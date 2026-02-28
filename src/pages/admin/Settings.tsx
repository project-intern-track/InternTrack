import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
              <input 
                type="password" 
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                style={inputStyle} 
              />
            </div>

            <div>
              <label>New Password</label>
              <input 
                type="password" 
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                style={inputStyle} 
              />
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <label>Confirm New Password</label>
            <input 
              type="password" 
              name="newPasswordConfirmation"
              value={passwordData.newPasswordConfirmation}
              onChange={handlePasswordChange}
              style={inputStyle} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={handleUpdatePassword} style={primaryButtonStyle}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
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