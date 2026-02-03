// Alternative LLM providers for README generation
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration for different providers
const config = {
  google: {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    model: "gemini-pro"
  },
  // Add other providers as needed
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    model: "gpt-3.5-turbo"
  }
};

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateReadmeWithFallback = async (repoContent: string): Promise<string> => {
  // Try Google Gemini first
  try {
    return await generateWithGoogle(repoContent);
  } catch (error: any) {
    console.warn('Google Gemini failed, trying fallback options:', error.message);
    
    // If rate limited, try local/free alternatives
    if (error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
      return generateWithTemplate(repoContent);
    }
    
    throw error;
  }
};

const generateWithGoogle = async (repoContent: string): Promise<string> => {
  const genAI = new GoogleGenerativeAI(config.google.apiKey);
  
  // Try current models in order of preference (matching your Python example)
  const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-pro"];
  
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      
      const prompt = `Generate a comprehensive, professional README.md file for the following GitHub repository:

${repoContent}

Please create a well-structured README with proper markdown formatting.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      if (models.indexOf(modelName) === models.length - 1) {
        throw error; // Last model, throw the error
      }
    }
  }
  
  throw new Error('All Google models failed');
};

// Fallback: Generate a template-based README when APIs are unavailable
const generateWithTemplate = (repoContent: string): string => {
  // Extract basic info from repo content
  const lines = repoContent.split('\n');
  const packageJsonMatch = repoContent.match(/"name":\s*"([^"]+)"/);
  const projectName = packageJsonMatch ? packageJsonMatch[1] : 'Project';
  
  // Check for common technologies
  const hasReact = repoContent.includes('react');
  const hasNode = repoContent.includes('node') || repoContent.includes('express');
  const hasTypeScript = repoContent.includes('typescript') || repoContent.includes('.ts');
  
  let techStack = [];
  if (hasReact) techStack.push('React');
  if (hasNode) techStack.push('Node.js');
  if (hasTypeScript) techStack.push('TypeScript');
  
  return `# ${projectName}

## Description
This project appears to be a ${techStack.length > 0 ? techStack.join(', ') : 'web'} application.

## Technologies Used
${techStack.length > 0 ? techStack.map(tech => `- ${tech}`).join('\n') : '- JavaScript'}

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

## License
[MIT](https://choosealicense.com/licenses/mit/)

---
*This README was generated automatically. Please customize it according to your project's specific needs.*`;
};