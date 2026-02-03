import axios from 'axios';

const GITHUB_API_URL = import.meta.env.VITE_GITHUB_API_URL;
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// Utility function to properly encode UTF-8 strings to Base64
const encodeToBase64 = (str: string): string => {
  // Use TextEncoder for proper UTF-8 encoding if available (modern browsers)
  if (typeof TextEncoder !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return btoa(String.fromCharCode(...data));
  }
  
  // Fallback: Convert string to UTF-8 bytes manually
  const utf8Bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      utf8Bytes.push(code);
    } else if (code < 0x800) {
      utf8Bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      utf8Bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      // Surrogate pair
      i++;
      const hi = code;
      const lo = str.charCodeAt(i);
      const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
      utf8Bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }
  }
  return btoa(String.fromCharCode(...utf8Bytes));
};

export const authenticateWithGitHub = () => {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;
  window.location.href = authUrl;
};

export const handleAuthCallback = async (code: string) => {
  try {
    const response = await axios.post(`${SERVER_URL}/api/github/callback`, { code }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    const { access_token } = response.data;
    if (!access_token) {
      throw new Error('No access token received from server');
    }
    localStorage.setItem('github_token', access_token);
    return access_token;
  } catch (error) {
    console.error('Error handling GitHub callback:', error);
    throw error;
  }
};

export const getUserRepos = async (): Promise<any[]> => {
  const token = localStorage.getItem('github_token');
  if (!token) throw new Error('No GitHub token found');

  let allRepos: any[] = [];
  let nextPage = `${GITHUB_API_URL}/user/repos?per_page=100`;

  while (nextPage) {
    try {
      const response = await axios.get(nextPage, {
        headers: { Authorization: `Bearer ${token}` },
      });
      allRepos = allRepos.concat(response.data);

      const linkHeader = response.headers.link;
      const nextPageUrl = getNextPageUrl(linkHeader);
      if (!nextPageUrl) break;
      nextPage = nextPageUrl;
    } catch (error) {
      console.error('Error fetching user repos:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
      }
      throw error;
    }
  }

  return allRepos;
};

function getNextPageUrl(linkHeader: string | undefined): string | null {
  if (!linkHeader) return null;
  const links = linkHeader.split(',');
  for (const link of links) {
    const [url, rel] = link.split(';');
    if (rel.includes('rel="next"')) {
      return url.trim().slice(1, -1);
    }
  }
  return null;
}

export const getRepoContent = async (repoFullName: string): Promise<string> => {
  const token = localStorage.getItem('github_token');
  if (!token) throw new Error('No GitHub token found');

  try {
    // Get repository information
    const repoInfo = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}`, {
      headers: { Authorization: `token ${token}` },
    });

    // Get repository tree (recursive)
    const treeResponse = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}/git/trees/${repoInfo.data.default_branch}?recursive=1`, {
      headers: { Authorization: `token ${token}` },
    });

    const files = treeResponse.data.tree;
    let analysisContent = '';

    // Add repository metadata
    analysisContent += `Repository: ${repoInfo.data.name}\n`;
    analysisContent += `Description: ${repoInfo.data.description || 'No description provided'}\n`;
    analysisContent += `Language: ${repoInfo.data.language || 'Not specified'}\n`;
    analysisContent += `Stars: ${repoInfo.data.stargazers_count}\n`;
    analysisContent += `Forks: ${repoInfo.data.forks_count}\n`;
    analysisContent += `License: ${repoInfo.data.license?.name || 'No license'}\n`;
    analysisContent += `Topics: ${repoInfo.data.topics?.join(', ') || 'None'}\n\n`;

    // Analyze file structure
    const importantFiles = files.filter((file: any) => 
      file.type === 'blob' && isImportantFile(file.path)
    );

    analysisContent += `=== PROJECT STRUCTURE ===\n`;
    analysisContent += generateFileTree(files);
    analysisContent += `\n\n=== IMPORTANT FILES ANALYSIS ===\n`;

    // Fetch and analyze important files
    for (const file of importantFiles.slice(0, 15)) { // Limit to prevent API rate limits
      try {
        const fileResponse = await axios.get(`${GITHUB_API_URL}/repos/${repoFullName}/contents/${file.path}`, {
          headers: { Authorization: `token ${token}` },
        });

        if (fileResponse.data.content) {
          const content = atob(fileResponse.data.content);
          analysisContent += `\n--- ${file.path} ---\n`;
          analysisContent += content.length > 2000 ? content.substring(0, 2000) + '...[truncated]' : content;
          analysisContent += '\n';
        }
      } catch (error) {
        console.warn(`Could not fetch content for ${file.path}`);
      }
    }

    // Add technology detection
    analysisContent += `\n=== DETECTED TECHNOLOGIES ===\n`;
    analysisContent += detectTechnologies(files, analysisContent);

    return analysisContent;
  } catch (error) {
    console.error('Error fetching repo content:', error);
    throw new Error('Failed to fetch repository content');
  }
};

