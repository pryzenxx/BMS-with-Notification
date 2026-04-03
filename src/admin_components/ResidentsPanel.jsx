import React, { useState, useEffect, useMemo, useRef } from "react";
import Modal from "../admin_components/Modalresidents";
import ModalAddResident from "../admin_components/ModalAddResident";
import ModalViewResident from "../admin_components/ModalViewResident";
import ModalEditResident from "../admin_components/ModalEditResident";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";
import { exportToPDF, exportToExcel } from "../utils/exportUtils";
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  Printer,
  UserPlus,
  ChevronDown,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";
const LABEL_CLASS =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export default function ResidentsPanel() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("lastName");
  const [tab, setTab] = useState("All");
  const [selectedPurok, setSelectedPurok] = useState("");
  const [selectedGender, setSelectedGender] = useState ( "");
  const [selectedMembership, setSelectedMembership] = useState("");
  const [approvalAction, setApprovalAction] = useState(null);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportRef = useRef(null);
  const printRef = useRef();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewIDModal, setViewIDModal] = useState(false);
  const [selectedIDPhoto, setSelectedIDPhoto] = useState(null);
  const [showRejectAllConfirm, setShowRejectAllConfirm] = useState(false); 
  const [toast, setToast] = useState(null);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsMessageText, setSmsMessageText] = useState("");
  const [smsRecipient, setSmsRecipient] = useState(null);
  const [smsSending, setSmsSending] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [rejectAllReason, setRejectAllReason] = useState("");
  const [customRejectAllReason, setCustomRejectAllReason] = useState("");

  // Handle sending SMS to pending resident
  const handleSendSMS = async () => {
    if (!smsMessageText.trim() || !smsRecipient) {
      setToast({ message: "Please enter a message.", type: "error" });
      return;
    }

    if (!smsRecipient.phone) {
      setToast({ message: "Resident phone number not found.", type: "error" });
      return;
    }

    setSmsSending(true);
    try {
      const smsRes = await fetch(`${API_URL}/api/sms/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: null,
          type: "Message",
          messageType: "Text",
          title: "Message from Barangay Victory",
          message: smsMessageText.trim(),
          audience: "Individual",
          recipient: `${smsRecipient.firstName || ""} ${smsRecipient.lastName || ""}`.trim() || "Resident",
          recipientId: smsRecipient._id,
          recipientPhone: smsRecipient.phone,
        }),
      });

      if (!smsRes.ok) {
        const errorData = await smsRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send SMS");
      }

      const smsResult = await smsRes.json();
      const successCount = smsResult.results?.filter((r) => r.ok).length || 0;

      if (successCount > 0) {
        setToast({ 
          message: `SMS sent successfully to ${smsRecipient.firstName || "resident"}!`, 
          type: "success" 
        });
        setSmsMessageText("");
        setSmsModalOpen(false);
        setSmsRecipient(null);
      } else {
        setToast({ 
          message: `Failed to send SMS to ${smsRecipient.firstName || "resident"}.`, 
          type: "error" 
        });
      }
    } catch (err) {
      console.error("Error sending SMS:", err);
      setToast({ 
        message: `Failed to send SMS: ${err.message || "Unknown error"}`, 
        type: "error" 
      });
    } finally {
      setSmsSending(false);
    }
  }; 

  
  // ✅ Utility: Convert buffer to Base64
  const ensureBase64 = (image, contentType) => {
    if (!image) return null;
    if (typeof image === "string") return image;
    try {
      const dataArray = image.data || image;
      const binary = String.fromCharCode(...new Uint8Array(dataArray));
      return `data:${contentType || image.contentType || "image/png"};base64,${btoa(binary)}`;
    } catch (err) {
      console.error("❌ Failed to convert image buffer:", err);
      return null;
    }
  };

  // ✅ Optimized fetch function - excludes images by default for faster loading
  const loadResidents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch without images first (much faster)
      const res = await fetch(`${API_URL}/api/residents?includeImages=false`, {
        headers: {
          'Accept': 'application/json',
        },
        // Add cache control
        cache: 'no-cache',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch residents: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();

      // Fast processing - no image conversion needed
      const processedResidents = Array.isArray(data)
        ? data
            .filter((r) => r.status !== "Rejected")
            .map((r) => ({
              ...r,
              purok: r.purok?.replace(/^P-(\d)$/, "Purok-$1") || r.purok,
              // Images are already base64 from backend or null
              idPhotoBase64: r.idPhotoBase64 || null,
              profileImageBase64: r.profileImageBase64 || null,
            }))
        : [];
      
      setResidents(processedResidents);
      setError(null);
      
      // Optionally load images for visible items only (lazy loading)
      // This happens after initial render for better UX
    } catch (err) {
      console.error("Error loading residents:", err);
      setError(err.message || "Failed to load residents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);



 // ✅ Membership helper (kept for backward compatibility, but use memoized version in filtered)
  const getMemberships = (r) => {
    const m = [];
    if (r.pwd?.toLowerCase() === "yes") m.push("PWD");
    if (r.member4ps?.toLowerCase() === "yes") m.push("4Ps");
    if (r.memberIps?.toLowerCase() === "yes") m.push("IPs");
    if (r.seniorCitizen?.toLowerCase() === "yes") m.push("Senior Citizen");
    return m.length > 0 ? m.join(", ") : "None";
  };

// ✅ Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);


// ✅ Optimized filter + sort
 const filtered = useMemo(() => {
    if (!residents.length) return [];
    
    let list = residents;
    
    // Fast status filter
    if (tab !== "All") {
      list = list.filter((r) => r.status === tab);
    } else {
      list = list.filter((r) => r.status !== "Rejected");
    }

    // Optimized search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const fullName = `${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(term) ||
          (r.phone || "").includes(term) ||
          (r.purok || "").toLowerCase().includes(term)
        );
      });
    }

    // Apply filters in order of selectivity
    if (selectedPurok) list = list.filter((r) => r.purok === selectedPurok);
    if (selectedGender) list = list.filter((r) => r.gender === selectedGender);
    if (selectedMembership) {
      list = list.filter((r) => getMemberships(r).includes(selectedMembership));
    }

    // Optimized sort
    if (sortKey === "fullname") {
      list.sort((a, b) => {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`;
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`;
        return nameA.localeCompare(nameB);
      });
    } else if (sortKey === "age") {
      list.sort((a, b) => (a.age || 0) - (b.age || 0));
    } else if (sortKey === "purok") {
      list.sort((a, b) => (a.purok || "").localeCompare(b.purok || ""));
    } else if (sortKey === "household") {
      list.sort((a, b) => (a.household || "").localeCompare(b.household || ""));
    }

    return list;
  }, [
    residents,
    tab,
    searchTerm,
    selectedPurok,
    selectedGender,
    selectedMembership,
    sortKey,
  ]);

  useEffect(() => {
  if (!toast) return;

  const timer = setTimeout(() => setToast(null), 3000); // 3 seconds
  return () => clearTimeout(timer);
}, [toast]);


  const handleApproval = async (id, action, reason = "") => {
  try {
    // Get resident data before processing to send SMS
    const resident = residents.find((r) => r._id === id);
    if (!resident) {
      throw new Error("Resident not found");
    }

    const res = await fetch(`${API_URL}/api/residents/${id}/${action}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Action failed");

    // Send automated SMS message
    if (resident.phone) {
      try {
        let smsMessage = "";
        const residentName = `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || "Resident";
        
        if (action === "approve") {
          smsMessage = `Hello ${residentName}! Your registration to Barangay Victory has been APPROVED. You can now log in to your account and access the system. Welcome to Barangay Victory!`;
        } else if (action === "reject") {
          const reasonText = reason ? ` Reason: ${reason}` : "";
          smsMessage = `Hello ${residentName}! We regret to inform you that your registration to Barangay Victory has been REJECTED.${reasonText} Please contact the barangay office for more information. Thank you.`;
        }

        if (smsMessage) {
          const smsRes = await fetch(`${API_URL}/api/sms/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              announcementId: null,
              type: "Message",
              messageType: action === "approve" ? "Text" : "Alert",
              title: action === "approve" ? "Registration Approved" : "Registration Rejected",
              message: smsMessage,
              audience: "Individual",
              recipient: residentName,
              recipientId: resident._id,
              recipientPhone: resident.phone,
            }),
          });

          if (smsRes.ok) {
            const smsResult = await smsRes.json();
            const successCount = smsResult.results?.filter((r) => r.ok).length || 0;
            if (successCount > 0) {
              console.log(`✅ SMS sent successfully to ${residentName}`);
            } else {
              console.warn(`⚠️ SMS sending failed for ${residentName}`);
            }
          }
        }
      } catch (smsErr) {
        // Don't fail the approval/rejection if SMS fails
        console.error("Error sending SMS:", smsErr);
      }
    }

    if (action === "reject") {
      await fetch(`${API_URL}/api/residents/${id}`, { method: "DELETE" });
      setResidents((prev) => prev.filter((r) => r._id !== id));
      setToast({ 
        message: `Resident rejected successfully. SMS notification sent.`, 
        type: "error", 
        action: "reject" 
      });
    } else if (action === "approve") {
      setResidents((prev) =>
        prev.map((r) => (r._id === id ? data.resident : r))
      );
      setToast({ 
        message: `Resident approved successfully. SMS notification sent.`, 
        type: "success", 
        action: "approve" 
      });
    }
  } catch (err) {
    console.error("Approval error:", err);
    setToast({ message: "Failed to update resident status.", type: "error" });
  }
};


  // ✅ Delete
  const confirmDelete = async () => {
    try {
      await fetch(`${API_URL}/api/residents/${residentToDelete._id}`, {
        method: "DELETE",
      });
      setResidents((prev) =>
        prev.filter((r) => r._id !== residentToDelete._id)
      );
      setToast({ message: "Resident deleted.", type: "error" });
    } catch (err) {
      setToast({ message: "Failed to delete resident.", type: "error" });
    } finally {
      setResidentToDelete(null);
    }
    
  };

  const handlePrintOption = () => {
  const filteredList = filtered;

  if (!filteredList.length) {
    alert("No residents found for the selected filters.");
    return;
  }

  const listHTML = filteredList
    .map(
      (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}</td>
          <td>${r.age || "—"}</td>
          <td>${r.gender || "—"}</td>
          <td>${r.phone || "—"}</td>
          <td>${r.purok || "—"}</td>
          <td>${r.civilStatus || "—"}</td>
          <td>${r.nationality || "—"}</td>
          <td>${r.religion || "—"}</td>
          <td>${r.education || "—"}</td>
          <td>${r.occupation || "—"}</td>
          <td>${getMemberships(r)}</td>
        </tr>
      `
    )
    .join("");

  const win = window.open("", "_blank");
  const logoURL = window.location.origin + logo;

  win.document.write(`
  <html>
  <head>
    <title>Resident List - Barangay Victory</title>
    <style>
      body {
        font-family: 'Times New Roman', serif;
        margin: 40px;
        background: #fff;
        color: #000;
        position: relative;
      }

      body::before {
        content: "Barangay Victory";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-25deg);
        font-size: 90px;
        color: rgba(0,0,0,0.08);
        z-index: 0;
        pointer-events: none;
      }

      .report-container {
        border: 3px double #000;
        padding: 40px;
        border-radius: 8px;
        position: relative;
        z-index: 1;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
      }

      .header img {
        width: 100px;
        height: auto;
      }

      .header-center {
        text-align: center;
        flex: 1;
        line-height: 1.4;
      }

      .header-center h1 {
        font-size: 22px;
        font-weight: bold;
        margin: 0;
      }

      .header-center h2 {
        font-size: 20px;
        margin: 0;
      }

      .header-center h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .header-center p {
        margin: 5px 0;
        font-style: italic;
        font-size: 15px;
      }

      hr {
        border: none;
        border-top: 2px solid #000;
        margin: 10px 0 20px 0;
      }

      .certificate-number {
        text-align: right;
        font-size: 14px;
        font-style: italic;
        margin-bottom: 10px;
      }

      .description {
        text-align: center;
        font-size: 15px;
        margin-bottom: 25px;
        line-height: 1.7;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        margin-top: 10px;
      }

      th, td {
        border: 1px solid #000;
        padding: 8px 10px;
        text-align: left;
      }

      th {
        background: #f3f4f6;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      tr:nth-child(even) {
        background-color: #fafafa;
      }

      tr:hover {
        background-color: #f1f5f9;
      }

      .legal {
        margin-top: 25px;
        font-size: 13px;
        text-align: center;
        font-style: italic;
        color: #444;
      }

      .signature-section {
        margin-top: 60px;
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        text-align: center;
      }

      .signature-block {
        width: 45%;
      }

      .signature-line {
        margin-top: 60px;
        border-top: 1px solid #000;
        padding-top: 5px;
      }

      .signature-block p {
        margin: 5px 0;
      }

      .footer {
        margin-top: 50px;
        text-align: center;
        font-size: 13px;
        color: #333;
        border-top: 1px solid #000;
        padding-top: 5px;
      }

      @media print {
        body { margin: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="report-container">
      <div class="header">
        <img src="${logo}" alt="Barangay Logo Left" />
        <div class="header-center">
          <h1>Republic of the Philippines</h1>
          <h2>Province of Agusan del Norte</h2>
          <h3>Municipality of Tubay</h3>
          <h1><strong>Barangay Victory</strong></h1>
          <hr />
          <p><strong>Official Resident List Report</strong></p>
        </div>
        <img src="${logo1}" alt="Barangay Logo Right" />
      </div>

      <div class="certificate-number">
        Report No.: BV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}
      </div>

      <div class="description">
        <p>
          The following list represents the official residents registered under the jurisdiction of
          <strong>Barangay Victory</strong>, Municipality of Tubay, Province of Agusan del Norte.
          This report is generated for administrative, record-keeping, and verification purposes.
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Full Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>Purok</th>
            <th>Civil Status</th>
            <th>Nationality</th>
            <th>Religion</th>
            <th>Education</th>
            <th>Occupation</th>
            <th>Membership</th>
          </tr>
        </thead>
        <tbody>
          ${listHTML}
        </tbody>
      </table>

      <div class="legal">
        <p>This document is certified true and correct as per records of Barangay Victory, Tubay, Agusan del Norte.</p>
        <p>Unauthorized reproduction or falsification of this report is punishable under Philippine law.</p>
      </div>

      <!-- ✅ SIGNATURE SECTION -->
      <div class="signature-section">
        <div class="signature-block">
          <div class="signature-line"></div>
          <p><strong>Prepared by:</strong></p>
          <p><em>Barangay Secretary</em></p>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <p><strong>Approved by:</strong></p>
          <p><em>Hon. Barangay Captain</em></p>
        </div>
      </div>

      <div class="footer">
        <p>Barangay Victory, Municipality of Tubay, Province of Agusan del Norte, Philippines</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  </body>
</html>
`);

  win.document.close();
  win.print();
};

  
 const handleExportOption = (type) => {
  const exportList = filtered; // filtered list matches filters (purok, gender, etc.)

  if (!exportList.length) {
    alert("No residents found for the selected filters.");
    return;
  }

  const fields = ["fullname", "age", "gender", "purok", "membership"];
  const processedList = exportList.map(r => ({
    fullname: `${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.trim(),
    age: r.age || "",
    gender: r.gender || "",
    purok: r.purok || "",
    membership: getMemberships(r)
  }));

  if (type === "pdf") exportToPDF(processedList, fields, "Residents_Filtered");
   else if (type === "excel") exportToExcel(processedList, fields, "Residents_Filtered");
    else if (type === "csv") {
   const csvContent = [
    fields.join(","),
    ...processedList.map(r => fields.map(f => `"${r[f]}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Residents_Filtered.csv";
  link.click();
}

};

  const statusCounts = useMemo(
  () => ({
    All: residents.filter((r) => r.status !== "Rejected").length,
    Pending: residents.filter((r) => r.status === "Pending").length,
    Active: residents.filter((r) => r.status === "Active").length,
    Transferred: residents.filter((r) => r.status === "Transferred").length,
  }),
  [residents]
);


  const purokOptions = [...new Set(residents.map((r) => r.purok).filter(Boolean))];

  // Loading state with better UI
  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white px-4 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-cyan-400" aria-hidden />
        <p className="text-base font-medium text-slate-700 dark:text-slate-300">Loading residents…</p>
        <p className="text-center text-sm text-slate-500 dark:text-slate-500">Fetching the latest records</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 dark:border-slate-700 dark:bg-slate-800/30">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" aria-hidden />
        <p className="max-w-md text-center text-sm font-medium text-slate-800 dark:text-slate-200">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            loadResidents();
          }}
          className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          Retry
        </button>
      </div>
    );
  }

  


  return (
    <div className="relative min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100/80 print:bg-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 print:space-y-0 print:p-0 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 print:hidden lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Users className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Residents</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Review registrations, approve pending accounts, and keep barangay records current.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {statusCounts.All} total
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50">
              {statusCounts.Pending} pending
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50">
              {statusCounts.Active} active
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <UserPlus className="h-4 w-4" />
              Add resident
            </button>
            <div className="relative inline-block text-left" ref={exportRef}>
              <button
                type="button"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
              >
                <FileDown className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
              {showExportDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportOption("pdf");
                      setShowExportDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportOption("excel");
                      setShowExportDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportOption("csv");
                      setShowExportDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    Export CSV
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handlePrintOption}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 print:hidden">
          {["All", "Pending", "Active", "Transferred"].map((status) => {
            const active = tab === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setTab(status)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                    : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700/80"
                }`}
              >
                {status}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                    active
                      ? "bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900"
                      : status === "Pending"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                >
                  {statusCounts[status]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 print:hidden sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <input
            type="text"
            placeholder="Search name or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${FIELD_CLASS} min-w-0 sm:col-span-2 xl:col-span-2`}
          />
          <select value={selectedPurok} onChange={(e) => setSelectedPurok(e.target.value)} className={FIELD_CLASS}>
            <option value="">All puroks</option>
            {purokOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select value={selectedMembership} onChange={(e) => setSelectedMembership(e.target.value)} className={FIELD_CLASS}>
            <option value="">All membership</option>
            <option value="PWD">PWD</option>
            <option value="4Ps">4Ps</option>
            <option value="IPs">IPs</option>
            <option value="Senior Citizen">Senior Citizen</option>
          </select>
          <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className={FIELD_CLASS}>
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={FIELD_CLASS}>
            <option value="fullname">Sort A–Z</option>
            <option value="age">Sort by age</option>
            <option value="purok">Sort by purok</option>
            <option value="household">Sort by household</option>
          </select>
        </div>


        <AnimatePresence>
          {toast && (
            <motion.div
              key={String(toast.message)}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed left-1/2 top-6 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-lg ring-1 ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white ring-emerald-500/30"
                  : "bg-red-600 text-white ring-red-500/30"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span className="flex-1 text-left">{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg p-1 hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={printRef}
          className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
        >
          {tab === "Pending" && filtered.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3 print:hidden dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{filtered.length}</span>{" "}
                  pending registration{filtered.length !== 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setShowRejectAllConfirm(true)}
                  className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  Reject all
                </button>
              </div>
              {showRejectAllConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
                  <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reject all pending</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Reject all {filtered.length} pending registration{filtered.length !== 1 ? "s" : ""}? This cannot be undone.
                    </p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className={LABEL_CLASS}>Reason for rejection *</label>
                        <select
                          value={rejectAllReason}
                          onChange={(e) => {
                            setRejectAllReason(e.target.value);
                            if (e.target.value !== "Other") setCustomRejectAllReason("");
                          }}
                          className={FIELD_CLASS}
                        >
                          <option value="">Select a reason</option>
                          <option value="No valid ID">No valid ID</option>
                          <option value="Invalid ID">Invalid ID</option>
                          <option value="ID does not match personal information">
                            ID does not match personal information
                          </option>
                          <option value="Incomplete information">Incomplete information</option>
                          <option value="Invalid phone number">Invalid phone number</option>
                          <option value="Duplicate registration">Duplicate registration</option>
                          <option value="Other">Other (specify below)</option>
                        </select>
                      </div>
                      {rejectAllReason === "Other" && (
                        <div>
                          <label className={LABEL_CLASS}>Custom reason *</label>
                          <textarea
                            value={customRejectAllReason}
                            onChange={(e) => setCustomRejectAllReason(e.target.value)}
                            placeholder="Specify the reason…"
                            rows={3}
                            className={`${FIELD_CLASS} min-h-[5rem] resize-y py-3`}
                          />
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectAllConfirm(false);
                          setRejectAllReason("");
                          setCustomRejectAllReason("");
                        }}
                        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const finalReason =
                            rejectAllReason === "Other" ? customRejectAllReason.trim() : rejectAllReason;
                          if (!finalReason) {
                            setToast({ message: "Please provide a reason for rejection.", type: "error" });
                            return;
                          }
                          try {
                            for (const r of filtered) {
                              await handleApproval(r._id, "reject", finalReason);
                            }
                            setShowRejectAllConfirm(false);
                            setRejectAllReason("");
                            setCustomRejectAllReason("");
                            setToast({
                              message: "All pending residents have been rejected. SMS notifications sent.",
                              type: "success",
                            });
                          } catch (err) {
                            console.error("Failed to reject all:", err);
                            setToast({ message: "Failed to reject all pending residents.", type: "error" });
                          }
                        }}
                        className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                      >
                        Yes, reject all
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="border-b border-slate-200 bg-slate-50/95 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3.5">#</th>
                  <th className="px-3 py-3.5">Profile</th>
                  <th className="px-3 py-3.5">Name</th>
                  <th className="px-3 py-3.5">Age</th>
                  <th className="px-3 py-3.5">Gender</th>
                  <th className="px-3 py-3.5">Civil status</th>
                  <th className="px-3 py-3.5">Nationality</th>
                  <th className="px-3 py-3.5">Religion</th>
                  <th className="px-3 py-3.5">Purok</th>
                  <th className="px-3 py-3.5">Phone</th>
                  <th className="px-3 py-3.5">Education</th>
                  <th className="px-3 py-3.5">Occupation</th>
                  <th className="px-3 py-3.5">Membership</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5 text-right print:hidden">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No residents found</p>
                        <p className="max-w-sm text-sm">
                          {searchTerm || selectedPurok || selectedGender || selectedMembership
                            ? "Try adjusting your filters."
                            : "No residents have been registered yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => {
                    const fullName = `${r.lastName || ""}, ${r.firstName || ""} ${r.middleName || ""}`.trim();
                    return (
                      <tr
                        key={r._id || i}
                        className="transition hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                          {i + 1}
                        </td>
                        <td className="px-3 py-3">
                          {r.status === "Pending" ? (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              —
                            </div>
                          ) : r.profileImageBase64 ? (
                            <img
                              src={r.profileImageBase64}
                              alt=""
                              className="h-11 w-11 rounded-full border border-slate-200 object-cover dark:border-slate-600"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              —
                            </div>
                          )}
                        </td>
                        <td className="max-w-[200px] px-3 py-3 font-medium text-slate-900 dark:text-white">{fullName}</td>
                        <td className="whitespace-nowrap px-3 py-3">{r.age || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3">{r.gender || "—"}</td>
                        <td className="px-3 py-3">{r.civilStatus || "—"}</td>
                        <td className="px-3 py-3">{r.nationality || "—"}</td>
                        <td className="max-w-[120px] truncate px-3 py-3">{r.religion || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3">{r.purok || "—"}</td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums">{r.phone || "—"}</td>
                        <td className="max-w-[140px] truncate px-3 py-3">{r.education || "—"}</td>
                        <td className="max-w-[140px] truncate px-3 py-3">{r.occupation || "—"}</td>
                        <td className="max-w-[120px] truncate px-3 py-3 text-xs">{getMemberships(r)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                              r.status === "Active"
                                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : r.status === "Pending"
                                  ? "bg-amber-50 text-amber-900 ring-1 ring-amber-600/15 dark:bg-amber-950/40 dark:text-amber-200"
                                  : r.status === "Transferred"
                                    ? "bg-violet-50 text-violet-800 ring-1 ring-violet-600/15 dark:bg-violet-950/40 dark:text-violet-300"
                                    : "bg-red-50 text-red-800 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right print:hidden">
                          <div className="flex flex-wrap justify-end gap-1">
                            {r.status !== "Pending" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResident(r);
                                    setViewModalOpen(true);
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResident(r);
                                    setEditModalOpen(true);
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResidentToDelete(r)}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_URL}/api/residents/${r._id}`);
                                      if (res.ok) {
                                        const fullData = await res.json();
                                        setSelectedIDPhoto(fullData.idPhotoBase64 || null);
                                      } else {
                                        setSelectedIDPhoto(r.idPhotoBase64 || null);
                                      }
                                      setSelectedResident(r);
                                      setViewIDModal(true);
                                    } catch (err) {
                                      console.error("Error fetching ID photo:", err);
                                      setSelectedIDPhoto(r.idPhotoBase64 || null);
                                      setSelectedResident(r);
                                      setViewIDModal(true);
                                    }
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  View ID
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResident(r);
                                    setViewModalOpen(true);
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovalTarget(r);
                                    setApprovalAction("approve");
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovalTarget(r);
                                    setApprovalAction("reject");
                                  }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={viewIDModal}
          onClose={() => setViewIDModal(false)}
          title="Resident ID photo"
          size="lg"
        >
          {selectedIDPhoto ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={selectedIDPhoto}
                alt="Resident ID"
                className="h-auto w-full max-w-md rounded-xl border border-slate-200 shadow-md dark:border-slate-700"
              />
              <a
                href={selectedIDPhoto}
                download={`IDPhoto_${selectedResident?.firstName || "resident"}.png`}
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Download photo
              </a>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">No photo available.</p>
          )}
        </Modal>

        <Modal
          isOpen={smsModalOpen}
          onClose={() => {
            setSmsModalOpen(false);
            setSmsMessageText("");
            setSmsRecipient(null);
          }}
          title={
            smsRecipient
              ? `SMS — ${`${smsRecipient.firstName || ""} ${smsRecipient.lastName || ""}`.trim() || "Resident"}`
              : "Send SMS"
          }
          size="lg"
        >
          {smsRecipient && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Recipient</span>{" "}
                  {`${smsRecipient.firstName || ""} ${smsRecipient.lastName || ""}`.trim() || "Resident"}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Phone</span>{" "}
                  {smsRecipient.phone || "N/A"}
                </p>
              </div>
              <div>
                <label className={LABEL_CLASS}>Message</label>
                <textarea
                  value={smsMessageText}
                  onChange={(e) => setSmsMessageText(e.target.value)}
                  placeholder="Type your message…"
                  rows={6}
                  className={`${FIELD_CLASS} min-h-[8rem] resize-y py-3`}
                  disabled={smsSending}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{smsMessageText.length} characters</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSmsModalOpen(false);
                    setSmsMessageText("");
                    setSmsRecipient(null);
                  }}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                  disabled={smsSending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSMS}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={smsSending || !smsMessageText.trim()}
                >
                  {smsSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Send SMS
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={!!approvalAction && !!approvalTarget}
          onClose={() => {
            setApprovalAction(null);
            setApprovalTarget(null);
            setRejectionReason("");
            setCustomRejectionReason("");
          }}
          title={approvalAction === "approve" ? "Approve registration" : "Reject registration"}
        >
          {approvalTarget && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {approvalAction === "approve" ? "Approve" : "Reject"}{" "}
                <strong className="text-slate-900 dark:text-white">
                  {`${approvalTarget.firstName} ${approvalTarget.lastName}`}
                </strong>
                ?
              </p>
              {approvalAction === "reject" && (
                <div className="space-y-3">
                  <div>
                    <label className={LABEL_CLASS}>Reason for rejection *</label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (e.target.value !== "Other") setCustomRejectionReason("");
                      }}
                      className={FIELD_CLASS}
                    >
                      <option value="">Select a reason</option>
                      <option value="No valid ID">No valid ID</option>
                      <option value="Invalid ID">Invalid ID</option>
                      <option value="ID does not match personal information">
                        ID does not match personal information
                      </option>
                      <option value="Incomplete information">Incomplete information</option>
                      <option value="Invalid phone number">Invalid phone number</option>
                      <option value="Duplicate registration">Duplicate registration</option>
                      <option value="Other">Other (specify below)</option>
                    </select>
                  </div>
                  {rejectionReason === "Other" && (
                    <div>
                      <label className={LABEL_CLASS}>Custom reason *</label>
                      <textarea
                        value={customRejectionReason}
                        onChange={(e) => setCustomRejectionReason(e.target.value)}
                        placeholder="Specify the reason…"
                        rows={3}
                        className={`${FIELD_CLASS} min-h-[5rem] resize-y py-3`}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setApprovalAction(null);
                    setApprovalTarget(null);
                    setRejectionReason("");
                    setCustomRejectionReason("");
                  }}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (approvalAction === "reject") {
                      const finalReason =
                        rejectionReason === "Other" ? customRejectionReason.trim() : rejectionReason;
                      if (!finalReason) {
                        setToast({ message: "Please provide a reason for rejection.", type: "error" });
                        return;
                      }
                      await handleApproval(approvalTarget._id, approvalAction, finalReason);
                    } else {
                      await handleApproval(approvalTarget._id, approvalAction);
                    }
                    setApprovalAction(null);
                    setApprovalTarget(null);
                    setRejectionReason("");
                    setCustomRejectionReason("");
                  }}
                  className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition ${
                    approvalAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Yes, {approvalAction === "approve" ? "approve" : "reject"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={!!residentToDelete} onClose={() => setResidentToDelete(null)} title="Remove resident">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Permanently remove this resident from the list? This cannot be undone.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setResidentToDelete(null)}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </Modal>

        <ModalAddResident
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onResidentAdded={() => {
            loadResidents();
          }}
        />

        <ModalViewResident
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          resident={selectedResident}
        />
        <ModalEditResident
          isOpen={editModalOpen}
          residentData={selectedResident}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedResident(null);
          }}
          onSave={(updated) => {
            setResidents((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
            loadResidents();
          }}
        />
      </div>
    </div>
  );
}
