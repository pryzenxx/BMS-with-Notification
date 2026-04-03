import React, { useState, useEffect } from "react";
import { Settings, Upload, Database, FileText, Save, Loader2, Download, FileSpreadsheet } from "lucide-react";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";
const LABEL_CLASS =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const SECTION_CARD =
  "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50";
const FILE_INPUT_CLASS =
  "block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700";

const LOGO_SLOTS = [
  { key: "systemLogo", title: "System logo", desc: "Admin panel and system chrome." },
  { key: "landingPageLogo", title: "Landing page logo", desc: "Public site header." },
  { key: "splashLogo", title: "Splash logo", desc: "Loading / welcome screen." },
  { key: "iconLogo", title: "Favicon", desc: "Browser tab icon." },
];

const SettingPanel = () => {
  const [barangaySettings, setBarangaySettings] = useState({
    systemName: "Barangay Victory System",
    barangayName: "Barangay Victory",
  });
  const [logoPreviews, setLogoPreviews] = useState({
    systemLogo: null,
    landingPageLogo: null,
    splashLogo: null,
    iconLogo: null,
  });
  const [logoFiles, setLogoFiles] = useState({
    systemLogo: null,
    landingPageLogo: null,
    splashLogo: null,
    iconLogo: null,
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [adminAccount, setAdminAccount] = useState({
    id: "",
    phone: "",
    originalPhone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/settings`);
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setBarangaySettings({ 
          systemName: data.systemName || "Barangay Victory System",
          barangayName: data.barangayName || "Barangay Victory" 
        });
        setLogoPreviews({
          systemLogo: data.systemLogoBase64 || null,
          landingPageLogo: data.landingPageLogoBase64 || null,
          splashLogo: data.splashLogoBase64 || null,
          iconLogo: data.iconLogoBase64 || null,
        });

        // Initialize admin account details from stored user info
        try {
          const stored = localStorage.getItem("userInfo");
          const parsed = stored ? JSON.parse(stored) : null;
          const resident = parsed?.resident || {};
          setAdminAccount((prev) => ({
            ...prev,
            id: resident.id || resident._id || "",
            phone: resident.phone || "",
            originalPhone: resident.phone || "",
          }));
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setBarangaySettings((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (logoType) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setLogoFiles(prev => ({ ...prev, [logoType]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviews(prev => ({ ...prev, [logoType]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFavicon = (base64Image) => {
    if (!base64Image) return;
    
    // Find existing favicon link or create new one
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = base64Image;
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("systemName", barangaySettings.systemName);
      formData.append("barangayName", barangaySettings.barangayName);
      
      // Append logo files if they exist
      if (logoFiles.systemLogo) {
        formData.append("systemLogo", logoFiles.systemLogo);
      }
      if (logoFiles.landingPageLogo) {
        formData.append("landingPageLogo", logoFiles.landingPageLogo);
      }
      if (logoFiles.splashLogo) {
        formData.append("splashLogo", logoFiles.splashLogo);
      }
      if (logoFiles.iconLogo) {
        formData.append("iconLogo", logoFiles.iconLogo);
      }

      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const data = await res.json();
      setSuccessMessage("Settings saved successfully.");
      toast.success("Settings saved successfully!");
      
      // Update logo previews
      if (data.settings) {
        setLogoPreviews({
          systemLogo: data.settings.systemLogoBase64 || logoPreviews.systemLogo,
          landingPageLogo: data.settings.landingPageLogoBase64 || logoPreviews.landingPageLogo,
          splashLogo: data.settings.splashLogoBase64 || logoPreviews.splashLogo,
          iconLogo: data.settings.iconLogoBase64 || logoPreviews.iconLogo,
        });

        // Update favicon if icon logo was changed
        if (data.settings.iconLogoBase64) {
          updateFavicon(data.settings.iconLogoBase64);
        }

        // Update page title
        if (data.settings.systemName) {
          document.title = data.settings.systemName;
        }
      }
      
      // Dispatch event to update logo in Landingpage
      window.dispatchEvent(new CustomEvent("settingsUpdated", { 
        detail: { 
          systemName: data.settings?.systemName,
          barangayName: data.settings?.barangayName,
          systemLogoBase64: data.settings?.systemLogoBase64,
          landingPageLogoBase64: data.settings?.landingPageLogoBase64,
          splashLogoBase64: data.settings?.splashLogoBase64,
          iconLogoBase64: data.settings?.iconLogoBase64,
          logoBase64: data.settings?.logoBase64 
        } 
      }));

      setTimeout(() => setSuccessMessage(""), 3000);
      setLogoFiles({
        systemLogo: null,
        landingPageLogo: null,
        splashLogo: null,
        iconLogo: null,
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const exportBackupToExcel = (backupData) => {
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date(backupData.timestamp).toLocaleString();

    // Create sheets for each data type
    if (backupData.residents && backupData.residents.length > 0) {
      const residentsData = backupData.residents.map(r => ({
        "First Name": r.firstName || "",
        "Middle Name": r.middleName || "",
        "Last Name": r.lastName || "",
        "Full Name": r.fullName || "",
        "Phone": r.phone || "",
        "Age": r.age || "",
        "Gender": r.gender || "",
        "Civil Status": r.civilStatus || "",
        "Address": r.address || "",
        "Purok": r.purok || "",
        "Household": r.householdNumber || "",
        "Education": r.education || "",
        "Occupation": r.occupation || "",
        "Status": r.status || "",
        "Registered": r.dateVerified ? new Date(r.dateVerified).toLocaleDateString() : ""
      }));
      const ws = XLSX.utils.json_to_sheet(residentsData);
      XLSX.utils.book_append_sheet(workbook, ws, "Residents");
    }

    if (backupData.officials && backupData.officials.length > 0) {
      const officialsData = backupData.officials.map(o => ({
        "Name": o.name || "",
        "Position": o.position || "",
        "Age": o.age || "",
        "Contact": o.contact || "",
        "Gender": o.gender || "",
        "Address": o.address || "",
        "Status": o.status || "",
        "Start Term": o.startTerm ? new Date(o.startTerm).toLocaleDateString() : "",
        "End Term": o.endTerm ? new Date(o.endTerm).toLocaleDateString() : ""
      }));
      const ws = XLSX.utils.json_to_sheet(officialsData);
      XLSX.utils.book_append_sheet(workbook, ws, "Officials");
    }

    if (backupData.documentRequests && backupData.documentRequests.length > 0) {
      const docsData = backupData.documentRequests.map(d => ({
        "Document Type": d.documentType || "",
        "Purpose": d.purpose || "",
        "Quantity": d.quantity || "",
        "Price": d.price || "",
        "Status": d.status || "",
        "Payment Method": d.paymentMethod || "",
        "Requested Date": d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""
      }));
      const ws = XLSX.utils.json_to_sheet(docsData);
      XLSX.utils.book_append_sheet(workbook, ws, "Document Requests");
    }

    if (backupData.announcements && backupData.announcements.length > 0) {
      const announcementsData = backupData.announcements.map(a => ({
        "Title": a.title || "",
        "Type": a.type || "",
        "Message": a.message || "",
        "Audience": a.audience || "",
        "Created Date": a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""
      }));
      const ws = XLSX.utils.json_to_sheet(announcementsData);
      XLSX.utils.book_append_sheet(workbook, ws, "Announcements");
    }

    if (backupData.puroks && backupData.puroks.length > 0) {
      const puroksData = backupData.puroks.map(p => ({
        "Purok Name": p.name || "",
        "Description": p.description || ""
      }));
      const ws = XLSX.utils.json_to_sheet(puroksData);
      XLSX.utils.book_append_sheet(workbook, ws, "Puroks");
    }

    // Summary sheet
    const summaryData = [
      ["Backup Information"],
      ["Generated At", timestamp],
      ["Total Residents", backupData.residents?.length || 0],
      ["Total Officials", backupData.officials?.length || 0],
      ["Total Document Requests", backupData.documentRequests?.length || 0],
      ["Total Announcements", backupData.announcements?.length || 0],
      ["Total Puroks", backupData.puroks?.length || 0]
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary");

    const filename = `backup-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportBackupToPDF = (backupData) => {
    const doc = new jsPDF();
    const timestamp = new Date(backupData.timestamp).toLocaleString();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text("Data Backup Report", 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${timestamp}`, 14, yPos);
    yPos += 15;

    // Summary
    doc.setFontSize(14);
    doc.text("Summary", 14, yPos);
    yPos += 8;

    const summaryData = [
      ["Category", "Count"],
      ["Residents", backupData.residents?.length || 0],
      ["Officials", backupData.officials?.length || 0],
      ["Document Requests", backupData.documentRequests?.length || 0],
      ["Announcements", backupData.announcements?.length || 0],
      ["Puroks", backupData.puroks?.length || 0]
    ];
    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPos,
      theme: "grid"
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Residents
    if (backupData.residents && backupData.residents.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Residents", 14, 20);
      const residentsData = backupData.residents.slice(0, 50).map(r => [
        r.fullName || `${r.firstName} ${r.lastName}`,
        r.phone || "",
        r.age || "",
        r.gender || "",
        r.status || ""
      ]);
      autoTable(doc, {
        head: [["Name", "Phone", "Age", "Gender", "Status"]],
        body: residentsData,
        startY: 30,
        theme: "grid"
      });
      if (backupData.residents.length > 50) {
        doc.text(`Showing first 50 of ${backupData.residents.length} residents`, 14, doc.lastAutoTable.finalY + 10);
      }
    }

    // Officials
    if (backupData.officials && backupData.officials.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Officials", 14, 20);
      const officialsData = backupData.officials.map(o => [
        o.name || "",
        o.position || "",
        o.contact || "",
        o.status || ""
      ]);
      autoTable(doc, {
        head: [["Name", "Position", "Contact", "Status"]],
        body: officialsData,
        startY: 30,
        theme: "grid"
      });
    }

    doc.save(`backup-${Date.now()}.pdf`);
  };

  const triggerBackup = async (format = "excel") => {
    try {
      setBackupLoading(true);
      const res = await fetch(`${API_BASE}/backup`);
      if (!res.ok) throw new Error("Failed to create backup");

      const backupData = await res.json();

      if (format === "excel") {
        exportBackupToExcel(backupData);
        toast.success("Backup exported to Excel successfully!");
      } else {
        exportBackupToPDF(backupData);
        toast.success("Backup exported to PDF successfully!");
      }
    } catch (err) {
      console.error("Error creating backup:", err);
      toast.error("Failed to create backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const exportReportToExcel = (reportData) => {
    const workbook = XLSX.utils.book_new();
    const timestamp = new Date(reportData.generatedAt).toLocaleString();

    // Summary Sheet
    const summaryData = [
      ["System Report"],
      ["Barangay Name", reportData.barangayName || "Barangay Victory"],
      ["Generated At", timestamp],
      [""],
      ["Summary Statistics"],
      ["Category", "Count"],
      ["Total Active Residents", reportData.summary?.totalResidents || 0],
      ["Pending Residents", reportData.summary?.pendingResidents || 0],
      ["Rejected Residents", reportData.summary?.rejectedResidents || 0],
      ["Active Officials", reportData.summary?.activeOfficials || 0],
      ["Old Officials", reportData.summary?.oldOfficials || 0],
      ["Total Document Requests", reportData.summary?.totalDocumentRequests || 0],
      ["Pending Documents", reportData.summary?.pendingDocuments || 0],
      ["Approved Documents", reportData.summary?.approvedDocuments || 0],
      ["Printed Documents", reportData.summary?.printedDocuments || 0],
      [""],
      ["Demographics"],
      ["Category", "Count"],
      ["Male Residents", reportData.demographics?.male || 0],
      ["Female Residents", reportData.demographics?.female || 0],
      ["Senior Citizens", reportData.demographics?.seniorCitizens || 0],
      ["PWD Members", reportData.demographics?.pwdMembers || 0],
      ["4Ps Members", reportData.demographics?.member4ps || 0],
      [""],
      ["Financial Summary"],
      ["Category", "Amount"],
      ["Total Transactions", reportData.financial?.totalTransactions || 0],
      ["Total Revenue", `₱${(reportData.financial?.totalRevenue || 0).toFixed(2)}`]
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, "Summary");

    const filename = `report-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportReportToPDF = (reportData) => {
    const doc = new jsPDF();
    const timestamp = new Date(reportData.generatedAt).toLocaleString();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.text("System Report", 14, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.text(reportData.barangayName || "Barangay Victory", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Generated: ${timestamp}`, 14, yPos);
    yPos += 15;

    // Summary Statistics
    doc.setFontSize(14);
    doc.text("Summary Statistics", 14, yPos);
    yPos += 8;

    const summaryData = [
      ["Category", "Count"],
      ["Total Active Residents", reportData.summary?.totalResidents || 0],
      ["Pending Residents", reportData.summary?.pendingResidents || 0],
      ["Rejected Residents", reportData.summary?.rejectedResidents || 0],
      ["Active Officials", reportData.summary?.activeOfficials || 0],
      ["Old Officials", reportData.summary?.oldOfficials || 0],
      ["Total Document Requests", reportData.summary?.totalDocumentRequests || 0],
      ["Pending Documents", reportData.summary?.pendingDocuments || 0],
      ["Approved Documents", reportData.summary?.approvedDocuments || 0],
      ["Printed Documents", reportData.summary?.printedDocuments || 0]
    ];
    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPos,
      theme: "grid"
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Demographics
    doc.setFontSize(14);
    doc.text("Demographics", 14, yPos);
    yPos += 8;

    const demographicsData = [
      ["Category", "Count"],
      ["Male Residents", reportData.demographics?.male || 0],
      ["Female Residents", reportData.demographics?.female || 0],
      ["Senior Citizens", reportData.demographics?.seniorCitizens || 0],
      ["PWD Members", reportData.demographics?.pwdMembers || 0],
      ["4Ps Members", reportData.demographics?.member4ps || 0]
    ];
    autoTable(doc, {
      head: [demographicsData[0]],
      body: demographicsData.slice(1),
      startY: yPos,
      theme: "grid"
    });
    yPos = doc.lastAutoTable.finalY + 15;

    // Financial Summary
    doc.setFontSize(14);
    doc.text("Financial Summary", 14, yPos);
    yPos += 8;

    const financialData = [
      ["Category", "Amount"],
      ["Total Transactions", reportData.financial?.totalTransactions || 0],
      ["Total Revenue", `₱${(reportData.financial?.totalRevenue || 0).toFixed(2)}`]
    ];
    autoTable(doc, {
      head: [financialData[0]],
      body: financialData.slice(1),
      startY: yPos,
      theme: "grid"
    });

    doc.save(`report-${Date.now()}.pdf`);
  };

  const saveAdminAccount = async () => {
    const payload = {};

    // Validate and prepare phone
    const phoneSanitized = String(adminAccount.phone || "").replace(/\D/g, "").slice(0, 11);
    if (phoneSanitized) {
      payload.phone = phoneSanitized;
    }

    // Validate and prepare password
    const hasPassword =
      adminAccount.newPassword && adminAccount.confirmPassword;
    if (hasPassword) {
      if (!adminAccount.currentPassword) {
        toast.error("Please enter your current password.");
        return;
      }
      if (adminAccount.newPassword !== adminAccount.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (adminAccount.newPassword.length < 8 || !/[0-9]/.test(adminAccount.newPassword) || !/[a-zA-Z]/.test(adminAccount.newPassword)) {
        toast.error("Password must be at least 8 chars with letters and numbers.");
        return;
      }
      payload.password = adminAccount.newPassword;
    }

    if (!payload.phone && !payload.password) {
      toast.error("Nothing to update.");
      return;
    }

    try {
      setAccountSaving(true);

      // Ensure we have an id; if missing (e.g., admin shortcut login), try to resolve via residents list
      let targetId = adminAccount.id;
      if (!targetId) {
        try {
          const resResidents = await fetch(`${API_BASE}/residents`);
          if (resResidents.ok) {
            const list = await resResidents.json();
            // Prefer match by originalPhone, then stored user phone, then current phone
            const stored = localStorage.getItem("userInfo");
            let storedPhone = "";
            try {
              const parsed = stored ? JSON.parse(stored) : null;
              storedPhone = parsed?.resident?.phone || "";
            } catch {}

            const candidates = [
              String(adminAccount.originalPhone || "").replace(/\D/g, ""),
              String(storedPhone || "").replace(/\D/g, ""),
              String(adminAccount.phone || "").replace(/\D/g, ""),
            ].filter(Boolean);

            const normalize = (p) => String(p || "").replace(/\D/g, "");
            const match = list.find(
              (r) => candidates.includes(normalize(r.phone)) || r.role === "admin"
            );
            if (match && (match._id || match.id)) {
              targetId = match._id || match.id;
              setAdminAccount((prev) => ({ ...prev, id: targetId }));
            }
          }
        } catch {
          // ignore resolution errors; will handle missing id below
        }
      }

      if (!targetId) {
        throw new Error("Admin account not found. Please sign in again.");
      }

      // If password will be changed, verify current password first via login
      if (payload.password) {
        // Use stored phone from localStorage for verification to avoid mismatch during phone edit
        let authPhone =
          adminAccount.originalPhone ||
          (() => {
            try {
              const stored = localStorage.getItem("userInfo");
              const parsed = stored ? JSON.parse(stored) : null;
              return parsed?.resident?.phone || "";
            } catch {
              return "";
            }
          })() ||
          adminAccount.phone;

        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: authPhone,
            password: adminAccount.currentPassword,
          }),
        });
        if (!loginRes.ok) {
          const errBody = await loginRes.json().catch(() => ({}));
          throw new Error(errBody.message || "Current password is incorrect.");
        }
      }

      // If phone is being changed, ensure it's 11 digits
      const isPhoneEdited = (adminAccount.originalPhone ?? "") !== (adminAccount.phone ?? "");
      if (isPhoneEdited && phoneDigits.length !== 11) {
        throw new Error("Please enter a valid 11-digit phone number.");
      }

      const res = await fetch(`${API_BASE}/residents/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to update account");
      }

      // Update local storage user info phone if present
      try {
        const stored = localStorage.getItem("userInfo");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.resident) {
            if (payload.phone) parsed.resident.phone = payload.phone;
            localStorage.setItem("userInfo", JSON.stringify(parsed));
            localStorage.setItem("user", JSON.stringify(parsed.resident));
          }
        }
      } catch (e) {
        // ignore storage errors
      }

      // Reset password fields after success
      setAdminAccount((prev) => ({
        ...prev,
        phone: payload.phone || prev.phone,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast.success("Account updated successfully.");
    } catch (err) {
      console.error("Error updating admin account:", err);
      toast.error(err.message || "Failed to update account");
    } finally {
      setAccountSaving(false);
    }
  };

  const generateReport = async (format = "excel") => {
    try {
      setReportLoading(true);
      const res = await fetch(`${API_BASE}/reports`);
      if (!res.ok) throw new Error("Failed to generate report");

      const reportData = await res.json();

      if (format === "excel") {
        exportReportToExcel(reportData);
        toast.success("Report exported to Excel successfully!");
      } else {
        exportReportToPDF(reportData);
        toast.success("Report exported to PDF successfully!");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error("Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  // Derived validation state for Save Account button
  const isChangingPassword =
    !!(adminAccount.currentPassword || adminAccount.newPassword || adminAccount.confirmPassword);
  const passwordMeetsRules =
    !!adminAccount.currentPassword &&
    !!adminAccount.newPassword &&
    !!adminAccount.confirmPassword &&
    adminAccount.newPassword === adminAccount.confirmPassword &&
    adminAccount.newPassword.length >= 8 &&
    /[0-9]/.test(adminAccount.newPassword) &&
    /[a-zA-Z]/.test(adminAccount.newPassword);
  const phoneDigits = String(adminAccount.phone || "").replace(/\D/g, "");
  const phoneChanged = (adminAccount.originalPhone ?? "") !== (adminAccount.phone ?? "");
  const phoneValid = !phoneChanged || phoneDigits.length === 11;
  const canSaveAccount = (!isChangingPassword || passwordMeetsRules) && phoneValid;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-8 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Settings className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Settings</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Branding, logos, data backup, and system reports.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {successMessage && (
        <div
          className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={SECTION_CARD}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            System information
          </p>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Names and title</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="settings-system-name" className={LABEL_CLASS}>
                System name
              </label>
              <input
                id="settings-system-name"
                name="systemName"
                value={barangaySettings.systemName}
                onChange={handleChange}
                className={FIELD_CLASS}
                placeholder="e.g. Barangay Victory System"
              />
            </div>
            <div>
              <label htmlFor="settings-barangay-name" className={LABEL_CLASS}>
                Barangay name
              </label>
              <input
                id="settings-barangay-name"
                name="barangayName"
                value={barangaySettings.barangayName}
                onChange={handleChange}
                className={FIELD_CLASS}
                placeholder="e.g. Barangay Victory"
              />
            </div>
          </div>
        </section>

        <section className={SECTION_CARD}>
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <Phone className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Admin account</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Update admin phone number and password.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="admin-phone" className={LABEL_CLASS}>Phone number</label>
              <input
                id="admin-phone"
                inputMode="numeric"
                value={adminAccount.phone}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setAdminAccount((prev) => ({ ...prev, phone: sanitized }));
                }}
                className={FIELD_CLASS}
                placeholder="e.g. 09123456789"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="admin-new-password" className={LABEL_CLASS}>New password</label>
                <div className="relative">
                  <input
                    id="admin-new-password"
                    type={showNew ? "text" : "password"}
                    value={adminAccount.newPassword}
                    onChange={(e) => setAdminAccount((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className={FIELD_CLASS}
                    placeholder="At least 8 characters"
                  />
                  {/* Right-side lock and eye toggle */}
                  <Lock className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="admin-confirm-password" className={LABEL_CLASS}>Confirm password</label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={adminAccount.confirmPassword}
                    onChange={(e) => setAdminAccount((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className={FIELD_CLASS}
                    placeholder="Re-enter new password"
                  />
                  {/* Right-side lock and eye toggle */}
                  <Lock className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="admin-current-password" className={LABEL_CLASS}>Current password (required to change)</label>
              <div className="relative">
                <input
                  id="admin-current-password"
                  type={showCurrent ? "text" : "password"}
                  value={adminAccount.currentPassword}
                  onChange={(e) => setAdminAccount((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className={FIELD_CLASS}
                  placeholder="Enter current password to confirm change"
                />
                {/* Right-side lock and eye toggle */}
                <Lock className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={saveAdminAccount}
                disabled={accountSaving || !canSaveAccount}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {accountSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {accountSaving ? "Saving…" : "Save account"}
              </button>
            </div>
          </div>
        </section>

        {LOGO_SLOTS.map(({ key, title, desc }) => (
          <section key={key} className={`${SECTION_CARD} flex flex-col`}>
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <Upload className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange(key)}
              className={`${FILE_INPUT_CLASS} mb-4`}
            />
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">PNG or JPG, max 5MB.</p>
            <div className="flex justify-center">
              {logoPreviews[key] ? (
                <img
                  src={logoPreviews[key]}
                  alt={`${title} preview`}
                  className="h-28 w-28 rounded-2xl border border-slate-200/80 object-cover shadow-sm dark:border-slate-700"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50 text-xs font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-500">
                  No image
                </div>
              )}
            </div>
          </section>
        ))}

        <section className={SECTION_CARD}>
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <Database className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data backup</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Export residents, officials, document requests, announcements, and puroks.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => triggerBackup("excel")}
              disabled={backupLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {backupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {backupLoading ? "Working…" : "Excel"}
            </button>
            <button
              type="button"
              onClick={() => triggerBackup("pdf")}
              disabled={backupLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {backupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {backupLoading ? "Working…" : "PDF"}
            </button>
          </div>
        </section>

        <section className={SECTION_CARD}>
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <Download className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reports</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Summary statistics, demographics, and financial totals.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => generateReport("excel")}
              disabled={reportLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {reportLoading ? "Working…" : "Excel"}
            </button>
            <button
              type="button"
              onClick={() => generateReport("pdf")}
              disabled={reportLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {reportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {reportLoading ? "Working…" : "PDF"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingPanel;
