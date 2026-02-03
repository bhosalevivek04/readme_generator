import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Button from './Button';
import { faCopy, faDownload, faRedo, faCodeCommit, faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { commitReadme } from '../services/github';
import 'highlight.js/styles/github-dark.css';

interface ReadmeViewerProps {
  readme: string;
  repoFullName: string;
  onReadmeUpdate?: (newContent: string) => void;
}

const ReadmeViewer: React.FC<ReadmeViewerProps> = ({ readme, repoFullName, onReadmeUpdate }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(readme);

  const handleCopy = () => {
    const contentToCopy = isEditing ? editedContent : readme;
    navigator.clipboard.writeText(contentToCopy);
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
    const contentToDownload = isEditing ? editedContent : readme;
    const blob = new Blob([contentToDownload], { type: 'text/markdown' });
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

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(readme);
    setActiveTab('raw'); // Switch to raw mode for editing
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Update the parent component with the edited content
    if (onReadmeUpdate) {
      onReadmeUpdate(editedContent);
    }
    
    // Show save notification
    const notification = document.createElement('div');
    notification.textContent = '✓ Changes saved successfully!';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(readme); // Reset to original content
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    }
  };

  const handleCommit = async () => {
    try {
      setIsCommitting(true);
      const contentToCommit = isEditing ? editedContent : readme;
      await commitReadme(repoFullName, contentToCommit);
      
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

  const currentContent = isEditing ? editedContent : readme;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit README' : 'Generated README'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">Repository: {repoFullName}</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('preview')}
            disabled={isEditing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'preview' && !isEditing
                ? 'bg-green-400 text-gray-900 font-medium' 
                : isEditing
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-sm">👁️</span>
            <span>Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'raw' || isEditing
                ? 'bg-green-400 text-gray-900 font-medium' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-sm">📝</span>
            <span>{isEditing ? 'Edit' : 'Raw'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {activeTab === 'preview' && !isEditing ? (
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
              {currentContent}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-400">Edit README Content</h3>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveEdit} icon={faSave} color="green">
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelEdit} icon={faTimes} color="yellow">
                      Cancel
                    </Button>
                  </div>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-96 p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 font-mono text-sm leading-relaxed resize-none focus:border-green-400 focus:outline-none"
                  placeholder="Edit your README content here..."
                />
                <div className="text-sm text-gray-400">
                  <p>💡 Tip: Use Markdown syntax for formatting. Press Ctrl+S to save or Esc to cancel.</p>
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
                {currentContent}
              </pre>
            )}
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
        {!isEditing ? (
          <Button onClick={handleEdit} icon={faEdit} color="yellow">
            Edit README
          </Button>
        ) : null}
        <Button onClick={handleRegenerate} icon={faRedo} color="purple">
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
            <div className="text-2xl font-bold text-green-400">{currentContent.split('\n').length}</div>
            <div className="text-sm text-gray-400">Lines</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{currentContent.split(' ').length}</div>
            <div className="text-sm text-gray-400">Words</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{currentContent.length}</div>
            <div className="text-sm text-gray-400">Characters</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{(currentContent.length / 1024).toFixed(1)}KB</div>
            <div className="text-sm text-gray-400">Size</div>
          </div>
        </div>
      </div>

      {/* Edit Mode Info */}
      {isEditing && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 mt-1">ℹ️</div>
            <div>
              <h4 className="text-blue-400 font-semibold mb-2">Edit Mode Active</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Make your changes in the text area above</li>
                <li>• Click "Save Changes" to apply your edits</li>
                <li>• Use "Cancel" to discard changes and return to the original</li>
                <li>• Preview is disabled while editing - save to see the rendered result</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadmeViewer;