import React, { useState, useEffect } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';
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
    email: ''
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

      // Check if anything changed before making an update call
      const isNameChanged = trimmedName !== formData.name;
      const isEmailChanged = formData.email !== formData.email;

      if (!isNameChanged && !isEmailChanged) {
        return;
      }

      await apiClient.put(`/users/${formData.id}`, {
        full_name: trimmedName,
        email: formData.email
      });
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
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem', position: 'relative' }}>
      {successPopup && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '50%',
          transform: 'translateX(50%)',
          backgroundColor: '#ff8c42',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontWeight: 'bold'
        }}>
          {successPopup}
          <button onClick={() => setSuccessPopup('')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#ff8c42' }}>Settings</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Manage your profile and account preferences.
          </p>
        </div>
      </div>

      {/* PROFILE INFORMATION */}
      <div style={{
        border: '1px solid #ccc',
        backgroundColor: '#e8ddd08e',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Profile Information</h2>

        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <User
            size={100}
            color="#000000be"
            strokeWidth={1.5}
            style={{
              borderRadius: '50%',
              padding: '10px',
              backgroundColor: '#fff',
              border: '3px solid #000000b4',
            }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          textAlign: 'left'
        }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Full Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Account Type</label>
              <input
                type="text"
                defaultValue="Supervisor"
                disabled
                style={{ ...inputStyle, backgroundColor: '#f5f5f5' }}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Date Created</label>
              <input
                type="text"
                defaultValue="January 15, 2026"
                disabled
                style={{ ...inputStyle, backgroundColor: '#f5f5f5' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.5rem', gap: '1rem' }}>
          {profileErr && <span style={{ color: '#d9534f', fontSize: '0.875rem', fontWeight: 'bold' }}>{profileErr}</span>}
          <button onClick={handleSave} style={primaryButtonStyle}>
            Save Changes
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD */}
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '0.5rem',
        backgroundColor: '#e8ddd08e',
        padding: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Change Password</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem'
        }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPwd.current ? "text" : "password"} 
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  style={{ ...inputStyle, paddingRight: '2.5rem' }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                  style={eyeButtonStyle}
                >
                  {showPwd.current ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
                </button>
              </div>
            </div>

            <div>
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPwd.new ? "text" : "password"} 
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  style={{ ...inputStyle, paddingRight: '2.5rem' }} 
                />
                <button
                  type="button"
                  onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                  style={eyeButtonStyle}
                >
                  {showPwd.new ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPwd.confirm ? "text" : "password"} 
                name="newPasswordConfirmation"
                value={passwordData.newPasswordConfirmation}
                onChange={handlePasswordChange}
                style={{ ...inputStyle, paddingRight: '2.5rem' }} 
              />
              <button
                type="button"
                onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                style={eyeButtonStyle}
              >
                {showPwd.confirm ? <EyeOff size={18} color="#666" /> : <Eye size={18} color="#666" />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1.5rem', gap: '1rem' }}>
          {pwdErr && <span style={{ color: '#d9534f', fontSize: '0.875rem', fontWeight: 'bold' }}>{pwdErr}</span>}
          <button onClick={handleUpdatePassword} style={primaryButtonStyle}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

const eyeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.5rem',
  top: '50%',
  transform: 'translateY(-35%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #ccc',
  marginTop: '0.25rem'
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  borderRadius: '0.25rem',
  border: 'none',
  backgroundColor: '#f87e32',
  color: 'white',
  cursor: 'pointer'
};

export default Settings;