// Helper function to identify important files
const isImportantFile = (path: string): boolean => {
  const importantPatterns = [
    /^package\.json$/,
    /^composer\.json$/,
    /^requirements\.txt$/,
    /^Gemfile$/,
    /^pom\.xml$/,
    /^build\.gradle$/,
    /^Cargo\.toml$/,
    /^go\.mod$/,
    /^setup\.py$/,
    /^Dockerfile$/,
    /^docker-compose\.ya?ml$/,
    /^\.env\.example$/,
    /^config\//,
    /^src\/.*\.(js|ts|jsx|tsx|py|java|go|rs|php|rb)$/,
    /^.*\.(md|txt)$/i,
    /^\.github\/workflows\//,
    /^scripts\//,
    /^docs\//
  ];

  return importantPatterns.some(pattern => pattern.test(path)) && 
         !path.includes('node_modules') && 
         !path.includes('.git/') &&
         !path.includes('dist/') &&
         !path.includes('build/');
};

// Generate a visual file tree
const generateFileTree = (files: any[]): string => {
  const directories = new Set<string>();
  const fileList: string[] = [];

  files.forEach((file: any) => {
    if (file.type === 'tree') {
      directories.add(file.path);
    } else if (file.type === 'blob' && !file.path.includes('node_modules') && !file.path.includes('.git/')) {
      fileList.push(file.path);
    }
  });

  let tree = '';
  const sortedDirs = Array.from(directories).sort();
  const sortedFiles = fileList.sort();

  // Show directory structure
  tree += 'Directories:\n';
  sortedDirs.slice(0, 20).forEach(dir => {
    tree += `  📁 ${dir}/\n`;
  });

  tree += '\nKey Files:\n';
  sortedFiles.slice(0, 30).forEach(file => {
    const icon = getFileIcon(file);
    tree += `  ${icon} ${file}\n`;
  });

  return tree;
};

// Get appropriate icon for file type
const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap: { [key: string]: string } = {
    'js': '📄', 'ts': '📘', 'jsx': '⚛️', 'tsx': '⚛️',
    'py': '🐍', 'java': '☕', 'go': '🐹', 'rs': '🦀',
    'php': '🐘', 'rb': '💎', 'css': '🎨', 'scss': '🎨',
    'html': '🌐', 'json': '📋', 'md': '📝', 'txt': '📄',
    'yml': '⚙️', 'yaml': '⚙️', 'xml': '📄', 'sql': '🗄️'
  };
  return iconMap[ext || ''] || '📄';
};

