import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { BmsToaster } from "../components/BmsToaster";
import Request from "../user_components/Request";
import Profile from "../user_components/Profile";
import Transaction from "../user_components/History";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/apiBase";


import 'swiper/css';
import {
  Home,
  User,
  FileText,
  Send,
  History,
  Bell,
  Sun,
  Moon,
  MessageSquare,
  LogOut,
  AlertTriangle,
  Info,
  Megaphone,
  X,
  Edit,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);
  const [hasUnreadReply, setHasUnreadReply] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);
  const [userName, setUserName] = useState("Resident");
  const [userPhoto, setUserPhoto] = useState("");
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  // API_BASE is centralized in utils/apiBase for Vercel + local dev

const suggestionsList = [
  "Hello, I need help with my document request.",
  "Can I pick up the document tomorrow?",
  "Thank you for your assistance!",
  "Good day, I have a concern with my ID.",
  "Good Morning",
];

  const iconMap = {
    Alert: <AlertTriangle className="text-rose-600 dark:text-rose-400" size={20} />,
    Announcement: <Megaphone className="text-amber-600 dark:text-amber-400" size={20} />,
    Event: <Info className="text-sky-600 dark:text-sky-400" size={20} />,
    alert: <AlertTriangle className="text-rose-600 dark:text-rose-400" size={20} />,
    announcement: <Megaphone className="text-amber-600 dark:text-amber-400" size={20} />,
    info: <Info className="text-sky-600 dark:text-sky-400" size={20} />,
  };

  // Fetch announcements for notifications
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const user = userInfo?.resident || {};
        const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        const userPurok = user.purok || "";
        
        // Fetch announcements for "All" or specific to user
        const res = await fetch(`${API_BASE}/announcements?audience=All`);
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const data = await res.json();
        
        // Filter announcements relevant to user and format for notifications
        const formatted = data
          .filter((ann) => {
            // Show if audience is "All" or matches user's purok or name
            return ann.audience === "All" || 
                   ann.audience === "Purok" && ann.recipient === userPurok ||
                   ann.audience === "Individual" && ann.recipient === userName;
          })
          .slice(0, 10)
          .map((ann) => ({
            type: ann.type,
            title: ann.title,
            description: ann.message,
            date: ann.date || ann.createdAt,
            messageType: ann.messageType,
          }));
        
        setNotifications(formatted);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        // Keep empty array on error
        setNotifications([]);
      }
    };
    
    fetchAnnouncements();
    // Refresh announcements every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ----------------- Effects -----------------
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const hydrateUser = useCallback(() => {
    let savedUser = localStorage.getItem("user");

    if (!savedUser) {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          if (parsedInfo?.resident) {
            savedUser = JSON.stringify(parsedInfo.resident);
            localStorage.setItem("user", savedUser);
          }
          if (parsedInfo?.token) {
            localStorage.setItem("token", parsedInfo.token);
          }
        } catch (err) {
          console.error("Failed to parse userInfo:", err);
        }
      }
    }

    if (!savedUser) {
      navigate("/");
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);
      const displayName =
        `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() || "Resident";
      setUserName(displayName);
      if (parsed.profileImageBase64) {
        setUserPhoto(parsed.profileImageBase64);
      }
    } catch (err) {
      console.error("Failed to parse saved user:", err);
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    window.addEventListener("userInfoUpdated", hydrateUser);
    window.addEventListener("storage", hydrateUser);

    return () => {
      window.removeEventListener("userInfoUpdated", hydrateUser);
      window.removeEventListener("storage", hydrateUser);
    };
  }, [hydrateUser]);

  // ----------------- Message Handling -----------------
  // Fetch messages from backend
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const residentId = userInfo?.resident?.id || userInfo?.resident?._id;
        
        if (!residentId) return;

        const res = await fetch(`${API_BASE}/messages?residentId=${residentId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          
          // Check if there are unread replies and mark them as read when drawer opens
          const hasUnread = data.some(
            (msg) => msg.sender === "admin" && !msg.isRead
          );
          setHasUnreadReply(hasUnread);
          
          // Mark unread replies as read when drawer is open
          if (messageDrawerOpen && hasUnread) {
            const unreadReplies = data.filter(
              (msg) => msg.sender === "admin" && !msg.isRead && msg.messageId
            );
            for (const msg of unreadReplies) {
              if (msg.messageId) {
                try {
                  await fetch(`${API_BASE}/messages/${msg.messageId}/read-reply`, {
                    method: "PUT",
                  });
                } catch (err) {
                  console.error("Error marking reply as read:", err);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [messageDrawerOpen]);

  const sendMessage = async () => {
    if (!messageContent.trim()) return toast.error("Cannot send empty message.");
    
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const residentId = userInfo?.resident?.id || userInfo?.resident?._id;
      
      if (!residentId) {
        toast.error("Please log in again");
        return;
      }

      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId,
          message: messageContent.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      const newMsg = { 
        id: data.data._id,
        sender: "user", 
        text: messageContent.trim(),
        createdAt: data.data.createdAt,
      };
      setMessages(prev => [...prev, newMsg]);
      setMessageContent("");
      toast.success("Message sent!");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userInfo");
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // ----------------- Pages -----------------
  const pages = {
    home: (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-4 sm:pb-0"
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Welcome</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Hello, {userName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Request documents, view your history, and stay in touch with the barangay office from one place.
          </p>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">How to request a document</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { icon: <FileText size={18} className="text-slate-600 dark:text-slate-300" />, title: "Select document", desc: "Open Request and choose the certificate or form you need." },
              { icon: <Edit size={18} className="text-slate-600 dark:text-slate-300" />, title: "Fill in details", desc: "Add purpose, contact information, and any required fields." },
              { icon: <UploadCloud size={18} className="text-slate-600 dark:text-slate-300" />, title: "Submit", desc: "Send your request and wait for staff review and approval." },
              { icon: <Bell size={18} className="text-slate-600 dark:text-slate-300" />, title: "Stay updated", desc: "Check notifications and History for status and pickup details." },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors hover:border-slate-300/80 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
              >
                <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                  {idx + 1}
                </span>
                <div className="flex items-start gap-3 pr-10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    ),
    profile: (
      <div className="min-h-0">
        <Profile />
      </div>
    ),
    request: (
      <div className="min-h-0">
        <Request />
      </div>
    ),
    history: (
      <div className="min-h-0">
        <Transaction />
      </div>
    ),
  };

  // ----------------- NavButton -----------------
  const NavButton = ({ label, icon: Icon, page }) => {
    const isActive = currentPage === page;
    return (
      <button
        type="button"
        onClick={() => setCurrentPage(page)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          isActive
            ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
        }`}
      >
        <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  // ----------------- Render -----------------
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:flex-row">
      <BmsToaster position="top-center" />

      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white py-6 dark:border-slate-800 dark:bg-slate-900 sm:flex">
        <div className="px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resident portal</p>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">Barangay Victory</h1>
        </div>

        <div className="mx-4 mt-6 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-slate-200 text-sm font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
            {userPhoto ? (
              <img src={userPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              userName
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>
          <span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{userName}</span>
        </div>

        <nav className="mt-6 flex flex-col gap-1 px-3" aria-label="Main navigation">
          <NavButton label="Home" icon={Home} page="home" />
          <NavButton label="Profile" icon={User} page="profile" />
          <NavButton label="Request" icon={FileText} page="request" />
          <NavButton label="History" icon={History} page="history" />
        </nav>

        <button
          type="button"
          className="mx-3 mt-6 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => {
            setNotificationDrawerOpen((prev) => !prev);
            setUnreadNotifications(false);
          }}
        >
          <span className="relative inline-flex">
            <Bell className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
            {unreadNotifications && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </span>
          Notifications
        </button>

        <div className="mt-auto space-y-3 border-t border-slate-200/80 px-4 pt-6 dark:border-slate-800">
          <div className="flex items-center justify-between rounded-xl px-2 py-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Theme</span>
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Portal</p>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Barangay Victory</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            onClick={() => {
              setNotificationDrawerOpen(true);
              setUnreadNotifications(false);
            }}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:px-8 sm:py-8 sm:pb-8">
        {pages[currentPage]}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-slate-200/80 bg-white/95 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden"
        aria-label="Mobile navigation"
      >
        {[
          { icon: Home, page: "home", label: "Home" },
          { icon: User, page: "profile", label: "Profile" },
          { icon: FileText, page: "request", label: "Request" },
          { icon: History, page: "history", label: "History" },
        ].map(({ icon: Icon, page, label }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`flex min-w-[4rem] flex-col items-center rounded-xl px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span
                className={`mb-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                  isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end" aria-hidden>
        <div className="pointer-events-auto flex w-full max-w-5xl mx-auto justify-end px-4 pb-[max(0.5rem,calc(4.25rem+env(safe-area-inset-bottom,0px)))] pt-0 sm:px-8 sm:pb-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => {
              setMessageDrawerOpen(true);
              setHasUnreadReply(false);
            }}
            className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 text-white shadow-[0_10px_40px_-10px_rgba(15,23,42,0.55)] ring-4 ring-slate-900/10 transition-[box-shadow] hover:shadow-[0_14px_44px_-12px_rgba(15,23,42,0.6)] dark:border-slate-600 dark:bg-white dark:text-slate-900 dark:ring-white/15 dark:hover:bg-slate-100"
            aria-label="Open messages to barangay"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-slate-900/5" />
            <MessageSquare className="relative h-6 w-6" strokeWidth={2} />
            {hasUnreadReply && (
              <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 dark:ring-white" />
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {notificationDrawerOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] dark:bg-slate-950/50"
              aria-label="Close notifications"
              onClick={() => setNotificationDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Announcements for you</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationDrawerOpen(false)}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No announcements yet.</p>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      className={`flex gap-3 rounded-xl border p-4 ${
                        n.type === "Alert"
                          ? "border-rose-200/80 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/20"
                          : n.type === "Announcement"
                            ? "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
                            : n.type === "Event"
                              ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                              : "border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">{iconMap[n.type] || iconMap.announcement}</div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{n.description}</p>
                        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                          {n.date ? new Date(n.date).toLocaleString() : new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Message Drawer */}
      <AnimatePresence>
        {messageDrawerOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] dark:bg-slate-950/50"
              aria-label="Close messages"
              onClick={() => setMessageDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.98 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.04),-24px_0_48px_-12px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),-24px_0_48px_-12px_rgba(0,0,0,0.35)]"
            >
              <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white px-4 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900">
                      <MessageSquare className="h-5 w-5" strokeWidth={2} />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
                        title="Office channel"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                        Messages
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Barangay office · replies during office hours
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessageDrawerOpen(false)}
                    className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Close messages"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col bg-slate-100/80 dark:bg-slate-950/50">
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white/80 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <MessageSquare className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No messages yet</p>
                      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Say hello or ask about your documents. Staff will reply here.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isUser = msg.sender === "user";
                      const body = msg.text ?? msg.message ?? "";
                      const messageDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
                      const timeString = messageDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <motion.div
                          key={msg.id || msg._id || index}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
                          className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
                              isUser
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "border border-slate-200/80 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {isUser ? <User className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          </div>

                          <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
                            {!isUser && (
                              <span className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Admin
                              </span>
                            )}
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                                isUser
                                  ? "rounded-br-md bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                  : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{body}</p>
                              <div
                                className={`mt-1.5 flex items-center gap-1 text-[10px] tabular-nums ${
                                  isUser
                                    ? "text-slate-300 dark:text-slate-600"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                {isUser && <CheckCircle2 className="h-3 w-3 opacity-70" />}
                                <span>{timeString}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {messageContent ? (
                  <div className="max-h-24 shrink-0 space-y-1 overflow-y-auto border-t border-slate-200/60 bg-white/90 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/80">
                    {suggestionsList
                      .filter(
                        (s) =>
                          s.toLowerCase().includes(messageContent.toLowerCase()) &&
                          s.toLowerCase() !== messageContent.toLowerCase()
                      )
                      .slice(0, 4)
                      .map((sugg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMessageContent(sugg)}
                          className="w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                        >
                          {sugg}
                        </button>
                      ))}
                  </div>
                ) : null}

                <div className="shrink-0 border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-1.5 shadow-inner dark:border-slate-700 dark:bg-slate-800/60">
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Write a message…"
                      rows={1}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      className="min-h-[44px] w-full flex-1 resize-none overflow-hidden rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={sendMessage}
                      disabled={!messageContent.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-slate-900 text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
                    Enter to send · Shift+Enter for new line
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm dark:bg-slate-950/60"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
                  <LogOut className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Log out?</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  You will need to sign in again to use the resident portal.
                </p>
                <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                    className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
