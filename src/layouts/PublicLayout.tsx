import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white overflow-hidden">
            {/* Left: Hero image – rendered once, never re-animates on route changes */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="hidden md:block relative overflow-hidden"
            >
                <img
                    src="/heroimage.png"
                    alt="Person typing on laptop"
                    className="w-full h-full object-cover rounded-r-[2rem]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>

            {/* Right: Form panel — swapped by child routes */}
            <Outlet />
        </div>
    );
};

export default PublicLayout;
