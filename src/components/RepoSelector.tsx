import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faStar, faCodeBranch } from '@fortawesome/free-solid-svg-icons';

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

interface RepoSelectorProps {
  repos: Repo[];
  onSelect: (repo: string) => void;
}

const RepoSelector: React.FC<RepoSelectorProps> = ({ repos, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reposPerPage = 12;

  // Get unique languages for filter
  const languages = Array.from(new Set(repos.map(repo => repo.language).filter(Boolean)));

  const filteredRepos = repos.filter(repo => {
    const matchesSearch = repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLanguage = !languageFilter || repo.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleRepoSelect = (repo: string) => {
    setSelectedRepo(repo);
    onSelect(repo);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'PHP': 'bg-purple-500',
      'Ruby': 'bg-red-500',
      'C++': 'bg-blue-600',
      'C#': 'bg-purple-600',
      'HTML': 'bg-orange-400',
      'CSS': 'bg-blue-400'
    };
    return colors[language] || 'bg-gray-500';
  };

  useEffect(() => {
    // Component mounted
  }, [repos]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select a Repository</h2>
        <p className="text-gray-400 text-sm">Choose a repository to analyze and generate a professional README</p>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search repositories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:outline-none"
          />
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-4 text-gray-400" />
        </div>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-400 focus:outline-none"
        >
          <option value="">All Languages</option>
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {currentRepos.length} of {filteredRepos.length} repositories
      </div>

      {/* Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentRepos.map((repo) => (
          <div
            key={repo.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRepo === repo.full_name 
                ? 'border-green-400 bg-gray-800 shadow-lg shadow-green-400/20' 
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => handleRepoSelect(repo.full_name)}
          >
            {/* Repository Header */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white truncate flex-1 mr-2">
                {repo.full_name.split('/')[1]}
              </h3>
              {repo.private && (
                <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                  Private
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-3 line-clamp-2 h-10">
              {repo.description || 'No description available'}
            </p>

            {/* Repository Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                {repo.language && (
                  <div className="flex items-center space-x-1">
                    <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
                    <span>{repo.language}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faStar} />
                  <span>{repo.stargazers_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FontAwesomeIcon icon={faCodeBranch} />
                  <span>{repo.forks_count}</span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-600 mt-2">
              Updated {formatDate(repo.updated_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {Math.ceil(filteredRepos.length / reposPerPage) > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: Math.ceil(filteredRepos.length / reposPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === i + 1 
                  ? 'bg-green-400 text-gray-900 font-medium' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faSearch} className="text-4xl text-gray-600 mb-4" />
          <p className="text-gray-400">No repositories found matching your criteria</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filter settings</p>
        </div>
      )}
    </div>
  );
};

export default RepoSelector;