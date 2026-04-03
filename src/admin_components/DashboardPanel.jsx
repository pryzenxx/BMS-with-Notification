import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import {
  Users,
  User,
  AlertCircle,
  Clock,
  ClipboardCheck,
  BarChartBig,
  UserPlus,
  CheckCircle,
  XCircle,
  Edit,
  Briefcase,
  FileEdit,
  Trash2,
  Megaphone,
  MapPin,
  FileCheck,
  Printer,
  FileText,
  Eye,
} from "lucide-react";
import Modal from "./Modal";
import { toast } from "react-hot-toast";
import { API_BASE, API_ORIGIN } from "../utils/apiBase";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const FIELD_CLASS =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";

const CHART_BAR_COLORS = ["#4f46e5", "#2563eb", "#d97706", "#059669"];

// Motion variants
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 },
  }),
};

// Chart Filters
const filters = ["This Month", "Last 30 Days", "This Year"];

// Helper function to get time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

// Helper function to get activity icon
const getActivityIcon = (type) => {
  const icons = {
    resident_added: <UserPlus className="h-5 w-5 shrink-0 text-blue-600 dark:text-cyan-400" />,
    resident_approved: <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    resident_rejected: <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />,
    resident_updated: <Edit className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />,
    official_added: <Briefcase className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />,
    official_updated: <FileEdit className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />,
    official_deleted: <Trash2 className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />,
    announcement_posted: <Megaphone className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />,
    purok_added: <MapPin className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />,
    purok_deleted: <Trash2 className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />,
    document_approved: <FileCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    document_printed: <Printer className="h-5 w-5 shrink-0 text-blue-600 dark:text-cyan-400" />,
  };
  return icons[type] || <FileText className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" />;
};

