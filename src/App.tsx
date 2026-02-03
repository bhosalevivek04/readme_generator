import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './components/Auth';
import Generate from './pages/Generate';
import { handleAuthCallback } from './services/github';

function AuthCallback() {
  const navigate = useNavigate();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Verifying authorization code...',
    'Exchanging tokens with GitHub...',
    'Setting up your session...',
    'Redirecting to dashboard...'
  ];

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get('code');
        
        if (!code) {
          setError('No authentication code received from GitHub');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        // Step 1: Verifying code
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 2: Exchange tokens
        setCurrentStep(1);
        await handleAuthCallback(code);
        await new Promise(resolve => setTimeout(resolve, 600));

        // Step 3: Setting up session
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 4: Redirecting
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 400));

        navigate('/generate');
      } catch (error: any) {
        console.error('Authentication failed:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Authentication failed';
        if (error.message?.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message?.includes('token')) {
          errorMessage = 'Failed to exchange authorization code. Please try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        setTimeout(() => navigate('/auth'), 4000);
      } finally {
        setIsAuthenticating(false);
      }
    };

    // Add a timeout for the entire authentication process
    const timeoutId = setTimeout(() => {
      if (isAuthenticating) {
        setError('Authentication timed out. Please try again.');
        setIsAuthenticating(false);
        setTimeout(() => navigate('/auth'), 2000);
      }
    }, 30000); // 30 second timeout

    authenticateUser();

    return () => clearTimeout(timeoutId);
  }, [navigate, isAuthenticating]);

  if (error) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4 text-red-400">Authentication Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="w-4 h-4 border-t-2 border-green-400 border-solid rounded-full animate-spin"></div>
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticating) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          {/* GitHub Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                className="text-green-400 animate-spin"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-green-400 text-2xl">🔐</div>
            </div>
          </div>

          {/* Text Content */}
          <h2 className="text-2xl font-bold mb-2 text-green-400">Authenticating with GitHub</h2>
          <p className="text-gray-400 mb-6">{steps[currentStep]}</p>
          
          {/* Progress Steps */}
          <div className="space-y-3 mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  index < currentStep 
                    ? 'bg-green-400' 
                    : index === currentStep 
                    ? 'bg-green-400 animate-pulse' 
                    : 'bg-gray-600'
                }`}></div>
                <span className={`${
                  index <= currentStep ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {step.replace('...', '')}
                </span>
                {index < currentStep && (
                  <div className="text-green-400 text-xs">✓</div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              This process is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;