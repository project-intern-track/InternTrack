import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const email = params.get('email');

        if (!token || !email) {
            setError("Invalid or missing password reset token.");
            setIsSubmitting(false);
            return;
        }

        const result = await updatePassword(newPassword, token, email);
        if (result.error) {
            if (result.error === 'You cannot use a password that has been used before.') {
                setFieldErrors((prev) => ({ ...prev, newPassword: result.error as string }));
                setTouched((prev) => ({ ...prev, newPassword: true }));
            } else {
                setError(result.error);
            }
            setIsSubmitting(false);
        }
        else { setSuccess(true); setIsSubmitting(false); }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-[2rem] shadow-lg p-8 text-center border border-gray-200">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6 mx-auto"
                        >
                            <CheckCircle className="text-green-600" size={40} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-black tracking-tight text-gray-900 mb-3"
                        >
                            Password Updated!
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 text-sm mb-8"
                        >
                            Your password has been successfully changed.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                onClick={() => navigate('/')}
                                className="w-full px-6 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                                id="go-to-login-reset"
                            >
                                Go to Login
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white overflow-hidden">
            {/* Left: Hero image */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="hidden md:block relative overflow-hidden"
            >
                <img
                    src="/heroimage.png"
                    alt="Person typing on laptop"
                    className="w-full h-full object-cover rounded-r-[2rem]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>

            {/* Right: Form panel */}
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

                    {/* Form header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8 text-center md:text-left"
                    >
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
                            Set new password
                        </h2>
                        <p className="text-gray-600 text-sm">
                            Choose a strong password for your account
                        </p>
                    </motion.div>

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

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" id="reset-password-form" noValidate>
                        {/* New Password field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                        >
                            <label htmlFor="reset-password" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="reset-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none pr-12 border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Min 6 characters"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (touched.newPassword) setFieldErrors((p) => {
                                            const n = { ...p };
                                            delete n.newPassword;
                                            return n;
                                        });
                                    }}
                                    onBlur={() => handleBlur('newPassword')}
                                    disabled={isSubmitting}
                                    autoComplete="new-password"
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
                            {touched.newPassword && fieldErrors.newPassword && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldErrors.newPassword}
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Confirm Password field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-2"
                        >
                            <label htmlFor="reset-confirm-password" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="reset-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed`}
                                    placeholder="Re-enter your new password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (touched.confirmPassword) setFieldErrors((p) => {
                                            const n = { ...p };
                                            delete n.confirmPassword;
                                            return n;
                                        });
                                    }}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    disabled={isSubmitting}
                                    autoComplete="new-password"
                                />
                            </div>
                            {touched.confirmPassword && fieldErrors.confirmPassword && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldErrors.confirmPassword}
                                </motion.span>
                            )}
                            {confirmPassword.length > 0 && !fieldErrors.confirmPassword && newPassword === confirmPassword && touched.confirmPassword && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-green-600 font-medium flex items-center gap-1"
                                >
                                    <CheckCircle size={12} /> Passwords match
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Submit button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full mt-8 px-4 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                                id="reset-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