export default function DashboardPanel({ onNavigate, onNotificationsUpdate }) {
  const API_URL = API_ORIGIN;
  const [selectedFilter, setSelectedFilter] = useState("This Month");
  const [chartData, setChartData] = useState({
    labels: ["Residents", "Officials", "Requests", "Transactions"],
    datasets: [
      {
        label: "This Month",
        data: [0, 0, 0, 0],
        backgroundColor: CHART_BAR_COLORS,
      },
    ],
  });
  const [activities, setActivities] = useState([]);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [summaryData, setSummaryData] = useState([
    { title: "Total Residents", count: "0", icon: <Users className="w-6 h-6" />, change: "", sectionId: "#residents" },
    { title: "Active Officials", count: "0", icon: <User className="w-6 h-6" />, change: "", sectionId: "#officials" },
    { title: "Senior Citizens", count: "0", icon: <User className="w-6 h-6" />, change: "", sectionId: "#senior" },
    { title: "PWD Members", count: "0", icon: <AlertCircle className="w-6 h-6" />, change: "", sectionId: "#pwd" },
    { title: "4Ps Members", count: "0", icon: <ClipboardCheck className="w-6 h-6" />, change: "", sectionId: "#4ps" },
    { title: "Male", count: "0", icon: <User className="w-6 h-6" />, change: "", sectionId: "#male" },
    { title: "Female", count: "0", icon: <User className="w-6 h-6" />, change: "", sectionId: "#female" },
  ]);
  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/residents/stats/dashboard`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const stats = await res.json();

        setSummaryData([
          {
            title: "Total Residents",
            count: stats.totalResidents?.toLocaleString() || "0",
            icon: <Users className="w-6 h-6" />,
            change: "",
            sectionId: "#residents",
            badge: stats.totalResidents > 0 ? "new" : null,
          },
          {
            title: "Active Officials",
            count: stats.activeOfficials?.toLocaleString() || "0",
            icon: <User className="w-6 h-6" />,
            change: "",
            sectionId: "#officials",
          },
          {
            title: "Senior Citizens",
            count: stats.seniorCitizens?.toLocaleString() || "0",
            icon: <User className="w-6 h-6" />,
            change: "",
            sectionId: "#senior",
          },
          {
            title: "PWD Members",
            count: stats.pwdMembers?.toLocaleString() || "0",
            icon: <AlertCircle className="w-6 h-6" />,
            change: "",
            sectionId: "#pwd",
          },
          {
            title: "4Ps Members",
            count: stats.member4ps?.toLocaleString() || "0",
            icon: <ClipboardCheck className="w-6 h-6" />,
            change: "",
            sectionId: "#4ps",
          },
          {
            title: "Male",
            count: stats.maleCount?.toLocaleString() || "0",
            icon: <User className="w-6 h-6" />,
            change: "",
            sectionId: "#male",
          },
          {
            title: "Female",
            count: stats.femaleCount?.toLocaleString() || "0",
            icon: <User className="w-6 h-6" />,
            change: "",
            sectionId: "#female",
          },
        ]);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchStats();
    // Real-time refresh every 30 seconds for instant updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch chart data based on selected filter
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/residents/stats/chart?filter=${encodeURIComponent(selectedFilter)}`);
        if (!res.ok) throw new Error("Failed to fetch chart data");
        const data = await res.json();

        setChartData({
          labels: ["Residents", "Officials", "Requests", "Transactions"],
          datasets: [
            {
              label: selectedFilter,
              data: [
                data.residents || 0,
                data.officials || 0,
                data.requests || 0,
                data.transactions || 0,
              ],
              backgroundColor: CHART_BAR_COLORS,
            },
          ],
        });
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchChartData();
  }, [selectedFilter, API_URL]);

  // Fetch activities function (reusable)
  const fetchActivities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/activities?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  // Fetch recent activities
  useEffect(() => {
    fetchActivities();
    // Real-time refresh every 15 seconds for instant updates
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, [API_URL]);

  // Clear/Delete all activities
  const handleClearActivities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/activities`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete activities");

      const data = await res.json();
      await fetchActivities(); // Refresh activities after deletion
      setShowClearConfirmModal(false);
      toast.success(`Deleted ${data.deletedCount || 0} activit${(data.deletedCount || 0) === 1 ? "y" : "ies"}.`);
    } catch (err) {
      console.error("Error deleting activities:", err);
      toast.error("Failed to delete activities.");
    }
  };

  // Fetch new residents and document requests and update parent notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch pending residents (new registrations)
        const residentsRes = await fetch(`${API_URL}/api/residents`);
        const residentsData = residentsRes.ok ? await residentsRes.json() : [];
        const pendingResidents = residentsData.filter(
          (r) => r.status === "Pending"
        );

        // Fetch pending document requests
        const docsRes = await fetch(`${API_URL}/api/document-requests?status=Pending`);
        const docsData = docsRes.ok ? await docsRes.json() : [];

        // Format notifications
        const residentNotifs = pendingResidents.slice(0, 10).map((resident) => ({
          id: `resident-${resident._id || resident.id}`,
          type: "resident",
          text: `New resident registered: ${resident.firstName || ""} ${resident.lastName || ""}`.trim() || "New resident",
          data: resident,
          timestamp: resident.createdAt || new Date(),
        }));

        const docNotifs = docsData.slice(0, 10).map((doc) => ({
          id: `doc-${doc._id || doc.id}`,
          type: "document",
          text: `New document request: ${doc.documentType || "Document"} from ${doc.residentName || "Resident"}`,
          data: doc,
          timestamp: doc.createdAt || new Date(),
        }));

        const allNotifs = [...residentNotifs, ...docNotifs].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Update parent component notifications
        if (onNotificationsUpdate) {
          onNotificationsUpdate(allNotifs);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    // Real-time refresh every 10 seconds for instant updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [onNotificationsUpdate]);

  const residentsChip = summaryData.find((s) => s.title === "Total Residents");
  const officialsChip = summaryData.find((s) => s.title === "Active Officials");

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <BarChartBig className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Dashboard</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Resident and barangay metrics, trends, and the latest system activity.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {residentsChip && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {residentsChip.count} residents
              </span>
            )}
            {officialsChip && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {officialsChip.count} officials
              </span>
            )}
          </div>
        </header>

        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="!pb-1"
          >
            {summaryData.map((card, i) => (
              <SwiperSlide key={i}>
                <motion.a
                  href={card.sectionId}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  whileHover={{ y: -2 }}
                  className="group block h-full rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {card.title}
                      {card.badge && (
                        <span className="ml-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-white">
                          {card.badge}
                        </span>
                      )}
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-950/40 dark:group-hover:text-cyan-400">
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{card.count}</p>
                  {card.change && (
                    <div className="mt-2 flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      {card.change}
                    </div>
                  )}
                </motion.a>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-cyan-400">
                  <BarChartBig className="h-5 w-5" />
                </span>
                Overview
              </h2>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className={`${FIELD_CLASS} w-full sm:w-auto sm:min-w-[11rem]`}
              >
                {filters.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="h-64 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40 sm:h-72 sm:p-4">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "rgba(15, 23, 42, 0.92)",
                      padding: 12,
                      titleFont: { size: 13, weight: "600" },
                      bodyFont: { size: 12 },
                      cornerRadius: 10,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 500, color: "#64748b", font: { size: 11 } },
                      grid: { color: "rgba(148, 163, 184, 0.2)" },
                      border: { display: false },
                    },
                    x: {
                      ticks: { color: "#64748b", font: { size: 11 } },
                      grid: { display: false },
                      border: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Clock className="h-5 w-5" />
              </span>
              Recent activity
            </h2>
            <button
              type="button"
              onClick={() => setShowActivitiesModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              title="View all activities"
            >
              <Eye className="h-4 w-4" />
              View all
            </button>
          </div>
          <div className="p-5 sm:p-6">
            {activities.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {activities.slice(0, 2).map((activity) => {
                  const date = new Date(activity.createdAt);
                  const timeAgo = getTimeAgo(date);
                  const icon = getActivityIcon(activity.type);

                  return (
                    <motion.li
                      key={activity._id}
                      whileHover={{ y: -1 }}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-800/30 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                    >
                      <div className="shrink-0 rounded-lg border border-slate-100 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">{activity.title}</div>
                        {activity.description && (
                          <div className="mt-1 text-slate-600 dark:text-slate-400">{activity.description}</div>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
                {activities.length > 2 && (
                  <li className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowActivitiesModal(true)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                      View {activities.length - 2} more →
                    </button>
                  </li>
                )}
              </ul>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Clock className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <Modal
          isOpen={showActivitiesModal}
          onClose={() => setShowActivitiesModal(false)}
          title="Activity log"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total entries
                </p>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {activities.length}
                </p>
              </div>
              {activities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                  title="Delete all activities"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </button>
              )}
            </div>
            {activities.length > 0 ? (
              <div className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto overscroll-contain pr-1">
                {activities.map((activity) => {
                  const date = new Date(activity.createdAt);
                  const timeAgo = getTimeAgo(date);
                  const fullDate = date.toLocaleString();
                  const icon = getActivityIcon(activity.type);

                  return (
                    <div
                      key={activity._id}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/40 sm:gap-4 sm:p-4"
                    >
                      <div className="shrink-0 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">{activity.title}</div>
                        {activity.description && (
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{activity.description}</div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-500">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium">{timeAgo}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="sm:ml-0">{fullDate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Clock className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No activity yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Events will show here as you use the system.
                </p>
              </div>
            )}
          </div>
        </Modal>

        <AnimatePresence>
          {showClearConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
              onClick={() => setShowClearConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 12 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100 dark:bg-red-950/40 dark:ring-red-900/50">
                    <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h2 className="mt-4 text-center text-lg font-semibold text-slate-900 dark:text-white">
                  Clear all activities?
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                  Remove all <strong className="text-slate-900 dark:text-white">{activities.length}</strong> log
                  {activities.length === 1 ? " entry" : " entries"}? This cannot be undone.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirmModal(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClearActivities}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
