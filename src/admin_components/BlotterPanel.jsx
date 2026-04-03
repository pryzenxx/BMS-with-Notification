import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Printer,
  Pencil,
  X,
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:5000/api";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";
const TEXTAREA_CLASS = `${FIELD_CLASS} resize-none min-h-[88px]`;
const LABEL_CLASS =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const READ_ONLY_BOX =
  "rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100";

const BTN_ICON =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";
const BTN_ICON_SM =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700";

/** Standard blotter party terms (complainant = reporting party; respondent = subject of complaint). */
const BLOTTER_PARTIES = {
  complainantTitle: "Complainant",
  complainantSubtitle: "reporting party",
  respondentTitle: "Respondent",
  respondentSubtitle: "subject of complaint",
};

const residentId = (r) => r?._id || r?.id || "";

const getResidentDisplayName = (r) => {
  if (!r) return "";
  if (r.fullName?.trim()) return r.fullName.trim();
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ").trim() || "Unnamed resident";
};

const formatResidentAddress = (r) => {
  if (!r) return "";
  const parts = [r.purok && r.purok !== "N/A" ? r.purok : null, r.address].filter(Boolean);
  return parts.join(parts.length > 1 ? ", " : "") || "";
};

const BlotterPanel = () => {
  const [blotters, setBlotters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    complainant: "",
    complainantResidentId: "",
    respondent: "",
    respondentResidentId: "",
    incident: "",
    date: "",
    status: "Pending",
  });

  const [residents, setResidents] = useState([]);

  // New UI states
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, index: null });
  const [viewRecord, setViewRecord] = useState(null);

  useEffect(() => {
    fetchBlotters();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast((s) => ({ ...s, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  const fetchResidents = async () => {
    try {
      const res = await fetch(`${API_URL}/residents?includeImages=false`);
      if (!res.ok) throw new Error("Failed to fetch residents");
      const data = await res.json();
      setResidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching residents:", err);
      setResidents([]);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  useEffect(() => {
    if (showModal) fetchResidents();
  }, [showModal]);

  const sortedResidents = useMemo(() => {
    return [...residents].sort((a, b) =>
      getResidentDisplayName(a).localeCompare(getResidentDisplayName(b), undefined, { sensitivity: "base" })
    );
  }, [residents]);

  const applyComplainantResident = (id) => {
    if (!id) {
      setForm((f) => ({ ...f, complainantResidentId: "" }));
      return;
    }
    const r = residents.find((x) => residentId(x) === id);
    if (!r) return;
    setForm((f) => ({
      ...f,
      complainantResidentId: id,
      complainant: getResidentDisplayName(r),
      complainantAddress: formatResidentAddress(r),
    }));
  };

  const applyRespondentResident = (id) => {
    if (!id) {
      setForm((f) => ({ ...f, respondentResidentId: "" }));
      return;
    }
    const r = residents.find((x) => residentId(x) === id);
    if (!r) return;
    setForm((f) => ({
      ...f,
      respondentResidentId: id,
      respondent: getResidentDisplayName(r),
      respondentAddress: formatResidentAddress(r),
    }));
  };

  const complainantSelectValue = useMemo(() => {
    const id = form.complainantResidentId;
    if (!id || !sortedResidents.some((r) => residentId(r) === id)) return "";
    return id;
  }, [form.complainantResidentId, sortedResidents]);

  const respondentSelectValue = useMemo(() => {
    const id = form.respondentResidentId;
    if (!id || !sortedResidents.some((r) => residentId(r) === id)) return "";
    return id;
  }, [form.respondentResidentId, sortedResidents]);

  const fetchBlotters = async () => {
    try {
      const res = await fetch(`${API_URL}/blotters`);
      if (!res.ok) throw new Error("Failed to fetch blotters");

      const data = await res.json();

      // accept several response shapes: []
      // { blotters: [...] } or { data: [...] } or direct array
      const blotterArray =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.blotters)
          ? data.blotters
          : Array.isArray(data?.data)
          ? data.data
          : [];

      setBlotters(blotterArray);
      setFiltered(blotterArray);
    } catch (err) {
      console.error("Error fetching blotters:", err);
      setBlotters([]);
      setFiltered([]);
      setToast({ show: true, type: "error", message: "Failed to load blotter records." });
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) return setFiltered(blotters);
    const filteredData = blotters.filter(
      (b) =>
        b.complainant?.toLowerCase().includes(term.toLowerCase()) ||
        b.respondent?.toLowerCase().includes(term.toLowerCase()) ||
        b.incident?.toLowerCase().includes(term.toLowerCase()) ||
        b.status?.toLowerCase().includes(term.toLowerCase())
    );
    setFiltered(filteredData);
  };

  const resetForm = () => {
    setForm({
      complainant: "",
      complainantResidentId: "",
      respondent: "",
      respondentResidentId: "",
      incident: "",
      date: "",
      status: "Pending",
    });
    setIsEditing(false);
    setEditIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.complainant || !form.respondent || !form.incident || !form.date) {
      setToast({ show: true, type: "error", message: "Please fill in required fields." });
      return;
    }

    // Normalize data before sending
    const payload = {
      complainant: form.complainant.trim(),
      complainantAddress: form.complainantAddress || "",
      complainantResidentId: form.complainantResidentId || "",
      respondent: form.respondent.trim(),
      respondentAddress: form.respondentAddress || "",
      respondentResidentId: form.respondentResidentId || "",
      incident: form.incident.trim(),
      incidentLocation: form.incidentLocation || "",
      incidentTime: form.incidentTime || "",
      date: form.date,
      narrative: form.narrative || "",
      officerInCharge: form.officerInCharge || "",
      witnesses: form.witnesses || "",
      actionTaken: form.actionTaken || "",
      status: form.status || "Pending",
    };

    try {
      const url = isEditing
        ? `${API_URL}/blotters/${blotters[editIndex]._id}`
        : `${API_URL}/blotters`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Error:", errorText);
        throw new Error("Failed to save record");
      }

      await fetchBlotters();
      resetForm();
      setShowModal(false);
      setToast({
        show: true,
        type: "success",
        message: isEditing ? "Record updated successfully." : "Record added successfully.",
      });
    } catch (err) {
      console.error("Error saving blotter:", err);
      setToast({ show: true, type: "error", message: "Failed to save blotter. Check backend." });
    }
  };

  const handleEdit = (record) => {
    const i = blotters.findIndex((b) => b._id === record._id);
    if (i < 0) return;
    setForm({ ...blotters[i] });
    setEditIndex(i);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (record) => {
    setViewRecord(record);
  };

  const promptDelete = (record) => {
    const i = blotters.findIndex((b) => b._id === record._id);
    const id = record?._id;
    setDeleteConfirm({ show: true, id, index: i >= 0 ? i : null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, index: null });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      const res = await fetch(`${API_URL}/blotters/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Delete failed:", txt);
        throw new Error("Delete failed");
      }
      const newBlotters = blotters.filter((b) => b._id !== deleteConfirm.id);
      setBlotters(newBlotters);
      setFiltered((prev) => prev.filter((b) => b._id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null, index: null });
      setToast({ show: true, type: "success", message: "Record deleted." });
      // ensure server state synced
      // await fetchBlotters();
    } catch (err) {
      console.error("Error deleting:", err);
      setToast({ show: true, type: "error", message: "Failed to delete record." });
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50";
      case "In Progress":
        return "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/50";
      case "Resolved":
        return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800/50";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";
    }
  };

  const handlePrint = () => {
  const listHTML = (filtered || [])
    .map(
      (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.complainant || "—"}</td>
          <td>${r.respondent || "—"}</td>
          <td>${r.incident || "—"}</td>
          <td>${r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
          <td>${r.status || "—"}</td>
        </tr>`
    )
    .join("");

  const logoURL = window.location.origin + logo;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Blotter Records - Barangay Victory</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 50px; color: #000; }
          .report-container { max-width: 1000px; margin: auto; position: relative; }
          .report-container::after {
            content: "BARANGAY VICTORY";
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            color: rgba(0,0,0,0.05);
            z-index: 0;
            pointer-events: none;
          }
          .header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; position: relative; z-index: 1;
          }
          .header img { width: 100px; height: auto; }
          .header .center { flex: 1; text-align: center; line-height: 1.3; }
          .center h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .center h2 { margin: 2px 0; font-size: 18px; }
          .center p { margin: 2px 0; font-size: 14px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px; position: relative; z-index: 1; }
          th, td { border: 1px solid #000; padding: 10px; text-align: left; }
          th { background: #000; color: white; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          tr:nth-child(even) { background-color: #f0f0f0; }
          tr:hover { background-color: #e0e0e0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #555; position: relative; z-index: 1; }
          .disclaimer { font-size: 12px; margin-top: 20px; font-style: italic; text-align: justify; position: relative; z-index: 1; }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <img src="${logo}" alt="Left Logo" />
            <div class="center">
              <h1>Republic of the Philippines</h1>
              <h2>Province of Agusan del Norte</h2>
              <h2>Municipality of Tubay</h2>
              <h2>Barangay Victory Blotter Office</h2>
              <p><strong>Official Blotter Records Report</strong></p>
              <p>Report No.: ${new Date().getTime()}</p>
            </div>
            <img src="${logo1}" alt="Right Logo" />
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Reporting party (Complainant)</th>
                <th>Subject of complaint (Respondent)</th>
                <th>Incident</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${listHTML}</tbody>
          </table>

          <div class="disclaimer">
            <p>
              This report contains official records of the Barangay Victory Blotter Office. 
              All information is confidential and intended for official use only. 
              Unauthorized use, reproduction, or disclosure of the contents is prohibited and may be subject to legal penalties.
            </p>
          </div>

          <div class="footer">
            <p>Generated from the Barangay Blotter Management System</p>
            <p>&copy; ${new Date().getFullYear()} Barangay Victory - Tubay, Agusan del Norte</p>
          </div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};


  const handlePrintBlotter = () => {
  const listHTML = (filtered || [])
    .map(
      (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.referenceNo || "—"}</td>
          <td>${r.complainant || "—"}</td>
          <td>${r.respondent || "—"}</td>
          <td>${r.incident || "—"}</td>
          <td>${r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
          <td>${r.status || "—"}</td>
          <td>${r.actionTaken || "—"}</td>
        </tr>
      `
    )
    .join("");

  const logoURL = window.location.origin + logo;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Barangay Victory - Blotter Report</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 50px; color: #000; }
          .report-container { max-width: 1000px; margin: auto; position: relative; }
          .report-container::after {
            content: "BARANGAY VICTORY";
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            color: rgba(0,0,0,0.05);
            z-index: 0;
            pointer-events: none;
          }
          .header {
            display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000;
            padding-bottom: 15px; margin-bottom: 25px; position: relative; z-index: 1;
          }
          .header img { width: 100px; height: auto; }
          .header .center { flex: 1; text-align: center; line-height: 1.3; }
          .center h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .center h2 { margin: 2px 0; font-size: 18px; }
          .center p { margin: 2px 0; font-size: 14px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px; position: relative; z-index: 1; }
          th, td { border: 1px solid #000; padding: 10px; text-align: left; }
          th { background: #000; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #f0f0f0; }
          tr:hover { background-color: #e0e0e0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #555; position: relative; z-index: 1; }
          .disclaimer { font-size: 12px; margin-top: 20px; font-style: italic; text-align: justify; position: relative; z-index: 1; }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <img src="${logo}" alt="Left Logo" />
            <div class="center">
              <h1>Republic of the Philippines</h1>
              <h2>Province of Agusan del Norte</h2>
              <h2>Municipality of Tubay</h2>
              <h2>Barangay Victory Blotter Office</h2>
              <p><strong>Official Blotter Report</strong></p>
              <p>Report No.: ${new Date().getTime()}</p>
            </div>
            <img src="${logo1}" alt="Right Logo" />
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Reference No</th>
                <th>Reporting party (Complainant)</th>
                <th>Subject of complaint (Respondent)</th>
                <th>Incident</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action Taken</th>
              </tr>
            </thead>
            <tbody>${listHTML}</tbody>
          </table>

          <div class="disclaimer">
            <p>
              This report contains official records of the Barangay Victory Blotter Office. 
              All information is considered confidential and is intended for official use only. 
              Unauthorized reproduction, disclosure, or use of the content is prohibited and may be subject to legal penalties.
            </p>
          </div>

          <div class="footer">
            <p>Generated from the Barangay Blotter Management System</p>
            <p>&copy; ${new Date().getFullYear()} Barangay Victory - Tubay, Agusan del Norte</p>
          </div>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};



  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Reporting party (Complainant),Subject of complaint (Respondent),Incident,Date,Status"]
        .concat(
          filtered.map((b) =>
            [b.complainant, b.respondent, b.incident, b.date, b.status].join(",")
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "blotter_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ show: true, type: "success", message: "CSV exported." });
  };

  return (
    <div className="min-h-full space-y-6">
      <div className="print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <FileText className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Blotter records
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Official incident log — complainant, respondent, and case status.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative min-w-[200px] flex-1 lg:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search complainant, respondent, incident…"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={`${FIELD_CLASS} pl-10`}
                aria-label="Search blotter records"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(true);
                  resetForm();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Add record
              </button>
              <button
                type="button"
                onClick={handlePrintBlotter}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer className="h-4 w-4" />
                Print report
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer className="h-4 w-4" />
                Print all
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Parties:</span>{" "}
          <strong>{BLOTTER_PARTIES.complainantTitle.toLowerCase()}</strong> — {BLOTTER_PARTIES.complainantSubtitle};{" "}
          <strong>{BLOTTER_PARTIES.respondentTitle.toLowerCase()}</strong> — {BLOTTER_PARTIES.respondentSubtitle}.
          Witnesses listed separately when applicable.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 py-20 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No blotter records match your search.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Registry
              <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="block text-xs text-slate-500 dark:text-slate-400 md:hidden">
              Scroll sideways to see all columns.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    #
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Ref.
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Date
                  </th>
                  <th className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Complainant
                  </th>
                  <th className="min-w-[140px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Respondent
                  </th>
                  <th className="min-w-[200px] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Incident
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/25"
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">{idx + 1}</td>
                    <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {item.referenceNo || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                      {item.date ? new Date(item.date).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <span className="line-clamp-2 text-slate-800 dark:text-slate-100" title={item.complainant || ""}>
                        {item.complainant || "—"}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <span className="line-clamp-2 text-slate-800 dark:text-slate-100" title={item.respondent || ""}>
                        {item.respondent || "—"}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <span className="line-clamp-2 text-slate-600 dark:text-slate-300" title={item.incident || ""}>
                        {item.incident || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(item.status)}`}
                      >
                        {item.status || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleView(item)}
                          title="View"
                          className={BTN_ICON_SM}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                          className={BTN_ICON_SM}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDelete(item)}
                          title="Delete"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm dark:bg-slate-950/60 sm:px-6"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {isEditing ? "Edit blotter record" : "New blotter record"}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {BLOTTER_PARTIES.complainantSubtitle} and {BLOTTER_PARTIES.respondentSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Parties
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/25">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {BLOTTER_PARTIES.complainantTitle}
                      </p>
                      <div>
                        <label className={LABEL_CLASS}>Select resident</label>
                        <select
                          className={FIELD_CLASS}
                          value={complainantSelectValue}
                          onChange={(e) => applyComplainantResident(e.target.value)}
                        >
                          <option value="">Choose from resident list…</option>
                          {sortedResidents.map((r) => {
                            const id = residentId(r);
                            if (!id) return null;
                            return (
                              <option key={id} value={id}>
                                {getResidentDisplayName(r)}
                                {r.phone ? ` · ${r.phone}` : ""}
                              </option>
                            );
                          })}
                        </select>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          Fills name and address; clear selection to type manually.
                        </p>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Full name (reporting party) *</label>
                        <input
                          type="text"
                          value={form.complainant}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              complainant: e.target.value,
                              ...(complainantSelectValue ? { complainantResidentId: "" } : {}),
                            })
                          }
                          className={FIELD_CLASS}
                          required
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Address</label>
                        <input
                          type="text"
                          value={form.complainantAddress || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              complainantAddress: e.target.value,
                              ...(complainantSelectValue ? { complainantResidentId: "" } : {}),
                            })
                          }
                          className={FIELD_CLASS}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/25">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {BLOTTER_PARTIES.respondentTitle}
                      </p>
                      <div>
                        <label className={LABEL_CLASS}>Select resident</label>
                        <select
                          className={FIELD_CLASS}
                          value={respondentSelectValue}
                          onChange={(e) => applyRespondentResident(e.target.value)}
                        >
                          <option value="">Choose from resident list…</option>
                          {sortedResidents.map((r) => {
                            const id = residentId(r);
                            if (!id) return null;
                            return (
                              <option key={id} value={id}>
                                {getResidentDisplayName(r)}
                                {r.phone ? ` · ${r.phone}` : ""}
                              </option>
                            );
                          })}
                        </select>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          Fills name and address; clear selection to type manually.
                        </p>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Full name (subject of complaint) *</label>
                        <input
                          type="text"
                          value={form.respondent}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              respondent: e.target.value,
                              ...(respondentSelectValue ? { respondentResidentId: "" } : {}),
                            })
                          }
                          className={FIELD_CLASS}
                          required
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Address</label>
                        <input
                          type="text"
                          value={form.respondentAddress || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              respondentAddress: e.target.value,
                              ...(respondentSelectValue ? { respondentResidentId: "" } : {}),
                            })
                          }
                          className={FIELD_CLASS}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Incident
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLASS}>Location</label>
                      <input
                        type="text"
                        value={form.incidentLocation || ""}
                        onChange={(e) => setForm({ ...form, incidentLocation: e.target.value })}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={LABEL_CLASS}>Date *</label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className={FIELD_CLASS}
                          required
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Time</label>
                        <input
                          type="time"
                          value={form.incidentTime || ""}
                          onChange={(e) => setForm({ ...form, incidentTime: e.target.value })}
                          className={FIELD_CLASS}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Incident description *</label>
                      <textarea
                        value={form.incident}
                        onChange={(e) => setForm({ ...form, incident: e.target.value })}
                        className={TEXTAREA_CLASS}
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Narrative (optional)</label>
                      <textarea
                        value={form.narrative || ""}
                        onChange={(e) => setForm({ ...form, narrative: e.target.value })}
                        className={TEXTAREA_CLASS}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Action taken</label>
                      <textarea
                        value={form.actionTaken || ""}
                        onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                        className={TEXTAREA_CLASS}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Witnesses (comma separated)</label>
                      <input
                        type="text"
                        value={form.witnesses || ""}
                        onChange={(e) => setForm({ ...form, witnesses: e.target.value })}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className={FIELD_CLASS}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {isEditing ? "Update record" : "Save record"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm dark:bg-slate-950/60"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Blotter details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Read-only</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewRecord(null)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto p-5">
                <div>
                  <p className={LABEL_CLASS}>Incident</p>
                  <div className={READ_ONLY_BOX}>{viewRecord.incident || "—"}</div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className={LABEL_CLASS}>
                      {BLOTTER_PARTIES.complainantTitle}{" "}
                      <span className="font-normal normal-case text-slate-400">({BLOTTER_PARTIES.complainantSubtitle})</span>
                    </p>
                    <div className={READ_ONLY_BOX}>{viewRecord.complainant || "—"}</div>
                    {viewRecord.complainantAddress ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{viewRecord.complainantAddress}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className={LABEL_CLASS}>
                      {BLOTTER_PARTIES.respondentTitle}{" "}
                      <span className="font-normal normal-case text-slate-400">({BLOTTER_PARTIES.respondentSubtitle})</span>
                    </p>
                    <div className={READ_ONLY_BOX}>{viewRecord.respondent || "—"}</div>
                    {viewRecord.respondentAddress ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{viewRecord.respondentAddress}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={LABEL_CLASS}>Date</p>
                    <div className={READ_ONLY_BOX}>
                      {viewRecord.date ? new Date(viewRecord.date).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                    </div>
                  </div>
                  <div>
                    <p className={LABEL_CLASS}>Time</p>
                    <div className={READ_ONLY_BOX}>{viewRecord.incidentTime || "—"}</div>
                  </div>
                </div>
                {viewRecord.incidentLocation ? (
                  <div>
                    <p className={LABEL_CLASS}>Location</p>
                    <div className={READ_ONLY_BOX}>{viewRecord.incidentLocation}</div>
                  </div>
                ) : null}
                <div>
                  <p className={LABEL_CLASS}>Narrative</p>
                  <div className={`${READ_ONLY_BOX} min-h-[60px] whitespace-pre-wrap`}>{viewRecord.narrative || "—"}</div>
                </div>
                <div>
                  <p className={LABEL_CLASS}>Action taken</p>
                  <div className={`${READ_ONLY_BOX} min-h-[44px] whitespace-pre-wrap`}>{viewRecord.actionTaken || "—"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(viewRecord.status)}`}>
                    {viewRecord.status || "—"}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200/80 px-5 py-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewRecord(null)}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:w-auto sm:px-6"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm.show && (
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
              className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete record?</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    This blotter entry will be removed permanently. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            className="pointer-events-none fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-lg ${
                toast.type === "success"
                  ? "border-emerald-200/80 bg-white dark:border-emerald-900/40 dark:bg-slate-900"
                  : "border-red-200/80 bg-white dark:border-red-900/40 dark:bg-slate-900"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlotterPanel;
