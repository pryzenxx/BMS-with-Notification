import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Ghost, ArrowLeft } from "lucide-react";


const NotFound = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-poppins">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-900 dark:via-indigo-800 dark:to-blue-800 animate-gradient bg-[length:200%_200%]" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/40 backdrop-blur-sm" />

      {/* 🌀 Diagonal/Curved Moving Ghost 1 */}
      <motion.div
        className="absolute z-0 left-[5%] top-[20%] opacity-10"
        animate={{
          x: [0, 50, 0, -50, 0],
          y: [0, -30, -60, -30, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Ghost size={120} className="text-white dark:text-white/70" />
      </motion.div>

      {/* 🌀 Diagonal/Curved Moving Ghost 2 */}
      <motion.div
        className="absolute z-0 right-[10%] bottom-[10%] opacity-10"
        animate={{
          x: [0, -40, 0, 40, 0],
          y: [0, 30, 60, 30, 0],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <Ghost size={100} className="text-white dark:text-white/50" />
      </motion.div>

      {/* Foreground Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-xl px-8 py-12 max-w-md w-full text-center border border-white/10 dark:border-gray-700"
      >
        {/* Floating Foreground Ghost */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Ghost size={72} className="mx-auto text-purple-600 dark:text-purple-400" />
        </motion.div>

        <h1 className="text-6xl font-extrabold text-gray-800 dark:text-white mt-6">
          404
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2 font-light text-base">
          Oops! The page you're looking for doesn’t exist.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-md text-sm transition-all"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
