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
            <div className="flex min-h-screen h-screen bg-[#fafafa] flex-col md:flex-row justify-center items-center">
                <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]"><Mail size={36} /></div>
                    <h2 className="text-[1.75rem] font-bold text-foreground mb-3 leading-tight">Check your email</h2>
                    <p className="text-[#666] text-base leading-relaxed mb-1">We've sent a password reset link to:</p>
                    <p className="font-semibold text-foreground text-base mb-6">{email}</p>
                    <div className="flex items-start gap-3 p-4 bg-orange/5 border border-orange/20 rounded-xl text-left mb-8">
                        <Info size={18} className="shrink-0 mt-1 text-orange" />
                        <div className="text-[0.875rem] leading-relaxed text-[#555]">Click the link in the email to reset your password. Check your <strong>spam/junk folder</strong>.</div>
                    </div>
                    <Link to="/" className="w-full py-3 px-5 text-base font-semibold border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)]" id="back-to-login" style={{ textDecoration: 'none' }}>Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen h-screen bg-[#fafafa] overflow-auto md:overflow-hidden flex-col md:flex-row">
            {/* Left half: hero image */}
            <div className="hidden md:block flex-[0_0_50%] relative overflow-hidden">
                <img src="/heroimage.png" alt="Person typing on laptop" className="w-full h-full object-cover block rounded-tr-[24px] rounded-br-[24px]" />
            </div>

            {/* Right half: forgot password form */}
            <div className="flex-1 flex flex-col justify-center items-center py-8 px-6 md:py-6 md:px-12 overflow-y-visible md:overflow-y-auto">
                <div className="w-full max-w-[380px] flex flex-col items-center md:block bg-white md:bg-transparent p-6 md:p-0 rounded-2xl md:rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:shadow-none">
                    <div className="md:hidden flex flex-col items-center mb-6">
                        <img src="/heroIcon.png" alt="InternTrack" className="w-14 h-14 rounded-xl bg-orange flex items-center justify-center mb-4" />
                        <div className="text-[1.375rem] font-bold flex gap-1" aria-label="InternTrack">
                            <span className="text-foreground">Intern</span>
                            <span className="text-orange">Track</span>
                        </div>
                    </div>

                    <div className="text-center md:text-left mb-8">
                        <h2 className="text-[1.75rem] md:text-[2rem] font-bold text-foreground mb-2 leading-tight tracking-tight">Forgot your password?</h2>
                        <p className="text-[0.9375rem] text-[#6b655b] leading-relaxed">Enter your email and we'll send you a reset link</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 py-3 px-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-[0.8125rem] leading-snug mb-4 animate-[shake_0.35s_ease]" id="forgot-error">
                            <AlertCircle size={18} className="shrink-0 mt-[1px]" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" id="forgot-password-form" noValidate>
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="forgot-email" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Email Address</label>
                            <div className={touched && fieldError ? 'text-danger' : ''}>
                                <input id="forgot-email" type="email" className={`w-full py-2.5 px-3.5 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched && fieldError ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
                                    placeholder="Enter your email address" value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (touched) setFieldError(null); }}
                                    onBlur={handleBlur} disabled={isSubmitting} autoComplete="email" />
                            </div>
                            {touched && fieldError && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldError}</span>
                            )}
                        </div>
                        <button type="submit" className="w-full py-3 px-5 text-base font-semibold mt-2 border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 tracking-[0.01em] hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)] disabled:opacity-60 disabled:cursor-not-allowed" disabled={isSubmitting} id="forgot-submit">
                            {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Sending link...</>) : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="text-center mt-6 w-full">
                        <Link to="/" className="inline-flex items-center gap-1 text-orange font-semibold no-underline transition-colors hover:underline" id="back-to-login-link">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
