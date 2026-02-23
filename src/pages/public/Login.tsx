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
        <div className="flex min-h-screen h-screen bg-[#fafafa] overflow-auto md:overflow-hidden flex-col md:flex-row">
            {/* Left half: hero image */}
            <div className="hidden md:block flex-[0_0_50%] relative overflow-hidden">
                <img src="/heroimage.png" alt="Person typing on laptop" className="w-full h-full object-cover block rounded-tr-[24px] rounded-br-[24px]" />
            </div>

            {/* Right half: login form */}
            <div className="flex-1 flex flex-col justify-center items-center py-8 px-6 md:py-6 md:px-12 overflow-y-visible md:overflow-y-auto">
                <div className="w-full max-w-[380px] flex flex-col items-center md:block bg-white md:bg-transparent p-6 md:p-0 rounded-2xl md:rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:shadow-none">
                    <div className="md:hidden flex flex-col items-center mb-6">
                        <img src="/heroIcon.png" alt="InternTrack" className="w-14 h-14 rounded-xl bg-orange flex items-center justify-center mb-4" />
                        <div className="text-[1.375rem] font-bold flex gap-1" aria-label="InternTrack">
                            <span className="text-foreground">Intern</span>
                            <span className="text-orange">Track</span>
                        </div>
                    </div>
                    {error && (
                        <div className="flex items-start gap-2.5 py-3 px-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-[0.8125rem] leading-snug mb-4 animate-[shake_0.35s_ease]" id="login-error">
                            <AlertCircle size={18} className="shrink-0 mt-[1px]" />
                            <div>{error}</div>
                        </div>
                    )}

                    {showResend && (
                        <div className="flex items-start gap-3 py-3.5 px-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-700 text-[0.8125rem] leading-relaxed text-left mb-4" id="resend-confirmation-box">
                            <Info size={18} className="shrink-0 mt-[2px] text-blue-600" />
                            <div>
                                <strong>Haven't confirmed your email?</strong>
                                <p className="m-0 mt-1 mb-2 text-[0.8125rem]">
                                    Click below to get a new confirmation link.
                                </p>
                                {resendStatus === 'sent' && resendMessage ? (
                                    <p className="text-[0.8125rem] text-success font-medium m-0 leading-snug">{resendMessage}</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resendStatus === 'sending'}
                                        className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-blue-700 bg-blue-500/10 border border-blue-500/20 rounded-md cursor-pointer transition-all duration-200 hover:bg-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                        id="resend-confirmation-btn"
                                    >
                                        {resendStatus === 'sending' ? (
                                            <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                        ) : (
                                            <><RefreshCw size={14} /> Resend Confirmation Email</>
                                        )}
                                    </button>
                                )}
                                {resendStatus === 'error' && resendMessage && (
                                    <p className="text-xs text-danger mt-1.5 mb-0">{resendMessage}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" id="login-form" noValidate>
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="login-email" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Email</label>
                            <div className={touched.email && fieldErrors.email ? 'text-danger' : ''}>
                                <input
                                    id="login-email"
                                    type="email"
                                    className={`w-full py-2.5 px-3.5 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.email && fieldErrors.email ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
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
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="login-password" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Password</label>
                            <div className={`relative flex items-center ${touched.password && fieldErrors.password ? 'text-danger' : ''}`}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`w-full py-2.5 px-3.5 pr-10 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.password && fieldErrors.password ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
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
                                    className="absolute right-3 bg-transparent border-none p-1 text-[#998f83] cursor-pointer flex items-center justify-center rounded transition-colors hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.password && fieldErrors.password && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.password}</span>
                            )}
                        </div>

                        <button type="submit" className="w-full py-3 px-5 text-base font-semibold mt-2 border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 tracking-[0.01em] hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)] disabled:opacity-60 disabled:cursor-not-allowed" disabled={formDisabled} id="login-submit">
                            {formDisabled ? (<><Loader2 size={18} className="animate-spin" /> Signing in...</>) : 'Login'}
                        </button>

                        <Link to="/forgot-password" className="block text-right text-sm text-black no-underline mt-3 font-normal italic transition-colors hover:text-orange hover:underline" id="forgot-password-link">
                            Forgot password?
                        </Link>
                    </form>

                    <div className="text-center mt-6 w-full">
                        <p className="text-sm text-black">Don't have an account? <Link to="/signup" className="text-orange font-semibold no-underline transition-colors hover:underline" id="signup-link">Sign Up here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
