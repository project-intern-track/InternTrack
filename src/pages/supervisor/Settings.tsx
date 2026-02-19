import { User } from 'lucide-react';

const Settings = () => {
  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color:'#ff8c42'}}>Settings</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Manage your profile and account preferences.
          </p>
        </div>
      </div>

      {/* PROFILE INFORMATION */}
      <div style={{
        border: '1px solid #ccc',
        backgroundColor:'#e8ddd08e',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Profile Information</h2>

{/* Profile Picture */}
<div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
  <User
    size={100} // Width & height
    color="#000000be" // Border / icon color
    strokeWidth={1.5} // Icon thickness
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
          textAlign: 'left' // Form fields align left
        }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Full Name</label>
              <input
                type="text"
                defaultValue="Test Supervisor"
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
                type="email"
                defaultValue="testsupervisor@email.com"
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

        {/* Save Changes Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button style={primaryButtonStyle}>
            Save Changes
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD */}
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '0.5rem',
        backgroundColor:'#e8ddd08e',
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
              <input type="password" style={inputStyle} />
            </div>

            <div>
              <label>New Password</label>
              <input type="password" style={inputStyle} />
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <label>Confirm New Password</label>
            <input type="password" style={inputStyle} />
          </div>
        </div>

        {/* Update Password Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button style={primaryButtonStyle}>
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
