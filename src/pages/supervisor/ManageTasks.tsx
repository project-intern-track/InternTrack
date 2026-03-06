import { ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const ManageTasks = () => {
    return (
        <div className="max-w-[2000px] mx-auto p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-16 shadow-sm text-center min-h-[500px] flex flex-col items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 p-6 bg-primary/10 dark:bg-primary/20 rounded-full"
                >
                    <ClipboardList size={64} className="text-primary" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                >
                    Manage Tasks
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md"
                >
                    Create, assign, and track tasks for your interns.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-6 py-2.5 bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary font-semibold rounded-full"
                >
                    Coming Soon
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ManageTasks;
