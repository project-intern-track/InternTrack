import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import DropdownSelect from '../../components/DropdownSelect';
import DateTimePicker from '../../components/DateTimePicker';

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

    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

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
                    if (password.length < 8) missing.push('be at least 8 characters');
                    if (!/[A-Z]/.test(password)) missing.push('contain a capital letter');
                    if (!/[0-9]/.test(password)) missing.push('contain a number');
                    if (!/[^a-zA-Z0-9]/.test(password)) missing.push('contain a special symbol');

                    if (missing.length > 0) return 'Password must: ' + missing.join(', ');
                }
                return undefined;
            case 'startDate':
                if (!startDate) return 'Start date is required.';
                if (startDate < todayStr) return 'Start date cannot be in the past.';
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
            if (msg.toLowerCase().includes('email already exists') || msg.toLowerCase().includes('taken')) {
                setFieldErrors((prev) => ({ ...prev, email: "Email is already used." }));
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
                    <form onSubmit={handleSubmit} className="space-y-4" id="signup-form" noValidate>
                        {/* Full Name field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                        >
                            <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Full Name
                            </label>
                            <div className="relative">
                                <input
                                    id="signup-name"
                                    type="text"
                                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter full name"
                                    value={fullName}
                                    onChange={(e) => handleChange('fullName', e.target.value)}
                                    onBlur={() => handleBlur('fullName')}
                                    disabled={isSubmitting}
                                    autoComplete="name"
                                />
                            </div>
                            {touched.fullName && fieldErrors.fullName && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldErrors.fullName}
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Role field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.34 }}
                            className="space-y-2"
                        >
                            <label htmlFor="signup-role" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Role
                            </label>
                            <div className="relative">
                                <DropdownSelect
                                    value={role}
                                    onChange={(value) => {
                                        handleChange('role', value);
                                        handleBlur('role');
                                    }}
                                    options={[
                                        { value: '', label: 'Select role' },
                                        ...OJT_ROLES.map((r) => ({ value: r, label: r })),
                                    ]}
                                    disabled={isSubmitting}
                                    buttonClassName="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-medium focus:border-orange focus:ring-2 focus:ring-orange/10"
                                />
                            </div>
                            {touched.role && fieldErrors.role && (
                                <motion.span
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-danger font-medium"
                                >
                                    {fieldErrors.role}
                                </motion.span>
                            )}
                        </motion.div>

                        {/* Email field */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.38 }}
                            className="space-y-2"
                        >
                            <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="signup-email"
                                    type="email"
                                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter email address"
                                    value={email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    onBlur={() => handleBlur('email')}
                                    disabled={isSubmitting}
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
                            transition={{ delay: 0.42 }}
                            className="space-y-2"
                        >
                            <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none pr-12 border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')}
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

                        {/* Start Date and Required Hours row */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.46 }}
                                className="space-y-2"
                            >
                                <label htmlFor="signup-start-date" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                    Start Date
                                </label>
                                <div className="relative">
                                    <DateTimePicker
                                        date={startDate}
                                        time=""
                                        minDate={todayStr}
                                        showTime={false}
                                        datePlaceholder="Select start date"
                                        disabled={isSubmitting}
                                        onDateChange={(value) => handleChange('startDate', value)}
                                        onTimeChange={() => {}}
                                    />
                                </div>
                                {touched.startDate && fieldErrors.startDate && (
                                    <motion.span
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-danger font-medium block"
                                    >
                                        {fieldErrors.startDate}
                                    </motion.span>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.50 }}
                                className="space-y-2"
                            >
                                <label htmlFor="signup-hours" className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                    Required Hours
                                </label>
                                <div className="relative">
                                    <input
                                        id="signup-hours"
                                        type="text"
                                        inputMode="numeric"
                                    className="w-full px-3 py-3 border-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-sm border-gray-300 bg-white focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="0"
                                        value={requiredHours}
                                        onChange={(e) => handleChange('requiredHours', e.target.value)}
                                        onBlur={() => handleBlur('requiredHours')}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {touched.requiredHours && fieldErrors.requiredHours && (
                                    <motion.span
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-danger font-medium block"
                                    >
                                        {fieldErrors.requiredHours}
                                    </motion.span>
                                )}
                            </motion.div>
                        </div>

                        {/* OJT Type radio group */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.54 }}
                            className="space-y-2"
                        >
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-600">
                                OJT Type
                            </label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="ojt-type"
                                        value="required"
                                        checked={ojtType === 'required'}
                                        onChange={() => setOjtType('required')}
                                        disabled={isSubmitting}
                                        className="w-4 h-4 cursor-pointer accent-orange"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Required</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="ojt-type"
                                        value="voluntary"
                                        checked={ojtType === 'voluntary'}
                                        onChange={() => setOjtType('voluntary')}
                                        disabled={isSubmitting}
                                        className="w-4 h-4 cursor-pointer accent-orange"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Voluntary</span>
                                </label>
                            </div>
                        </motion.div>

                        {/* Submit button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.58 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full mt-8 px-4 py-3 bg-orange text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                                id="signup-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    'Sign Up'
                                )}
                            </motion.button>
                        </motion.div>
                    </form>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.62 }}
                        className="mt-6 text-center text-sm text-gray-600"
                    >
                        Already have an account?{' '}
                        <Link
                            to="/"
                            className="font-bold text-orange hover:text-orange transition-opacity"
                            id="login-link"
                        >
                            Login here
                        </Link>
                    </motion.div>
            </div>
        </motion.div>
    );
};

export default Signup;
