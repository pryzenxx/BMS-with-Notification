
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import { EffectCoverflow, Autoplay, Pagination } from 'swiper/modules';
import logo from "../assets/logo.png";
import backgroundimg from "../assets/bg.jpg";
import {
  FaUserPlus, FaSignInAlt, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaUsers, FaRegFileAlt, FaClipboardList, FaSms,
  FaSun, FaMoon,FaUserTie,FaEye, FaEyeSlash ,FaKey,
  FaBullhorn, FaExclamationTriangle, FaCalendarAlt,
  FaHandshake,
} from "react-icons/fa";
import { CheckCircle, XCircle } from "lucide-react";

// -----------------------------------------------------------------------------------


import { API_ORIGIN, API_BASE } from "../utils/apiBase";

function FloatingAnnouncementBodyIcon({ kind, className = "w-4 h-4 shrink-0" }) {
  if (kind === "alert") return <FaExclamationTriangle className={className} aria-hidden />;
  if (kind === "event") return <FaCalendarAlt className={className} aria-hidden />;
  return <FaBullhorn className={className} aria-hidden />;
}

// -----------------------------------------------------------------------------------

export default function App() {

  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [officials, setOfficials] = useState([]);
  const [loadingofficial, setloadingofficial] = useState(false);

//for auth//
const [loading, setLoading] = useState(false);
 const [successMsg, setSuccessMsg] = useState("");
 const [errorMsg, setErrorMsg] = useState("");


  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [showSplash, setShowSplash] = useState(true);
  const [showScrollBottom, setHideDownArrow] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [current, setCurrent] = useState(0);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    systemName: "Barangay Victory System",
    barangayName: "Barangay Victory",
    systemLogoBase64: null,
    landingPageLogoBase64: null,
    splashLogoBase64: null,
    iconLogoBase64: null,
    logoBase64: null,
  });

  const features = [
  { icon: <FaUsers />, title: "Resident Records", desc: "Securely manage resident data efficiently." },
  { icon: <FaRegFileAlt />, title: "Incident Reports", desc: "Track and manage community issues." },
  { icon: <FaClipboardList />, title: "Certificate Requests", desc: "Request barangay documents online." },
  { icon: <FaPhone />, title: "Hotline Support", desc: "Quick access to help when you need it." },
  { icon: <FaEnvelope />, title: "Message Alerts", desc: "Get notified about barangay activities." },
  { icon: <FaSms />, title: "Notifications", desc: "Send Notifiations in residents." },
];

  const visionText =
    "A progressive, peaceful, and resilient Barangay Victory empowered by united citizens, transparent leadership, sustainable development, and quality public service for a better and brighter future.";

  const missionText =
    "To serve the people of Barangay Victory through effective governance, community participation, environmental protection, public safety, and inclusive programs that promote education, livelihood, health, and social welfare while preserving unity, discipline, and integrity within the community.";

  const baseBtn = "px-6 py-2 rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2";

// -------------------------------------------------------------------------------------------------------

useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const res = await fetch(`${API_BASE}/officials`);
        const data = await res.json();
     

        // Only keep active officials
      const activeOfficials = data.filter((official) => official.status !== "Old");
      setOfficials(activeOfficials);


      } catch (err) {
        console.error("Error fetching officials:", err);
      } finally {
        setloadingofficial(false);
      }
    };
    fetchOfficials();
  }, []);

  if (loadingofficial) {
    return <p className="text-center text-gray-500">Loading officials...</p>;
  }


useEffect(() => {
  if (successMsg) {
    const timer = setTimeout(() => setSuccessMsg(""), 4000); // auto-close in 4s
    return () => clearTimeout(timer);
  }
}, [successMsg]);

useEffect(() => {
  if (errorMsg) {
    const timer = setTimeout(() => setErrorMsg(""), 4000); // auto-close in 4s
    return () => clearTimeout(timer);
  }
}, [errorMsg]);

useEffect(() => {
  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 100);
    setHideDownArrow(window.scrollY > 50);
  };
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

