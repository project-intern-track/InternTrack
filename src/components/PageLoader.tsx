import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

/**
 * Full-page loading overlay that covers the content area.
 * Use this on any page that fetches data on mount to prevent
 * a blank/empty screen while waiting for the API response.
 */
const PageLoader = ({ message = 'Loading...' }: PageLoaderProps) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    width: '100%',
    gap: '1rem',
  }}>
    <Loader2
      size={40}
      style={{
        animation: 'spin 1s linear infinite',
        color: '#ff8800',
      }}
    />
    <p style={{
      color: '#6b7280',
      fontSize: '0.95rem',
      margin: 0,
    }}>
      {message}
    </p>
  </div>
);

export default PageLoader;
