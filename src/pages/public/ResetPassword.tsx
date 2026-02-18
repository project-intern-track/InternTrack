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
            <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="auth-success-card">
                    <div className="auth-success-icon auth-success-icon-green"><CheckCircle size={36} /></div>
                    <h2>Password Updated!</h2>
                    <p>Your password has been successfully changed.</p>
                    <button onClick={() => navigate('/')} className="auth-submit-btn" id="go-to-login-reset">Go to Login</button>
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

            {/* Right half: reset password form */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-mobile-header">
                        <img src="/heroIcon.png" alt="InternTrack" className="auth-mobile-icon" />
                        <img src="/heroLogo.png" alt="InternTrack Logo" className="auth-hero-mobile-logo" />
                    </div>

                    <div className="auth-compact-header" style={{ marginBottom: '2rem' }}>
                        <h2>Set new password</h2>
                        <p>Choose a strong password for your account</p>
                    </div>

                    {error && (
                        <div className="auth-error" id="reset-error">
                            <AlertCircle size={18} className="auth-error-alert-icon" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" id="reset-password-form" noValidate>
                        <div className="auth-field">
                            <label htmlFor="reset-password" className="auth-label">New Password</label>
                            <div className={`auth-input-wrapper ${touched.newPassword && fieldErrors.newPassword ? 'auth-input-error' : ''}`}>
                                <input id="reset-password" type={showPassword ? 'text' : 'password'} className="auth-input"
                                    placeholder="Min 6 characters" value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); if (touched.newPassword) setFieldErrors((p) => { const n = { ...p }; delete n.newPassword; return n; }); }}
                                    onBlur={() => handleBlur('newPassword')} disabled={isSubmitting} autoComplete="new-password" />
                                <button type="button" className="auth-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.newPassword && fieldErrors.newPassword && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.newPassword}</span>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="reset-confirm-password" className="auth-label">Confirm New Password</label>
                            <div className={`auth-input-wrapper ${touched.confirmPassword && fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}>
                                <input id="reset-confirm-password" type={showPassword ? 'text' : 'password'} className="auth-input"
                                    placeholder="Re-enter your new password" value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); if (touched.confirmPassword) setFieldErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n; }); }}
                                    onBlur={() => handleBlur('confirmPassword')} disabled={isSubmitting} autoComplete="new-password" />
                            </div>
                            {touched.confirmPassword && fieldErrors.confirmPassword && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.confirmPassword}</span>
                            )}
                            {confirmPassword.length > 0 && !fieldErrors.confirmPassword && newPassword === confirmPassword && touched.confirmPassword && (
                                <span className="auth-field-hint auth-field-hint-success"><CheckCircle size={12} /> Passwords match</span>
                            )}
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting} id="reset-submit">
                            {isSubmitting ? (<><Loader2 size={18} className="auth-spinner" /> Updating...</>) : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
