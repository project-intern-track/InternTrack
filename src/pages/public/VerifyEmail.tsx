import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleReturnToLogin = () => {
        // Clear any navigation state and go to login
        navigate('/', { replace: true });
    };

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

            {/* Right: Verify content */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50"
            >
                <div className="w-full max-w-md text-center">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange/10 mb-8 mx-auto"
                    >
                        <Mail className="text-orange" size={48} />
                    </motion.div>

                    {/* Heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-black tracking-tight text-gray-900 mb-4"
                    >
                        Verify your email
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600 text-sm mb-4"
                    >
                        We've sent a confirmation link to:
                    </motion.p>

                    {/* Email display */}
                    {email && (
                        <motion.p
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-gray-900 font-bold text-sm px-4 py-3 bg-gray-100 rounded-lg mb-6 break-all"
                        >
                            {email}
                        </motion.p>
                    )}

                    {/* Info box */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3"
                        id="email-verification-notice"
                    >
                        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 text-left">
                            <strong>Important:</strong> You must click the confirmation link in your email
                            before you can sign in. Check your <strong>spam/junk folder</strong> if you don't see it.
                        </div>
                    </motion.div>

                    {/* Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReturnToLogin}
                        className="w-full px-6 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200"
                        id="return-to-login"
                    >
                        Return to Login
                    </motion.button>

                    {/* Hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-xs text-gray-600 mt-6 leading-relaxed"
                    >
                        Didn't receive the email? Wait a minute, then try signing up again.
                    </motion.p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
