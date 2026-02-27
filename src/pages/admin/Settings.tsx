import { useState } from 'react';
import { Settings as SettingsIcon, Bell, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [dashboardDensity, setDashboardDensity] = useState('comfortable');

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-orange-50/40 to-gray-50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
                <p className="mt-1 text-sm text-gray-600">Configure admin-facing preferences for your workspace.</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm lg:col-span-2"
                >
                    <div className="mb-6 flex items-center gap-2">
                        <SettingsIcon size={18} className="text-[#ff7a00]" />
                        <h2 className="text-lg font-bold text-gray-900">Admin Preferences</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Email Alerts</p>
                                <p className="text-xs text-gray-500">Receive account and workflow notifications by email.</p>
                            </div>
                            <button
                                onClick={() => setEmailAlerts((prev) => !prev)}
                                className={`relative h-6 w-11 rounded-full transition ${emailAlerts ? 'bg-[#ff7a00]' : 'bg-gray-300'}`}
                                aria-label="Toggle email alerts"
                            >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${emailAlerts ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Weekly Digest</p>
                                <p className="text-xs text-gray-500">Get a summary of intern activity every week.</p>
                            </div>
                            <button
                                onClick={() => setWeeklyDigest((prev) => !prev)}
                                className={`relative h-6 w-11 rounded-full transition ${weeklyDigest ? 'bg-[#ff7a00]' : 'bg-gray-300'}`}
                                aria-label="Toggle weekly digest"
                            >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${weeklyDigest ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Maintenance Banner</p>
                                <p className="text-xs text-gray-500">Show a maintenance notice to all users.</p>
                            </div>
                            <button
                                onClick={() => setMaintenanceMode((prev) => !prev)}
                                className={`relative h-6 w-11 rounded-full transition ${maintenanceMode ? 'bg-[#ff7a00]' : 'bg-gray-300'}`}
                                aria-label="Toggle maintenance mode"
                            >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${maintenanceMode ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <label className="mb-1 block text-sm font-semibold text-gray-800">Dashboard Density</label>
                            <p className="mb-2 text-xs text-gray-500">Adjust spacing for cards and tables.</p>
                            <select
                                value={dashboardDensity}
                                onChange={(e) => setDashboardDensity(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            >
                                <option value="comfortable">Comfortable</option>
                                <option value="compact">Compact</option>
                                <option value="spacious">Spacious</option>
                            </select>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="space-y-5"
                >
                    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a00]">
                            <Bell size={18} />
                        </div>
                        <h3 className="mb-1 text-sm font-bold text-gray-900">Notifications</h3>
                        <p className="text-xs leading-5 text-gray-500">
                            Keep admins informed with critical updates for attendance, reports, and approvals.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a00]">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="mb-1 text-sm font-bold text-gray-900">Security</h3>
                        <p className="text-xs leading-5 text-gray-500">
                            Role and account controls are managed server-side. This panel only configures UI preferences.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a00]">
                            <SettingsIcon size={18} />
                        </div>
                        <h3 className="mb-1 text-sm font-bold text-gray-900">Appearance</h3>
                        <p className="text-xs leading-5 text-gray-500">
                            Layout and spacing tweaks here are frontend-only and do not modify your backend configuration.
                        </p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default Settings;
