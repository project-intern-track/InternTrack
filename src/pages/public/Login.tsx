import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';
import { motion } from 'framer-motion';

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
    const [searchParams, setSearchParams] = useSearchParams();
    // Persist flags in state so they survive the cleanup re-render.
    // Initialized once on mount from URL param or sessionStorage.
    const [isDeactivated] = useState(() =>
        searchParams.get('deactivated') === '1' || sessionStorage.getItem('account_deactivated') === '1'
    );
    const [isSessionExpired] = useState(() =>
        sessionStorage.getItem('session_expired') === '1'
    );

    useEffect(() => {
        const hashParams = parseHashParams();
        if (hashParams?.error) {
            setError(getHashErrorMessage(hashParams.errorCode, hashParams.errorDescription));
            if (hashParams.errorCode === 'otp_expired') setShowResend(true);
        }
        // Clean up indicators from URL and sessionStorage
        // (messages stay visible because the flags are in React state)
        if (isDeactivated) {
            sessionStorage.removeItem('account_deactivated');
            setSearchParams({}, { replace: true });
        }
        if (isSessionExpired) {
            sessionStorage.removeItem('session_expired');
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
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50"
        >
            <div className="w-full max-w-md">
                    {/* Mobile header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:hidden flex flex-col items-center gap-2 mb-8"
                    >
                        <img src="/heroIcon.png" alt="InternTrack" className="h-20 w-auto" />
                        <div className="flex items-center gap-1 font-black text-2xl" aria-label="InternTrack">
                            <span className="text-gray-800">Intern</span>
                            <span className="text-orange">Track</span>
                        </div>
                    </motion.div>

                    {/* Session expired notice */}
                    {isSessionExpired && !isDeactivated && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex gap-3 items-start"
                        >
                            <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger">Your session has expired due to inactivity or a connection issue. Please log in again.</p>
                        </motion.div>
                    )}

                    {/* Deactivated notice */}
                    {isDeactivated && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex gap-3 items-start"
                        >
                            <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger">Your account has been archived.</p>
                        </motion.div>
                    )}

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex gap-3 items-start"
                        >
                            <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger">{error}</p>
                        </motion.div>
                    )}

                    {/* Resend confirmation info */}
                    {showResend && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3"
                        >
                            <div className="flex gap-3 items-start">
                                <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-900 font-medium mb-3">
                                        Didn't receive a confirmation email, or it expired? Let us send it again.
                                    </p>
                                    {resendStatus === 'sent' && resendMessage ? (
                                        <p className="text-sm text-green-700 font-medium">{resendMessage}</p>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={resendEmail}
                                                onChange={(e) => setResendEmail(e.target.value)}
                                                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleResendConfirmation}
                                                disabled={resendStatus === 'sending'}
                                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
                                                id="resend-confirmation-btn"
                                            >
                                                {resendStatus === 'sending' ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        <span>Sending...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={14} />
                                                        <span>Resend Email</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {resendStatus === 'error' && resendMessage && (
                                <p className="text-sm text-red-700 font-medium">{resendMessage}</p>
                            )}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" id="login-form" noValidate>
                        {/* Email field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                        >
                            <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Email
                            </label>
                            <div className={`relative transition-all duration-200 ${touched.email && fieldErrors.email ? '' : ''}`}>
                                <input
                                    id="login-email"
                                    type="email"
                                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (touched.email) setFieldErrors((prev) => {
                                            const n = { ...prev };
                                            delete n.email;
                                            return n;
                                        });
                                    }}
                                    onBlur={() => handleBlur('email')}
                                    disabled={formDisabled}
                                    autoComplete="email"
                                />
                            </div>
                            {touched.email && fieldErrors.email && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldErrors.email}
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Password field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                        >
                            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Password
                            </label>
                            <div className={`relative transition-all duration-200 ${touched.password && fieldErrors.password ? '' : ''}`}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none pr-12 border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (touched.password) setFieldErrors((prev) => {
                                            const n = { ...prev };
                                            delete n.password;
                                            return n;
                                        });
                                    }}
                                    onBlur={() => handleBlur('password')}
                                    disabled={formDisabled}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {touched.password && fieldErrors.password && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldErrors.password}
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Login button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full mt-8 px-4 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={formDisabled}
                                id="login-submit"
                            >
                                {formDisabled ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </motion.button>
                        </motion.div>

                        {/* Forgot password link */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center"
                        >
                            <Link
                                to="/forgot-password"
                                className="text-sm font-bold text-orange hover:opacity-80 transition-opacity"
                                id="forgot-password-link"
                            >
                                Forgot password?
                            </Link>
                        </motion.div>
                    </form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-8 text-center text-sm text-gray-600"
                    >
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-bold text-orange hover:text-orange transition-opacity"
                            id="signup-link"
                        >
                            Sign Up here
                        </Link>
                    </motion.div>
            </div>
        </motion.div>
    );
};

export default Login;
