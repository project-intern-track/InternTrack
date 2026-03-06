import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

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
                            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange/10 mb-6 mx-auto"
                        >
                            <Mail className="text-orange" size={40} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-black tracking-tight text-gray-900 mb-3"
                        >
                            Check your email
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 text-sm mb-4"
                        >
                            We've sent a password reset link to:
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-gray-900 font-bold text-sm px-4 py-3 bg-gray-100 rounded-lg mb-6 break-all"
                        >
                            {email}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3"
                        >
                            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-800 text-left">
                                Click the link in the email to reset your password. Check your <strong>spam/junk folder</strong>.
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            <Link
                                to="/"
                                className="inline-block w-full px-6 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                            >
                                Back to Login
                            </Link>
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
                            Forgot your password?
                        </h2>
                        <p className="text-gray-600 text-sm">
                            Enter your email and we'll send you a reset link
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
                    <form onSubmit={handleSubmit} className="space-y-5" id="forgot-password-form" noValidate>
                        {/* Email field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                        >
                            <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="forgot-email"
                                    type="email"
                                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter your email address"
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
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldError}
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Submit button */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full mt-8 px-4 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                            id="forgot-submit"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Sending link...</span>
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 text-center"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1 text-sm font-bold text-orange hover:opacity-80 transition-opacity"
                            id="back-to-login-link"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
