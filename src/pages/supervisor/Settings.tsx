import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';
import PageLoader from '../../components/PageLoader';

const Settings = () => {
  // PROFILE DATA (Unmasked)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: ''
  });

  const [profileLoading, setProfileLoading] = useState(true);

  // PASSWORD DATA (Masked)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: ''
  });

  // Load user data on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { session, error } = await authService.getSession();

      if (session?.user) {
        setFormData({
          id: session.user.id,
          name: session.user.user_metadata.full_name || '',
          email: session.user.email || ''
        });
      } else if (error) {
        console.error("Fetch failed:", error);
      }
      setProfileLoading(false);
    };

    loadProfile();
  }, []);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.id) {
      alert("Error: No User ID found. Please refresh the page.");
      return;
    }

    // Safety Check: Basic validation
    if (formData.name.trim().length < 2) {
      alert("Please enter a valid name.");
      return;
    }

    try {
      await apiClient.put(`/users/${formData.id}`, {
        full_name: formData.name,
        email: formData.email
      });
      alert('Profile Updated Successfully!');
    } catch (err) {
      console.error(err);
      alert('Update Failed');
    }
  };

  const handleUpdatePassword = async () => {
      const { currentPassword, newPassword, newPasswordConfirmation } = passwordData;

      if (!currentPassword || !newPassword || !newPasswordConfirmation) {
        alert("Please fill in all password fields.");
        return;
      }

      if (newPassword !== newPasswordConfirmation) {
        alert("New passwords do not match!");
        return;
      }

      try {
        await apiClient.put(`/users/${formData.id}`, {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        });

        alert("Password updated successfully!");
        setPasswordData({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' });
      } catch (err: any) {
        alert(err.response?.data?.message || "Update failed. The backend might not support password changes via this route.");
      }
    };

  if (profileLoading) return <PageLoader message="Loading settings..." />;

  return (
    <div className="max-w-[2000px] mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary mb-1">
            Settings
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Manage your profile and account preferences.
          </p>
        </div>
      </motion.div>

      {/* PROFILE INFORMATION */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm text-center"
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Profile Information
        </h2>

        <div className="flex justify-center mb-8">
          <div className="p-3 rounded-full bg-white border-[3px] border-gray-800 dark:border-gray-300">
            <User 
              size={100} 
              className="text-gray-700 dark:text-gray-300" 
              strokeWidth={1.5} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
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
                Account Type
              </label>
              <input
                type="text"
                defaultValue="Supervisor"
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
                Date Created
              </label>
              <input
                type="text"
                defaultValue="January 15, 2026"
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
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
        className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm"
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Change Password
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input 
                type="password" 
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input 
                type="password" 
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input 
              type="password" 
              name="newPasswordConfirmation"
              value={passwordData.newPasswordConfirmation}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button 
            onClick={handleUpdatePassword}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
          >
            Update Password
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;