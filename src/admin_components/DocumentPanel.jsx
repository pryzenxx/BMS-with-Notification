
import { motion, AnimatePresence } from "framer-motion";
import { Printer, FileText, Clock, Eye, CheckCircle2, List, Send, Loader2, FileDown, Download } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";

import { API_BASE } from "../utils/apiBase";

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
  const [releaseModal, setReleaseModal] = useState(null);
  const [releaseHistoryModal, setReleaseHistoryModal] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ idType: "", idNumber: "", receiverName: "" });
  const [messageText, setMessageText] = useState("");
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState(null);

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
      const res = await fetch(`${API_URL}/api/document-requests/${request._id}/status`, {
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
  const openReleaseModal = (request) => {
    const existing = request.receivedIdentification || {};
    setReleaseModal(request);
    setReleaseForm({
      idType: existing.idType || "",
      idNumber: existing.idNumber || "",
      receiverName: existing.receiverName || request.residentName || request.name || "",
    });
  };




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


const handlePrintDoc = (doc) => {
  const printWindow = window.open("", "_blank");

  // const logo = "/assets/logo-left.png";  // Adjust logo paths
  // const logo1 = "/assets/logo-right.png";

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
  printWindow.print();

  showToast("Document Printed Successfully");
  setLastGeneratedDoc(null);
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

  const handlePrintRequest = async (request, identification = null) => {
    const doc = buildDocFromRequest(request);
    handlePrintDoc(doc);
    setGeneratedDocs((prev) => {
      const updated = [doc, ...prev];
      localStorage.setItem("generatedDocs", JSON.stringify(updated));
      return updated;
    });
    const payload = identification ? { receivedIdentification: identification } : {};
    await handleRequestStatusChange(request, "Printed", payload);
  };

  const handleReprintRequest = (request) => {
    const doc = buildDocFromRequest(request);
    handlePrintDoc(doc);
    showToast("Document reprinted successfully");
  };

  const handleConfirmRelease = async () => {
    if (!releaseModal) return;
    const idType = releaseForm.idType.trim();
    const idNumber = releaseForm.idNumber.trim();
    const receiverName = releaseForm.receiverName.trim();
    if (!idType || !idNumber || !receiverName) {
      showToast("Please complete ID type, ID number, and receiver name.");
      return;
    }
    await handlePrintRequest(releaseModal, { idType, idNumber, receiverName });
    setReleaseModal(null);
    setReleaseForm({ idType: "", idNumber: "", receiverName: "" });
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
          const smsRes = await fetch(`${API_URL}/api/sms/send`, {
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
        const existingMessagesRes = await fetch(`${API_URL}/api/messages?residentId=${residentId}`);
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
          const messageRes = await fetch(`${API_URL}/api/messages`, {
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
          const replyRes = await fetch(`${API_URL}/api/messages/${messageId}/reply`, {
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
    const header = [
      "Section",
      "Resident",
      "Document",
      "Purpose",
      "ID Type",
      "ID Number",
      "Receiver",
      "Date",
    ];

    const generatedRows = generatedHistory.map((doc) => [
      "Generated Documents",
      doc.name || "N/A",
      doc.type || "N/A",
      doc.purpose || "N/A",
      "",
      "",
      "",
      formatDateTime(doc.createdAt),
    ]);

    const releasedRows = releasedRequests.map((doc) => [
      "Released Records",
      doc.residentName || doc.name || "N/A",
      doc.documentType || doc.type || "N/A",
      doc.purpose || "N/A",
      doc.receivedIdentification?.idType || "N/A",
      doc.receivedIdentification?.idNumber || "N/A",
      doc.receivedIdentification?.receiverName || "N/A",
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
          <td>${doc.receivedIdentification?.idType || "N/A"}</td>
          <td>${doc.receivedIdentification?.idNumber || "N/A"}</td>
          <td>${doc.receivedIdentification?.receiverName || "N/A"}</td>
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
          <h2>Released Records (With Identification)</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Resident</th><th>Document</th><th>Purpose</th><th>ID Type</th><th>ID Number</th><th>Receiver</th><th>Released At</th></tr>
            </thead>
            <tbody>
              ${releasedRows || '<tr><td colspan="8">No released records yet.</td></tr>'}
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50 border border-emerald-500"><CheckCircle2 className="w-5 h-5" />{toast}</motion.div>}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white/90 dark:bg-slate-900/85 dark:border-slate-700 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Admin Portal</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Barangay Document Management</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Generate documents, process requests, and track released records with identification details.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800 dark:text-amber-200">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/40 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">Approved</p>
          <p className="mt-1 text-2xl font-semibold text-blue-800 dark:text-blue-200">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/40 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Printed</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">{printedCount}</p>
        </div>
      </div>

      {/* Document Generator */}
      <div className="flex justify-center relative">
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-700 relative">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Generate Document</h2>
          <form onSubmit={handleGenerateAdminDoc} className="space-y-3 mt-3">
            <select value={adminForm.type} onChange={(e) => setAdminForm({ ...adminForm, type: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {Object.keys(documentTemplates).map(type => <option key={type} value={type}>{type}</option>)}
            </select>


              <div className="relative">
                      <input type="text" placeholder="Resident Name" value={adminForm.name} onChange={handleNameChange} className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" required />
                      {filteredResidents.length > 0 && filteredName !== "" && (
                        <div className="absolute top-full left-0 dark:bg-slate-900 bg-slate-800 text-white border border-slate-600 rounded-lg mt-1 w-full max-h-40 overflow-y-auto shadow-lg z-20">
                          {filteredResidents.map((r, i) => (
                           <div
                              key={i}
                               onClick={() => {
                                 setAdminForm(prev => ({ ...prev, name: r.name }));
                                   setFilteredName("");
                                    showToast(`Selected: ${r.name}`);
                                      }}
                                     className="px-3 py-2 dark:hover:bg-indigo-900 hover:bg-slate-900 cursor-pointer"
                                  >
                                     {r.name}
                                    </div>
                                  ))}      
                        </div>
                      )}
                      {filteredResidents.length === 0 && filteredName !== "" && (
                        <div className="absolute top-full left-0 bg-white border border-slate-300 rounded-lg mt-1 w-full shadow-lg z-20 px-3 py-2 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                          No resident found
                        </div>
                      )}
                    </div>


            <textarea value={adminForm.purpose} onChange={(e) => setAdminForm({ ...adminForm, purpose: e.target.value })} placeholder="Purpose" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50" rows={3} required />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm"><FileText className="w-5 h-5" /> Generate</button>

            {lastGeneratedDoc && <button type="button" onClick={() => handlePrintDoc(lastGeneratedDoc)} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm"><Printer className="w-5 h-5" /> Print</button>}
          </form>
        </div>
      </div>

      {/* Pending Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="w-6 h-6 text-yellow-500" /> Pending Documents
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage approvals, release flow, and reprints from one table.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReleaseHistoryModal(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <List className="w-4 h-4" /> History
            </button>
            <button onClick={fetchDocumentRequests} className="text-sm border border-slate-300 dark:border-slate-600 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
              Refresh
            </button>
          </div>
        </div>
        {requestsLoading ? (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin" size={20} /> Loading requests...
          </div>
        ) : documentRequests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            No pending document requests yet.
          </p>
        ) : (
          <>
            <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="max-h-[460px] overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <th className="p-2">Resident Name</th>
                    <th className="p-2">Document Type</th>
                    <th className="p-2">Purpose</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documentRequests.map((doc) => (
                    <tr key={doc._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                      <td className="p-2">{doc.residentName || doc.name}</td>
                      <td className="p-2">{doc.documentType || doc.type}</td>
                      <td className="p-2">{doc.purpose}</td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : doc.status === "Approved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => handleOpenViewModal(doc)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          {doc.status === "Pending" && (
                            <button
                              onClick={() => handleRequestStatusChange(doc, "Approved")}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs shadow-sm"
                            >
                              Approve
                            </button>
                          )}
                          {doc.status === "Approved" && (
                            <button
                              onClick={() => openReleaseModal(doc)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm"
                            >
                              <Printer className="w-4 h-4" /> Print & Release
                            </button>
                          )}
                          {doc.status === "Printed" && (
                            <>
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={14} /> Printed
                              </span>
                              <button
                                onClick={() => handleReprintRequest(doc)}
                                className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm"
                              >
                                <Printer className="w-4 h-4" /> Reprint
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

            <div className="md:hidden flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1">
              {documentRequests.map((doc) => (
                <div key={doc._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900/70 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{doc.residentName || doc.name}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === "Pending"
                          ? "bg-amber-100 text-amber-700"
                          : doc.status === "Approved"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm">{doc.documentType || doc.type}</p>
                  <p className="text-sm">{doc.purpose}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => handleOpenViewModal(doc)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    {doc.status === "Pending" && (
                      <button
                        onClick={() => handleRequestStatusChange(doc, "Approved")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs shadow-sm"
                      >
                        Approve
                      </button>
                    )}
                    {doc.status === "Approved" && (
                      <button
                        onClick={() => openReleaseModal(doc)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Printer className="w-4 h-4" /> Print & Release
                      </button>
                    )}
                    {doc.status === "Printed" && (
                      <>
                        <span className="flex-1 text-xs text-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 size={14} /> Printed
                        </span>
                        <button
                          onClick={() => handleReprintRequest(doc)}
                          className="flex-1 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Printer className="w-4 h-4" /> Reprint
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Released Records History Modal */}
      <AnimatePresence>
        {releaseHistoryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="backdrop-blur-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-5xl shadow-2xl text-slate-900 dark:text-white max-h-[80vh] overflow-y-auto">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-xl font-bold">Document History</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePrintHistory}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={handleExportHistoryPdf}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1"
                  >
                    <FileDown className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={handleExportHistoryExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Excel
                  </button>
                  <button onClick={() => setReleaseHistoryModal(false)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md">Close</button>
                </div>
              </div>
              {releasedRequests.length === 0 && generatedHistory.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-300">No history records yet.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-base mb-2">Generated Documents</h4>
                    {generatedHistory.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-300">No generated documents yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                              <th className="p-2">Resident</th>
                              <th className="p-2">Document</th>
                              <th className="p-2">Purpose</th>
                              <th className="p-2">Generated At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedHistory.map((doc) => (
                              <tr key={`generated-${doc.id}`} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                                <td className="p-2">{doc.name || "N/A"}</td>
                                <td className="p-2">{doc.type || "N/A"}</td>
                                <td className="p-2">{doc.purpose || "N/A"}</td>
                                <td className="p-2">{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : "N/A"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-base mb-2">Released Records (With Identification)</h4>
                    {releasedRequests.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-300">No released records yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                              <th className="p-2">Resident</th>
                              <th className="p-2">Document</th>
                              <th className="p-2">Purpose</th>
                              <th className="p-2">ID Type</th>
                              <th className="p-2">ID Number</th>
                              <th className="p-2">Receiver</th>
                              <th className="p-2">Released At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {releasedRequests.map((doc) => (
                              <tr key={`released-${doc._id}`} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                                <td className="p-2">{doc.residentName || doc.name}</td>
                                <td className="p-2">{doc.documentType || doc.type}</td>
                                <td className="p-2">{doc.purpose || "N/A"}</td>
                                <td className="p-2">{doc.receivedIdentification?.idType || "N/A"}</td>
                                <td className="p-2">{doc.receivedIdentification?.idNumber || "N/A"}</td>
                                <td className="p-2">{doc.receivedIdentification?.receiverName || "N/A"}</td>
                                <td className="p-2">
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
        )}
      </AnimatePresence>

      {/* View Pending Modal */}
      <AnimatePresence>
        {viewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="backdrop-blur-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl text-slate-900 dark:text-white max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {viewModal.residentName || viewModal.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {viewModal.documentType || viewModal.type}
                  </p>
                </div>
                <button onClick={() => setViewModal(null)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md">Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <p><strong>Status:</strong> {viewModal.status}</p>
                <p><strong>Purpose:</strong> {viewModal.purpose}</p>
                <p><strong>Payment:</strong> {viewModal.paymentMethod || "Pickup"}</p>
                <p><strong>Requested:</strong> {new Date(viewModal.createdAt).toLocaleString()}</p>
                <p><strong>ID Type:</strong> {viewModal.receivedIdentification?.idType || "N/A"}</p>
                <p><strong>ID Number:</strong> {viewModal.receivedIdentification?.idNumber || "N/A"}</p>
                <p><strong>Received By:</strong> {viewModal.receivedIdentification?.receiverName || "N/A"}</p>
                <p><strong>Received At:</strong> {viewModal.receivedAt ? new Date(viewModal.receivedAt).toLocaleString() : "N/A"}</p>
              </div>
              {viewModal.residentSnapshot && (
                <div className="mb-4 border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/60 dark:bg-slate-800/40">
                  <h4 className="font-semibold mb-2">Resident Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><strong>Age:</strong> {viewModal.residentSnapshot.age || "N/A"}</p>
                    <p><strong>Gender:</strong> {viewModal.residentSnapshot.gender || "N/A"}</p>
                    <p><strong>Civil Status:</strong> {viewModal.residentSnapshot.civilStatus || "N/A"}</p>
                    <p><strong>Purok:</strong> {viewModal.residentSnapshot.purok || "N/A"}</p>
                    <p><strong>Address:</strong> {viewModal.residentSnapshot.address || "N/A"}</p>
                    <p><strong>Contact:</strong> {viewModal.residentSnapshot.phone || "N/A"}</p>
                  </div>
                </div>
              )}
              <div className="mb-3">
                <h4 className="font-semibold">Messages:</h4>
                {(viewModal.messages || []).length > 0 ? (
                  viewModal.messages.map((msg, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 dark:border-slate-700 rounded-md mb-1 text-sm bg-white dark:bg-slate-800/60">
                      <span className="font-semibold">{msg.sender}:</span> {msg.text}
                      {msg.date && (
                        <span className="text-xs text-slate-400 ml-2">{msg.date}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No messages yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-1 shadow-sm"><Send className="w-5 h-5" /> Send</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print & Release Modal */}
      <AnimatePresence>
        {releaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
          >
          <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold mb-1 dark:text-white">Record Resident Identification</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Add identification details before releasing and printing this document.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <input
                  value={releaseForm.idType}
                  onChange={(e) => setReleaseForm((prev) => ({ ...prev, idType: e.target.value }))}
                  placeholder="ID Type (e.g. Barangay ID, National ID)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <input
                  value={releaseForm.idNumber}
                  onChange={(e) => setReleaseForm((prev) => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="ID Number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <input
                  value={releaseForm.receiverName}
                  onChange={(e) => setReleaseForm((prev) => ({ ...prev, receiverName: e.target.value }))}
                  placeholder="Name of receiver"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => {
                    setReleaseModal(null);
                    setReleaseForm({ idType: "", idNumber: "", receiverName: "" });
                  }}
                  className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRelease}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
                >
                  Save & Print
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