useEffect(() => {
  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 100);
  };
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          setSystemSettings({
            systemName: data.systemName || "Barangay Victory System",
            barangayName: data.barangayName || "Barangay Victory",
            systemLogoBase64: data.systemLogoBase64 || data.logoBase64 || null,
            landingPageLogoBase64: data.landingPageLogoBase64 || data.logoBase64 || null,
            splashLogoBase64: data.splashLogoBase64 || data.logoBase64 || null,
            iconLogoBase64: data.iconLogoBase64 || data.logoBase64 || null,
            logoBase64: data.logoBase64 || null,
          });
          
          // Update page title
          if (data.systemName) {
            document.title = data.systemName;
          }
          
          // Update favicon
          if (data.iconLogoBase64 || data.logoBase64) {
            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = data.iconLogoBase64 || data.logoBase64;
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();

    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      setSystemSettings({
        systemName: e.detail.systemName || "Barangay Victory System",
        barangayName: e.detail.barangayName || "Barangay Victory",
        systemLogoBase64: e.detail.systemLogoBase64 || e.detail.logoBase64 || null,
        landingPageLogoBase64: e.detail.landingPageLogoBase64 || e.detail.logoBase64 || null,
        splashLogoBase64: e.detail.splashLogoBase64 || e.detail.logoBase64 || null,
        iconLogoBase64: e.detail.iconLogoBase64 || e.detail.logoBase64 || null,
        logoBase64: e.detail.logoBase64 || null,
      });
      
      // Update page title
      if (e.detail.systemName) {
        document.title = e.detail.systemName;
      }
      
      // Update favicon
      if (e.detail.iconLogoBase64 || e.detail.logoBase64) {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = e.detail.iconLogoBase64 || e.detail.logoBase64;
      }
    };
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  // Fetch announcements from backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_BASE}/announcements?audience=All`);
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const data = await res.json();
        // Format announcements for display (icons rendered in UI, not emoji in text)
        const formatted = data.slice(0, 10).map((ann) => {
          const kind = ann.type === "Alert" ? "alert" : ann.type === "Event" ? "event" : "info";
          return { text: `${ann.title}: ${ann.message}`, kind };
        });
        setAnnouncements(formatted.length > 0 ? formatted : [
          { text: `Welcome to ${systemSettings.barangayName} Management System`, kind: "info" },
          { text: "Stay updated with the latest announcements", kind: "info" },
          { text: "Contact us for any concerns", kind: "info" },
        ]);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        // Fallback announcements
        setAnnouncements([
          { text: `Welcome to ${systemSettings.barangayName} Management System`, kind: "info" },
          { text: "Stay updated with the latest announcements", kind: "info" },
          { text: "Contact us for any concerns", kind: "info" },
        ]);
      }
    };
    fetchAnnouncements();
  }, [systemSettings.barangayName]);

  // Rotate floating announcements
  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;
    const id = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(id);
  }, [announcements]);



