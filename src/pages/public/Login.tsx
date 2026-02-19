import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';
import '../../styles/auth.css';

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getFriendlyError = (error: string): string => {
    const lower = error.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
        return 'Invalid email or password. If you recently signed up, please check your email inbox and confirm your account first.';
    }
    if (lower.includes('email not confirmed')) {
        return 'Your email address hasn\'t been confirmed yet. Please check your inbox (and spam folder) for a confirmation link.';
    }
    if (lower.includes('too many requests') || lower.includes('rate limit')) {
        return 'Too many login attempts. Please wait a moment and try again.';
    }
    if (lower.includes('network') || lower.includes('fetch')) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error;
};

const parseHashParams = () => {
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return null;
    const params = new URLSearchParams(hash.substring(1));
    const error = params.get('error') || undefined;
    const errorCode = params.get('error_code') || undefined;
    const errorDescription = params.get('error_description') || undefined;
    const accessToken = params.get('access_token') || undefined;
    if (error || accessToken) {
        window.history.replaceState(null, '', window.location.pathname);
        return { error, errorCode, errorDescription, accessToken };
    }
    return null;
};

const getHashErrorMessage = (errorCode?: string, errorDescription?: string): string => {
    if (errorCode === 'otp_expired') return 'Your email confirmation link has expired. Please request a new one below.';
    if (errorDescription) return errorDescription.replace(/\+/g, ' ');
    return 'Something went wrong with the confirmation link. Please try again.';
};

interface FieldErrors { email?: string; password?: string; }

const Login = () => {
    const { signIn, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showResend, setShowResend] = useState(false);
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    useEffect(() => {
        const hashParams = parseHashParams();
        if (hashParams?.error) {
            setError(getHashErrorMessage(hashParams.errorCode, hashParams.errorDescription));
            if (hashParams.errorCode === 'otp_expired') setShowResend(true);
        }
    }, []);

    const validateFields = (): boolean => {
        const errors: FieldErrors = {};
        if (!email.trim()) errors.email = 'Email is required.';
        else if (!isValidEmail(email.trim())) errors.email = 'Please enter a valid email address.';
        if (!password) errors.password = 'Password is required.';
        else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const errors = { ...fieldErrors };
        if (field === 'email') {
            if (!email.trim()) errors.email = 'Email is required.';
            else if (!isValidEmail(email.trim())) errors.email = 'Please enter a valid email address.';
            else delete errors.email;
        }
        if (field === 'password') {
            if (!password) errors.password = 'Password is required.';
            else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
            else delete errors.password;
        }
        setFieldErrors(errors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setShowResend(false);
        setTouched({ email: true, password: true });
        if (!validateFields()) return;

        setIsSubmitting(true);
        const result = await signIn(email.trim(), password);
        if (result.error) {
            setError(getFriendlyError(result.error));
            setIsSubmitting(false);
            if (result.error.toLowerCase().includes('invalid login credentials') ||
                result.error.toLowerCase().includes('email not confirmed')) {
                setShowResend(true);
                setResendEmail(email.trim());
            }
        }
    };

    const handleResendConfirmation = async () => {
        const target = resendEmail || email.trim();
        if (!target || !isValidEmail(target)) { setResendMessage('Enter a valid email above first.'); return; }
        setResendStatus('sending');
        setResendMessage(null);
        const result = await authService.resendConfirmation(target);
        if (result.error) { setResendStatus('error'); setResendMessage(result.error); }
        else { setResendStatus('sent'); setResendMessage(`Confirmation email sent to ${target}. Check your inbox and spam folder.`); }
    };

    const formDisabled = isSubmitting || isLoading;

    return (
        <div className="auth-page">
            {/* Left half: hero image */}
            <div className="auth-hero">
                <img src="/heroimage.png" alt="Person typing on laptop" className="auth-hero-image" />
            </div>

            {/* Right half: login form */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-mobile-header">
                        <img src="/heroIcon.png" alt="InternTrack" className="auth-mobile-icon" />
                        <div className="auth-mobile-wordmark" aria-label="InternTrack">
                            <span className="auth-mobile-wordmark-intern">Intern</span>
                            <span className="auth-mobile-wordmark-track">Track</span>
                        </div>
                    </div>
                    {error && (
                        <div className="auth-error" id="login-error">
                            <AlertCircle size={18} className="auth-error-alert-icon" />
                            <div>{error}</div>
                        </div>
                    )}

                    {showResend && (
                        <div className="auth-info-box" id="resend-confirmation-box">
                            <Info size={18} className="auth-info-icon" />
                            <div>
                                <strong>Haven't confirmed your email?</strong>
                                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8125rem' }}>
                                    Click below to get a new confirmation link.
                                </p>
                                {resendStatus === 'sent' && resendMessage ? (
                                    <p className="auth-resend-success">{resendMessage}</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resendStatus === 'sending'}
                                        className="auth-resend-btn"
                                        id="resend-confirmation-btn"
                                    >
                                        {resendStatus === 'sending' ? (
                                            <><Loader2 size={14} className="auth-spinner" /> Sending...</>
                                        ) : (
                                            <><RefreshCw size={14} /> Resend Confirmation Email</>
                                        )}
                                    </button>
                                )}
                                {resendStatus === 'error' && resendMessage && (
                                    <p className="auth-resend-error">{resendMessage}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" id="login-form" noValidate>
                        <div className="auth-field">
                            <label htmlFor="login-email" className="auth-label">Email</label>
                            <div className={touched.email && fieldErrors.email ? 'auth-input-error' : ''}>
                                <input
                                    id="login-email"
                                    type="email"
                                    className="auth-input"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (touched.email) setFieldErrors((prev) => { const n = { ...prev }; delete n.email; return n; });
                                    }}
                                    onBlur={() => handleBlur('email')}
                                    disabled={formDisabled}
                                    autoComplete="email"
                                />
                            </div>
                            {touched.email && fieldErrors.email && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password" className="auth-label">Password</label>
                            <div className={`auth-input-wrapper ${touched.password && fieldErrors.password ? 'auth-input-error' : ''}`}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (touched.password) setFieldErrors((prev) => { const n = { ...prev }; delete n.password; return n; });
                                    }}
                                    onBlur={() => handleBlur('password')}
                                    disabled={formDisabled}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.password && fieldErrors.password && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.password}</span>
                            )}
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={formDisabled} id="login-submit">
                            {formDisabled ? (<><Loader2 size={18} className="auth-spinner" /> Signing in...</>) : 'Login'}
                        </button>

                        <Link to="/forgot-password" className="auth-forgot-link" id="forgot-password-link">
                            Forgot password?
                        </Link>
                    </form>

                    <div className="auth-footer">
                        <p>Don't have an account? <Link to="/signup" className="auth-link" id="signup-link">Sign Up here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
