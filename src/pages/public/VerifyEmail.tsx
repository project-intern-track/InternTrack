import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Info } from 'lucide-react';
import '../../styles/auth.css';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleReturnToLogin = () => {
        // Clear any navigation state and go to login
        navigate('/', { replace: true });
    };

    return (
        <div className="flex min-h-screen h-screen bg-[#fafafa] flex-col md:flex-row justify-center items-center">
            {/* Left half: hero image */}
            <div className="hidden md:block flex-[0_0_50%] relative overflow-hidden h-full">
                <img src="/heroimage.png" alt="Person typing on laptop" className="w-full h-full object-cover block rounded-tr-[24px] rounded-br-[24px]" />
            </div>

            {/* Right half: verify email content */}
            <div className="flex-1 flex flex-col justify-center items-center py-8 px-6 md:py-6 md:px-12 w-full h-full">
                <div className="w-full max-w-[420px] md:max-w-[380px] bg-white md:bg-transparent p-8 md:p-0 rounded-2xl md:rounded-none shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:shadow-none text-center flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                        <div className="w-[4.5rem] h-[4.5rem] bg-orange/10 text-orange rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,136,0,0.2)]">
                            <Mail size={48} />
                        </div>
                        
                        <h2 className="text-[1.75rem] font-bold text-foreground mb-3 leading-tight">Verify your email</h2>
                        
                        <p className="text-[#666] text-base leading-relaxed mb-2">
                            We've sent a confirmation link to:
                        </p>
                        
                        {email && (
                            <p className="font-semibold text-foreground text-[1.0625rem] mb-6">{email}</p>
                        )}
                        
                        <div className="flex items-start gap-3 p-4 bg-orange/5 border border-orange/20 rounded-xl text-left mb-8 w-full" id="email-verification-notice">
                            <Info size={18} className="shrink-0 mt-1 text-orange" />
                            <div className="text-[0.875rem] leading-relaxed text-[#555]">
                                <strong>Important:</strong> You must click the confirmation link in your email
                                before you can sign in. Check your <strong>spam/junk folder</strong> if you don't see it.
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleReturnToLogin} 
                            className="w-full py-3 px-5 text-base font-semibold border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 tracking-[0.01em] hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)]" 
                            id="return-to-login"
                        >
                            Return to Login
                        </button>
                        
                        <p className="text-sm text-[#777] mt-5 leading-relaxed">
                            Didn't receive the email? Wait a minute, then try signing up again.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
