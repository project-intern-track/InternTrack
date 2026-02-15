import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading your account info...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>Settings</h1>
        <p>You are not logged in.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Settings</h1>

      <div style={{
        border: '1px solid #ccc',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <h3>Account Information</h3>

        <p><strong>Name:</strong> {user.name || user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      <button
        onClick={logout}
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '1px solid #ccc',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Settings;
