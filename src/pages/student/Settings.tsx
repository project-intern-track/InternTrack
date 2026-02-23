import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    return (
        <div className="placeholder-page">
            <div className="placeholder-icon">
                <SettingsIcon size={48} />
            </div>
            <h1 className="placeholder-title">Settings</h1>
            <p className="placeholder-description">
                Manage your profile, preferences, and account settings.
            </p>
            <div className="placeholder-badge">Coming Soon</div>
        </div>
    );
};

export default Settings;