// Detect technologies used in the project
const detectTechnologies = (files: any[], content: string): string => {
  const technologies: string[] = [];
  const frameworks: string[] = [];
  const tools: string[] = [];

  // Check file extensions and names
  const fileNames = files.map((f: any) => f.path.toLowerCase());
  
  // Languages
  if (fileNames.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) technologies.push('JavaScript');
  if (fileNames.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) technologies.push('TypeScript');
  if (fileNames.some(f => f.endsWith('.py'))) technologies.push('Python');
  if (fileNames.some(f => f.endsWith('.java'))) technologies.push('Java');
  if (fileNames.some(f => f.endsWith('.go'))) technologies.push('Go');
  if (fileNames.some(f => f.endsWith('.rs'))) technologies.push('Rust');
  if (fileNames.some(f => f.endsWith('.php'))) technologies.push('PHP');
  if (fileNames.some(f => f.endsWith('.rb'))) technologies.push('Ruby');

  // Frameworks and libraries (from content analysis)
  if (content.includes('react')) frameworks.push('React');
  if (content.includes('vue')) frameworks.push('Vue.js');
  if (content.includes('angular')) frameworks.push('Angular');
  if (content.includes('express')) frameworks.push('Express.js');
  if (content.includes('django')) frameworks.push('Django');
  if (content.includes('flask')) frameworks.push('Flask');
  if (content.includes('spring')) frameworks.push('Spring Boot');
  if (content.includes('laravel')) frameworks.push('Laravel');

  // Tools and build systems
  if (fileNames.includes('package.json')) tools.push('npm/Node.js');
  if (fileNames.includes('yarn.lock')) tools.push('Yarn');
  if (fileNames.includes('dockerfile')) tools.push('Docker');
  if (fileNames.includes('docker-compose.yml')) tools.push('Docker Compose');
  if (fileNames.some(f => f.includes('webpack'))) tools.push('Webpack');
  if (fileNames.some(f => f.includes('vite'))) tools.push('Vite');
  if (fileNames.includes('tailwind.config.js')) tools.push('Tailwind CSS');

  let result = '';
  if (technologies.length > 0) result += `Languages: ${technologies.join(', ')}\n`;
  if (frameworks.length > 0) result += `Frameworks: ${frameworks.join(', ')}\n`;
  if (tools.length > 0) result += `Tools: ${tools.join(', ')}\n`;

  return result || 'No specific technologies detected';
};

export const updateReadme = async (repoFullName: string, content: string): Promise<void> => {
  const token = localStorage.getItem('github_token');
  if (!token) throw new Error('No GitHub token found');

  try {
    const [owner, repo] = repoFullName.split('/');
    const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/README.md`, {
      headers: { Authorization: `token ${token}` },
    });

    const { sha } = response.data;
    // Properly encode UTF-8 content to Base64
    const encodedContent = encodeToBase64(content);

    await axios.put(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/README.md`,
      {
        message: 'Update README.md',
        content: encodedContent,
        sha,
      },
      {
        headers: { Authorization: `token ${token}` },
      }
    );
  } catch (error) {
    console.error('Error updating README:', error);
    throw new Error('Failed to update README');
  }
};

export const commitReadme = async (repoFullName: string, content: string): Promise<void> => {
  const token = localStorage.getItem('github_token');
  if (!token) throw new Error('No GitHub token found');

  // Validate inputs
  if (!repoFullName || !content) {
    throw new Error('Repository name and content are required');
  }

  try {
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository name format');
    }

    let sha: string | undefined;

    // Check if README.md exists
    try {
      const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/README.md`, {
        headers: { Authorization: `token ${token}` },
      });
      sha = response.data.sha;
    } catch (error) {
      // If README.md doesn't exist (404), sha will remain undefined
      // This is expected for new repositories - suppress the 404 error
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // README.md doesn't exist, we'll create it
        sha = undefined;
      } else {
        // For other errors, we might want to log them
        console.warn('Unexpected error checking README existence:', error);
      }
    }

    // Properly encode UTF-8 content to Base64
    const encodedContent = encodeToBase64(content);

    await axios.put(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/README.md`,
      {
        message: sha ? 'Update README.md via AI Generator' : 'Create README.md via AI Generator',
        content: encodedContent,
        sha,
      },
      {
        headers: { Authorization: `token ${token}` },
      }
    );
  } catch (error) {
    console.error('Error committing README:', error);
    
    // Provide more specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        throw new Error('Permission denied. Please check repository access rights.');
      } else if (error.response?.status === 404) {
        throw new Error('Repository not found or access denied.');
      } else if (error.response?.status === 422) {
        throw new Error('Invalid content or repository state. Please try again.');
      }
    }
    
    throw new Error('Failed to commit README');
  }
};