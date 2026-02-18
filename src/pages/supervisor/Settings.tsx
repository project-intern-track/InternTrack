import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <SettingsIcon size={36} />
        <div>
          <h1 style={{ margin: 0 }}>Settings</h1>
          <p style={{ color: '#555', margin: 0 }}>
            Manage your supervisor profile and preferences.
          </p>
        </div>
      </div>

      {/* Profile Information Container */}
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <h2 style={{ margin: 0 }}>Profile Information</h2>
        <label style={{ fontSize: '0.85rem', color: '#666' }}>Full Name</label>
        <input
          type="text"
          placeholder="John Doe"
          disabled
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        />

        <label style={{ fontSize: '0.85rem', color: '#666' }}>Email</label>
        <input
          type="email"
          placeholder="john.doe@example.com"
          disabled
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        />

        <button
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: '#fa721d',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'not-allowed',
          }}
        >
          Update Profile
        </button>
      </div>

      {/* Change Password Container */}
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '0.5rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <h2 style={{ margin: 0 }}>Change Password</h2>
        <label style={{ fontSize: '0.85rem', color: '#666' }}>Current Password</label>
        <input
          type="password"
          placeholder="••••••••"
          disabled
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        />

        <label style={{ fontSize: '0.85rem', color: '#666' }}>New Password</label>
        <input
          type="password"
          placeholder="••••••••"
          disabled
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        />

        <label style={{ fontSize: '0.85rem', color: '#666' }}>Confirm Password</label>
        <input
          type="password"
          placeholder="••••••••"
          disabled
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #ccc',
            backgroundColor: '#f5f5f5',
          }}
        />

        <button
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: '#fa721d',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'not-allowed',
          }}
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default Settings;
