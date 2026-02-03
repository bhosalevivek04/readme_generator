import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRepos } from '../services/github';
import Navbar from '../components/Navbar';
import RepoSelector from '../components/RepoSelector';
import ReadmeGenerator from '../components/ReadmeGenerator';
import ReadmeViewer from '../components/ReadmeViewer';

interface Repo {
  id: number;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
}

const Generate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRepoSelect = (repo: string) => {
    setSelectedRepo(repo);
    setStep(2);
  };

  const handleReadmeGenerated = (readme: string) => {
    setGeneratedReadme(readme);
    setStep(3);
  };

  const handleReadmeUpdate = (newContent: string) => {
    setGeneratedReadme(newContent);
  };

  const handleBackToRepos = () => {
    setStep(1);
    setSelectedRepo('');
    setGeneratedReadme('');
  };

  const handleBackToGenerate = () => {
    setStep(2);
    setGeneratedReadme('');
  };

  useEffect(() => {
    const fetchRepos = async () => {
      const token = localStorage.getItem('github_token');
      
      if (!token) {
        console.error('No GitHub token found');
        navigate('/auth');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const fetchedRepos = await getUserRepos();
        setRepos(fetchedRepos);
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
        if (error instanceof Error && error.message === 'No GitHub token found') {
          navigate('/auth');
        } else {
          setError('Failed to fetch repositories. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-green-400 border-solid rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="text-lg">Loading your repositories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {step} of 3
            </span>
            <span className="text-sm text-gray-400">
              {step === 1 && 'Select Repository'}
              {step === 2 && 'Generate README'}
              {step === 3 && 'Review & Commit'}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Back Navigation */}
        {step > 1 && (
          <div className="mb-6">
            <button
              onClick={step === 2 ? handleBackToRepos : handleBackToGenerate}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <span>←</span>
              <span>
                {step === 2 ? 'Back to Repository Selection' : 'Back to Generation'}
              </span>
            </button>
          </div>
        )}

        {/* Step Content */}
        {step === 1 && <RepoSelector repos={repos} onSelect={handleRepoSelect} />}
        {step === 2 && <ReadmeGenerator repo={selectedRepo} onGenerate={handleReadmeGenerated} />}
        {step === 3 && (
          <ReadmeViewer 
            readme={generatedReadme} 
            repoFullName={selectedRepo} 
            onReadmeUpdate={handleReadmeUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default Generate;