import './index.css'
import { useNavigate } from 'react-router-dom';

const LandingScreen = () => {
    const navigate = useNavigate();

    const handleCreateAccount = () => {
        navigate('/sign');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="main-landing-screen-container"> 
            <div className='content-main-container'>
                <div className='content-container'>
                    <h1>Welcome to PopX</h1>
                    <p>Lorem ipsum dolar sit amlet,<br/>
                        consectetur adipiscing elit,
                    </p>
                </div>
                <div className='buttons-container'>
                    <button className='create-account-btn btn' onClick={handleCreateAccount}>
                        Create Account
                    </button>
                    <button className='login-btn btn' onClick={handleLogin}>
                        Already Registered? Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingScreen;