import { BarChart } from 'lucide-react';
import { motion } from 'framer-motion';

const Reports = () => {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-16 shadow-sm text-center min-h-[300px] sm:min-h-[500px] flex flex-col items-center justify-center"
            >
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 dark:bg-primary/20"
                >
                    <BarChart size={40} className="text-primary" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.14, ease: 'easeOut' }}
                    className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4"
                >
                    Reports Section
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' }}
                    className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md"
                >
                    Generate detailed reports on intern performance and progress.
                </motion.p>
                <motion.span
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.26, ease: 'easeOut' }}
                    className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary"
                >
                    Coming Soon
                </motion.span>
            </motion.div>
        </div>
    );
};

export default Reports;
