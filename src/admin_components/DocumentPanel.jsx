
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  List,
  Send,
  Loader2,
  FileDown,
  Download,
  RefreshCw,
  X,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";

import { API_BASE } from "../utils/apiBase";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80";

const DocumentPanel = () => {
  const [adminForm, setAdminForm] = useState({ type: "Residency Certificate", name: "", purpose: "" });
  const [generatedDocs, setGeneratedDocs] = useState(() => {
    const stored = localStorage.getItem("generatedDocs");
    return stored ? JSON.parse(stored) : [];
  });
  const [documentRequests, setDocumentRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [releaseHistoryModal, setReleaseHistoryModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState(null);
  const [showGeneratedReprint, setShowGeneratedReprint] = useState(false);

   const [residents, setResidents] = useState([]);
   const [filteredName, setFilteredName] = useState("");

 // Fetch residents
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const res = await fetch(`${API_BASE}/residents`);
        const data = await res.json();
        const formatted = data.map((r) => ({
          ...r,
          name: `${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.trim(),
        }));
        formatted.sort((a, b) => a.name.localeCompare(b.name));
        setResidents(formatted);
      } catch (err) {
        console.error("Error fetching residents:", err);
      }
    };
    fetchResidents();
  }, []);

  const fetchDocumentRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const res = await fetch(`${API_BASE}/document-requests`);
      if (!res.ok) throw new Error("Failed to load document requests");
      const data = await res.json();
      const formatted = Array.isArray(data)
        ? data.map((req) => ({
            ...req,
            messages: req.messages || [],
            // Ensure resident ID is accessible
            residentId: req.resident?._id || req.resident || req.residentId,
          }))
        : [];
      setDocumentRequests(formatted);
    } catch (err) {
      console.error("Error fetching document requests:", err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentRequests();
  }, [fetchDocumentRequests]);

 const handleNameChange = (e) => {
  const value = e.target.value;
  setAdminForm({ ...adminForm, name: value });
  setFilteredName(value);

  const matchedResident = residents.find(
    (r) => r.name && r.name.toLowerCase() === value.toLowerCase()
  );

  if (matchedResident) {
    setAdminForm((prev) => ({
      ...prev,
      name: matchedResident.name,
      age: matchedResident.age || "", 
    gender: matchedResident.gender || "", 
    civilStatus: matchedResident.civilStatus || "", 
    purok: matchedResident.purok || "",
    }));
  }
};

  const filteredResidents = residents.filter(
    (r) => r.name && r.name.toLowerCase().includes(filteredName.toLowerCase())
  );
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const updateRequestLocally = (updated) => {
    if (!updated) return;
    setDocumentRequests((prev) =>
      prev.map((req) =>
        req._id === updated._id
          ? { ...req, ...updated, messages: updated.messages || req.messages || [] }
          : req
      )
    );
  };

  const handleRequestStatusChange = async (request, status, extraPayload = {}) => {
    try {
      const res = await fetch(`${API_BASE}/document-requests/${request._id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extraPayload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update request status.");
      updateRequestLocally(data.request);
      showToast(
        status === "Printed"
          ? "Request marked as Printed"
          : status === "Approved"
          ? "Request approved"
          : "Request updated"
      );
    } catch (err) {
      console.error("Update request status error:", err);
      showToast("Failed to update request status");
    }
  };

  const handleApproveRequest = (request) => handleRequestStatusChange(request, "Approved");

  const handleReleaseAndPrint = (request) => handlePrintRequest(request);


  const handleGenerateAdminDoc = (e) => {
  e.preventDefault();

  // Find the selected resident's full data
  const selectedResident = residents.find(
    (r) => r.name.toLowerCase() === adminForm.name.toLowerCase()
  );

  if (!selectedResident || !documentTemplates[adminForm.type] || !adminForm.name || !adminForm.purpose) return;

  // Fill in the template with resident details
  const content = documentTemplates[adminForm.type]
    .replace("{name}", selectedResident.name)
    .replace("{age}", selectedResident.age || "N/A")
    .replace("{gender}", selectedResident.gender || "N/A")
    .replace("{civilStatus}", selectedResident.civilStatus || "N/A")
    .replace("{purok}", selectedResident.purok || "N/A")
    .replace("{purpose}", adminForm.purpose);

  const newDoc = {
    id: Date.now(),
    type: adminForm.type,
    name: selectedResident.name,
    purpose: adminForm.purpose,
    content,
    createdAt: new Date().toLocaleString()
  };

  const updatedDocs = [newDoc, ...generatedDocs];
  setGeneratedDocs(updatedDocs);
  localStorage.setItem("generatedDocs", JSON.stringify(updatedDocs));

  // Reset form and set last generated doc
  setAdminForm({ ...adminForm, name: "", purpose: "" });
  setFilteredName("");
  setLastGeneratedDoc(newDoc);

  showToast("Document Generated Successfully");
};


  const documentTemplates = {
  "Residency Certificate": `TO WHOM IT MAY CONCERN:

This is to certify that {name}, of legal age, is a bona fide resident of Barangay Victory. {name} resides in  {purok} and is recognized as a responsible and active member of the community.

The above-named individual is {age} years old, {gender}, and currently {civilStatus}. This certification is issued upon request for {purpose}.

This document serves as official proof of residency and may be presented for all lawful purposes. It bears the official seal of Barangay Victory and is issued under the authority of the Barangay Captain.`,

  "Indigency Certificate": `TO WHOM IT MAY CONCERN:

This is to certify that {name}, residing in  {purok}, is considered an indigent resident of Barangay Victory and is eligible for government or private assistance programs.

The individual is {age} years old, {gender}, and currently {civilStatus}. This certification is issued upon request for {purpose}.

This certificate is provided to ensure proper identification and verification for the purpose of availing social services, aid, or other forms of support.`,

  "Barangay Clearance": `TO WHOM IT MAY CONCERN:

This is to certify that {name}, residing in  {purok}, has no derogatory record in Barangay Victory. The individual is {age} years old, {gender}, and currently {civilStatus}.

This clearance is issued for {purpose} and is valid solely for the legal purpose intended by the requesting institution.

Issued with the authority and authentication of Barangay Victory.`,

  "Business Permit": `TO WHOM IT MAY CONCERN:

This is to certify that {name}, residing in  {purok}, has applied for a Barangay Business Permit to operate a business within Barangay Victory.

The individual is {age} years old, {gender}, and currently {civilStatus}. The business application has been duly reviewed and processed.

Purpose of issuance: {purpose}. This certificate affirms compliance with local business regulations and is issued under the Barangay Captain’s authority.`,

  "Certificate of Good Moral Character": `TO WHOM IT MAY CONCERN:

This certifies that {name}, of  {purok}, is known for good moral character, law-abiding conduct, and respect for community rules in Barangay Victory.

The individual is {age} years old, {gender}, and currently {civilStatus}. This certificate is issued for {purpose} and may be used as reference for academic, employment, or legal purposes.

Issued with the approval and authentication of Barangay Victory.`,

  "Certificate of Employment": `TO WHOM IT MAY CONCERN:

This is to certify that {name}, residing in  {purok}, is employed within the jurisdiction of Barangay Victory.

The individual is {age} years old, {gender}, and currently {civilStatus}. This certification is issued for {purpose} and serves as proof of employment for official and legal purposes.

Issued by the Barangay Victory office under the authority of the Barangay Captain.`,

  "Solo Parent Certificate": `TO WHOM IT MAY CONCERN:

This is to certify that {name}, residing in  {purok}, is recognized as a solo parent residing in Barangay Victory.

The individual is {age} years old, {gender}, and currently {civilStatus}. This document is issued for {purpose} and may be used to access benefits, programs, or assistance provided to solo parents by the government or private institutions.

Issued under the official authority of Barangay Victory.`,

  "First Time Jobseeker Assistance": `TO WHOM IT MAY CONCERN:

This certifies that {name}, of  {purok}, is a first-time jobseeker in accordance with Republic Act 11261.

The individual is {age} years old, {gender}, and currently {civilStatus}. This certificate is issued for {purpose} and may be used to access government or private job placement programs designed for first-time jobseekers.

Issued by the Barangay Victory office for proper identification, verification, and employment facilitation purposes.`,

  "Barangay ID": `TO WHOM IT MAY CONCERN:

This certifies that {name}, residing in  {purok}, is a registered resident of Barangay Victory and is entitled to a Barangay ID.

The individual is {age} years old, {gender}, and currently {civilStatus}. This ID may be used for official transactions, government programs, and other legal purposes.

Issued by the Barangay Victory office and is valid until revoked, updated, or reissued as necessary.`
};


const handlePrintDoc = (doc, options = {}) => {
  const { isGeneratedDoc = false } = options;
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    if (isGeneratedDoc) {
      setShowGeneratedReprint(true);
      showToast("Unable to open print window. Allow pop-ups, then use Reprint.");
    } else {
      showToast("Unable to open print window. Please allow pop-ups.");
    }
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${doc.type}</title>
        <style>
          body {
            font-family: "Times New Roman", serif;
            margin: 50px 70px;
            color: #000;
            position: relative;
          }

          /* Text Watermark */
          .watermark-text {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            color: rgba(0,0,0,0.05);
            font-weight: bold;
            z-index: -1;
            white-space: nowrap;
          }

          /* Header */
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 4px double #000;
            padding-bottom: 10px;
          }

          .header-logos img {
            width: 90px;
            height: 90px;
          }

          .header-text {
            text-align: center;
            flex: 1;
          }

          .header-text h1 {
            margin: 0;
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
          }

          .header-text h2 {
            margin: 2px 0;
            font-size: 18px;
            font-weight: bold;
          }

          .header-text h3 {
            margin: 5px 0 20px 0;
            font-size: 20px;
            font-weight: bold;
            text-decoration: underline;
          }

          /* Document Body */
          .doc-content {
            margin-top: 30px;
            font-size: 16px;
            text-align: justify;
          }

          /* Signature */
          .signature-section {
            margin-top: 80px;
            text-align: right;
          }

          .sig-line {
            width: 250px;
            border-top: 1px solid #000;
            margin-bottom: 5px;
            margin-left: auto;
          }

          .sig-name {
            font-weight: bold;
            text-transform: uppercase;
          }

          .sig-pos {
            font-size: 14px;
          }

          /* Footer Date */
          .footer {
            margin-top: 50px;
            font-size: 14px;
          }

          /* Note at bottom-left */
          .note {
            position: absolute;
            bottom: 40px;
            left: 70px;
            font-size: 14px;
            color: red;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <!-- Text Watermark -->
        <div class="watermark-text">BARANGAY VICTORY</div>

        <!-- Header -->
        <div class="header-container">
          <div class="header-logos"> <img src="${logo}" alt="Barangay Logo Left" /></div>
          <div class="header-text">
            <h1>Republic of the Philippines</h1>
            <h2>Province of Agusan del Norte</h2>
            <h2>Municipality of Tubay</h2>
            <h2>Barangay Victory</h2>
            <h3>${doc.type}</h3>
          </div>
          <div class="header-logos"> <img src="${logo1}" alt="Barangay Logo Right" /></div>
        </div>

        <!-- Body Content -->
        <div class="doc-content">
          ${doc.content.replace(/\n/g, "<br>")}
        </div>

        <!-- Signature -->
        <div class="signature-section">
          <div class="sig-line"></div>
          <div class="sig-name">HON. JUAN DELA CRUZ</div>
          <div class="sig-pos">Barangay Captain</div>
        </div>

        <!-- Footer Date -->
        <div class="footer">
          <strong>Issued on:</strong> ${new Date(doc.createdAt).toLocaleDateString()}
        </div>

        <!-- Note -->
        <div class="note">Note: "NOT VALID WITHOUT BARANGAY OFFICIAL DRY"</div>
      </body>
    </html>
  `);

  printWindow.document.close();

  const closePrintWindow = () => {
    setTimeout(() => {
      try {
        if (!printWindow.closed) printWindow.close();
      } catch (_) {
        /* ignore */
      }
    }, 100);
  };

  if (isGeneratedDoc) {
    let enteredPrintMode = false;
    const mq = printWindow.matchMedia("print");

    const onPrintMediaChange = (e) => {
      if (e.matches) enteredPrintMode = true;
    };

    const onAfterPrint = () => {
      mq.removeEventListener("change", onPrintMediaChange);
      printWindow.removeEventListener("afterprint", onAfterPrint);

      if (!enteredPrintMode) {
        setShowGeneratedReprint(true);
        showToast("Print cancelled. Click Reprint to try again.");
      } else {
        setShowGeneratedReprint(false);
        showToast("Document printed successfully.");
      }

      closePrintWindow();
    };

    mq.addEventListener("change", onPrintMediaChange);
    printWindow.addEventListener("afterprint", onAfterPrint);
    printWindow.print();
    return;
  }

  printWindow.print();
  showToast("Document Printed Successfully");
  closePrintWindow();
};

  const buildDocFromRequest = (request) => {
    const snapshot = request.residentSnapshot || {};
    const name =
      request.residentName ||
      `${snapshot.firstName || ""} ${snapshot.lastName || ""}`.trim() ||
      "Resident";
    const template =
      documentTemplates[request.documentType] || documentTemplates["Residency Certificate"];
    const replacements = {
      "{name}": name,
      "{age}": snapshot.age || "N/A",
      "{gender}": snapshot.gender || "N/A",
      "{civilStatus}": snapshot.civilStatus || "N/A",
      "{purok}": snapshot.purok || "N/A",
      "{purpose}": request.purpose || "N/A",
    };
    let content = template || "This certifies that {name}. Purpose: {purpose}.";
    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, "g"), value);
    });
    return {
      id: request._id,
      type: request.documentType,
      name,
      purpose: request.purpose,
      content,
      createdAt: request.createdAt || new Date().toISOString(),
    };
  };

  const handlePrintRequest = async (request) => {
    const doc = buildDocFromRequest(request);
    handlePrintDoc(doc);
    setGeneratedDocs((prev) => {
      const updated = [doc, ...prev];
      localStorage.setItem("generatedDocs", JSON.stringify(updated));
      return updated;
    });
    await handleRequestStatusChange(request, "Printed");
  };

  const handleReprintRequest = (request) => {
    const doc = buildDocFromRequest(request);
    handlePrintDoc(doc);
    showToast("Document reprinted successfully");
  };

  const handleOpenViewModal = (doc) => setViewModal(doc);
  const handleSendMessage = async () => {
    if (!messageText.trim() || !viewModal) return;
    
    try {
      // Get resident ID and phone number
      const residentId = viewModal.resident?._id || viewModal.resident || viewModal.residentId || null;
      const phoneNumber = viewModal.residentSnapshot?.phone || viewModal.resident?.phone || null;
      
      if (!residentId) {
        showToast("Resident ID not found. Cannot send message.");
        return;
      }

      // Send SMS if phone number is available
      if (phoneNumber) {
        try {
          const smsRes = await fetch(`${API_BASE}/sms/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              announcementId: null,
              type: "Message",
              messageType: "Text",
              title: "Document Request Update",
              message: messageText.trim(),
              audience: "Individual",
              recipient: viewModal.residentName || viewModal.name,
              recipientId: residentId,
              recipientPhone: phoneNumber,
            }),
          });

          if (!smsRes.ok) {
            const errorData = await smsRes.json().catch(() => ({}));
            console.warn("SMS sending failed:", errorData.message || "Unknown error");
          }
        } catch (smsErr) {
          console.error("SMS error:", smsErr);
          // Continue even if SMS fails
        }
      }

      // Create message in the message drawer (admin only)
      // Admin sends message directly to resident - check for existing message or create new one
      try {
        const docType = viewModal.documentType || viewModal.type || "Document";
        const adminReplyText = `[${docType} Request] ${messageText.trim()}`;
        
        // First, try to find an existing message for this resident (prefer one without reply)
        const existingMessagesRes = await fetch(`${API_BASE}/messages?residentId=${residentId}`);
        let messageId = null;
        
        if (existingMessagesRes.ok) {
          const existingMessages = await existingMessagesRes.json();
          // Find a message without a reply, or use the most recent one
          const messageWithoutReply = existingMessages.find((msg) => msg.sender === "user" && !msg.text.includes("Admin message"));
          if (messageWithoutReply && messageWithoutReply.messageId) {
            messageId = messageWithoutReply.messageId;
          } else if (existingMessages.length > 0 && existingMessages[existingMessages.length - 1].messageId) {
            // Use the most recent message
            messageId = existingMessages[existingMessages.length - 1].messageId;
          }
        }
        
        // If no existing message found, create a new minimal one
        if (!messageId) {
          const messageRes = await fetch(`${API_BASE}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              residentId: residentId,
              message: "Admin message", // Minimal placeholder
            }),
          });

          if (messageRes.ok) {
            const messageData = await messageRes.json();
            messageId = messageData.data?._id;
          } else {
            const errorData = await messageRes.json().catch(() => ({}));
            console.warn("Failed to create message entry:", errorData.message || "Unknown error");
          }
        }
        
        // Add admin reply to the message (existing or newly created)
        if (messageId) {
          const replyRes = await fetch(`${API_BASE}/messages/${messageId}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reply: adminReplyText,
            }),
          });
          
          if (!replyRes.ok) {
            console.warn("Failed to save admin reply to message thread");
          }
        }
      } catch (msgErr) {
        console.error("Message save error:", msgErr);
        // Continue even if message save fails
      }

      // Update local state
      const newMessage = {
        sender: "Barangay Official",
        text: messageText,
        date: new Date().toLocaleString(),
      };
      setDocumentRequests((prev) =>
        prev.map((doc) =>
          doc._id === viewModal._id
            ? { ...doc, messages: [...(doc.messages || []), newMessage] }
            : doc
        )
      );
      setViewModal((prev) =>
        prev ? { ...prev, messages: [...(prev.messages || []), newMessage] } : prev
      );
      setMessageText("");
      
      const successMsg = phoneNumber 
        ? "Message sent via SMS and saved to message drawer!" 
        : "Message saved to message drawer!";
      showToast(successMsg);
    } catch (err) {
      console.error("Error sending message:", err);
      showToast("Failed to send message. Please try again.");
    }
  };
  const releasedRequests = documentRequests
    .filter((doc) => doc.status === "Printed")
    .sort((a, b) => new Date(b.receivedAt || b.printedAt || b.updatedAt || b.createdAt) - new Date(a.receivedAt || a.printedAt || a.updatedAt || a.createdAt));
  const generatedHistory = [...generatedDocs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const pendingCount = documentRequests.filter((doc) => doc.status === "Pending").length;
  const approvedCount = documentRequests.filter((doc) => doc.status === "Approved").length;
  const printedCount = documentRequests.filter((doc) => doc.status === "Printed").length;

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const csvEscape = (value) => {
    const text = (value ?? "").toString().replace(/"/g, '""');
    return `"${text}"`;
  };

  const handleExportHistoryExcel = () => {
    const header = ["Section", "Resident", "Document", "Purpose", "Date"];

    const generatedRows = generatedHistory.map((doc) => [
      "Generated Documents",
      doc.name || "N/A",
      doc.type || "N/A",
      doc.purpose || "N/A",
      formatDateTime(doc.createdAt),
    ]);

    const releasedRows = releasedRequests.map((doc) => [
      "Released Records",
      doc.residentName || doc.name || "N/A",
      doc.documentType || doc.type || "N/A",
      doc.purpose || "N/A",
      formatDateTime(doc.receivedAt || doc.printedAt),
    ]);

    const csv = [header, ...generatedRows, ...releasedRows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `document-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("History exported to Excel (CSV)");
  };

  const openHistoryPrintableReport = (title) => {
    const generatedRows = generatedHistory
      .map(
        (doc, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${doc.name || "N/A"}</td>
          <td>${doc.type || "N/A"}</td>
          <td>${doc.purpose || "N/A"}</td>
          <td>${formatDateTime(doc.createdAt)}</td>
        </tr>`
      )
      .join("");

    const releasedRows = releasedRequests
      .map(
        (doc, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${doc.residentName || doc.name || "N/A"}</td>
          <td>${doc.documentType || doc.type || "N/A"}</td>
          <td>${doc.purpose || "N/A"}</td>
          <td>${formatDateTime(doc.receivedAt || doc.printedAt)}</td>
        </tr>`
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) {
      showToast("Unable to open print window. Please allow popups.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin-bottom: 6px; }
            h2 { margin-top: 24px; margin-bottom: 10px; }
            .meta { color: #6b7280; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Document History Report</h1>
          <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
          <h2>Generated Documents</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Resident</th><th>Document</th><th>Purpose</th><th>Generated At</th></tr>
            </thead>
            <tbody>
              ${generatedRows || '<tr><td colspan="5">No generated documents yet.</td></tr>'}
            </tbody>
          </table>
          <h2>Released Records</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Resident</th><th>Document</th><th>Purpose</th><th>Released At</th></tr>
            </thead>
            <tbody>
              ${releasedRows || '<tr><td colspan="5">No released records yet.</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const handlePrintHistory = () => openHistoryPrintableReport("Document History - Print");
  const handleExportHistoryPdf = () => {
    openHistoryPrintableReport("Document History - PDF");
    showToast("Use Save as PDF in the print dialog.");
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16, x: 16 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -16, x: 16 }}
              className="fixed top-6 right-6 z-50 flex max-w-sm items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/20"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                Admin Portal
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Document Management
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Generate certificates, process resident requests, and track released records.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setReleaseHistoryModal(true)} className={BTN_PRIMARY}>
              <List className="h-4 w-4" />
              View history
            </button>
            <button type="button" onClick={fetchDocumentRequests} className={BTN_SECONDARY}>
              <RefreshCw className={`h-4 w-4 ${requestsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.header>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Pending",
              count: pendingCount,
              icon: Clock,
              ring: "ring-amber-200/80 dark:ring-amber-500/30",
              bg: "bg-amber-50 dark:bg-amber-500/10",
              iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
              text: "text-amber-800 dark:text-amber-200",
            },
            {
              label: "Approved",
              count: approvedCount,
              icon: FileCheck,
              ring: "ring-blue-200/80 dark:ring-blue-500/30",
              bg: "bg-blue-50 dark:bg-blue-500/10",
              iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
              text: "text-blue-800 dark:text-blue-200",
            },
            {
              label: "Printed",
              count: printedCount,
              icon: Printer,
              ring: "ring-emerald-200/80 dark:ring-emerald-500/30",
              bg: "bg-emerald-50 dark:bg-emerald-500/10",
              iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
              text: "text-emerald-800 dark:text-emerald-200",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border border-slate-200/90 p-5 shadow-sm ring-1 ${stat.ring} ${stat.bg} dark:border-slate-700/80`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${stat.text}`}>
                    {stat.count}
                  </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          {/* Generate Document */}
          <section className="xl:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
              <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/50 px-5 py-4 dark:border-slate-800 dark:from-indigo-950/30 dark:to-violet-950/20 sm:px-6">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-indigo-400 dark:ring-slate-700">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  Generate Document
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Select type, resident, and purpose to issue an on-the-spot certificate.
                </p>
              </div>
              <form onSubmit={handleGenerateAdminDoc} className="space-y-4 p-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Document type
                  </label>
                  <select
                    value={adminForm.type}
                    onChange={(e) => setAdminForm({ ...adminForm, type: e.target.value })}
                    className={FIELD_CLASS}
                  >
                    {Object.keys(documentTemplates).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Resident name
                  </label>
                  <input
                    type="text"
                    placeholder="Search or type resident name"
                    value={adminForm.name}
                    onChange={handleNameChange}
                    className={FIELD_CLASS}
                    required
                  />
                  {filteredResidents.length > 0 && filteredName !== "" && (
                    <div className="absolute top-full left-0 z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-600 dark:bg-slate-900">
                      {filteredResidents.map((r, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setAdminForm((prev) => ({ ...prev, name: r.name }));
                            setFilteredName("");
                            showToast(`Selected: ${r.name}`);
                          }}
                          className="cursor-pointer px-3.5 py-2.5 text-sm text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-indigo-950/50"
                        >
                          {r.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredResidents.length === 0 && filteredName !== "" && (
                    <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      No resident found
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Purpose
                  </label>
                  <textarea
                    value={adminForm.purpose}
                    onChange={(e) => setAdminForm({ ...adminForm, purpose: e.target.value })}
                    placeholder="State the purpose of this document"
                    className={`${FIELD_CLASS} resize-none`}
                    rows={3}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <FileText className="h-5 w-5" />
                    Generate document
                  </button>
                  {lastGeneratedDoc && (
                    <button
                      type="button"
                      onClick={() => handlePrintDoc(lastGeneratedDoc, { isGeneratedDoc: true })}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 ${
                        showGeneratedReprint
                          ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/40"
                          : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/40"
                      }`}
                    >
                      <Printer className="h-5 w-5" />
                      {showGeneratedReprint ? "Reprint" : "Print"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* Document requests */}
          <section className="xl:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 dark:text-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
                      <Clock className="h-5 w-5" />
                    </span>
                    Document requests
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Approve, release, and reprint from one workspace.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6">
        {requestsLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading requests…</p>
          </div>
        ) : documentRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <FileText className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No document requests yet</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
              New resident requests will appear here for review and release.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 md:block">
              <div className="max-h-[min(520px,60vh)] overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-200 bg-slate-50/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resident</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Document</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Purpose</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documentRequests.map((doc) => (
                    <tr key={doc._id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">{doc.residentName || doc.name}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{doc.documentType || doc.type}</td>
                      <td className="max-w-[180px] truncate px-4 py-3.5 text-slate-600 dark:text-slate-400" title={doc.purpose}>{doc.purpose}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            doc.status === "Pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                              : doc.status === "Approved"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenViewModal(doc)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {doc.status === "Pending" && (
                            <button
                              onClick={() => handleRequestStatusChange(doc, "Approved")}
                              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                              Approve
                            </button>
                          )}
                          {doc.status === "Approved" && (
                            <button
                              onClick={() => handleReleaseAndPrint(doc)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                              <Printer className="h-3.5 w-3.5" /> Print & Release
                            </button>
                          )}
                          {doc.status === "Printed" && (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </span>
                              <button
                                onClick={() => handleReprintRequest(doc)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Printer className="h-3.5 w-3.5" /> Reprint
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            <div className="flex max-h-[min(520px,60vh)] flex-col gap-3 overflow-y-auto pr-0.5 md:hidden">
              {documentRequests.map((doc) => (
                <article key={doc._id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{doc.residentName || doc.name}</p>
                      <p className="mt-0.5 text-sm text-indigo-600 dark:text-indigo-400">{doc.documentType || doc.type}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        doc.status === "Pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                          : doc.status === "Approved"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{doc.purpose}</p>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenViewModal(doc)}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                    {doc.status === "Pending" && (
                      <button
                        onClick={() => handleRequestStatusChange(doc, "Approved")}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Approve
                      </button>
                    )}
                    {doc.status === "Approved" && (
                      <button
                        onClick={() => handleReleaseAndPrint(doc)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Printer className="h-4 w-4" /> Print & Release
                      </button>
                    )}
                    {doc.status === "Printed" && (
                      <button
                        onClick={() => handleReprintRequest(doc)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Printer className="h-4 w-4" /> Reprint
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
              </div>
            </div>
          </section>
        </div>

      {/* Document history modal */}
      <AnimatePresence>
        {releaseHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
            onClick={() => setReleaseHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[min(88vh,800px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Document history</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generated and released records</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={handlePrintHistory} className={BTN_PRIMARY}>
                    <Printer className="h-4 w-4" /> Print
                  </button>
                  <button type="button" onClick={handleExportHistoryPdf} className={BTN_SECONDARY}>
                    <FileDown className="h-4 w-4" /> PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportHistoryExcel}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" /> Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseHistoryModal(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {releasedRequests.length === 0 && generatedHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <List className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No history records yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Generated documents
                    </h4>
                    {generatedHistory.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No generated documents yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Resident</th>
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Document</th>
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Purpose</th>
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Generated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {generatedHistory.map((doc) => (
                              <tr key={`generated-${doc.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-2.5">{doc.name || "N/A"}</td>
                                <td className="px-4 py-2.5">{doc.type || "N/A"}</td>
                                <td className="px-4 py-2.5">{doc.purpose || "N/A"}</td>
                                <td className="px-4 py-2.5 text-slate-500">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Released records
                    </h4>
                    {releasedRequests.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No released records yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Resident</th>
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Document</th>
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Purpose</th>
                              <th className="px-4 py-2.5 text-xs font-semibold uppercase text-slate-500">Released</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {releasedRequests.map((doc) => (
                              <tr key={`released-${doc._id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-2.5">{doc.residentName || doc.name}</td>
                                <td className="px-4 py-2.5">{doc.documentType || doc.type}</td>
                                <td className="px-4 py-2.5">{doc.purpose || "N/A"}</td>
                                <td className="px-4 py-2.5 text-slate-500">
                                  {doc.receivedAt || doc.printedAt
                                    ? new Date(doc.receivedAt || doc.printedAt).toLocaleString()
                                    : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Pending Modal */}
      <AnimatePresence>
        {viewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
            onClick={() => setViewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[min(88vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {viewModal.residentName || viewModal.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-indigo-600 dark:text-indigo-400">
                    {viewModal.documentType || viewModal.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewModal(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <dl className="mb-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Status", viewModal.status],
                  ["Purpose", viewModal.purpose],
                  ["Payment", viewModal.paymentMethod || "Pickup"],
                  ["Requested", new Date(viewModal.createdAt).toLocaleString()],
                  ["Printed at", viewModal.printedAt ? new Date(viewModal.printedAt).toLocaleString() : "N/A"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{value}</dd>
                  </div>
                ))}
              </dl>
              {viewModal.residentSnapshot && (
                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Resident details
                  </h4>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {[
                      ["Age", viewModal.residentSnapshot.age],
                      ["Gender", viewModal.residentSnapshot.gender],
                      ["Civil status", viewModal.residentSnapshot.civilStatus],
                      ["Purok", viewModal.residentSnapshot.purok],
                      ["Address", viewModal.residentSnapshot.address],
                      ["Contact", viewModal.residentSnapshot.phone],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                        <dd className="font-medium text-slate-800 dark:text-slate-200">{value || "N/A"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Messages
                </h4>
                {(viewModal.messages || []).length > 0 ? (
                  <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
                    {viewModal.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white">{msg.sender}:</span>{" "}
                        {msg.text}
                        {msg.date && <span className="ml-2 text-xs text-slate-400">{msg.date}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
                )}
              </div>
              </div>
              <div className="flex shrink-0 gap-2 border-t border-slate-100 p-4 dark:border-slate-800 sm:px-6">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message to the resident…"
                  className={`${FIELD_CLASS} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Send className="h-5 w-5" /> Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};

export default DocumentPanel;
