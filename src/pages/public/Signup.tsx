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
                    if (password.length < 6) missing.push('be at least 6 characters');
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
        <div className="auth-page">
            {/* Left half: hero image */}
            <div className="auth-hero">
                <img src="/heroimage.png" alt="Person typing on laptop" className="auth-hero-image" />
            </div>

            {/* Right half: signup form */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-mobile-header">
                        <img src="/heroIcon.png" alt="InternTrack" className="auth-mobile-icon" />
                        <div className="auth-mobile-wordmark" aria-label="InternTrack">
                            <span className="auth-mobile-wordmark-intern">Intern</span>
                            <span className="auth-mobile-wordmark-track">Track</span>
                        </div>
                    </div>

                    {error && (
                        <div className="auth-error" id="signup-error">
                            <AlertCircle size={18} className="auth-error-alert-icon" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" id="signup-form" noValidate>
                        <div className="auth-field">
                            <label htmlFor="signup-name" className="auth-label">Full Name</label>
                            <div className={touched.fullName && fieldErrors.fullName ? 'auth-input-error' : ''}>
                                <input id="signup-name" type="text" className="auth-input" placeholder="Enter full name"
                                    value={fullName} onChange={(e) => handleChange('fullName', e.target.value)}
                                    onBlur={() => handleBlur('fullName')} disabled={isSubmitting} autoComplete="name" />
                            </div>
                            {touched.fullName && fieldErrors.fullName && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.fullName}</span>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="signup-role" className="auth-label">Role</label>
                            <div className={touched.role && fieldErrors.role ? 'auth-input-error' : ''}>
                                <select id="signup-role" className={`auth-select ${!role ? 'placeholder-shown' : ''}`}
                                    value={role} onChange={(e) => handleChange('role', e.target.value)}
                                    onBlur={() => handleBlur('role')} disabled={isSubmitting}>
                                    <option value="" disabled>Select role</option>
                                    {OJT_ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                                </select>
                            </div>
                            {touched.role && fieldErrors.role && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.role}</span>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="signup-email" className="auth-label">Email address</label>
                            <div className={touched.email && fieldErrors.email ? 'auth-input-error' : ''}>
                                <input id="signup-email" type="email" className="auth-input" placeholder="Enter email address"
                                    value={email} onChange={(e) => handleChange('email', e.target.value)}
                                    onBlur={() => handleBlur('email')} disabled={isSubmitting} autoComplete="email" />
                            </div>
                            {touched.email && fieldErrors.email && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="signup-password" className="auth-label">Password</label>
                            <div className={`auth-input-wrapper ${touched.password && fieldErrors.password ? 'auth-input-error' : ''}`}>
                                <input id="signup-password" type={showPassword ? 'text' : 'password'} className="auth-input"
                                    placeholder="Enter password" value={password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    onBlur={() => handleBlur('password')} disabled={isSubmitting} autoComplete="new-password" />
                                <button type="button" className="auth-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {touched.password && fieldErrors.password && (
                                <span className="auth-field-hint auth-field-hint-error">{fieldErrors.password}</span>
                            )}
                        </div>

                        <div className="auth-field-row">
                            <div className="auth-field">
                                <label htmlFor="signup-start-date" className="auth-label">Start Date</label>
                                <div className={touched.startDate && fieldErrors.startDate ? 'auth-input-error' : ''}>
                                    <input id="signup-start-date" type="date" className="auth-input" value={startDate}
                                        min={todayStr}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        onBlur={() => handleBlur('startDate')} disabled={isSubmitting} />
                                </div>
                                {touched.startDate && fieldErrors.startDate && (
                                    <span className="auth-field-hint auth-field-hint-error">{fieldErrors.startDate}</span>
                                )}
                            </div>
                            <div className="auth-field">
                                <label htmlFor="signup-hours" className="auth-label">Required Hours</label>
                                <div className={touched.requiredHours && fieldErrors.requiredHours ? 'auth-input-error' : ''}>
                                    <input id="signup-hours" type="text" inputMode="numeric" className="auth-input" placeholder="Enter hours"
                                        value={requiredHours}
                                        onChange={(e) => handleChange('requiredHours', e.target.value)}
                                        onBlur={() => handleBlur('requiredHours')} disabled={isSubmitting} />
                                </div>
                                {touched.requiredHours && fieldErrors.requiredHours && (
                                    <span className="auth-field-hint auth-field-hint-error">{fieldErrors.requiredHours}</span>
                                )}
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">OJT Type</label>
                            <div className="auth-radio-group">
                                <label className="auth-radio-label">
                                    <input type="radio" name="ojt-type" value="required" checked={ojtType === 'required'}
                                        onChange={() => setOjtType('required')} disabled={isSubmitting} />
                                    Required
                                </label>
                                <label className="auth-radio-label">
                                    <input type="radio" name="ojt-type" value="voluntary" checked={ojtType === 'voluntary'}
                                        onChange={() => setOjtType('voluntary')} disabled={isSubmitting} />
                                    Voluntary
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={isSubmitting} id="signup-submit">
                            {isSubmitting ? (<><Loader2 size={18} className="auth-spinner" /> Creating account...</>) : 'Sign Up'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/" className="auth-link" id="login-link">Login here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
