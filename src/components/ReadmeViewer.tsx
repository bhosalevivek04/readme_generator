import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Button from './Button';
import { faCopy, faDownload, faRedo, faCodeCommit } from '@fortawesome/free-solid-svg-icons';
import { commitReadme } from '../services/github';
import 'highlight.js/styles/github-dark.css';

interface ReadmeViewerProps {
  readme: string;
  repoFullName: string;
}

const ReadmeViewer: React.FC<ReadmeViewerProps> = ({ readme, repoFullName }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(readme);
    // Show a better notification
    const notification = document.createElement('div');
    notification.textContent = '✓ README copied to clipboard!';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    // Reload the page to start over
    window.location.reload();
  };

  const handleCommit = async () => {
    try {
      setIsCommitting(true);
      await commitReadme(repoFullName, readme);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✓ README committed successfully to GitHub!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Error committing README:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.textContent = '❌ Failed to commit README. Please try again.';
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Generated README</h2>
          <p className="text-gray-400 text-sm mt-1">Repository: {repoFullName}</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'preview' 
                ? 'bg-green-400 text-gray-900 font-medium' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-sm">👁️</span>
            <span>Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'raw' 
                ? 'bg-green-400 text-gray-900 font-medium' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-sm">📝</span>
            <span>Raw</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="p-6 prose prose-invert prose-green max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom styling for markdown elements
                h1: ({children}) => <h1 className="text-3xl font-bold mb-4 text-green-400">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-semibold mb-3 text-green-300 border-b border-gray-600 pb-2">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-semibold mb-2 text-green-200">{children}</h3>,
                p: ({children}) => <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="mb-4 space-y-1 text-gray-300">{children}</ul>,
                ol: ({children}) => <ol className="mb-4 space-y-1 text-gray-300">{children}</ol>,
                li: ({children}) => <li className="ml-4">{children}</li>,
                code: ({children, className}) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-700 text-green-300 px-1 py-0.5 rounded text-sm">{children}</code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-green-400 pl-4 italic text-gray-400 mb-4">{children}</blockquote>,
                a: ({children, href}) => <a href={href} className="text-green-400 hover:text-green-300 underline">{children}</a>,
                table: ({children}) => <table className="w-full border-collapse border border-gray-600 mb-4">{children}</table>,
                th: ({children}) => <th className="border border-gray-600 px-4 py-2 bg-gray-700 text-left">{children}</th>,
                td: ({children}) => <td className="border border-gray-600 px-4 py-2">{children}</td>,
              }}
            >
              {readme}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
              {readme}
            </pre>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCopy} icon={faCopy} color="green">
          Copy to Clipboard
        </Button>
        <Button onClick={handleDownload} icon={faDownload} color="blue">
          Download README.md
        </Button>
        <Button onClick={handleRegenerate} icon={faRedo} color="yellow">
          Generate New README
        </Button>
        <Button 
          onClick={handleCommit} 
          icon={faCodeCommit} 
          color="purple"
          disabled={isCommitting}
        >
          {isCommitting ? 'Committing...' : 'Commit to GitHub'}
        </Button>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">{readme.split('\n').length}</div>
            <div className="text-sm text-gray-400">Lines</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{readme.split(' ').length}</div>
            <div className="text-sm text-gray-400">Words</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{readme.length}</div>
            <div className="text-sm text-gray-400">Characters</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{(readme.length / 1024).toFixed(1)}KB</div>
            <div className="text-sm text-gray-400">Size</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadmeViewer;