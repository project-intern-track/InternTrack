import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/auth.css';

interface FieldErrors { newPassword?: string; confirmPassword?: string; }

const ResetPassword = () => {
    const { updatePassword } = useAuth();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = (field: string): string | undefined => {
        if (field === 'newPassword') {
            if (!newPassword) return 'New password is required.';
            {
                const missing = [];
                if (newPassword.length < 6) missing.push('be at least 6 characters');
                if (!/[A-Z]/.test(newPassword)) missing.push('contain a capital letter');
                if (!/[0-9]/.test(newPassword)) missing.push('contain a number');
                if (!/[^a-zA-Z0-9]/.test(newPassword)) missing.push('contain a special symbol');

                if (missing.length > 0) return 'Password must: ' + missing.join(', ');
            }
        }
        if (field === 'confirmPassword') {
            if (!confirmPassword) return 'Please confirm your password.';
            if (confirmPassword !== newPassword) return 'Passwords do not match.';
        }
        return undefined;
    };

    const validateAll = (): boolean => {
        const errors: FieldErrors = {};
        const e1 = validateField('newPassword'); if (e1) errors.newPassword = e1;
        const e2 = validateField('confirmPassword'); if (e2) errors.confirmPassword = e2;
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const err = validateField(field);
        setFieldErrors((prev) => {
            const next = { ...prev };
            if (err) (next as Record<string, string>)[field] = err;
            else delete (next as Record<string, string | undefined>)[field];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTouched({ newPassword: true, confirmPassword: true });
        if (!validateAll()) return;
        setIsSubmitting(true);
        const result = await updatePassword(newPassword);
        if (result.error) { setError(result.error); setIsSubmitting(false); }
        else { setSuccess(true); setIsSubmitting(false); }
    };

    if (success) {
        return (
            <div className="flex min-h-screen h-screen bg-[#fafafa] flex-col md:flex-row justify-center items-center">
                <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(21,128,61,0.2)]"><CheckCircle size={36} /></div>
                    <h2 className="text-[1.75rem] font-bold text-foreground mb-3 leading-tight">Password Updated!</h2>
                    <p className="text-[#666] text-base leading-relaxed mb-8">Your password has been successfully changed.</p>
                    <button onClick={() => navigate('/')} className="w-full py-3 px-5 text-base font-semibold border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 tracking-[0.01em] hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)]" id="go-to-login-reset">Go to Login</button>
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

            {/* Right half: reset password form */}
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
                        <h2 className="text-[1.75rem] md:text-[2rem] font-bold text-foreground mb-2 leading-tight tracking-tight">Set new password</h2>
                        <p className="text-[0.9375rem] text-[#6b655b] leading-relaxed">Choose a strong password for your account</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 py-3 px-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-[0.8125rem] leading-snug mb-4 animate-[shake_0.35s_ease]" id="reset-error">
                            <AlertCircle size={18} className="shrink-0 mt-[1px]" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" id="reset-password-form" noValidate>
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="reset-password" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">New Password</label>
                            <div className={`relative flex items-center ${touched.newPassword && fieldErrors.newPassword ? 'text-danger' : ''}`}>
                                <input id="reset-password" type={showPassword ? 'text' : 'password'} className={`w-full py-2.5 px-3.5 pr-10 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.newPassword && fieldErrors.newPassword ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
                                    placeholder="Min 6 characters" value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); if (touched.newPassword) setFieldErrors((p) => { const n = { ...p }; delete n.newPassword; return n; }); }}
                                    onBlur={() => handleBlur('newPassword')} disabled={isSubmitting} autoComplete="new-password" />
                                <button type="button" className="absolute right-3 bg-transparent border-none p-1 text-[#998f83] cursor-pointer flex items-center justify-center rounded transition-colors hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.newPassword && fieldErrors.newPassword && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.newPassword}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="reset-confirm-password" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Confirm New Password</label>
                            <div className={`relative flex items-center ${touched.confirmPassword && fieldErrors.confirmPassword ? 'text-danger' : ''}`}>
                                <input id="reset-confirm-password" type={showPassword ? 'text' : 'password'} className={`w-full py-2.5 px-3.5 pr-10 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.confirmPassword && fieldErrors.confirmPassword ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
                                    placeholder="Re-enter your new password" value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); if (touched.confirmPassword) setFieldErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n; }); }}
                                    onBlur={() => handleBlur('confirmPassword')} disabled={isSubmitting} autoComplete="new-password" />
                            </div>
                            {touched.confirmPassword && fieldErrors.confirmPassword && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.confirmPassword}</span>
                            )}
                            {confirmPassword.length > 0 && !fieldErrors.confirmPassword && newPassword === confirmPassword && touched.confirmPassword && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-success animate-[hint-enter_0.2s_ease]"><CheckCircle size={12} /> Passwords match</span>
                            )}
                        </div>

                        <button type="submit" className="w-full py-3 px-5 text-base font-semibold mt-2 border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 tracking-[0.01em] hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)] disabled:opacity-60 disabled:cursor-not-allowed" disabled={isSubmitting} id="reset-submit">
                            {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Updating...</>) : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
