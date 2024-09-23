import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="text-xl">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <Link to="/" className="text-xl font-bold">README Generator</Link>
      </div>
    </nav>
  );
};

export default Navbar;