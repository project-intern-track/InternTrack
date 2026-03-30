import React, { useState, useEffect } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { updateUser } = useAuth();
  // PROFILE DATA (Unmasked)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    ojt_id: '',
    start_date: '',
    required_hours: '',
    ojt_type: '',
    status: '',
  });

  // Original data for change detection
  const [originalData, setOriginalData] = useState({
      id: '',
    name: '',
    email: '',
    role: '',
    ojt_id: '',
    start_date: '',
    required_hours: '',
    ojt_type: '',
    status: '',
  });



  const [profileLoading, setProfileLoading] = useState(true);

  // PASSWORD DATA (Masked)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: ''
  });

  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileErr, setProfileErr] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [successPopup, setSuccessPopup] = useState('');

  // Load user data on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { session, error } = await authService.getSession();
      if (error || !session?.user) { setProfileLoading(false); return; }

      try {
        // Load from Laravel API — this is the real source of truth
        const res = await apiClient.get(`/users/${session.user.id}`);
        const profile = res.data;
        const userData = {
          id: String(profile.id ?? session.user.id),
          name: profile.full_name || '',
          email: profile.email || session.user.email || '',
          role: profile.role || '',
          ojt_id: profile.ojt_id != null ? String(profile.ojt_id) : '',
          start_date: profile.start_date || '',
          required_hours: profile.required_hours != null ? String(profile.required_hours) : '',
          ojt_type: profile.ojt_type || '',
          status: profile.status || '',
        };
        setFormData(userData);
        setOriginalData(userData);
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Check if profile Data has been Changed
  const isProfileChanged = () => {
    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email
    );
  };

  // Check if Password Data is Valid
  const isPasswordValid = () => {
    return passwordData.currentPassword.trim() !== '' ||
           passwordData.newPassword.trim() !== '' ||
           passwordData.newPasswordConfirmation.trim() !== '';
  };
  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'name') {
      const val = e.target.value;
      if (val.startsWith(' ')) return;
      if (val.includes('  ')) return;
      if (val !== '' && !/^[a-zA-Z\s]*$/.test(val)) return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setProfileErr('');

    if (!isProfileChanged()) {
      setProfileErr("No changes detected.");
      return;
    }

    if (!formData.id) {
      setProfileErr("Error: No User ID found. Please refresh the page.");
      return;
    }

    const trimmedName = formData.name.trim();

    // Safety Check: Basic validation
    if (trimmedName.length < 2) {
      setProfileErr("Please enter a valid name.");
      return;
    }

    if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(trimmedName)) {
      setProfileErr("Full name can only contain alphabetic characters and single spaces.");
      return;
    }

    try {
      
      await apiClient.put(`/users/${formData.id}`, {
        full_name: trimmedName,
        email: formData.email
      });
      setOriginalData(formData);
      updateUser({ name: trimmedName, email: formData.email });
      setSuccessPopup('Profile Updated Successfully!');
      setTimeout(() => setSuccessPopup(''), 3000);
    } catch (err) {
      console.error(err);
      setProfileErr('Update Failed. Please try again.');
    }
  };

  const handleUpdatePassword = async () => {
      setPwdErr('');
      const { currentPassword, newPassword, newPasswordConfirmation } = passwordData;

      if (!currentPassword || !newPassword || !newPasswordConfirmation) {
        setPwdErr("Please fill in all password fields.");
        return;
      }

      if (currentPassword === newPassword) {
        setPwdErr("New password cannot be the same as your current password.");
        return;
      }

      if (newPassword !== newPasswordConfirmation) {
        setPwdErr("New passwords do not match!");
        return;
      }

      const missing = [];
      if (newPassword.length < 8) missing.push('be at least 8 characters');
      if (!/[A-Z]/.test(newPassword)) missing.push('contain a capital letter');
      if (!/[0-9]/.test(newPassword)) missing.push('contain a number');
      if (!/[^a-zA-Z0-9]/.test(newPassword)) missing.push('contain a special symbol');

      if (missing.length > 0) {
        setPwdErr('Password must: ' + missing.join(', '));
        return;
      }

      try {
        await apiClient.put(`/users/${formData.id}`, {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        });

        setSuccessPopup("Password updated successfully!");
        setTimeout(() => setSuccessPopup(''), 3000);
        setPasswordData({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' });
      } catch (err: any) {
        setPwdErr(err.response?.data?.message || "Update failed. Please try again.");
      }
    };

  if (profileLoading) return <PageLoader message="Loading settings..." />;

  return (
    <div className="relative space-y-4">
      {successPopup && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-3.5 rounded-xl shadow-lg z-50 flex items-center gap-4 font-bold text-sm">
          {successPopup}
          <button onClick={() => setSuccessPopup('')} className="bg-transparent border-none text-white cursor-pointer text-xl hover:text-white/80 transition-colors">&times;</button>
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-1.5"
      >
        <h1 className="m-0 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile and account preferences.
        </p>
      </motion.div>

      {/* PROFILE INFORMATION */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm text-center"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Profile Information
        </h2>

        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-2xl bg-[#FF8800] flex items-center justify-center shadow-[0_0_20px_rgba(255,136,0,0.25)]">
            <span className="text-2xl font-black text-white select-none">
              {formData.name ? formData.name.trim().charAt(0).toUpperCase() : <User size={32} />}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* LEFT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <input
                type="text"
                defaultValue={formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : 'Supervisor'}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OJT ID
              </label>
              <input
                type="text"
                value={formData.ojt_id || '—'}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed font-mono tracking-wider"
                title="Use this ID in the Time Log to clock in and out"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <input
                type="text"
                defaultValue={formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1) : 'Active'}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OJT Type
              </label>
              <input
                type="text"
                defaultValue={formData.ojt_type.charAt(0).toUpperCase() + formData.ojt_type.slice(1)}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Started
              </label>
              <input
                type="text"
                value={
                  formData.start_date
                    ? new Date(formData.start_date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })
                    : '—'
                }
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                REQUIRED HOURS
              </label>
              <input
                type="text"
                defaultValue={formData.required_hours}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center mt-6 gap-4">
          {profileErr && <span className="text-danger text-sm font-bold">{profileErr}</span>}
          
          <button 
            onClick={handleSave}
            disabled={!isProfileChanged()}
            className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
              isProfileChanged()
                ? 'bg-primary hover:bg-primary/90 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            Save Changes
          </button>
        </div>
      </motion.div>

      {/* CHANGE PASSWORD */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Change Password
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input 
                  type={showPwd.current ? "text" : "password"} 
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input 
                  type={showPwd.new ? "text" : "password"} 
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  maxLength={128}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input 
                type={showPwd.confirm ? "text" : "password"} 
                name="newPasswordConfirmation"
                value={passwordData.newPasswordConfirmation}
                onChange={handlePasswordChange}
                maxLength={128}
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center mt-6 gap-4">
          {pwdErr && <span className="text-danger text-sm font-bold">{pwdErr}</span>}
          
          <button 
            onClick={handleUpdatePassword}
            disabled={!isPasswordValid()}
            className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
              isPasswordValid()
                ? 'bg-primary hover:bg-primary/90 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            Update Password
          </button>
        </div>
      </motion.div>
    </div>
  );
};


export default Settings;
