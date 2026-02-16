import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Info } from 'lucide-react';
import '../../styles/auth.css';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleReturnToLogin = () => {
        // Clear any navigation state and go to login
        navigate('/', { replace: true });
    };

    return (
        <div className="auth-page">
            {/* Left half: hero image */}
            <div className="auth-hero">
                <img src="/heroimage.png" alt="Person typing on laptop" className="auth-hero-image" />
            </div>

            {/* Right half: verify email content */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-verify-content">
                        <div className="auth-verify-icon">
                            <Mail size={48} />
                        </div>
                        
                        <h2 className="auth-verify-title">Verify your email</h2>
                        
                        <p className="auth-verify-text">
                            We've sent a confirmation link to:
                        </p>
                        
                        {email && (
                            <p className="auth-verify-email">{email}</p>
                        )}
                        
                        <div className="auth-info-box" id="email-verification-notice">
                            <Info size={18} className="auth-info-icon" />
                            <div>
                                <strong>Important:</strong> You must click the confirmation link in your email
                                before you can sign in. Check your <strong>spam/junk folder</strong> if you don't see it.
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleReturnToLogin} 
                            className="auth-submit-btn" 
                            id="return-to-login"
                        >
                            Return to Login
                        </button>
                        
                        <p className="auth-verify-hint">
                            Didn't receive the email? Wait a minute, then try signing up again.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
