import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, AlertCircle, Info } from 'lucide-react';
import '../../styles/auth.css';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ForgotPassword = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [touched, setTouched] = useState(false);

    const validateEmail = (): string | null => {
        if (!email.trim()) return 'Email is required.';
        if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
        return null;
    };

    const handleBlur = () => { setTouched(true); setFieldError(validateEmail()); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTouched(true);
        const err = validateEmail();
        if (err) { setFieldError(err); return; }
        setIsSubmitting(true);
        const result = await resetPassword(email.trim());
        if (result.error) { setError(result.error); setIsSubmitting(false); }
        else { setSuccess(true); setIsSubmitting(false); }
    };

    if (success) {
        return (
            <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="auth-success-card">
                    <div className="auth-success-icon"><Mail size={36} /></div>
                    <h2>Check your email</h2>
                    <p>We've sent a password reset link to:</p>
                    <p className="auth-success-email">{email}</p>
                    <div className="auth-info-box">
                        <Info size={18} className="auth-info-icon" />
                        <div>Click the link in the email to reset your password. Check your <strong>spam/junk folder</strong>.</div>
                    </div>
                    <Link to="/" className="auth-submit-btn" id="back-to-login" style={{ textDecoration: 'none' }}>Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            {/* Left half: hero image */}
            <div className="auth-hero">
                <img src="/heroimage.png" alt="Person typing on laptop" className="auth-hero-image" />
            </div>

            {/* Right half: forgot password form */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-mobile-header">
                        <img src="/heroIcon.png" alt="InternTrack" className="auth-mobile-icon" />
                        <img src="/heroLogo.png" alt="InternTrack Logo" className="auth-hero-mobile-logo" />
                    </div>

                    <div className="auth-compact-header" style={{ marginBottom: '2rem' }}>
                        <h2>Forgot your password?</h2>
                        <p>Enter your email and we'll send you a reset link</p>
                    </div>

                    {error && (
                        <div className="auth-error" id="forgot-error">
                            <AlertCircle size={18} className="auth-error-alert-icon" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" id="forgot-password-form" noValidate>
                        <div className="auth-field">
                            <label htmlFor="forgot-email" className="auth-label">Email Address</label>
                            <div className={touched && fieldError ? 'auth-input-error' : ''}>
                                <input id="forgot-email" type="email" className="auth-input"
                                    placeholder="Enter your email address" value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (touched) setFieldError(null); }}
                                    onBlur={handleBlur} disabled={isSubmitting} autoComplete="email" />
                            </div>
                            {touched && fieldError && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldError}</span>
                            )}
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting} id="forgot-submit">
                            {isSubmitting ? (<><Loader2 size={18} className="auth-spinner" /> Sending link...</>) : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <Link to="/" className="auth-link" id="back-to-login-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
