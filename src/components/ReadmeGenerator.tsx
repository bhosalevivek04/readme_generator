import React, { useState, useEffect } from 'react';
import { getRepoContent } from '../services/github';
import { generateReadme } from '../services/llm';

interface ReadmeGeneratorProps {
  repo: string;
  onGenerate: (readme: string) => void;
}

const ReadmeGenerator: React.FC<ReadmeGeneratorProps> = ({ repo, onGenerate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [pun, setPun] = useState('');

  const puns = [
    "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
    "Why do Java developers wear glasses? Because they don't C#! 👓",
    "Why was the JavaScript developer sad? Because he didn't Node how to Express himself. 😢",
    "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25! 🎃🎄",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
    "Why do Python programmers prefer snakes? Because they're great at debugging! 🐍"
  ];

  const steps = [
    { text: "Connecting to GitHub API...", progress: 10 },
    { text: "Fetching repository information...", progress: 25 },
    { text: "Analyzing project structure...", progress: 40 },
    { text: "Detecting technologies and frameworks...", progress: 60 },
    { text: "Reading important files...", progress: 75 },
    { text: "Generating README with AI...", progress: 90 },
    { text: "Finalizing and formatting...", progress: 100 }
  ];

  useEffect(() => {
    generateReadmeContent();
    const punInterval = setInterval(() => {
      setPun(puns[Math.floor(Math.random() * puns.length)]);
    }, 4000);

    return () => clearInterval(punInterval);
  }, [repo]);

  const generateReadmeContent = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate progress steps
      for (let i = 0; i < steps.length - 2; i++) {
        setCurrentStep(steps[i].text);
        setProgress(steps[i].progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Fetch repository content
      setCurrentStep(steps[5].text);
      setProgress(steps[5].progress);
      const repoContent = await getRepoContent(repo);
      
      // Generate README
      setCurrentStep(steps[6].text);
      setProgress(steps[6].progress);
      const generatedReadme = await generateReadme(repoContent);
      
      onGenerate(generatedReadme);
    } catch (error) {
      console.error('Error generating README:', error);
      setCurrentStep('❌ Error occurred during generation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-80 p-6">
      {isLoading ? (
        <div className="w-full max-w-md">
          {/* Progress Circle */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                className="text-green-400 transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-green-400">{progress}%</span>
            </div>
          </div>

          {/* Current Step */}
          <div className="text-center mb-4">
            <p className="text-lg font-semibold mb-2">Analyzing Repository</p>
            <p className="text-sm text-gray-400">{currentStep}</p>
          </div>

          {/* Repository Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">
              <span className="font-medium">Repository:</span> {repo}
            </p>
          </div>

          {/* Fun Fact */}
          <div className="text-center">
            <p className="text-xs text-gray-500 italic">{pun}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-lg font-semibold text-green-400">README Generated Successfully!</p>
          <p className="text-sm text-gray-400 mt-2">Your professional README is ready to use</p>
        </div>
      )}
    </div>
  );
};

export default ReadmeGenerator;