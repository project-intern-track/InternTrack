import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../../styles/auth.css';

const OJT_ROLES = [
    'UI/UX Designer',
    'Back-end Developer',
    'Front-end Developer',
    'Fullstack Developer',
    'Mobile Developer',
    'Quality Assurance',
    'Data Analyst',
    'Project Manager',
    'Multimedia',
    'IT Support',
];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// Name must contain only letters, spaces, dots, or hyphens (no numbers)
const isValidName = (name: string) => /^[a-zA-Z\s.-]+$/.test(name) && name.trim().length >= 2;

interface FieldErrors {
    fullName?: string;
    role?: string;
    email?: string;
    password?: string;
    startDate?: string;
    requiredHours?: string;
}

const Signup = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [requiredHours, setRequiredHours] = useState('');
    const [ojtType, setOjtType] = useState<'required' | 'voluntary'>('required');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Re-validate required hours when OJT type changes
    useEffect(() => {
        if (touched.requiredHours) {
            const err = validateField('requiredHours');
            setFieldErrors((prev) => {
                const next = { ...prev };
                if (err) next.requiredHours = err;
                else delete next.requiredHours;
                return next;
            });
        }
    }, [ojtType]);

    const validateField = (field: string): string | undefined => {
        switch (field) {
            case 'fullName':
                if (!fullName.trim()) return 'Full name is required.';
                if (!isValidName(fullName)) return 'Name must be at least 2 characters.';
                return undefined;
            case 'role':
                if (!role) return 'Please select a role.';
                return undefined;
            case 'email':
                if (!email.trim()) return 'Email is required.';
                if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
                return undefined;
            case 'password':
                if (!password) return 'Password is required.';
                {
                    const missing = [];
                    if (password.length < 6) missing.push('be at least 6 characters');
                    if (!/[A-Z]/.test(password)) missing.push('contain a capital letter');
                    if (!/[0-9]/.test(password)) missing.push('contain a number');
                    if (!/[^a-zA-Z0-9]/.test(password)) missing.push('contain a special symbol');

                    if (missing.length > 0) return 'Password must: ' + missing.join(', ');
                }
                return undefined;
            case 'startDate':
                if (!startDate) return 'Start date is required.';
                return undefined;
            case 'requiredHours':
                if (!requiredHours) return 'Required hours is needed.';
                const h = Number(requiredHours);
                if (isNaN(h) || h <= 0) return 'Must be greater than 0.';
                if (ojtType === 'voluntary' && h < 500) return 'Voluntary OJT requires at least 500 hours.';
                return undefined;
            default: return undefined;
        }
    };

    const validateAll = (): boolean => {
        const errors: FieldErrors = {};
        for (const f of ['fullName', 'role', 'email', 'password', 'startDate', 'requiredHours']) {
            const err = validateField(f);
            if (err) (errors as Record<string, string>)[f] = err;
        }
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

    const handleChange = (field: string, value: string) => {
        switch (field) {
            case 'fullName':
                // Only allow letters, spaces, dots, and hyphens. Block numbers/other symbols.
                if (/^[a-zA-Z\s.-]*$/.test(value)) {
                    setFullName(value);
                }
                break;
            case 'role': setRole(value); break;
            case 'email': setEmail(value); break;
            case 'password': setPassword(value); break;
            case 'startDate': setStartDate(value); break;
            case 'requiredHours':
                if (/^\d{0,4}$/.test(value)) {
                    setRequiredHours(value);
                }
                break;
        }
        if (touched[field]) {
            setFieldErrors((prev) => { const n = { ...prev }; delete (n as Record<string, string | undefined>)[field]; return n; });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTouched({ fullName: true, role: true, email: true, password: true, startDate: true, requiredHours: true });
        if (!validateAll()) return;

        setIsSubmitting(true);
        const result = await signUp(email.trim(), password, {
            full_name: fullName.trim(),
            role: 'intern',
            ojt_role: role,
            start_date: startDate,
            required_hours: Number(requiredHours),
            ojt_type: ojtType,
        });

        if (result.error) {
            const msg = result.error;

            // If this is a duplicate email error, highlight the email field too
            if (msg.toLowerCase().includes('email already exists')) {
                setFieldErrors((prev) => ({ ...prev, email: msg }));
                setTouched((prev) => ({ ...prev, email: true }));
            }

            setError(msg);
            setIsSubmitting(false);
        } else {
            // Navigate immediately on success
            navigate('/verify-email', { state: { email: email.trim() }, replace: true });
        }
    };

    return (
        <div className="flex min-h-screen h-screen bg-[#fafafa] overflow-auto md:overflow-hidden flex-col md:flex-row">
            {/* Left half: hero image */}
            <div className="hidden md:block flex-[0_0_50%] relative overflow-hidden">
                <img src="/heroimage.png" alt="Person typing on laptop" className="w-full h-full object-cover block rounded-tr-[24px] rounded-br-[24px]" />
            </div>

            {/* Right half: signup form */}
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
                        <div className="flex items-start gap-2.5 py-3 px-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-[0.8125rem] leading-snug mb-4 animate-[shake_0.35s_ease]" id="signup-error">
                            <AlertCircle size={18} className="shrink-0 mt-[1px]" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" id="signup-form" noValidate>
                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="signup-name" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Full Name</label>
                            <div className={touched.fullName && fieldErrors.fullName ? 'text-danger' : ''}>
                                <input id="signup-name" type="text" className={`w-full py-2.5 px-3.5 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.fullName && fieldErrors.fullName ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`} placeholder="Enter full name"
                                    value={fullName} onChange={(e) => handleChange('fullName', e.target.value)}
                                    onBlur={() => handleBlur('fullName')} disabled={isSubmitting} autoComplete="name" />
                            </div>
                            {touched.fullName && fieldErrors.fullName && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.fullName}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="signup-role" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Role</label>
                            <div className={touched.role && fieldErrors.role ? 'text-danger' : ''}>
                                <select id="signup-role" className={`w-full py-2.5 px-3.5 pr-10 text-sm leading-relaxed text-foreground bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=\\'http://www.w3.org/2000/svg\\'_width=\\'16\\'_height=\\'16\\'_viewBox=\\'0_0_24_24\\'_fill=\\'none\\'_stroke=\\'%23998f83\\'_stroke-width=\\'2\\'_stroke-linecap=\\'round\\'_stroke-linejoin=\\'round\\'%3E%3Cpath_d=\\'M6_9l6_6_6-6\\'/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_0.75rem_center] focus:border-orange focus:ring-[3px] focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed ${!role ? 'text-[#998f83] italic' : ''} ${touched.role && fieldErrors.role ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
                                    value={role} onChange={(e) => handleChange('role', e.target.value)}
                                    onBlur={() => handleBlur('role')} disabled={isSubmitting}>
                                    <option value="" disabled className="bg-white text-foreground p-2">Select role</option>
                                    {OJT_ROLES.map((r) => (<option key={r} value={r} className="bg-white text-foreground p-2">{r}</option>))}
                                </select>
                            </div>
                            {touched.role && fieldErrors.role && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.role}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="signup-email" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Email address</label>
                            <div className={touched.email && fieldErrors.email ? 'text-danger' : ''}>
                                <input id="signup-email" type="email" className={`w-full py-2.5 px-3.5 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.email && fieldErrors.email ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`} placeholder="Enter email address"
                                    value={email} onChange={(e) => handleChange('email', e.target.value)}
                                    onBlur={() => handleBlur('email')} disabled={isSubmitting} autoComplete="email" />
                            </div>
                            {touched.email && fieldErrors.email && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <label htmlFor="signup-password" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Password</label>
                            <div className={`relative flex items-center ${touched.password && fieldErrors.password ? 'text-danger' : ''}`}>
                                <input id="signup-password" type={showPassword ? 'text' : 'password'} className={`w-full py-2.5 px-3.5 pr-10 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.password && fieldErrors.password ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`}
                                    placeholder="Enter password" value={password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')} disabled={isSubmitting} autoComplete="new-password" />
                                <button type="button" className="absolute right-3 bg-transparent border-none p-1 text-[#998f83] cursor-pointer flex items-center justify-center rounded transition-colors hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.password && fieldErrors.password && (
                                <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.password}</span>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-1">
                                <label htmlFor="signup-start-date" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Start Date</label>
                                <div className={touched.startDate && fieldErrors.startDate ? 'text-danger' : ''}>
                                    <input id="signup-start-date" type="date" className={`w-full py-2.5 px-3.5 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.startDate && fieldErrors.startDate ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`} value={startDate}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        onBlur={() => handleBlur('startDate')} disabled={isSubmitting} />
                                </div>
                                {touched.startDate && fieldErrors.startDate && (
                                    <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.startDate}</span>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                                <label htmlFor="signup-hours" className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">Required Hours</label>
                                <div className={touched.requiredHours && fieldErrors.requiredHours ? 'text-danger' : ''}>
                                    <input id="signup-hours" type="text" inputMode="numeric" className={`w-full py-2.5 px-3.5 text-sm leading-relaxed text-black bg-[#ece5db] border-[1.5px] rounded-lg outline-none transition-all duration-200 placeholder:text-[#a39e96] placeholder:font-normal focus:border-orange focus:ring-[3px] focus:ring-orange/10 focus:bg-[#e8e0d5] disabled:opacity-60 disabled:cursor-not-allowed ${touched.requiredHours && fieldErrors.requiredHours ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-transparent'}`} placeholder="Enter hours"
                                        value={requiredHours}
                                        onChange={(e) => handleChange('requiredHours', e.target.value)}
                                        onBlur={() => handleBlur('requiredHours')} disabled={isSubmitting} />
                                </div>
                                {touched.requiredHours && fieldErrors.requiredHours && (
                                    <span className="text-xs mt-1 flex items-center gap-1 text-danger animate-[hint-enter_0.2s_ease]">{fieldErrors.requiredHours}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 w-full">
                            <label className="font-['Poppins'] text-sm font-medium leading-tight text-black mb-1">OJT Type</label>
                            <div className="flex gap-6 mt-1">
                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                    <input type="radio" name="ojt-type" value="required" checked={ojtType === 'required'}
                                        onChange={() => setOjtType('required')} disabled={isSubmitting}
                                        className="appearance-none w-[18px] h-[18px] border-2 border-[#ccc] rounded-full outline-none cursor-pointer relative transition-colors duration-200 bg-[#ece5db] checked:border-orange checked:after:content-[''] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:w-2 checked:after:h-2 checked:after:rounded-full checked:after:bg-orange" />
                                    Required
                                </label>
                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                    <input type="radio" name="ojt-type" value="voluntary" checked={ojtType === 'voluntary'}
                                        onChange={() => setOjtType('voluntary')} disabled={isSubmitting}
                                        className="appearance-none w-[18px] h-[18px] border-2 border-[#ccc] rounded-full outline-none cursor-pointer relative transition-colors duration-200 bg-[#ece5db] checked:border-orange checked:after:content-[''] checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:w-2 checked:after:h-2 checked:after:rounded-full checked:after:bg-orange" />
                                    Voluntary
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="w-full py-3 px-5 text-base font-semibold mt-2 border-none rounded-lg bg-orange text-white cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 tracking-[0.01em] hover:not(:disabled):bg-orange/90 hover:not(:disabled):shadow-[0_4px_16px_hsl(var(--orange)_/_0.35)] disabled:opacity-60 disabled:cursor-not-allowed" disabled={isSubmitting} id="signup-submit">
                            {isSubmitting ? (<><Loader2 size={18} className="animate-spin" /> Creating account...</>) : 'Sign Up'}
                        </button>
                    </form>

                    <div className="text-center mt-6 w-full">
                        <p className="text-sm text-black">Already have an account? <Link to="/" className="text-orange font-semibold no-underline transition-colors hover:underline" id="login-link">Login here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
