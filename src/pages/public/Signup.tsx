import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import '../../styles/auth.css';

// ========================
// Validation helpers
// ========================
const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidName = (name: string) =>
    name.trim().length >= 2;

interface FieldErrors {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

const Signup = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successEmail, setSuccessEmail] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // ========================
    // Field-level validation
    // ========================
    const validateField = (field: string, value?: string): string | undefined => {
        switch (field) {
            case 'fullName': {
                const v = value ?? fullName;
                if (!v.trim()) return 'Full name is required.';
                if (!isValidName(v)) return 'Name must be at least 2 characters.';
                if (v.trim().length > 100) return 'Name is too long (max 100 characters).';
                return undefined;
            }
            case 'email': {
                const v = value ?? email;
                if (!v.trim()) return 'Email is required.';
                if (!isValidEmail(v.trim())) return 'Please enter a valid email address (e.g. you@example.com).';
                return undefined;
            }
            case 'password': {
                const v = value ?? password;
                if (!v) return 'Password is required.';
                if (v.length < 6) return 'Password must be at least 6 characters.';
                return undefined;
            }
            case 'confirmPassword': {
                const v = value ?? confirmPassword;
                if (!v) return 'Please confirm your password.';
                if (v !== password) return 'Passwords do not match.';
                return undefined;
            }
            default:
                return undefined;
        }
    };

    const validateAll = (): boolean => {
        const errors: FieldErrors = {};
        const nameErr = validateField('fullName');
        const emailErr = validateField('email');
        const pwErr = validateField('password');
        const cpwErr = validateField('confirmPassword');
        if (nameErr) errors.fullName = nameErr;
        if (emailErr) errors.email = emailErr;
        if (pwErr) errors.password = pwErr;
        if (cpwErr) errors.confirmPassword = cpwErr;
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const err = validateField(field);
        setFieldErrors((prev) => {
            const next = { ...prev };
            if (err) {
                (next as Record<string, string>)[field] = err;
            } else {
                delete (next as Record<string, string | undefined>)[field];
            }
            return next;
        });
    };

    const handleChange = (field: string, value: string) => {
        // Update value
        switch (field) {
            case 'fullName': setFullName(value); break;
            case 'email': setEmail(value); break;
            case 'password': setPassword(value); break;
            case 'confirmPassword': setConfirmPassword(value); break;
        }
        // Clear field error on change if already touched
        if (touched[field]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete (next as Record<string, string | undefined>)[field];
                return next;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Mark all as touched
        setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

        if (!validateAll()) {
            return;
        }

        setIsSubmitting(true);

        const result = await signUp(email.trim(), password, {
            full_name: fullName.trim(),
            role: 'intern', // Default role for new signups
        });

        if (result.error) {
            // Friendly error messages
            let msg = result.error;
            if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
                msg = 'An account with this email already exists. Please sign in instead, or use a different email.';
            }
            setError(msg);
            setIsSubmitting(false);
        } else {
            setSuccessEmail(email.trim());
            setSuccess(true);
            setIsSubmitting(false);
        }
    };

    // ========================
    // Password strength indicator
    // ========================
    const getPasswordStrength = () => {
        if (password.length === 0) return { level: 0, label: '', color: '' };
        if (password.length < 6) return { level: 1, label: 'Too short', color: 'var(--danger)' };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 2, label: 'Weak', color: 'var(--danger)' };
        if (score === 2) return { level: 3, label: 'Fair', color: 'var(--warning)' };
        if (score === 3) return { level: 4, label: 'Good', color: 'var(--secondary)' };
        return { level: 5, label: 'Strong', color: 'var(--success)' };
    };

    const strength = getPasswordStrength();

    // ========================
    // Success screen — email confirmation
    // ========================
    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-bg-decoration">
                    <div className="auth-bg-circle auth-bg-circle-1"></div>
                    <div className="auth-bg-circle auth-bg-circle-2"></div>
                    <div className="auth-bg-circle auth-bg-circle-3"></div>
                </div>
                <div className="auth-success-card">
                    <div className="auth-success-icon">
                        <Mail size={48} />
                    </div>
                    <h2>Check your email!</h2>
                    <p style={{ marginBottom: '0.5rem' }}>
                        We've sent a confirmation link to:
                    </p>
                    <p className="auth-success-email">{successEmail}</p>
                    <div className="auth-info-box" id="email-confirmation-notice">
                        <Info size={18} className="auth-info-icon" />
                        <div>
                            <strong>Important:</strong> You must click the confirmation link in your email
                            before you can sign in. If you don't see it, check your <strong>spam/junk folder</strong>.
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-primary auth-submit-btn"
                        id="go-to-login"
                    >
                        Go to Login
                        <ArrowRight size={18} />
                    </button>
                    <p className="auth-success-hint">
                        Didn't receive the email? Wait a minute, then try signing up again.
                    </p>
                </div>
            </div>
        );
    }

    // ========================
    // Signup form
    // ========================
    return (
        <div className="auth-page">
            <div className="auth-bg-decoration">
                <div className="auth-bg-circle auth-bg-circle-1"></div>
                <div className="auth-bg-circle auth-bg-circle-2"></div>
                <div className="auth-bg-circle auth-bg-circle-3"></div>
            </div>

            <div className="auth-container">
                {/* Left side: Branding panel */}
                <div className="auth-branding">
                    <div className="auth-branding-content">
                        <div className="auth-brand-icon">
                            <Briefcase size={32} />
                        </div>
                        <h1 className="auth-brand-title">InternTrack</h1>
                        <p className="auth-brand-subtitle">
                            Centralized Internship Management Platform
                        </p>
                        <div className="auth-brand-features">
                            <div className="auth-feature-item">
                                <div className="auth-feature-dot"></div>
                                <span>Track attendance & hours</span>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-dot"></div>
                                <span>Manage tasks & evaluations</span>
                            </div>
                            <div className="auth-feature-item">
                                <div className="auth-feature-dot"></div>
                                <span>Real-time performance insights</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Signup form */}
                <div className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Create your account</h2>
                            <p>Get started with InternTrack</p>
                        </div>

                        {error && (
                            <div className="auth-error" id="signup-error">
                                <AlertCircle size={18} className="auth-error-alert-icon" />
                                <div>{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form" id="signup-form" noValidate>
                            {/* Full Name */}
                            <div className="auth-field">
                                <label htmlFor="signup-name" className="auth-label">
                                    Full Name
                                </label>
                                <div className={`auth-input-wrapper ${touched.fullName && fieldErrors.fullName ? 'auth-input-error' : ''}`}>
                                    <User size={18} className="auth-input-icon" />
                                    <input
                                        id="signup-name"
                                        type="text"
                                        className="auth-input"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                        onBlur={() => handleBlur('fullName')}
                                        disabled={isSubmitting}
                                        autoComplete="name"
                                    />
                                </div>
                                {touched.fullName && fieldErrors.fullName && (
                                    <span className="auth-field-hint auth-field-hint-error" id="signup-name-error">
                                        {fieldErrors.fullName}
                                    </span>
                                )}
                            </div>

                            {/* Email */}
                            <div className="auth-field">
                                <label htmlFor="signup-email" className="auth-label">
                                    Email Address
                                </label>
                                <div className={`auth-input-wrapper ${touched.email && fieldErrors.email ? 'auth-input-error' : ''}`}>
                                    <Mail size={18} className="auth-input-icon" />
                                    <input
                                        id="signup-email"
                                        type="email"
                                        className="auth-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                        disabled={isSubmitting}
                                        autoComplete="email"
                                    />
                                </div>
                                {touched.email && fieldErrors.email && (
                                    <span className="auth-field-hint auth-field-hint-error" id="signup-email-error">
                                        {fieldErrors.email}
                                    </span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="auth-field">
                                <label htmlFor="signup-password" className="auth-label">
                                    Password
                                </label>
                                <div className={`auth-input-wrapper ${touched.password && fieldErrors.password ? 'auth-input-error' : ''}`}>
                                    <Lock size={18} className="auth-input-icon" />
                                    <input
                                        id="signup-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="auth-input"
                                        placeholder="Min 6 characters"
                                        value={password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        onBlur={() => handleBlur('password')}
                                        disabled={isSubmitting}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {touched.password && fieldErrors.password && (
                                    <span className="auth-field-hint auth-field-hint-error" id="signup-password-error">
                                        {fieldErrors.password}
                                    </span>
                                )}
                                {/* Password strength meter */}
                                {password.length > 0 && !fieldErrors.password && (
                                    <div className="auth-password-strength">
                                        <div className="auth-strength-bars">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`auth-strength-bar ${level <= strength.level ? 'active' : ''}`}
                                                    style={level <= strength.level ? { backgroundColor: `hsl(${strength.color})` } : {}}
                                                ></div>
                                            ))}
                                        </div>
                                        <span className="auth-strength-label" style={{ color: `hsl(${strength.color})` }}>
                                            {strength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="auth-field">
                                <label htmlFor="signup-confirm-password" className="auth-label">
                                    Confirm Password
                                </label>
                                <div className={`auth-input-wrapper ${touched.confirmPassword && fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}>
                                    <Lock size={18} className="auth-input-icon" />
                                    <input
                                        id="signup-confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="auth-input"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                        onBlur={() => handleBlur('confirmPassword')}
                                        disabled={isSubmitting}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {touched.confirmPassword && fieldErrors.confirmPassword && (
                                    <span className="auth-field-hint auth-field-hint-error" id="signup-confirm-error">
                                        {fieldErrors.confirmPassword}
                                    </span>
                                )}
                                {confirmPassword.length > 0 && !fieldErrors.confirmPassword && password === confirmPassword && touched.confirmPassword && (
                                    <span className="auth-field-hint auth-field-hint-success">
                                        <CheckCircle size={12} /> Passwords match
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary auth-submit-btn"
                                disabled={isSubmitting}
                                id="signup-submit"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="auth-spinner" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Already have an account?{' '}
                                <Link to="/" className="auth-link" id="login-link">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
