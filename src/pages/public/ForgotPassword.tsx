import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, ArrowLeft, ArrowRight, Loader2, AlertCircle, Info } from 'lucide-react';
import '../../styles/auth.css';

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ForgotPassword = () => {
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [touched, setTouched] = useState(false);

    const validateEmail = (value?: string): string | null => {
        const v = value ?? email;
        if (!v.trim()) return 'Email is required.';
        if (!isValidEmail(v.trim())) return 'Please enter a valid email address.';
        return null;
    };

    const handleBlur = () => {
        setTouched(true);
        setFieldError(validateEmail());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTouched(true);

        const err = validateEmail();
        if (err) {
            setFieldError(err);
            return;
        }

        setIsSubmitting(true);
        const result = await resetPassword(email.trim());

        if (result.error) {
            setError(result.error);
            setIsSubmitting(false);
        } else {
            setSuccess(true);
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-bg-decoration">
                    <div className="auth-bg-circle auth-bg-circle-1"></div>
                    <div className="auth-bg-circle auth-bg-circle-2"></div>
                    <div className="auth-bg-circle auth-bg-circle-3"></div>
                </div>
                <div className="auth-success-card">
                    <div className="auth-success-icon">
                        <Mail size={48} />
                    </div>
                    <h2>Check your email</h2>
                    <p style={{ marginBottom: '0.5rem' }}>
                        We've sent a password reset link to:
                    </p>
                    <p className="auth-success-email">{email}</p>
                    <div className="auth-info-box">
                        <Info size={18} className="auth-info-icon" />
                        <div>
                            Click the link in the email to reset your password.
                            If you don't see it, check your <strong>spam/junk folder</strong>.
                        </div>
                    </div>
                    <Link to="/" className="btn btn-primary auth-submit-btn" id="back-to-login">
                        <ArrowLeft size={18} />
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-decoration">
                <div className="auth-bg-circle auth-bg-circle-1"></div>
                <div className="auth-bg-circle auth-bg-circle-2"></div>
                <div className="auth-bg-circle auth-bg-circle-3"></div>
            </div>

            <div className="auth-container auth-container-compact">
                <div className="auth-form-panel auth-form-panel-full">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header" style={{ textAlign: 'center' }}>
                            <div className="auth-brand-icon" style={{ margin: '0 auto 1rem' }}>
                                <Briefcase size={28} />
                            </div>
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
                                <label htmlFor="forgot-email" className="auth-label">
                                    Email Address
                                </label>
                                <div className={`auth-input-wrapper ${touched && fieldError ? 'auth-input-error' : ''}`}>
                                    <Mail size={18} className="auth-input-icon" />
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        className="auth-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (touched) setFieldError(null);
                                        }}
                                        onBlur={handleBlur}
                                        disabled={isSubmitting}
                                        autoComplete="email"
                                    />
                                </div>
                                {touched && fieldError && (
                                    <span className="auth-field-hint auth-field-hint-error" id="forgot-email-error">
                                        {fieldError}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary auth-submit-btn"
                                disabled={isSubmitting}
                                id="forgot-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="auth-spinner" />
                                        Sending link...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                <Link to="/" className="auth-link" id="back-to-login-link">
                                    <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                    Back to Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
