import React, { useState, useEffect, useMemo } from "react";
import {
  Megaphone,
  AlertCircle,
  Calendar,
  Trash2,
  CheckCircle,
  X,
  SendHorizontal,
  ScrollText,
  History,
  Smartphone,
  LayoutList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** Labels for saved announcements + membership SMS targeting (matches resident fields). */
const MEMBERSHIP_CATEGORY = {
  All: "All",
  "4PS": "4PS",
  PWD: "PWD",
  IPS: "IPS",
  SeniorCitizen: "SeniorCitizen",
};

const membershipRecipientLabel = {
  [MEMBERSHIP_CATEGORY.All]: "Active members (all categories)",
  [MEMBERSHIP_CATEGORY["4PS"]]: "4Ps members",
  [MEMBERSHIP_CATEGORY.PWD]: "PWD members",
  [MEMBERSHIP_CATEGORY.IPS]: "IPs members",
  [MEMBERSHIP_CATEGORY.SeniorCitizen]: "Senior citizens",
};

const membershipCardLabel = {
  [MEMBERSHIP_CATEGORY.All]: "All membership types",
  [MEMBERSHIP_CATEGORY["4PS"]]: "4Ps",
  [MEMBERSHIP_CATEGORY.PWD]: "PWD",
  [MEMBERSHIP_CATEGORY.IPS]: "IPs",
  [MEMBERSHIP_CATEGORY.SeniorCitizen]: "Senior citizens",
};

function getAnnouncementAudienceLabel(a) {
  if (a.audience === "All") return "All residents";
  if (a.audience === "MembershipResident")
    return `Membership · ${membershipCardLabel[a.membershipCategory || MEMBERSHIP_CATEGORY.All] || "All types"}`;
  if (a.audience === "Purok") return `Purok · ${a.recipient || "—"}`;
  if (a.audience === "Individual") return `Resident · ${a.recipient || "—"}`;
  if (a.audience === "Officials")
    return a.official?.trim()
      ? `Official · ${a.official}`
      : "All officials";
  return a.audience || "—";
}

/** Same SMS rules as backend: phone on file, not Rejected/Transferred. */
function residentSmsEligible(r) {
  const phone = (r.phone || "").toString().trim();
  if (!phone) return false;
  if (r.status === "Rejected" || r.status === "Transferred") return false;
  return true;
}

/** Same as server affirmativeMemberField — matches resident profile Yes/No fields. */
function residentMembershipFlagYes(val) {
  if (val === true) return true;
  if (val == null || val === "") return false;
  return /^\s*(yes|y|1|true)\s*$/i.test(String(val).trim());
}

const MEMBERSHIP_SELECT_OPTIONS = [
  { value: MEMBERSHIP_CATEGORY.All, label: "All members (any category)", field: null },
  { value: MEMBERSHIP_CATEGORY["4PS"], label: "4Ps members", field: "member4ps" },
  { value: MEMBERSHIP_CATEGORY.PWD, label: "PWD members", field: "pwd" },
  { value: MEMBERSHIP_CATEGORY.IPS, label: "IPs members", field: "memberIps" },
  { value: MEMBERSHIP_CATEGORY.SeniorCitizen, label: "Senior citizens", field: "seniorCitizen" },
];

const SEND_LOGS_STORAGE_KEY = "bms_announcement_send_logs_v1";
const MAX_SEND_LOGS = 80;

const AnnouncementPanel = () => {
  const [residentsList, setResidentsList] = useState([]);
  const [officialsList, setOfficialsList] = useState([]);
  const [puroksList, setPuroksList] = useState([]);
  const [lastNameFilter, setLastNameFilter] = useState("");

  const [form, setForm] = useState({
    messageType: "Announcement",
    title: "",
    message: "",
    audience: "All",
    recipient: "",
    recipientId: "", // Store resident ID for Individual audience
    recipientPhone: "", // Store resident phone for Individual audience
    official: "",
    membershipCategory: MEMBERSHIP_CATEGORY.All,
  });

  const [announcements, setAnnouncements] = useState([]);
  const [filters, setFilters] = useState({ type: "All", date: "All" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, announcement: null });
  const [publishedModalOpen, setPublishedModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sendLogs, setSendLogs] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const persistSendLogs = (next) => {
    try {
      localStorage.setItem(SEND_LOGS_STORAGE_KEY, JSON.stringify(next.slice(0, MAX_SEND_LOGS)));
    } catch {
      /* ignore quota */
    }
  };

  const pushSendLog = (entry) => {
    setSendLogs((prev) => {
      const row = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        at: new Date().toISOString(),
      };
      const next = [row, ...prev].slice(0, MAX_SEND_LOGS);
      persistSendLogs(next);
      return next;
    });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEND_LOGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSendLogs(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const membershipRecipientCounts = useMemo(() => {
    const eligible = residentsList.filter(residentSmsEligible);
    const countForField = (field) =>
      field == null
        ? eligible.length
        : eligible.filter((r) => residentMembershipFlagYes(r[field])).length;
    return {
      [MEMBERSHIP_CATEGORY.All]: countForField(null),
      [MEMBERSHIP_CATEGORY["4PS"]]: countForField("member4ps"),
      [MEMBERSHIP_CATEGORY.PWD]: countForField("pwd"),
      [MEMBERSHIP_CATEGORY.IPS]: countForField("memberIps"),
      [MEMBERSHIP_CATEGORY.SeniorCitizen]: countForField("seniorCitizen"),
    };
  }, [residentsList]);

  // If the chosen membership has no one on file, fall back to "All" when that still has recipients
  useEffect(() => {
    if (form.audience !== "MembershipResident") return;
    const n = membershipRecipientCounts[form.membershipCategory];
    const allN = membershipRecipientCounts[MEMBERSHIP_CATEGORY.All];
    if (
      n === 0 &&
      allN > 0 &&
      form.membershipCategory !== MEMBERSHIP_CATEGORY.All
    ) {
      setForm((prev) => ({
        ...prev,
        membershipCategory: MEMBERSHIP_CATEGORY.All,
        recipient:
          membershipRecipientLabel[MEMBERSHIP_CATEGORY.All] ||
          "Membership residents",
      }));
    }
  }, [
    form.audience,
    form.membershipCategory,
    membershipRecipientCounts,
  ]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!publishedModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPublishedModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [publishedModalOpen]);

  // Fetch announcements from backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_URL}/api/announcements`);
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const data = await res.json();
        setAnnouncements(data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/officials`)
      .then((res) => res.json())
      .then((data) => setOfficialsList(data))
      .catch((err) => console.error("Error fetching officials:", err));
  }, []);

  useEffect(() => {
    const fetchPuroks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/puroks`);
        if (!res.ok) throw new Error("Failed to fetch puroks");
        const data = await res.json();
        setPuroksList(data);
      } catch (err) {
        console.error("Error fetching puroks:", err);
      }
    };
    fetchPuroks();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/residents`);
        const data = await res.json();

        const formatted = data.map((r) => ({
          id: r._id,
          fullName: `${r.firstName} ${r.lastName}`.trim(),
          firstName: r.firstName || "",
          lastName: r.lastName || "",
          phone: r.phone || r.contact || "",
          purok: r.purok || "",
          status: r.status,
          member4ps: r.member4ps,
          pwd: r.pwd,
          memberIps: r.memberIps,
          seniorCitizen: r.seniorCitizen,
        }));

        setResidentsList(formatted);

        setForm((prev) => {
          if (prev.audience === "All") {
            return { ...prev, recipient: "All" };
          }
          if (prev.audience === "MembershipResident") {
            const mc = prev.membershipCategory || MEMBERSHIP_CATEGORY.All;
            return {
              ...prev,
              recipient: membershipRecipientLabel[mc] || "Membership residents",
            };
          }

          if (prev.audience === "Individual" && formatted.length > 0) {
            return { ...prev, recipient: formatted[0].fullName };
          }

          return prev;
        });
      } catch (err) {
        console.error("Error fetching residents:", err);
      }
    };

    loadData();
  }, []);

  /** Maps Message Type UI ("Events") to API `type` ("Event"). */
  const messageTypeToApiType = (mt) => (mt === "Events" ? "Event" : mt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!form.title.trim() || !form.message.trim()) {
      setToast({ message: "Please fill in the title and message fields.", type: "error" });
      return;
    }
    if (form.audience === "Individual" && !form.recipient) {
      setToast({ message: "Please select a resident by typing their last name.", type: "error" });
      return;
    }
    if (form.audience === "Individual" && !form.recipientPhone) {
      setToast({ message: "Selected resident does not have a phone number. Please select a resident with a valid phone number.", type: "error" });
      return;
    }
    if (form.audience === "Purok" && !form.recipient) {
      setToast({ message: "Please select a purok.", type: "error" });
      return;
    }
    if (form.audience === "MembershipResident") {
      const n =
        membershipRecipientCounts[form.membershipCategory] ?? 0;
      if (n === 0) {
        setToast({
          message:
            "No residents match this membership with a phone on file (same fields as Residents: 4Ps, PWD, IPs, Senior citizen). Update profiles or pick another membership.",
          type: "error",
        });
        return;
      }
    }

    const apiType = messageTypeToApiType(form.messageType);
    // Officials audience: official field is optional (can send to all officials)
    // No validation needed for Officials - if empty, sends to all

    try {
      // For Individual audience: Skip saving to database, only send SMS
      if (form.audience === "Individual") {
        // Prepare SMS payload for individual resident
        const smsPayload = {
          announcementId: null, // No announcement ID since we're not saving
          type: apiType,
          messageType: form.messageType,
          title: form.title,
          message: form.message,
          audience: "Individual",
          recipient: form.recipient,
          recipientId: form.recipientId,
          recipientPhone: form.recipientPhone,
          official: "",
        };

        // Show loading message
        const loadingMsg = `Sending ${apiType} (${form.messageType}) via SMS to ${form.recipient}...`;
        console.log(loadingMsg);

        // Call SMS send endpoint
        const smsRes = await fetch(`${API_URL}/api/sms/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsPayload),
        });

        if (!smsRes.ok) {
          let errorMessage = "Unknown error";
          let isConfigError = false;
          try {
            const errorText = await smsRes.text();
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorText || "Unknown error";
              isConfigError = errorData.error === "IPROG_API_TOKEN_MISSING";
            } catch {
              errorMessage = errorText || "Unknown error";
            }
          } catch {
            errorMessage = "Failed to read error response";
          }
          console.error("SMS send failed:", errorMessage);
          
          if (isConfigError) {
            setToast({ 
              message: `SMS Configuration Required: ${errorMessage}. Please contact your system administrator.`, 
              type: "error" 
            });
          } else {
            setToast({ 
              message: `SMS sending failed: ${errorMessage}. Please check server logs for details.`, 
              type: "error" 
            });
          }
          pushSendLog({
            title: form.title,
            messageType: form.messageType,
            audience: "Individual",
            recipientLabel: form.recipient,
            mode: "individual",
            announcementId: null,
            status: "error",
            summary: errorMessage,
          });
        } else {
          // SMS sent successfully
          const smsResult = await smsRes.json();
          const successCount = smsResult.results?.filter((r) => r.ok).length || 0;
          const total = smsResult.results?.length ?? smsResult.count ?? 0;

          if (successCount > 0) {
            setToast({ 
              message: `SMS sent successfully to ${form.recipient}!`, 
              type: "success" 
            });
          } else {
            setToast({ 
              message: `SMS failed to send to ${form.recipient}.`, 
              type: "error" 
            });
          }
          console.log("SMS send result:", smsResult);
          pushSendLog({
            title: form.title,
            messageType: form.messageType,
            audience: "Individual",
            recipientLabel: form.recipient,
            mode: "individual",
            announcementId: null,
            status: successCount > 0 ? "success" : "error",
            summary:
              total > 0
                ? `${successCount}/${total} delivered`
                : successCount > 0
                  ? "Delivered"
                  : "No delivery confirmation",
            successCount,
            failCount: total - successCount,
            total,
          });
        }

        // Reset form
        setForm({
          messageType: "Announcement",
          title: "",
          message: "",
          audience: "All",
          recipient: "All",
          recipientId: "",
          recipientPhone: "",
          official: "",
          membershipCategory: MEMBERSHIP_CATEGORY.All,
        });
        setLastNameFilter("");
        return; // Exit early for Individual audience
      }

      // For other audiences: Save announcement and send SMS as before
      const mc = form.membershipCategory || MEMBERSHIP_CATEGORY.All;
      const newPost = {
        ...form,
        type: apiType,
        membershipCategory:
          form.audience === "MembershipResident" ? mc : "",
        recipient:
          form.audience === "All"
            ? "All Residents"
            : form.audience === "MembershipResident"
              ? membershipRecipientLabel[mc] || "Membership residents"
              : form.recipient,
      };

      // 1) Save announcement in backend (database)
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Save announcement failed:", errText);
        throw new Error("Failed to post announcement");
      }

      const savedAnnouncement = await res.json();
      setAnnouncements([savedAnnouncement, ...announcements]);

      // 2) Request backend to send SMS based on audience & message type
      const smsPayload = {
        announcementId: savedAnnouncement._id || savedAnnouncement.id,
        type: savedAnnouncement.type,
        messageType: savedAnnouncement.messageType,
        title: savedAnnouncement.title,
        message: savedAnnouncement.message,
        audience: savedAnnouncement.audience,
        recipient: savedAnnouncement.recipient,
        official: savedAnnouncement.official || "",
        membershipCategory:
          savedAnnouncement.audience === "MembershipResident"
            ? savedAnnouncement.membershipCategory ||
              form.membershipCategory ||
              MEMBERSHIP_CATEGORY.All
            : MEMBERSHIP_CATEGORY.All,
      };

      // Show loading message
      const loadingMsg = `Sending ${savedAnnouncement.type} (${savedAnnouncement.messageType}) via SMS...`;
      console.log(loadingMsg);

      // Call SMS send endpoint
      const smsRes = await fetch(`${API_URL}/api/sms/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smsPayload),
      });

      if (!smsRes.ok) {
        let errorMessage = "Unknown error";
        let isConfigError = false;
        try {
          const errorText = await smsRes.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorText || "Unknown error";
            isConfigError = errorData.error === "IPROG_API_TOKEN_MISSING";
          } catch {
            errorMessage = errorText || "Unknown error";
          }
        } catch {
          errorMessage = "Failed to read error response";
        }
        console.error("SMS send failed:", errorMessage);
        
        if (isConfigError) {
          setToast({ 
            message: `Announcement saved! SMS Configuration Required: ${errorMessage}. Please contact your system administrator.`, 
            type: "error" 
          });
        } else {
          setToast({ 
            message: `Announcement saved! SMS sending failed: ${errorMessage}. Please check server logs.`, 
            type: "error" 
          });
        }
        pushSendLog({
          title: savedAnnouncement.title,
          messageType: savedAnnouncement.messageType,
          audience: savedAnnouncement.audience,
          recipientLabel: savedAnnouncement.recipient,
          mode: "bulk",
          announcementId: savedAnnouncement._id || savedAnnouncement.id || null,
          status: "saved_only",
          summary: `Saved; SMS error: ${errorMessage}`,
        });
      } else {
        const smsResult = await smsRes.json();
        const recipientCount = smsResult.count || smsResult.results?.length || 0;
        const successCount = smsResult.results?.filter((r) => r.ok).length || 0;
        const failCount = recipientCount - successCount;

        if (successCount > 0) {
          setToast({ 
            message: `Announcement saved and SMS sent to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}!`, 
            type: "success" 
          });
        } else {
          setToast({ 
            message: `Announcement saved but SMS failed to send.`, 
            type: "error" 
          });
        }
        console.log("SMS send result:", smsResult);
        const st =
          failCount === 0 && successCount > 0
            ? "success"
            : successCount > 0
              ? "partial"
              : "error";
        pushSendLog({
          title: savedAnnouncement.title,
          messageType: savedAnnouncement.messageType,
          audience: savedAnnouncement.audience,
          recipientLabel: savedAnnouncement.recipient,
          mode: "bulk",
          announcementId: savedAnnouncement._id || savedAnnouncement.id || null,
          status: st,
          summary: `${successCount}/${recipientCount || successCount || 0} SMS delivered`,
          successCount,
          failCount,
          total: recipientCount,
        });
        try {
          const listRes = await fetch(`${API_URL}/api/announcements`);
          if (listRes.ok) setAnnouncements(await listRes.json());
        } catch {
          /* ignore */
        }
      }

      // Reset form
      setForm({
        messageType: "Announcement",
        title: "",
        message: "",
        audience: "All",
        recipient: "All",
        recipientId: "",
        recipientPhone: "",
        official: "",
        membershipCategory: MEMBERSHIP_CATEGORY.All,
      });
      setLastNameFilter("");
    } catch (err) {
      console.error("Error posting announcement:", err);
      setToast({ 
        message: `Failed to post announcement: ${err.message}. Please try again.`, 
        type: "error" 
      });
    }
  };

  // Delete announcement handler
  const handleDelete = async () => {
    if (!deleteConfirm.announcement) return;

    try {
      const announcementId = deleteConfirm.announcement._id || deleteConfirm.announcement.id;
      const res = await fetch(`${API_URL}/api/announcements/${announcementId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to delete announcement";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, try text
          try {
            const errorText = await res.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // Use default message
          }
        }
        throw new Error(errorMessage);
      }

      // Remove from local state
      setAnnouncements((prev) =>
        prev.filter((a) => (a._id || a.id) !== announcementId)
      );

      setDeleteConfirm({ open: false, announcement: null });
      setToast({ 
        message: "Announcement deleted successfully!", 
        type: "success",
        action: "delete"
      });
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setToast({ 
        message: `Failed to delete announcement: ${err.message}`, 
        type: "error",
        action: "delete"
      });
    }
  };

  // ... (no changes to filteredAnnouncements, typeBadgeColor, typeIcon, and rendering)
  const filteredAnnouncements = announcements.filter((a) => {
    let typeMatch = filters.type === "All" || a.type === filters.type;
    let dateMatch = true;
    const now = new Date();
    const aDate = new Date(a.date || a.createdAt);
    if (filters.date === "Today") dateMatch = aDate.toDateString() === now.toDateString();
    else if (filters.date === "This Week") {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      dateMatch = aDate >= startOfWeek;
    } else if (filters.date === "This Month") {
      dateMatch = aDate.getMonth() === now.getMonth() && aDate.getFullYear() === now.getFullYear();
    }
    return typeMatch && dateMatch;
  });

  const typeBadgeColor = {
    Announcement: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Alert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Event: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  const typeIcon = {
    Announcement: <Megaphone className="w-5 h-5 text-blue-500" />,
    Alert: <AlertCircle className="w-5 h-5 text-red-500" />,
    Event: <Calendar className="w-5 h-5 text-green-500" />,
  };

  const announcementsWithSms = useMemo(
    () =>
      announcements.filter(
        (a) =>
          a.smsSent &&
          Array.isArray(a.smsResult) &&
          a.smsResult.length > 0
      ),
    [announcements]
  );

  const controlClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";

  const labelClass =
    "block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

  const logStatusBadge = {
    success:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300",
    partial:
      "bg-amber-50 text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200",
    error:
      "bg-red-50 text-red-800 ring-1 ring-red-600/20 dark:bg-red-950/40 dark:text-red-200",
    saved_only:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300",
  };

  const clearSendLogs = () => {
    setSendLogs([]);
    try {
      localStorage.removeItem(SEND_LOGS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <Megaphone className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Announcements
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Compose official notices, broadcast SMS to residents and officials, and review delivery activity.
              </p>
            </div>
          </motion.div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-medium shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
              <History className="h-3.5 w-3.5 text-slate-400" />
              {announcements.length} published
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-medium shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              {sendLogs.length} local log{sendLogs.length === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 dark:shadow-none sm:p-8"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Compose & send
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Posts are saved; SMS runs for the audience you select.
                  </p>
                </div>
                <SendHorizontal className="h-8 w-8 text-blue-500/80 dark:text-cyan-400/80" aria-hidden />
              </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Message Type */}
          <div className="space-y-2">
            <label className={labelClass}>Message type</label>
            <select
              value={form.messageType}
              onChange={(e) => setForm({ ...form, messageType: e.target.value })}
              className={controlClass}
            >
              <option value="Announcement">Announcement</option>
              <option value="Alert">Alert</option>
              <option value="Events">Events</option>
            </select>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <label className={labelClass}>Audience</label>
            <select
              value={form.audience}
              onChange={(e) => {
                const selectedAudience = e.target.value;
                // Clear lastName filter when audience changes
                if (selectedAudience !== "Individual") {
                  setLastNameFilter("");
                }
                setForm((prev) => {
                  const memCat =
                    selectedAudience === "MembershipResident"
                      ? prev.membershipCategory || MEMBERSHIP_CATEGORY.All
                      : MEMBERSHIP_CATEGORY.All;
                  return {
                    ...prev,
                    audience: selectedAudience,
                    membershipCategory: memCat,
                    recipient:
                      selectedAudience === "All"
                        ? "All"
                        : selectedAudience === "MembershipResident"
                          ? membershipRecipientLabel[memCat] || "Membership residents"
                          : selectedAudience === "Individual" && residentsList.length > 0
                            ? residentsList[0].fullName
                            : selectedAudience === "Purok" && puroksList.length > 0
                              ? puroksList[0].name
                              : "",
                    recipientId: selectedAudience === "Individual" && residentsList.length > 0
                      ? residentsList[0].id
                      : "",
                    recipientPhone: selectedAudience === "Individual" && residentsList.length > 0
                      ? residentsList[0].phone || ""
                      : "",
                  };
                });
              }}
              className={controlClass}
            >
              <option value="All">All Residents</option>
              <option value="MembershipResident">Membership resident</option>
              <option value="Individual">Individual Resident</option>
              <option value="Purok">Specific Purok</option>
              <option value="Officials">Officials</option>
            </select>
          </div>
        </div>

        {form.audience === "MembershipResident" && (
          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <label className={labelClass}>
              Membership (linked to residents)
            </label>
            <select
              value={form.membershipCategory}
              onChange={(e) => {
                const v = e.target.value;
                setForm({
                  ...form,
                  membershipCategory: v,
                  recipient: membershipRecipientLabel[v] || "Membership residents",
                });
              }}
              className={controlClass}
            >
              {MEMBERSHIP_SELECT_OPTIONS.map((opt) => {
                const count = membershipRecipientCounts[opt.value] ?? 0;
                const isAll = opt.value === MEMBERSHIP_CATEGORY.All;
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={count === 0 && !isAll}
                  >
                    {opt.label} — {count} resident{count === 1 ? "" : "s"} (SMS)
                  </option>
                );
              })}
            </select>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Counts use the same resident records and rules as SMS: phone on file, not Rejected/Transferred, and profile flags 4Ps / PWD / IPs / Senior citizen set to Yes (or Y / 1 / true).
            </p>
          </div>
        )}

        {/* Conditional Dropdowns */}
        {form.audience === "Individual" && residentsList.length > 0 && (
          <div className="relative space-y-2">
            <label className={labelClass}>Search resident (last name)</label>
            <input
              type="text"
              value={form.recipient ? form.recipient : lastNameFilter}
              onChange={(e) => {
                const value = e.target.value;
                setLastNameFilter(value);
                // Clear recipient if user starts typing and it matches the selected recipient
                if (form.recipient && value !== form.recipient) {
                  setForm({ 
                    ...form, 
                    recipient: "",
                    recipientId: "",
                    recipientPhone: ""
                  });
                }
              }}
              onFocus={() => {
                // When input is focused, if there's a selected recipient, clear it to allow searching
                if (form.recipient) {
                  setLastNameFilter(form.recipient);
                }
              }}
              placeholder="Type last name or letters from last name..."
              className={controlClass}
            />
            
            {/* Filtered Residents List - Only show when searching (not when resident is selected) */}
            {lastNameFilter && !form.recipient && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {residentsList
                  .filter((res) => 
                    res.lastName.toLowerCase().includes(lastNameFilter.toLowerCase()) ||
                    res.fullName.toLowerCase().includes(lastNameFilter.toLowerCase())
                  )
                  .length > 0 ? (
                  residentsList
                    .filter((res) => 
                      res.lastName.toLowerCase().includes(lastNameFilter.toLowerCase()) ||
                      res.fullName.toLowerCase().includes(lastNameFilter.toLowerCase())
                    )
                    .map((res) => (
                      <div
                        key={res.id}
                        onClick={() => {
                          setForm({ 
                            ...form, 
                            recipient: res.fullName,
                            recipientId: res.id,
                            recipientPhone: res.phone || ""
                          });
                          setLastNameFilter(""); // Clear filter to show selected name in input
                        }}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                          form.recipient === res.fullName
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : ""
                        } border-b border-gray-200 dark:border-gray-700 last:border-b-0`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-800 dark:text-white font-medium">
                            {res.fullName}
                          </span>
                          {form.recipient === res.fullName && (
                            <span className="text-blue-600 dark:text-blue-400 text-sm">✓ Selected</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Purok: {res.purok || "N/A"} | Phone: {res.phone || "N/A"}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                    No residents found matching "{lastNameFilter}"
                  </div>
                )}
              </div>
            )}

            {/* Selected Resident Display - Show below input when selected */}
            {form.recipient && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      Selected Resident:
                    </span>
                    <span className="ml-2 text-gray-800 dark:text-white font-semibold">
                      {form.recipient}
                    </span>
                    {form.recipientPhone && (
                      <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                        ({form.recipientPhone})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ 
                        ...form, 
                        recipient: "",
                        recipientId: "",
                        recipientPhone: ""
                      });
                      setLastNameFilter("");
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {form.audience === "Purok" && (
          <div className="space-y-2">
            <label className={labelClass}>Purok</label>
            <select
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              className={controlClass}
              required
            >
              <option value="">-- Choose Purok --</option>
              {puroksList.map((purok) => (
                <option key={purok._id || purok.id} value={purok.name}>
                  {purok.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {form.audience === "Officials" && (
          <div className="space-y-2">
            <label className={labelClass}>
              Official (optional — empty = all officials)
            </label>
            <select
              value={form.official}
              onChange={(e) => setForm({ ...form, official: e.target.value })}
              className={controlClass}
            >
              <option value="">-- All Officials --</option>
              {officialsList.map((o, index) => (
                <option key={`off-${o.id}-${index}`} value={o.name}>
                  {o.name} {o.position ? `(${o.position})` : ""}
                </option>
              ))}
            </select>
            {form.official === "" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                SMS will be sent to all officials with contact information.
              </p>
            )}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Short headline"
            className={controlClass}
            required
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className={labelClass}>Message</label>
          <textarea
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Body text for the post and SMS…"
            className={`${controlClass} resize-none py-3`}
            required
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-cyan-700 dark:shadow-blue-900/30"
        >
          <SendHorizontal className="h-4 w-4" />
          Post & send SMS
        </motion.button>
      </motion.form>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-6 flex max-h-[min(36rem,calc(100vh-6rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <ScrollText className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Send logs
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      This browser · last {MAX_SEND_LOGS} events
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSendLogs}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Clear
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {sendLogs.length === 0 &&
                announcementsWithSms.length === 0 ? (
                  <p className="px-2 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No delivery activity yet. After you send SMS, results appear
                    here. Saved posts with SMS also show below when the server
                    stores results.
                  </p>
                ) : (
                  <>
                    {sendLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${logStatusBadge[log.status] || logStatusBadge.saved_only}`}
                          >
                            {log.status === "saved_only"
                              ? "Saved"
                              : log.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {log.at
                              ? new Date(log.at).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {log.title || "(No title)"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {log.messageType}
                          </span>
                          {" · "}
                          {log.audience}
                          {log.recipientLabel
                            ? ` · ${log.recipientLabel}`
                            : ""}
                          {log.mode === "individual" ? " · Direct" : " · Bulk"}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {log.summary}
                        </p>
                      </div>
                    ))}

                    {announcementsWithSms.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Server · SMS on saved posts
                        </p>
                        {announcementsWithSms.slice(0, 12).map((a) => {
                          const ok =
                            a.smsResult?.filter((r) => r.ok).length ?? 0;
                          const tot = a.smsResult?.length ?? 0;
                          return (
                            <div
                              key={a._id || a.id}
                              className="mb-2 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/30"
                            >
                              <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                {a.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {a.audience}
                                {a.smsSentAt
                                  ? ` · ${new Date(a.smsSentAt).toLocaleString()}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                {ok}/{tot} SMS delivered (stored)
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-12 border-t border-slate-200/80 pt-10 dark:border-slate-800">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Published announcements
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Open the library to browse a scrollable list, filter by type and date, and remove posts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublishedModalOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <LayoutList className="h-4 w-4 opacity-90" aria-hidden />
              View library
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-bold tabular-nums dark:bg-slate-900/10">
                {announcements.length}
              </span>
            </button>
          </div>
        </section>

        <AnimatePresence>
          {publishedModalOpen ? (
            <motion.div
              key="published-announcements-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] flex items-center justify-center p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="published-modal-title"
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] dark:bg-black/65"
                aria-label="Close published list"
                onClick={() => setPublishedModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                className="relative flex max-h-[min(36rem,88vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[85vh] sm:max-w-3xl"
              >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="min-w-0">
                    <h3
                      id="published-modal-title"
                      className="text-base font-semibold text-slate-900 dark:text-white"
                    >
                      Announcement library
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {filteredAnnouncements.length} of {announcements.length} shown · scroll to review
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishedModalOpen(false)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80 sm:px-5">
                  <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Filters
                  </span>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, type: e.target.value }))
                    }
                    className={`${controlClass} w-auto min-w-[8.5rem] text-xs`}
                  >
                    <option value="All">All types</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Alert">Alert</option>
                    <option value="Event">Event</option>
                  </select>
                  <select
                    value={filters.date}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, date: e.target.value }))
                    }
                    className={`${controlClass} w-auto min-w-[9rem] text-xs`}
                  >
                    <option value="All">Any date</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This week</option>
                    <option value="This Month">This month</option>
                  </select>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {filteredAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
                      <LayoutList className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        No announcements match these filters
                      </p>
                      <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
                        Try changing type or date, or post a new announcement above.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAnnouncements.map((a, index) => (
                        <li
                          key={a._id || a.id || `ann-${index}`}
                          className="group transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/35"
                        >
                          <div className="flex gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                            <div className="hidden shrink-0 pt-0.5 sm:block">
                              <span
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${typeBadgeColor[a.type]}`}
                              >
                                {typeIcon[a.type]}
                                <span className="max-w-[5rem] truncate sm:max-w-none">
                                  {a.type}
                                </span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 sm:hidden">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadgeColor[a.type]}`}
                                    >
                                      {typeIcon[a.type]} {a.type}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {a.title}
                                  </h4>
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    {a.message}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      announcement: a,
                                    })
                                  }
                                  className="shrink-0 rounded-lg p-2 text-slate-400 opacity-80 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  {a.messageType}
                                </span>
                                <span className="hidden sm:inline">·</span>
                                <span className="max-w-full truncate">
                                  {getAnnouncementAudienceLabel(a)}
                                </span>
                                <span className="hidden sm:inline">·</span>
                                <time
                                  dateTime={
                                    a.date || a.createdAt
                                      ? new Date(
                                          a.date || a.createdAt
                                        ).toISOString()
                                      : undefined
                                  }
                                >
                                  {new Date(
                                    a.date || a.createdAt
                                  ).toLocaleString()}
                                </time>
                                {a.smsSent && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <Smartphone className="h-3 w-3" />
                                    SMS
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[1px] dark:bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Delete Announcement
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
              Are you sure you want to permanently delete this announcement?
              <br />
              <strong className="text-gray-900 dark:text-white">
                "{deleteConfirm.announcement?.title}"
              </strong>
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, announcement: null })}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 right-5 z-50 w-80 p-4 rounded-xl shadow-2xl flex items-center gap-4 text-white backdrop-blur-xl"
            style={{
              background: toast.type === "success" 
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(16, 185, 129, 0.95))"
                : "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))",
              borderLeft: `5px solid ${toast.type === "success" ? "#22c55e" : "#ef4444"}`,
              boxShadow: toast.type === "success"
                ? "0 0 20px rgba(34, 197, 94, 0.35)"
                : "0 0 20px rgba(239, 68, 68, 0.35)",
            }}
          >
            {/* Icon background ring */}
            <div
              className="w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-sm"
              style={{
                background: toast.type === "success"
                  ? "rgba(34, 197, 94, 0.25)"
                  : "rgba(239, 68, 68, 0.25)",
              }}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-6 h-6" />
              ) : toast.action === "delete" ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 text-sm font-medium tracking-wide">
              {toast.message}
            </div>

            {/* Close button */}
            <button
              onClick={() => setToast(null)}
              className="text-lg font-bold hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default AnnouncementPanel;
