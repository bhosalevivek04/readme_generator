import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBack = () => {
    // Safe navigation based on current location
    if (location.pathname === '/generate') {
      navigate('/');
    } else if (location.pathname === '/auth') {
      navigate('/');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('github_token');
    // Navigate to home
    navigate('/');
  };

  const isAuthenticated = !!localStorage.getItem('github_token');

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <button 
          onClick={handleBack} 
          className="text-xl hover:text-green-400 transition-colors"
          title="Go back"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        
        <Link to="/" className="text-xl font-bold hover:text-green-400 transition-colors">
          README Generator
        </Link>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="text-sm hover:text-red-400 transition-colors flex items-center space-x-1"
              title="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;