// ------------------------------------------------------------------------------------------------

 return (

    <>
 { showSplash ? (
  <div className="fixed inset-0 bg-blue-600 flex items-center justify-center z-[9999] px-4">
    <div className="text-center">
      <motion.img
        src={systemSettings.splashLogoBase64 || systemSettings.logoBase64 || logo}
        alt="Logo"
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto mb-3 sm:mb-4 rounded-full bg-white p-2"
        initial={{ rotate: 0, scale: 0 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold font-roboto text-white max-w-[90vw] mx-auto"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        Welcome to {systemSettings.barangayName}
      </motion.h1>
    </div>
  </div>

  ):(

  <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300 scroll-smooth">
      {/* Theme Toggle */}
        <button
            onClick={() => setIsDark(prev => !prev)}
            className="fixed top-4 right-4 p-2 z-50 rounded-full bg-white dark:bg-gray-800 shadow-md hover:scale-110 transition"
          >
            {isDark ? <FaSun className="text-white" /> : <FaMoon className="text-blue-600" />}
        </button>

<AnimatePresence>
  {showScrollTop && (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 right-6 z-50 p-2 text-3xl text-white bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 rounded shadow-lg border border-blue-400/30 backdrop-blur-md hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 ease-out">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19m9-12.243L19.092 17H4.908z"/></svg>
    </motion.button>
  )}
</AnimatePresence>

 

{/* Home*/}
<section
  id="top"
  className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900"
>
 {/* Angled Background Split (Desktop Only) */}
<div className="absolute inset-0 hidden md:flex z-0">

  {/* Left animated gradient */}
  <motion.div
    className="w-1/2 clip-left"
    style={{
      background: "linear-gradient(270deg, #2563EB, #4F46E5, #1E3A8A)",
      backgroundSize: "500% 500%",
    }}
    animate={{
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "linear",
    }}
  />
  {/* Right static image background */}
  <div
    className="w-1/2 bg-cover bg-center clip-right"
    style={{
      backgroundImage: `url(${backgroundimg})`,
    }}
  />
</div>

  {/* Mobile Fallback Background */}
<div className="absolute md:hidden inset-0 bg-gradient-to-br from-blue-600 to-blue-400" />
  <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">

    {/* Left Content */}
    <div className="text-white text-center md:text-left space-y-6">
      <img
        src={systemSettings.landingPageLogoBase64 || systemSettings.logoBase64 || logo}
        alt="Barangay Logo"
        className="w-25 h-25 rounded-full bg-white p-2 mx-auto md:mx-0 hover:animate-spin"
      />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
        Empowering <br className="hidden md:block" />
        <span className="text-yellow-300 ">{systemSettings.barangayName}</span>
      </h1>
      <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto md:mx-0">
        Building a connected, efficient, and transparent community through modern digital governance.
      </p>

      {/* Buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md mx-auto md:mx-0"
      >
        <button
          onClick={() => setShowRegister(true)}
          className="w-full sm:w-40 px-6 py-2 rounded-full font-semibold text-white dark:text-white bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white dark:border-blue-300 hover:bg-white hover:text-blue-600 dark:hover:text-white dark:hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
        >
          <FaUserPlus /> Get Started
        </button>
        <button
          onClick={() => setShowLogin(true)}
          className="w-full sm:w-40 px-6 py-2 rounded-full font-semibold text-white dark:text-white bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white dark:border-blue-300 hover:bg-white hover:text-blue-600 dark:hover:text-white dark:hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
        >
          <FaSignInAlt /> Login
        </button>
      </motion.div>

      {/* Floating Announcements (Mobile View Only) */}
      {announcements.length > 0 && (
        <div className="md:hidden mt-8 flex flex-col gap-4 items-center">
          {[0, 1, 2].map((i) => {
            const ann = announcements[(announcementIndex + i) % announcements.length];
            if (!ann) return null;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.4 }}
                className="bg-white/90 dark:bg-gray-800/90 border-l-4 border-blue-600 dark:border-blue-400 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md text-sm text-gray-900 dark:text-gray-100 w-full max-w-sm"
              >
                <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
                  <FaBullhorn className="w-4 h-4 shrink-0" aria-hidden />
                  <span>Announcement</span>
                </div>
                <div className="flex items-start gap-2">
                  <FloatingAnnouncementBodyIcon
                    kind={ann.kind}
                    className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5"
                  />
                  <div className="min-w-0">{ann.text}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>

  {/* Floating Announcements (Desktop View Only) */}
  {announcements.length > 0 && (
    <div className="hidden md:flex flex-col gap-4 absolute right-6 top-1/2 transform -translate-y-1/2 z-30 pointer-events-none">
      {[0, 1, 2].map((i) => {
        const ann = announcements[(announcementIndex + i) % announcements.length];
        if (!ann) return null;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}       
            transition={{ duration: 5, repeat: Infinity, delay: i * 2, repeatDelay: 7 }}
            className="bg-white/90 dark:bg-gray-800/90 border-l-4 border-blue-600 dark:border-blue-400 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md text-sm text-gray-900 dark:text-gray-100 w-72 pointer-events-auto"
          >
            <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-2">
              <FaBullhorn className="w-4 h-4 shrink-0" aria-hidden />
              <span>Announcement</span>
            </div>
            <div className="flex items-start gap-2">
              <FloatingAnnouncementBodyIcon
                kind={ann.kind}
                className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5"
              />
              <div className="min-w-0">{ann.text}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  )}
  </div>
 <AnimatePresence>
  {!showScrollBottom && (
    <motion.button
      onClick={() => {
        const nextSection = document.querySelector("#features");
        if (nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: [0, 10, 0],
        transition: {
          y: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          },
        },
      }}
      exit={{ opacity: 0, y: 20 }}
     className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white text-3xl p-3 rounded shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 ease-out z-20 border border-blue-400/30 backdrop-blur-md"
    >
      
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.886 5.536A1 1 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13a.998.998 0 0 0 1.644 0l9-13a1 1 0 0 0 .064-1.033M12 17.243L4.908 7h14.184z"/></svg>
    </motion.button>
  )}
</AnimatePresence>
</section>


{/* Features*/}
<section id="features" className="py-20 px-6 bg-white dark:bg-gray-900 text-center">
      <motion.h2
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
       className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">Key Features</motion.h2>

      {/* Mobile Swipeable Slider */}
      <div className="sm:hidden overflow-hidden px-4">
        <Swiper
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          className="features-swiper"
          modules={[Autoplay]}
        >
          {features.map((feature, index) => (
            <SwiperSlide key={index} className="!flex !justify-center">
              <div className="cursor-pointer group w-[88vw] max-w-xs mx-auto bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl p-5 text-center transition duration-300">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-600 shadow-inner group-hover:ring-4 group-hover:ring-blue-400 transition-all duration-300">
                  <div className="text-3xl text-blue-600 dark:text-white">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.desc}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="cursor-pointer group bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl p-6 text-center transition duration-300 hover:shadow-2xl"
            whileHover={{
              y: -12,
              rotate: -5,
              transition: { type: "spring", stiffness: 300, damping: 22 },
              
            }}

            whileTap={{ scale: 0.96 }}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-600 shadow-inner group-hover:ring-4 group-hover:ring-blue-400 transition-all duration-300">
              <div className="text-3xl text-blue-600 dark:text-white">{feature.icon}</div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>

{/* Vision & Mission */}
<section
  id="vision-mission"
  className="py-20 px-6 bg-gradient-to-b from-blue-50/80 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950"
>
  <div className="max-w-6xl mx-auto">
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">
        Our direction
      </p>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
        Vision & Mission
      </h2>
      <p className="mt-3 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
        Guiding principles that shape how {systemSettings.barangayName} serves its community.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.article
        initial={{ y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="group relative overflow-hidden rounded-2xl border border-blue-100/80 bg-white/80 dark:bg-gray-800/60 dark:border-blue-900/50 p-8 shadow-lg backdrop-blur-sm text-left"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 mb-6">
          <FaEye className="text-2xl" aria-hidden />
        </div>
        <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-4">Vision</h3>
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-base md:text-lg">
          {visionText}
        </p>
      </motion.article>

      <motion.article
        initial={{ y: 24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="group relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/80 dark:bg-gray-800/60 dark:border-indigo-900/50 p-8 shadow-lg backdrop-blur-sm text-left"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-400/20 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 mb-6">
          <FaHandshake className="text-2xl" aria-hidden />
        </div>
        <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Mission</h3>
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed text-base md:text-lg">
          {missionText}
        </p>
      </motion.article>
    </div>
  </div>
</section>

{/* About Barangay*/}
<section className="py-16 px-6 bg-gray-50 dark:bg-gray-900 text-center">
  <motion.h2 
  initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
   className="text-3xl font-bold mb-4">About Barangay Victory</motion.h2>

  <motion.p
  initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
   className="max-w-3xl mx-auto text-gray-700 dark:text-gray-300 mb-10">
    We aim to deliver fast, transparent, and people-centered services to our constituents.
  </motion.p>

  <motion.h3
  initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
   className="text-xl font-semibold mb-6 text-blue-600 dark:text-blue-400">"The strength of a barangay lies in its people — those who choose to clean, serve,
    and uplift without being asked"
  </motion.h3>


 <div className="relative w-full max-w-6xl mx-auto py-10">
      <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
        Barangay Officials
      </h2>

      {officials.length > 0 ? (
        <Swiper
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          loop={true}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          coverflowEffect={{
            rotate: 20,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
          }}
          pagination={{ clickable: true }}
          modules={[EffectCoverflow, Pagination, Autoplay]}
          className="officials-swiper px-4"
        >
          {officials.map((o, index) => (
            <SwiperSlide key={index} className="group">
              <div className="relative w-full h-[360px] rounded-3xl overflow-hidden shadow-xl transition-transform duration-500 transform hover:scale-105">
                <img
                  src={o.image}
                  alt={o.position}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 bg-blue-600/80 px-3 py-1 rounded-full text-sm font-semibold text-white shadow-lg backdrop-blur-md">
                  {o.position}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-500 text-center">
                  <FaUserTie className="text-3xl mb-2 text-white animate-pulse drop-shadow" />
                  <p className="text-lg font-medium">{o.name}</p>
                </div>

                <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-500" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="text-center text-gray-500">No officials found.</p>
      )}

      <div className="mt-6">
        <div className="swiper-pagination !static flex justify-center gap-2"></div>
      </div>
    </div>
</section>


{/* Contact Information*/}
<section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
  <div className="max-w-6xl mx-auto text-center">
    <motion.h2
      className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-4 tracking-tight"
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      Barangay Contact 
    </motion.h2>
    <motion.p
      className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto"
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      Connect with Barangay Victory for services, assistance, or general inquiries. We’re here to help!
    </motion.p>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
      {/* Address */}
      <motion.div
        whileHover={{ y: -10, rotate: 5 }}
        className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-6 rounded-2xl shadow-lg transition-all duration-300"
      >
        <FaMapMarkerAlt className="text-3xl text-blue-600 dark:text-blue-400 mb-4 mx-auto" />
        <h4 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Barangay Hall</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">Purok 3, Zone 1, Barangay Victory, City</p>
      </motion.div>

      {/* Phone */}
      <motion.div
        whileHover={{ y: -8 }}
        className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-6 rounded-2xl shadow-lg transition-all duration-300"
      >
        <FaPhone className="text-3xl text-blue-600 dark:text-blue-400 mb-4 mx-auto" />
        <h4 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Hotline</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">(+63) 912-345-6789</p>
      </motion.div>

      {/* Email */}
      <motion.div
        whileHover={{ y: 10, rotate: 5 }}
        className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-6 rounded-2xl shadow-lg transition-all duration-300"
      >
        <FaEnvelope className="text-3xl text-blue-600 dark:text-blue-400 mb-4 mx-auto" />
        <h4 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Email</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">barangay@victory.gov.ph</p>
      </motion.div>
    </div>
  </div>
</section>

   {/* CTA Footer */}
<section className="py-20 px-6 bg-blue-600 dark:bg-blue-500 text-white text-center rounded-t-4xl shadow-lg">
  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Serve Your Community?</h2>
  <p className="mb-6 text-lg">Get started with your account today.</p>
  <div className="flex justify-center mb-6">
    <button
      onClick={() => setShowRegister(true)}
      className={`bg-white text-blue-600 animate-bounce ${baseBtn}`}
    >
      <FaUserPlus /> Register Now
    </button>
  </div>
  {/* Footer Text */}
  <p className="text-sm text-white/80 mt-10">
    &copy; {new Date().getFullYear()} Barangay Victory. All rights reserved.
  </p>
</section>







 {/* ------------------------------------------------------------------------------------------------------------- */}
 {/* ------------------------------------------------------------------------------------------------------------- */}


{/* Modals */}
<AnimatePresence>

{successMsg && (
  <motion.div
    key="success-modal"
    initial={{ y: -50, opacity: 0, scale: 0.9 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: -50, opacity: 0, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-sm sm:max-w-md"
  >
    <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-xl relative flex items-center gap-2 sm:gap-3">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8" />
      </motion.div>
      <div className="flex-1">
        <p className="font-semibold text-base sm:text-lg">Success!</p>
        <p className="text-xs sm:text-sm">{successMsg}</p>
      </div>
      <button
        onClick={() => setSuccessMsg("")}
        className="p-1.5 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300"
      >
        ✕
      </button>
    </div>
  </motion.div>
)}

{/* ✅ Error Modal */}
{errorMsg && (
  <motion.div
    key="error-modal"
    initial={{ y: -50, opacity: 0, scale: 0.9 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: -50, opacity: 0, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-sm sm:max-w-md"
  >
    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-xl relative flex items-center gap-2 sm:gap-3">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
      </motion.div>
      <div className="flex-1">
        <p className="font-semibold text-base sm:text-lg">Error!</p>
        <p className="text-xs sm:text-sm">{errorMsg}</p>
      </div>
      <button
        onClick={() => setErrorMsg("")}
        className="p-1.5 sm:p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300"
      >
        ✕
      </button>
    </div>
  </motion.div>
)}

{loading && (
  <motion.div
    key="loading-spinner"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] backdrop-blur-sm"
  >
    <motion.div
      className="w-24 h-24 relative"
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.8, 1.2, 0.8] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    >
      {/* Outer rotating circle */}
      <motion.div
        className="absolute w-full h-full rounded-full border-4 border-t-blue-400 border-b-purple-500 border-l-transparent border-r-transparent"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      ></motion.div>
      
      {/* Inner pulsing circle */}
      <motion.div
        className="absolute w-12 h-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-80"
        animate={{ scale: [1, 0.8, 1] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      ></motion.div>
    </motion.div>
  </motion.div>
)}


  {/* ✅ Login Modal */}
  {showLogin && (
    <Modal title="Login" onClose={() => setShowLogin(false)}>
      <LoginForm
        switchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        switchToForgotPassword={() => {
          setShowLogin(false);
          setShowForgotPassword(true);
        }}
        setLoading={setLoading}
        setSuccessMsg={setSuccessMsg}
        setErrorMsg={setErrorMsg}
      />
    </Modal>
  )}

  {/* ✅ Register Modal */}
  {showRegister && (
    <Modal title="Register" onClose={() => setShowRegister(false)}>
      <RegisterForm
        switchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
        setLoading={setLoading}
        setSuccessMsg={setSuccessMsg}
        setErrorMsg={setErrorMsg}
      />
    </Modal>
  )}

  {/* ✅ Forgot Password Modal */}
  {showForgotPassword && (
    <Modal title="Forgot Password" onClose={() => setShowForgotPassword(false)}>
      <ForgotPasswordForm
        switchToLogin={() => {
           setShowForgotPassword(false);
           setShowLogin(true);
           }}
           setLoading={setLoading}
           setSuccessMsg={setSuccessMsg}
            setErrorMsg={setErrorMsg}
           />
         </Modal>
       )}
       </AnimatePresence>

        </div>
      )
      }
    </>
  );
}


// ------------------------------------------------------------------------------------------------

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // const handleBackdropClick = (e) => {
  //   if (e.target === e.currentTarget) onClose();
  // };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // onClick={handleBackdropClick}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-md cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.9, y: -20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-[92vw] max-w-sm sm:max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/40 dark:border-gray-700/40 shadow-[0_8px_40px_rgba(0,0,0,0.15)] cursor-default overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-800 dark:via-indigo-700 dark:to-purple-800 text-white shadow-md">
          <h3 className="text-2xl font-bold tracking-wide drop-shadow-sm">{title}</h3>
          <p className="text-sm text-white/90 mt-1">
            {title === "Login"
              ? "Welcome back! Please log in to continue."
              : title === "Register"
              ? "Create your account to get started."
              : "Enter your registered number to receive reset instructions."}
          </p>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-indigo-400"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 transition-all duration-200 text-white p-1.5 rounded-full text-lg shadow-sm hover:shadow-md hover:scale-110"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 text-gray-800 dark:text-gray-200">{children}</div>
      </motion.div>
    </motion.div>
  );
}



// ------------------------------------------------------------------------------------------------

function LoginForm({ switchToRegister, switchToForgotPassword, setLoading, setSuccessMsg, setErrorMsg }) {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: phone.trim(), 
          password: password.trim() 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.message || "Login failed");
        error.code = data.code;
        throw error;
      }

      localStorage.setItem("userInfo", JSON.stringify(data));
      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.resident) localStorage.setItem("user", JSON.stringify(data.resident));

      if (data?.resident?.role === "admin") {
        setSuccessMsg("Welcome back, Admin! Redirecting...");
        setTimeout(() => (window.location.href = "/admin"), 1200);
      } else {
        setSuccessMsg("Login successful! Redirecting...");
        setTimeout(() => (window.location.href = "/user"), 1200);
      }

    } catch (err) {
      console.error("❌ Login error:", err);
      if (err.code === "INCORRECT_PASSWORD") {
        setErrorMsg("Incorrect password. Please try again or reset it via Forgot Password.");
      } else if (err.code === "ACCOUNT_NOT_FOUND") {
        setErrorMsg("No account is registered with that mobile number. Please register first.");
      } else if (err.code === "NOT_ACTIVE") {
        setErrorMsg("Your account is still awaiting admin approval.");
      } else {
        setErrorMsg(err.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="tel"
        placeholder="Mobile Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
        className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
        maxLength={11}
        inputMode="numeric"
        required
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700 w-full pr-10"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white py-2 rounded-full flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        disabled={!phone || !password}
      >
        <FaSignInAlt /> Login
      </button>
      <p className="text-sm text-center">
        Don’t have an account?{" "}
        <button type="button" onClick={switchToRegister} className="text-blue-600 hover:underline">
          Register here
        </button>
      </p>
      <p className="text-sm text-center mt-2">
        <button type="button" onClick={switchToForgotPassword} className="text-blue-500 hover:underline">
          Forgot Password?
        </button>
      </p>
    </form>
  );
}



// ------------------------------------------------------------------------------------------------

function RegisterForm({ switchToLogin, setLoading, setSuccessMsg, setErrorMsg }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", username: "",
    password: "", confirmPassword: "", phone: "", address: "Barangay Victory Agusan Del Norte",
    civilStatus: "", purok: "", household: "", gender: "",
    birthdate: "", age: "", nationality: "Filipino", religion: "",
    occupation: "", education: "", membership: "", idPhoto: null
  });

  const [idPreview, setIdPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // -------------------- Helpers --------------------
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (["firstName","middleName","lastName","address","occupation","civilStatus","purok"].includes(name)) {
      val = capitalizeWords(value);
    }
    setFormData({ ...formData, [name]: val });
  };

  const handleBirthdateChange = (e) => {
    const birthdate = e.target.value;
    if (!birthdate) return setFormData({ ...formData, birthdate, age: "" });

    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    setFormData({ ...formData, birthdate, age });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/png","image/jpeg","image/jpg","image/webp","image/gif"];
    if (!allowed.includes(file.type)) {
      setErrors({ ...errors, idPhoto: "❌ Invalid file type" });
      setFormData({ ...formData, idPhoto: null });
      setIdPreview(null);
      return;
    }
    setFormData({ ...formData, idPhoto: file });
    setIdPreview(URL.createObjectURL(file));
    setErrors({ ...errors, idPhoto: "" });
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.username) newErrors.username = "Username is required";
    }
    if (step === 2) {
      if (!formData.password) newErrors.password = "Password is required";
      else {
        if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (!/[a-z]/.test(formData.password)) newErrors.password = "Password must contain a lowercase letter";
        if (!/[0-9]/.test(formData.password)) newErrors.password = "Password must contain a number";
      }
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
      if (!formData.phone) newErrors.phone = "Phone number is required";
      if (!formData.civilStatus) newErrors.civilStatus = "Civil Status is required";
    }
    if (step === 3) {
      if (!formData.address) newErrors.address = "Address is required";
      if (!formData.purok) newErrors.purok = "Purok is required";
      if (!formData.household) newErrors.household = "Household number is required";
      if (!formData.occupation) newErrors.occupation = "Occupation is required";
      if (!formData.education) newErrors.education = "Education is required";
    }
    if (step === 4) {
      if (!formData.membership) newErrors.membership = "Membership is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.nationality) newErrors.nationality = "Nationality is required";
      if (!formData.religion) newErrors.religion = "Religion is required";
    }
    if (step === 5) {
      if (!formData.birthdate) newErrors.birthdate = "Birthdate is required";
      if (!formData.idPhoto) newErrors.idPhoto = "Government ID photo is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      const API_URL = API_ORIGIN;
      const fd = new FormData();

      for (const key in formData) {
        if (formData[key] !== null) fd.append(key, formData[key]);
      }

      fd.append("fullName", `${formData.lastName} ${formData.firstName} ${formData.middleName}`.trim());

      const res = await fetch(`${API_URL}/api/auth/register`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setSuccessMsg("✅ Registration successful! Awaiting admin approval...");
      setTimeout(() => switchToLogin(), 2000);

    } catch (err) {
      console.error("❌ Registration error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / totalSteps) * 100;


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Step {step} of {totalSteps}
          </p>
        </div>
        <div className="w-full bg-gray-300 dark:bg-gray-600 h-2 rounded-full">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.firstName && <p className="text-red-500">{errors.firstName}</p>}
          <input name="middleName" placeholder="Middle Name (Optional)" value={formData.middleName} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          <input name="lastName" placeholder="Last Name (suffix)" value={formData.lastName} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.lastName && <p className="text-red-500">{errors.lastName}</p>}
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.username && <p className="text-red-500">{errors.username}</p>}
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700 w-full pr-10" />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && <p className="text-red-500">{errors.password}</p>}
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword}</p>}
          <input type="tel" name="phone" placeholder="Mobile Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} maxLength={11} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.phone && <p className="text-red-500">{errors.phone}</p>}
          <select name="civilStatus"  value={formData.civilStatus} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700">
         <option value="">Select Civil Status</option> <option value="Single">Single</option> <option value="Married">Married</option> <option value="Widowed">Widowed</option><option value="Separated">Separated</option> <option value="Divorced">Divorced</option>
         </select>{errors.civilStatus && ( <p className="text-red-500">{errors.civilStatus}</p>
      )}
        </>
      )}

      {/* STEP 3 */}

      {step === 3 && (
        <>
    <input
      name="address"
      placeholder="Address"
      value={formData.address}
      readOnly
      className="border px-3 sm:px-4 py-2 rounded  cursor-not-allowed bg-gray-100 dark:bg-gray-800"
    />
    <select
  name="purok"
  value={formData.purok}
  onChange={(e) => {
    const val = e.target.value;
    setFormData({ ...formData, purok: val });
  }}
  className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
>
  <option value="">Select Purok</option>
  <option value="Purok-1">Purok-1</option>
  <option value="Purok-2">Purok-2</option>
  <option value="Purok-3">Purok-3</option>
  <option value="Purok-4">Purok-4</option>
  <option value="Purok-5">Purok-5</option>
</select>
{errors.purok && <p className="text-red-500">{errors.purok}</p>}


    <input
      name="household"
      placeholder="Household Number"
      value={formData.household}
      onChange={handleChange}
      className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
    />
    {errors.household && <p className="text-red-500">{errors.household}</p>}

    {/* ✅ Occupation Dropdown */}
    <select
      name="occupation"
      value={formData.occupation}
      onChange={handleChange}
      className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
    >
      <option value="">Select Occupation</option>
      <option value="Student">Student</option>
      <option value="Employed">Employed</option>
      <option value="Self-Employed">Self-Employed</option>
      <option value="Unemployed">Unemployed</option>
      <option value="Retired">Retired</option>
      <option value="Other">Other</option>
    </select>
    {errors.occupation && <p className="text-red-500">{errors.occupation}</p>}

    {/* ✅ Education Dropdown */}
    <select
      name="education"
      value={formData.education || ""}
      onChange={handleChange}
      className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
    >
      <option value="">Select Educational Attainment</option>
      <option value="Elementary">Elementary</option>
      <option value="High School">High School</option>
      <option value="College">College</option>
      <option value="Vocational">Vocational</option>
      <option value="Post-Graduate">Post-Graduate</option>
      <option value="None">None</option>
     </select>
       {errors.education && <p className="text-red-500">{errors.education}</p>}

        </>
       )}


            {/* STEP 4 🆕 */}
      {step === 4 && (
        <>
 
         <select
           name="membership" value={formData.membership || ""}onChange={handleChange}className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
            > 
             <option value="">Select Membership</option>
             <option value="4Ps Beneficiary">4Ps Beneficiary</option>
              <option value="Senior Citizen">Senior Citizen</option>
               <option value="PWD">PWD</option>
               <option value="Solo Parent">Solo Parent</option>
                <option value="Youth">Youth</option>
                 <option value="Farmer Association">Farmer Association</option>
                  <option value="Fisherfolk Association">Fisherfolk Association</option>
                  <option value="Women’s Organization">Women’s Organization</option>
                    <option value="Barangay Volunteer">Barangay Volunteer</option>
                     <option value="None">None</option>
                  </select>

         <select name="gender" value={formData.gender} onChange={handleChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && <p className="text-red-500">{errors.gender}</p>}

          <input type="date" name="birthdate" value={formData.birthdate} onChange={handleBirthdateChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.birthdate && <p className="text-red-500">{errors.birthdate}</p>}
          <input type="number" name="age" placeholder="Age" value={formData.age} readOnly className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700 cursor-not-allowed" />
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            readOnly
            className="border px-3 sm:px-4 py-2 rounded  cursor-not-allowed bg-gray-100 dark:bg-gray-800"
          />
            {errors.nationality && <p className="text-red-500">{errors.nationality}</p>}


           <select
          name="religion"
          value={formData.religion}
           onChange={handleChange}
           className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700"
            >
            <option value="">Select Religion</option>
            <option value="Roman Catholic">Roman Catholic</option>
            <option value="Christian">Christian</option>
             <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
             <option value="Muslim">Muslim</option>
             <option value="Buddhist">Buddhist</option>
             <option value="Hindu">Hindu</option>
             <option value="Other">Other</option>
            </select>
              {errors.religion && <p className="text-red-500">{errors.religion}</p>}
            </>
           )}


      {/* STEP 5 */}
      {step === 5 && (
        <>
         
          <label className="font-semibold text-sm text-gray-300">Upload Government ID</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="border px-3 sm:px-4 py-2 rounded dark:bg-gray-700" />
          {errors.idPhoto && <p className="text-red-500 mt-1">{errors.idPhoto}</p>}
          {idPreview && <img src={idPreview} alt="ID Preview" className="w-32 h-32 object-cover mt-2 rounded" />}
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)} className="bg-gray-400 text-white px-4 py-2 rounded-full hover:bg-gray-500">
            Back
          </button>
        )}
        {step < totalSteps && (
          <button type="button" onClick={() => validateStep() && setStep(step + 1)} className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
            Next
          </button>
        )}
        {step === totalSteps && (
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700">
            Register
          </button>
        )}
      </div>

      <p className="text-sm text-center mt-2">
        Already have an account?{" "}
        <button type="button" onClick={switchToLogin} className="text-blue-600 hover:underline">
          Login
        </button>
      </p>
    </form>
  );
}




function ForgotPasswordForm({ switchToLogin, setLoading, setSuccessMsg, setErrorMsg }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpRequesting, setOtpRequesting] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validate = () => {
    const issues = {};
    if (!phone) issues.phone = "Registered mobile number is required.";
    
    if (!otpSent) {
      return Object.keys(issues).length === 0;
    }

    if (!otp) {
      issues.otp = "OTP code is required.";
    } else if (otp.length !== 6) {
      issues.otp = "OTP must be 6 digits.";
    }

    if (!otpVerified) {
      setErrors(issues);
      return false;
    }

    if (!newPassword) {
      issues.newPassword = "New password is required.";
    } else {
      if (newPassword.length < 8) issues.newPassword = "Minimum of 8 characters.";
      if (!/[a-z]/i.test(newPassword) || !/[0-9]/.test(newPassword))
        issues.newPassword = "Use letters and numbers.";
    }

    if (newPassword !== confirmPassword) {
      issues.confirmPassword = "Passwords do not match.";
    }

    setErrors(issues);
    return Object.keys(issues).length === 0;
  };

  const handleRequestOTP = async () => {
    if (!phone) {
      setErrors({ phone: "Phone number is required." });
      return;
    }

    setOtpRequesting(true);
    setErrorMsg("");
    try {
      const API_URL = API_ORIGIN;
      const res = await fetch(`${API_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown
        setSuccessMsg(data.message || "OTP code sent to your phone number.");
        // In development, show OTP in console
        if (data.otp) {
          console.log("OTP Code (dev only):", data.otp);
        }
      } else {
        setErrorMsg(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Request OTP error:", err);
      setErrorMsg("Server error");
    } finally {
      setOtpRequesting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP code." });
      return;
    }

    setOtpVerifying(true);
    setErrorMsg("");
    try {
      const API_URL = API_ORIGIN;
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpVerified(true);
        setSuccessMsg(data.message || "OTP verified successfully. You can now set your new password.");
      } else {
        setErrorMsg(data.message || "Invalid OTP code");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setErrorMsg("Server error");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const API_URL = API_ORIGIN;
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, password: newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Password reset successful! Please log in.");
        setTimeout(() => switchToLogin(), 1500);
      } else {
        setErrorMsg(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setErrorMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Registered Mobile Number"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 12) setPhone(value);
            }}
            className="border px-4 py-2 rounded dark:bg-gray-700 w-full"
            maxLength={12}
            inputMode="numeric"
            pattern="[0-9]*"
            required
            disabled={otpSent}
          />
          {!otpSent && (
            <button
              type="button"
              onClick={handleRequestOTP}
              disabled={otpRequesting || !phone}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {otpRequesting ? "Sending..." : "Send OTP"}
            </button>
          )}
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        {otpSent && !otpVerified && (
          <p className="text-green-500 text-sm mt-1">OTP sent! Check your phone for the code.</p>
        )}
      </div>

      {otpSent && !otpVerified && (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              className="border px-4 py-2 rounded dark:bg-gray-700 w-full"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={otpVerifying || otp.length !== 6}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {otpVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>
          {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
          {countdown > 0 ? (
            <p className="text-sm text-gray-500 mt-1">
              Resend OTP in {countdown}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleRequestOTP}
              disabled={otpRequesting}
              className="text-sm text-blue-600 hover:underline mt-1"
            >
              Resend OTP
            </button>
          )}
        </div>
      )}

      {otpVerified && (
        <>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border px-4 py-2 rounded dark:bg-gray-700 w-full pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
          </div>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border px-4 py-2 rounded dark:bg-gray-700 w-full"
            required
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm -mt-2">{errors.confirmPassword}</p>}

          <button
            type="submit"
            className="bg-yellow-500 text-white py-2 rounded-full flex items-center justify-center gap-2 hover:bg-yellow-600"
          >
            <FaKey /> Reset Password
          </button>
        </>
      )}

      <p className="text-sm text-center mt-2">
        Remembered your password?{" "}
        <button type="button" onClick={switchToLogin} className="text-blue-600 hover:underline">
          Back to Login
        </button>
      </p>
    </form>
  );
}
