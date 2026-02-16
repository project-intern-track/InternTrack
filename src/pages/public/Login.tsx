import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';
import '../../styles/auth.css';

// ========================
// Validation helpers
// ========================
const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Translate cryptic Supabase errors into user-friendly messages
 */
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
        return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    return error;
};

/**
 * Parse Supabase error/success from the URL hash fragment
 * e.g. #error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
 */
const parseHashParams = (): { error?: string; errorCode?: string; errorDescription?: string; accessToken?: string } | null => {
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return null;

    const params = new URLSearchParams(hash.substring(1));
    const error = params.get('error') || undefined;
    const errorCode = params.get('error_code') || undefined;
    const errorDescription = params.get('error_description') || undefined;
    const accessToken = params.get('access_token') || undefined;

    if (error || accessToken) {
        // Clean the hash from the URL without reloading
        window.history.replaceState(null, '', window.location.pathname);
        return { error, errorCode, errorDescription, accessToken };
    }

    return null;
};

/**
 * Get a friendly message for Supabase redirect errors
 */
const getHashErrorMessage = (errorCode?: string, errorDescription?: string): string => {
    if (errorCode === 'otp_expired') {
        return 'Your email confirmation link has expired. Please request a new one below.';
    }
    if (errorCode === 'access_denied') {
        return errorDescription || 'Access was denied. The link may be invalid or expired.';
    }
    if (errorDescription) {
        return errorDescription.replace(/\+/g, ' ');
    }
    return 'Something went wrong with the confirmation link. Please try again.';
};

interface FieldErrors {
    email?: string;
    password?: string;
}

const Login = () => {
    const { signIn, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Resend confirmation state
    const [showResend, setShowResend] = useState(false);
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    // On mount: check for Supabase redirect errors in the URL hash
    useEffect(() => {
        const hashParams = parseHashParams();
        if (hashParams?.error) {
            const message = getHashErrorMessage(hashParams.errorCode, hashParams.errorDescription);
            setError(message);
            // Show the resend option if it's an expired link
            if (hashParams.errorCode === 'otp_expired') {
                setShowResend(true);
            }
        }
    }, []);

    const validateFields = (): boolean => {
        const errors: FieldErrors = {};

        if (!email.trim()) {
            errors.email = 'Email is required.';
        } else if (!isValidEmail(email.trim())) {
            errors.email = 'Please enter a valid email address.';
        }

        if (!password) {
            errors.password = 'Password is required.';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const errors: FieldErrors = { ...fieldErrors };
        if (field === 'email') {
            if (!email.trim()) {
                errors.email = 'Email is required.';
            } else if (!isValidEmail(email.trim())) {
                errors.email = 'Please enter a valid email address.';
            } else {
                delete errors.email;
            }
        }
        if (field === 'password') {
            if (!password) {
                errors.password = 'Password is required.';
            } else if (password.length < 6) {
                errors.password = 'Password must be at least 6 characters.';
            } else {
                delete errors.password;
            }
        }
        setFieldErrors(errors);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setShowResend(false);

        setTouched({ email: true, password: true });

        if (!validateFields()) {
            return;
        }

        setIsSubmitting(true);
        const result = await signIn(email.trim(), password);

        if (result.error) {
            const friendlyError = getFriendlyError(result.error);
            setError(friendlyError);
            setIsSubmitting(false);

            // If invalid credentials, show resend option (might be unconfirmed email)
            if (result.error.toLowerCase().includes('invalid login credentials') ||
                result.error.toLowerCase().includes('email not confirmed')) {
                setShowResend(true);
                setResendEmail(email.trim());
            }
        }
    };

    const handleResendConfirmation = async () => {
        const emailToResend = resendEmail || email.trim();
        if (!emailToResend || !isValidEmail(emailToResend)) {
            setResendMessage('Please enter a valid email address above first.');
            return;
        }

        setResendStatus('sending');
        setResendMessage(null);

        const result = await authService.resendConfirmation(emailToResend);

        if (result.error) {
            setResendStatus('error');
            setResendMessage(result.error);
        } else {
            setResendStatus('sent');
            setResendMessage(`A new confirmation email has been sent to ${emailToResend}. Please check your inbox (and spam folder).`);
        }
    };

    const formDisabled = isSubmitting || isLoading;

    return (
        <div className="auth-page">
            {/* Background decoration */}
            <div className="auth-bg-decoration">
                <div className="auth-bg-circle auth-bg-circle-1"></div>
                <div className="auth-bg-circle auth-bg-circle-2"></div>
                <div className="auth-bg-circle auth-bg-circle-3"></div>
            </div>

            <div className="auth-container">
                {/* Left side: Branding panel */}
                <div className="auth-branding">
                    <div className="auth-branding-content">
                        <div className="auth-brand-icon">
                            <Briefcase size={32} />
                        </div>
                        <h1 className="auth-brand-title">InternTrack</h1>
                        <p className="auth-brand-subtitle">
                            Centralized Internship Management Platform
                        </p>
                        <div className="auth-brand-features">
                            <div className="auth-feature-item">
                                <div className="auth-feature-dot"></div>
                                <span>Track attendance & hours</span>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-dot"></div>
                                <span>Manage tasks & evaluations</span>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-dot"></div>
                                <span>Real-time performance insights</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Login form */}
                <div className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Welcome back</h2>
                            <p>Sign in to your account to continue</p>
                        </div>

                        {/* Error from Supabase redirect or login failure */}
                        {error && (
                            <div className="auth-error" id="login-error">
                                <AlertCircle size={18} className="auth-error-alert-icon" />
                                <div>{error}</div>
                            </div>
                        )}

                        {/* Resend confirmation email option */}
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
                                                <>
                                                    <Loader2 size={14} className="auth-spinner" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw size={14} />
                                                    Resend Confirmation Email
                                                </>
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
                                <label htmlFor="login-email" className="auth-label">
                                    Email Address
                                </label>
                                <div className={`auth-input-wrapper ${touched.email && fieldErrors.email ? 'auth-input-error' : ''}`}>
                                    <Mail size={18} className="auth-input-icon" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        className="auth-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (touched.email) {
                                                setFieldErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next.email;
                                                    return next;
                                                });
                                            }
                                        }}
                                        onBlur={() => handleBlur('email')}
                                        disabled={formDisabled}
                                        autoComplete="email"
                                    />
                                </div>
                                {touched.email && fieldErrors.email && (
                                    <span className="auth-field-hint auth-field-hint-error" id="login-email-error">
                                        {fieldErrors.email}
                                    </span>
                                )}
                            </div>

                            <div className="auth-field">
                                <div className="auth-label-row">
                                    <label htmlFor="login-password" className="auth-label">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="auth-forgot-link" tabIndex={-1}>
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className={`auth-input-wrapper ${touched.password && fieldErrors.password ? 'auth-input-error' : ''}`}>
                                    <Lock size={18} className="auth-input-icon" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="auth-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (touched.password) {
                                                setFieldErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next.password;
                                                    return next;
                                                });
                                            }
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
                                    <span className="auth-field-hint auth-field-hint-error" id="login-password-error">
                                        {fieldErrors.password}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary auth-submit-btn"
                                disabled={formDisabled}
                                id="login-submit"
                            >
                                {formDisabled ? (
                                    <>
                                        <Loader2 size={18} className="auth-spinner" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Don't have an account?{' '}
                                <Link to="/signup" className="auth-link" id="signup-link">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
