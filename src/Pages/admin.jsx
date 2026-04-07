import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { BmsToaster } from "../components/BmsToaster";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  File,
  FileText,
  Settings,
  Moon,
  Sun,
  MapPin,
  ClipboardList,
  Briefcase,
  Bell,
  LogOut,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import Modal from "../admin_components/Modal";
import DashboardPanel from "../admin_components/DashboardPanel";
import ResidentsPanel from "../admin_components/ResidentsPanel";
import PurokPanel from "../admin_components/PurokPanel";
import OfficialsPanel from "../admin_components/OfficialsPanel";
import AnnouncementPanel from "../admin_components/AnnouncementPanel";
import DocumentPanel from "../admin_components/DocumentPanel";
import BlotterPanel from "../admin_components/BlotterPanel";
import TransactionPanel from "../admin_components/TransactionPanel"; 
import SettingPanel from "../admin_components/SettingPanel"; 
import { API_BASE } from "../utils/apiBase";

const navItems = [
  { label: "Dashboard", Icon: LayoutDashboard },
  { label: "Residents", Icon: Users },
  { label: "Purok", Icon: MapPin },
  { label: "Officials", Icon: Briefcase },
  { label: "SMS/Announcements", Icon: Megaphone },
  { label: "Documents", Icon: File },
  { label: "Blotter", Icon: FileText },
  { label: "Transaction", Icon: ClipboardList },
  { label: "Settings", Icon: Settings },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [systemLogo, setSystemLogo] = useState(logo);
  const navigate = useNavigate();

  // Fetch system logo
  useEffect(() => {
    const fetchSystemLogo = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.systemLogoBase64 || data.logoBase64) {
            setSystemLogo(data.systemLogoBase64 || data.logoBase64);
          }
        }
      } catch (err) {
        console.error("Error fetching system logo:", err);
      }
    };
    fetchSystemLogo();

    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      if (e.detail.systemLogoBase64 || e.detail.logoBase64) {
        setSystemLogo(e.detail.systemLogoBase64 || e.detail.logoBase64);
      }
    };
    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

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


  const renderPanel = () => {
    switch (activeNav) {
      case "Dashboard": return <DashboardPanel onNavigate={setActiveNav} onNotificationsUpdate={handleNotificationsUpdate} />;
      case "Residents": return <ResidentsPanel />;
      case "Purok": return <PurokPanel />;
      case "Officials": return <OfficialsPanel />;
      case "SMS/Announcements": return <AnnouncementPanel />;
      case "Documents": return <DocumentPanel />;
      case "Blotter": return <BlotterPanel />;
      case "Transaction": return <TransactionPanel />;
      case "Settings": return <SettingPanel />;
      default:
        return (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeNav}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Content coming soon...</p>
          </div>
        );
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessageDrawer, setShowMessageDrawer] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessageGroup, setSelectedMessageGroup] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const initialMessagesLoaded = useRef(false);
  const latestMessageIds = useRef(new Set());

  // Group messages by resident
  const groupedMessagesByResident = useMemo(() => {
    const grouped = userMessages.reduce((acc, msg) => {
      const residentId = msg.residentId || msg.resident?._id || msg.resident || msg._id;
      const residentName = msg.residentName || "Unknown Resident";
      const key = residentId || residentName;
      
      if (!acc[key]) {
        acc[key] = {
          residentId,
          residentName,
          messages: [],
          latestMessage: msg,
          unreadCount: 0,
        };
      }
      
      acc[key].messages.push(msg);
      
      // Update latest message if this one is newer
      const msgTime = new Date(msg.createdAt || 0).getTime();
      const latestTime = new Date(acc[key].latestMessage.createdAt || 0).getTime();
      if (msgTime > latestTime) {
        acc[key].latestMessage = msg;
      }
      
      // Count unread messages (messages without reply)
      if (!msg.reply) {
        acc[key].unreadCount++;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by latest message time
    return Object.values(grouped).sort((a, b) => {
      const timeA = new Date(a.latestMessage.createdAt || 0).getTime();
      const timeB = new Date(b.latestMessage.createdAt || 0).getTime();
      return timeB - timeA; // Most recent first
    });
  }, [userMessages]);

  // Count unique residents
  const uniqueResidentCount = useMemo(() => {
    const uniqueResidents = new Set(
      userMessages.map(msg => msg.residentId || msg.resident?._id || msg.resident || msg.residentName)
    );
    return uniqueResidents.size;
  }, [userMessages]);

  // Callback to update notifications from DashboardPanel
  const handleNotificationsUpdate = (dashboardNotifs) => {
    setNotifications((prev) => {
      // Preserve announcement notifications, add dashboard notifications
      // Messages are removed from notifications - they're only in the message drawer
      const announcementNotifs = prev.filter((n) => n.type === "announcement");
      return [...dashboardNotifs, ...announcementNotifs];
    });
  };

  // Fetch user messages for notifications
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/admin`);
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched messages:", data); // Debug log

          const newMessages = data.filter(
            (msg) => !latestMessageIds.current.has(msg._id || msg.id)
          );

          // Show popup for new messages
          if (initialMessagesLoaded.current && newMessages.length > 0) {
            // Show the most recent new message in popup
            const latestNewMessage = newMessages.sort((a, b) => 
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )[0];
            setIncomingMessage(latestNewMessage);
          }

          if (!initialMessagesLoaded.current) {
            initialMessagesLoaded.current = true;
          }

          latestMessageIds.current = new Set(
            data.map((msg) => msg._id || msg.id)
          );

          // Merge with existing messages to preserve all messages (never remove)
          setUserMessages((prevMessages) => {
            // If this is the first load, just use the data
            if (!prevMessages || prevMessages.length === 0) {
              // Deduplicate by _id and sort by most recent
              const uniqueMessages = Array.from(
                new Map(data.map(msg => [msg._id, msg])).values()
              ).sort((a, b) => {
                const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return timeB - timeA; // Most recent first
              });
              
              // Don't add messages to notifications - they're only in the message drawer
              // Messages are removed from notifications
              
              return uniqueMessages;
            }
            
            // Otherwise, merge existing with new to preserve all messages
            // Use Map to deduplicate by _id (ensures no duplicates)
            const existingMap = new Map(prevMessages.map(msg => [msg._id, msg]));
            
            // Update with latest data from API (this replaces old message with updated one)
            data.forEach(msg => {
              existingMap.set(msg._id, msg); // Update with latest data
            });
            
            // Return all messages (existing + updated) - NEVER remove any
            // Sort by most recent update time so latest messages appear first
            // Deduplication by _id ensures no duplicates, and updated messages replace old ones
            const mergedMessages = Array.from(existingMap.values()).sort((a, b) => {
              const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
              const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
              return timeB - timeA; // Most recent first
            });
            
            // Don't add messages to notifications - they're only in the message drawer
            // Messages are removed from notifications
            
            return mergedMessages; // Return merged messages to keep all in drawer
          });
        } else {
          console.error("Failed to fetch messages:", res.status, res.statusText);
          const errorText = await res.text();
          console.error("Error response:", errorText);
          // Don't clear userMessages on error - keep existing messages visible in drawer
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    
    fetchMessages();
    // Real-time refresh every 5 seconds for instant updates
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch announcements for notifications (based on Message Type: Reminder, Emergency)
  useEffect(() => {
    const fetchAnnouncementNotifications = async () => {
      try {
        // Fetch announcements with Message Type: Reminder or Emergency (these show in notifications)
        const res = await fetch(`${API_BASE}/announcements?messageType=Reminder`);
        const reminderData = res.ok ? await res.json() : [];
        
        const res2 = await fetch(`${API_BASE}/announcements?messageType=Emergency`);
        const emergencyData = res2.ok ? await res2.json() : [];
        
        // Combine and format for notifications
        const announcementNotifs = [...reminderData, ...emergencyData]
          .slice(0, 10)
          .map((ann) => ({
            id: ann._id || ann.id || Date.now(),
            type: "announcement",
            text: `${ann.type}: ${ann.title}`,
            announcement: ann,
          }));
        
        setNotifications((prev) => {
          // Keep dashboard notifications, update announcements
          // Messages are removed from notifications - they're only in the message drawer
          const dashboardNotifs = prev.filter((n) => n.type === "resident" || n.type === "document");
          return [...dashboardNotifs, ...announcementNotifs];
        });
      } catch (err) {
        console.error("Error fetching announcement notifications:", err);
      }
    };
    
    fetchAnnouncementNotifications();
    // Real-time refresh every 10 seconds for instant updates
    const interval = setInterval(fetchAnnouncementNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle sending reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) {
      toast.error("Please enter a reply message");
      return;
    }
    
    setSendingReply(true);
    
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const adminId = userInfo?.resident?.id || userInfo?.resident?._id;
      
      const res = await fetch(`${API_BASE}/messages/${selectedMessage._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: replyText.trim(),
          adminId,
        }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      // Mark message as read by admin
      await fetch(`${API_BASE}/messages/${selectedMessage._id}/read`, {
        method: "PUT",
      });

      // Refresh messages to get updated reply status (keep all messages visible - NEVER remove)
      try {
        const messagesRes = await fetch(`${API_BASE}/messages/admin`);
        if (messagesRes.ok) {
          const updatedMessages = await messagesRes.json();
          
          // Merge with existing messages to ensure nothing is lost
          // If API filters messages, we keep existing ones and merge updates
          setUserMessages((prevMessages) => {
            // Create a map of existing messages by ID (deduplicates by _id)
            const existingMap = new Map(prevMessages.map(msg => [msg._id, msg]));
            
            // Update with new data from API (replaces old message with updated one)
            updatedMessages.forEach(msg => {
              existingMap.set(msg._id, msg);
            });
            
            // Return all messages (existing + updated) - NEVER remove any
            // Sort by most recent update time so latest messages appear first
            const mergedMessages = Array.from(existingMap.values()).sort((a, b) => {
              const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
              const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
              return timeB - timeA; // Most recent first
            });
            
            // Don't add messages to notifications - they're only in the message drawer
            // Messages are removed from notifications
            
            return mergedMessages;
          });
        } else {
          // Even if refresh fails, don't remove existing messages - keep them in drawer
          console.warn("Failed to refresh messages, keeping existing messages visible in drawer");
          // Don't modify userMessages - keep existing messages
        }
      } catch (error) {
        // On any error, preserve existing messages - never empty the drawer
        console.error("Error refreshing messages:", error);
        // Keep existing userMessages - don't clear or filter
      }
      
      setShowReplyModal(false);
      setSelectedMessage(null);
      setSelectedMessageGroup(null);
      setReplyText("");
      
      toast.success("Reply sent successfully!");
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <BmsToaster position="top-center" />
      <aside className="flex w-20 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white py-5 dark:border-slate-800 dark:bg-slate-900 md:w-64 md:px-4">
        <div>
          <div className="mb-8 flex items-center gap-3 px-2 md:px-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <img src={systemLogo} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">Barangay</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Management System</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-1 md:px-0" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.Icon;
              const active = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveNav(item.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 space-y-2 border-t border-slate-200/80 px-1 pt-4 dark:border-slate-800 md:px-0">
          <div className="flex items-center gap-2 rounded-xl px-2 py-2">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6 dark:border-slate-800">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{activeNav}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {activeNav === "Dashboard"
                  ? "Welcome back! Here's what's happening today."
                  : `You're on the ${activeNav} panel.`}
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageDrawer(!showMessageDrawer);
                    setShowNotifications(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  title="View messages"
                >
                  <MessageSquare className="h-5 w-5" />
                  {uniqueResidentCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
                      {uniqueResidentCount}
                    </span>
                  )}
                </button>

                {showMessageDrawer && (
                  <div className="absolute right-0 z-50 mt-2 flex max-h-[min(500px,70vh)] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <span>Messages</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMessageDrawer(false)}
                        className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {groupedMessagesByResident.length > 0 ? (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                          {groupedMessagesByResident.map((group) => (
                            <li
                              key={group.residentId || group.residentName}
                              onClick={() => {
                                setSelectedMessage(group.latestMessage);
                                setSelectedMessageGroup(group);
                                setShowReplyModal(true);
                                setShowMessageDrawer(false);
                              }}
                              className="cursor-pointer p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                  {group.residentName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                      {group.residentName}
                                    </div>
                                    {group.messages.length > 1 && (
                                      <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                        {group.messages.length}
                                      </span>
                                    )}
                                    {group.unreadCount > 0 && (
                                      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                        {group.unreadCount} new
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                                    {group.latestMessage.message}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    {group.latestMessage.createdAt
                                      ? new Date(group.latestMessage.createdAt).toLocaleString()
                                      : "Just now"}
                                  </div>
                                </div>
                                {group.latestMessage.reply && (
                                  <div className="shrink-0 pt-1" title="Replied">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <MessageSquare className="mx-auto mb-2 h-12 w-12 opacity-40" />
                          <p className="text-sm">No messages yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMessageDrawer(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2.5 dark:border-slate-700">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNotifications([])}
                          className="text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <li
                            key={n.id}
                            onClick={() => {
                              if (n.type === "resident") {
                                setActiveNav("Residents");
                                setShowNotifications(false);
                              } else if (n.type === "document") {
                                setActiveNav("Documents");
                                setShowNotifications(false);
                              } else if (n.type === "announcement") {
                                setActiveNav("SMS/Announcements");
                                setShowNotifications(false);
                              }
                            }}
                            className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          >
                            {n.type === "resident" && (
                              <Users className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
                            )}
                            {n.type === "announcement" && (
                              <Megaphone className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {n.type === "document" && (
                              <FileText className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            )}
                            <div className="flex-1 text-sm text-slate-700 dark:text-slate-300">{n.text}</div>
                          </li>
                        ))
                      ) : (
                        <li className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                          No new notifications
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </header>

          {renderPanel()}
        </div>
      </main>

      {/* Incoming Message Popup */}
      <Modal
        isOpen={!!incomingMessage}
        onClose={() => setIncomingMessage(null)}
        title="New resident message"
        center
        size="md"
      >
        {incomingMessage && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">From</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {incomingMessage.residentName || "Resident"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {incomingMessage.message}
              </p>
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {incomingMessage.createdAt ? new Date(incomingMessage.createdAt).toLocaleString() : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedMessage(incomingMessage);
                  const residentId = incomingMessage.residentId || incomingMessage.resident?._id || incomingMessage.resident;
                  const residentName = incomingMessage.residentName || "Unknown Resident";
                  const group = groupedMessagesByResident.find(
                    (g) =>
                      (g.residentId && g.residentId === residentId) || g.residentName === residentName
                  );
                  setSelectedMessageGroup(
                    group || {
                      residentId,
                      residentName,
                      messages: [incomingMessage],
                      latestMessage: incomingMessage,
                      unreadCount: incomingMessage.reply ? 0 : 1,
                    }
                  );
                  setIncomingMessage(null);
                  setShowReplyModal(true);
                }}
                className="min-w-[140px] flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Reply now
              </button>
              <button
                type="button"
                onClick={() => setIncomingMessage(null)}
                className="min-w-[140px] flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                View later
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm dark:bg-slate-950/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
                  <LogOut className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirm logout</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You will need to sign in again to access the admin panel.
                </p>
                <div className="mt-2 flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Message Modal */}
      <AnimatePresence>
        {showReplyModal && selectedMessage && selectedMessageGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm dark:bg-slate-950/60"
            onClick={() => setShowReplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-700">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  Reply to {selectedMessage.residentName}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedMessage(null);
                    setSelectedMessageGroup(null);
                    setReplyText("");
                  }}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[400px] flex-1 overflow-y-auto px-5 py-4">
                <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Thread ({selectedMessageGroup.messages.length})
                </p>
                <div className="space-y-3">
                  {selectedMessageGroup.messages
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                    .map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`rounded-xl border p-3 ${
                          msg._id === selectedMessage._id
                            ? "border-sky-300/80 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30"
                            : "border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="flex-1 text-sm text-slate-800 dark:text-slate-200">{msg.message}</p>
                          {msg.reply && (
                            <div className="shrink-0 pt-0.5" title="Replied">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "Just now"}
                          </p>
                          {msg._id === selectedMessage._id && (
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-slate-900">
                              Latest
                            </span>
                          )}
                        </div>
                        {msg.reply && (
                          <div className="mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-600">
                            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Admin reply</p>
                            <p className="text-xs text-slate-700 dark:text-slate-300">{msg.reply}</p>
                            {msg.repliedAt && (
                              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                {new Date(msg.repliedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-slate-200/80 px-5 py-4 dark:border-slate-700">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Your reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-white/10"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-200/80 px-5 py-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedMessage(null);
                    setSelectedMessageGroup(null);
                    setReplyText("");
                  }}
                  className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sendingReply}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {sendingReply ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Send size={18} />
                      </motion.div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send reply
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
