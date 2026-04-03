import React, { useState, useRef, useEffect } from "react";
import { motion ,AnimatePresence} from "framer-motion";
import { UserPlus, Printer, Edit2, Eye, Trash2, X ,Users, MapPin, Briefcase, Phone, Calendar,ClipboardList,Clock } from "lucide-react";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";

const READ_ONLY_FIELD =
  "flex min-h-[42px] w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100";

function Modal({ isOpen, onClose, title, icon: Icon, children, center = false, extraActions = null }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] md:items-center md:p-4">
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className={`max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:rounded-2xl ${
          center ? "text-center" : ""
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-5 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:static">
          <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {Icon && <Icon className="h-5 w-5 shrink-0 text-blue-600 dark:text-cyan-400" />}
            <span className="min-w-0">{title}</span>
          </h3>
          <div className="flex items-center gap-2">
            {extraActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="max-h-[min(32rem,75vh)] overflow-y-auto overscroll-contain p-5 sm:p-6 md:max-h-[calc(90vh-5rem)]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Main Component
const todayDateString = () => new Date().toISOString().split("T")[0];

const createOfficialTemplate = () => ({
  name: "",
  position: "",
  age: "",
  contact: "",
  address: "",
  responsibilities: "",
  image: "",
  gender: "",
  status: "Active",
  startTerm: todayDateString(),
  endTerm: "",
});

const normalizePhoneInput = (value = "") => value.replace(/\D/g, "").slice(0, 11);
const isValidPhoneNumber = (value = "") => normalizePhoneInput(value).length === 11;

const prepareOfficialForEdit = (official = {}) => ({
  ...official,
  startTerm: official.startTerm || official.createdAt || new Date().toISOString(),
});

export default function OfficialPanel() {
  const [officials, setOfficials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewOfficial, setViewOfficial] = useState(null);
  const [editOfficial, setEditOfficial] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [officialToDelete, setOfficialToDelete] = useState(null);
  const [newOfficial, setNewOfficial] = useState(createOfficialTemplate());
  const printRef = useRef();
  const [toast, setToast] = useState({ message: "", type: "" });
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [oldOfficials, setOldOfficials] = useState([]);
  const [showOldModal, setShowOldModal] = useState(false);
  const [residents, setResidents] = useState([]);
  const [selectedSource, setSelectedSource] = useState(""); // "resident" or "official"
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedEditResidentId, setSelectedEditResidentId] = useState("");


  


  // Fetch data from backend
  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const res = await fetch(`${API_URL}/api/officials`);
        const data = await res.json();

        // 🆕 Auto-move officials with status "Old"
        const active = data.filter(o => o.status !== "Old");
        const old = data.filter(o => o.status === "Old");
        setOfficials(active);
        setOldOfficials(old);

      } catch (err) {
        console.error("Failed to fetch officials:", err);
      }
    };
    fetchOfficials();
  }, []);

  // Fetch residents for auto-fill (with profile images)
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        // Fetch residents with images included
        const res = await fetch(`${API_URL}/api/residents?includeImages=true`);
        const data = await res.json();
        // Filter only Active residents
        const activeResidents = data.filter(r => r.status === "Active");
        setResidents(activeResidents);
      } catch (err) {
        console.error("Failed to fetch residents:", err);
        // Fallback: try without images
        try {
          const res = await fetch(`${API_URL}/api/residents`);
          const data = await res.json();
          const activeResidents = data.filter(r => r.status === "Active");
          setResidents(activeResidents);
        } catch (fallbackErr) {
          console.error("Failed to fetch residents (fallback):", fallbackErr);
        }
      }
    };
    fetchResidents();
  }, []);

  // 🆕 Fetch old officials separately
useEffect(() => {
  const fetchOldOfficials = async () => {
    try {
      const res = await fetch(`${API_URL}/api/officials/old`);
      if (!res.ok) throw new Error("Failed to fetch old officials");
      const data = await res.json();
      setOldOfficials(data);
    } catch (err) {
      console.error("Failed to fetch old officials:", err);
    }
  };
  fetchOldOfficials();
}, []);



    // 🆕 Check if any official becomes "Old" → move automatically
  useEffect(() => {
    const [active, old] = officials.reduce(
      ([a, o], off) => {
        if (off.status === "Old") o.push(off);
        else a.push(off);
        return [a, o];
      },
      [[], []]
    );
    if (old.length > 0) {
      setOfficials(active);
      setOldOfficials(prev => [...prev, ...old]);
    }
  }, [officials]);



// ADD
const handleAddOfficial = async (e) => {
  e.preventDefault();

  try {
    if (!selectedPersonId || selectedSource !== "resident") {
      setToast({
        message: "Please select a resident — name and contact come from the resident record.",
        type: "error",
      });
      return;
    }

    // Validate position is not duplicate (only check active officials)
    if (newOfficial.position) {
      const existingOfficial = officials.find(
        o => o.position === newOfficial.position && o.status !== "Old"
      );
      if (existingOfficial) {
        setToast({ 
          message: `Position "${newOfficial.position}" is already assigned to ${existingOfficial.name}. Please choose a different position.`, 
          type: "error" 
        });
        return;
      }
    }

    const cleanedContact = normalizePhoneInput(newOfficial.contact || "");
    if (!isValidPhoneNumber(cleanedContact)) {
      setToast({ message: contactErrorMessage, type: "error" });
      return;
    }
    const payload = { ...newOfficial, contact: cleanedContact };
    const response = await fetch(`${API_URL}/api/officials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to add official");
    const data = await response.json();

    // 🆕 If status is "Old", move directly to oldOfficials
      if (data.status === "Old") {
        setOldOfficials((prev) => [...prev, data]);
      } else {
        setOfficials((prev) => [...prev, data]);
      }
    setToast({ message: "Official added successfully!", type: "success" });
    setShowModal(false);
    setNewOfficial(createOfficialTemplate());
    setSelectedSource("");
    setSelectedPersonId("");
  } catch (error) {
    console.error(error);
    setToast({ message: "Error adding official.", type: "error" });
  }
};

// EDIT
  const handleEditOfficial = async (e) => {
    e.preventDefault();

    try {
      // Validate position is not duplicate (only check active officials, exclude current official)
      if (editOfficial.position) {
        const existingOfficial = officials.find(
          o => o.position === editOfficial.position && 
               o.status !== "Old" && 
               o._id !== editOfficial._id
        );
        if (existingOfficial) {
          setToast({ 
            message: `Position "${editOfficial.position}" is already assigned to ${existingOfficial.name}. Please choose a different position.`, 
            type: "error" 
          });
          return;
        }
      }

      const cleanedContact = normalizePhoneInput(editOfficial.contact || "");
      if (!isValidPhoneNumber(cleanedContact)) {
        setToast({ message: contactErrorMessage, type: "error" });
        return;
      }
      const payload = { ...editOfficial, contact: cleanedContact };
      const response = await fetch(`${API_URL}/api/officials/${editOfficial._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update official");
      const updated = await response.json();

      // 🆕 Move updated to old list if marked "Old"
      if (updated.status === "Old") {
        setOfficials(prev => prev.filter(o => o._id !== updated._id));
        setOldOfficials(prev => [...prev, updated]);
      } else {
        setOfficials(prev => prev.map(o => (o._id === updated._id ? updated : o)));
      }

      setToast({ message: "Official updated!", type: "success" });
      setEditOfficial(null);
      setSelectedEditResidentId("");
    } catch (error) {
      console.error(error);
      setToast({ message: "Error updating official.", type: "error" });
    }
  };

// DELETE
const handleDeleteOfficial = async (id) => {
  try {
    await fetch(`${API_URL}/api/officials/${id}`, { method: "DELETE" }); // fixed URL
    setOfficials((prev) => prev.filter((o) => o._id !== id)); // fixed _id
    setToast({ message: "Official deleted.", type: "success" });
  } catch (error) {
    console.error(error);
    setToast({ message: "Error deleting official.", type: "error" });
  }
};


  // 🧩 Unified image upload, validation, and compression
const handleImageUpload = (e, setter) => {
  const file = e.target.files[0];
  if (!file) return;

  // 🧠 1️⃣ Validate file type
  if (!file.type.startsWith("image/")) {
    setToast({ message: "Please upload a valid image file (JPG, PNG, etc.)", type: "error" });
    return;
  }

  // 🧠 2️⃣ Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    setToast({ message: "Image too large (max 2MB). Please choose a smaller one.", type: "error" });
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result;

    // 🧠 3️⃣ Compress and resize before saving
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 400; // Adjust width for size/quality balance
      const scale = Math.min(1, MAX_WIDTH / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to compressed JPEG (70% quality)
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

      // 🧠 4️⃣ Save to state (works for both add/edit)
      setter(prev => ({ ...prev, image: compressedBase64 }));

      // 🧠 5️⃣ Show success toast
      setToast({ message: "Image uploaded successfully!", type: "success" });
    };

    img.onerror = () => {
      setToast({ message: "Failed to process image. Please try another file.", type: "error" });
    };
  };

  reader.onerror = () => {
    setToast({ message: "Error reading file. Please try again.", type: "error" });
  };

  reader.readAsDataURL(file);
};


  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  const formatYear = (value) => {
    if (!value) return "N/A";
    try {
      return new Date(value).getFullYear();
    } catch {
      return "N/A";
    }
  };

  const formatDateWithYear = (value) => {
    if (!value) return "N/A";
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "N/A";
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}, ${year}`;
    } catch {
      return "N/A";
    }
  };

  const getStartTermSource = (official = {}) =>
    official.startTerm || official.createdAt || official.updatedAt || null;

  const getEndTermSource = (official = {}) =>
    official.endTerm || official.updatedAt || official.startTerm || null;

  const toDateInputValue = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  const contactErrorMessage = "Contact number must be exactly 11 digits.";

  // Auto-fill from resident or official
  const handleAutoFill = async (source, personId) => {
    if (!personId) {
      setNewOfficial(createOfficialTemplate());
      setSelectedSource("");
      setSelectedPersonId("");
      return;
    }

    if (source === "resident") {
      // First try to find in cached residents
      let resident = residents.find(r => r._id === personId);
      
      // If resident found but no profile image, fetch full resident data
      if (resident && !resident.profileImageBase64) {
        try {
          const res = await fetch(`${API_URL}/api/residents/${personId}`);
          if (res.ok) {
            const fullData = await res.json();
            resident = fullData;
          }
        } catch (err) {
          console.error("Error fetching resident details:", err);
        }
      }
      
      if (resident) {
        const fullName = `${resident.firstName || ""} ${resident.middleName || ""} ${resident.lastName || ""}`.trim();
        // Map purok to the exact format used in the dropdown
        let address = "";
        if (resident.purok) {
          // Normalize purok format (handle both "Purok-1", "Purok 1", "Purok-1", etc.)
          const purokNum = resident.purok.replace(/[^0-9]/g, "");
          if (purokNum && ["1", "2", "3", "4", "5"].includes(purokNum)) {
            address = `Purok ${purokNum}, Barangay Victory`;
          } else {
            // If purok doesn't match dropdown options, use the purok value as-is
            address = `${resident.purok}, Barangay Victory`;
          }
        } else {
          // Default address if no purok
          address = "";
        }
        
        // Extract profile image - backend should provide profileImageBase64
        // If not available, try to get it from the full data fetch
        let profileImage = resident.profileImageBase64 || "";
        
        setNewOfficial({
          ...createOfficialTemplate(),
          name: fullName,
          age: resident.age || "",
          contact: normalizePhoneInput(resident.phone || ""),
          gender: resident.gender || "",
          address: address,
          image: profileImage,
        });
        setSelectedSource("resident");
        setSelectedPersonId(personId);
        
        if (profileImage) {
          setToast({ message: "Resident information and profile image loaded!", type: "success" });
        } else {
          setToast({ message: "Resident information loaded. No profile image available.", type: "success" });
        }
      }
    } else if (source === "official") {
      const official = officials.find(o => o._id === personId) || oldOfficials.find(o => o._id === personId);
      if (official) {
        setNewOfficial({
          ...createOfficialTemplate(),
          name: official.name || "",
          age: official.age || "",
          contact: official.contact || "",
          gender: official.gender || "",
          address: official.address || "",
          position: official.position || "",
          responsibilities: official.responsibilities || "",
          image: official.image || "",
          startTerm: official.startTerm || todayDateString(),
          endTerm: official.endTerm || "",
        });
        setSelectedSource("official");
        setSelectedPersonId(personId);
      }
    }
  };

  const handleEditResidentSelect = async (personId) => {
    if (!personId) {
      setSelectedEditResidentId("");
      return;
    }
    let resident = residents.find((r) => r._id === personId);
    if (resident && !resident.profileImageBase64) {
      try {
        const res = await fetch(`${API_URL}/api/residents/${personId}`);
        if (res.ok) resident = await res.json();
      } catch (err) {
        console.error("Error fetching resident details:", err);
      }
    }
    if (!resident) return;

    const fullName = `${resident.firstName || ""} ${resident.middleName || ""} ${resident.lastName || ""}`.trim();
    let address = "";
    if (resident.purok) {
      const purokNum = resident.purok.replace(/[^0-9]/g, "");
      if (purokNum && ["1", "2", "3", "4", "5"].includes(purokNum)) {
        address = `Purok ${purokNum}, Barangay Victory`;
      } else {
        address = `${resident.purok}, Barangay Victory`;
      }
    }
    const profileImage = resident.profileImageBase64 || "";

    setEditOfficial((prev) =>
      prev
        ? {
            ...prev,
            name: fullName,
            age: resident.age !== undefined && resident.age !== null && resident.age !== "" ? resident.age : prev.age,
            contact: normalizePhoneInput(resident.phone || ""),
            gender: resident.gender || prev.gender,
            address: address || prev.address,
            image: profileImage || prev.image,
          }
        : prev
    );
    setSelectedEditResidentId(personId);
  };

  const buildPrintLayout = ({
    contentHTML,
    reportTitle = "Barangay Officials Report",
    description = "Barangay Victory is a dedicated community in Tubay, Agusan del Norte, striving to provide excellent public service and promote sustainable local governance.",
    subheading = "Official Information Report",
  }) => {
    const now = new Date();
    const docNumber = now.getTime();
    const printedOn = now.toLocaleString();
    return `
      <html>
        <head>
          <title>${reportTitle}</title>
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
            .header-center h1 { font-size: 22px; font-weight: bold; margin: 0; }
            .header-center h2 { font-size: 20px; margin: 0; }
            .header-center h3 { font-size: 18px; font-weight: 600; margin: 0; }
            .header-center p { margin: 5px 0; font-style: italic; font-size: 15px; }
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
            tr:nth-child(even) { background-color: #fafafa; }
            tr:hover { background-color: #f1f5f9; }
            .legal {
              margin-top: 25px;
              font-size: 13px;
              text-align: center;
              font-style: italic;
              color: #444;
            }
            .meta {
              text-align: center;
              font-size: 13px;
              color: #555;
              margin-bottom: 15px;
            }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              text-align: center;
            }
            .signature-block { width: 45%; }
            .signature-line {
              margin-top: 60px;
              border-top: 1px solid #000;
              padding-top: 5px;
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
                <h2>Municipality of Tubay</h2>
                <h3>Barangay Victory</h3>
                <p><strong>${subheading}</strong></p>
                <p>Document No.: ${docNumber}</p>
              </div>
              <img src="${logo1}" alt="Barangay Logo Right" />
            </div>
            <hr />
            <div class="certificate-number">Printed on: ${printedOn}</div>
            <div class="description">${description}</div>
            ${contentHTML}
            <div class="legal">
              Remark: Approved by Barangay Victory Management System. This document is automatically generated.
            </div>
            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line">Barangay Captain</div>
                <small>Authorized Signatory</small>
              </div>
              <div class="signature-block">
                <div class="signature-line">Barangay Secretary</div>
                <small>Document Custodian</small>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const contentHTML = printRef.current.innerHTML;
    const template = buildPrintLayout({
      contentHTML,
      reportTitle: "Barangay Official Information Report",
      description:
        "Comprehensive profile of the selected barangay official, including position, responsibilities, and service record.",
    });
    const newWindow = window.open("", "", "width=900,height=700");
    newWindow.document.write(template);
    newWindow.document.close();
    newWindow.print();
  };

  const handlePrintOldOfficials = () => {
    if (!oldOfficials.length) {
      setToast({ message: "No old officials to print.", type: "error" });
      return;
    }
    const rows = oldOfficials
      .map(
        (official, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${official.name || ""}</td>
            <td>${official.position || ""}</td>
            <td>Old</td>
            <td>${formatDateWithYear(getStartTermSource(official))}</td>
            <td>${formatDateWithYear(getEndTermSource(official))}</td>
            <td>${official.contact || "N/A"}</td>
          </tr>
        `
      )
      .join("");

    const tableHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Position</th>
            <th>Status</th>
            <th>Start Term</th>
            <th>End Term</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    const template = buildPrintLayout({
      contentHTML: tableHTML,
      reportTitle: "Barangay Old Officials Register",
      subheading: "Archived Officials Report",
      description:
        "Historical roster of barangay officials whose terms have concluded. This list provides accountability and transparency for leadership transitions.",
    });

    const newWindow = window.open("", "", "width=900,height=700");
    newWindow.document.write(template);
    newWindow.document.close();
    newWindow.print();
  };


    useEffect(() => {
      if (toast.message) {
       const timer = setTimeout(() => setToast({ message: "", type: "" }), 3000);
       return () => clearTimeout(timer);
  }
}, [toast]);


  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AnimatePresence>
          {toast.message && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed left-1/2 top-6 z-[60] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-lg ring-1 ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white ring-emerald-500/30"
                  : "bg-red-600 text-white ring-red-500/30"
              }`}
            >
              {toast.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-left">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Users className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Barangay officials
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Manage the current roster, terms, and records. Add from verified residents or review former officials.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              {officials.length} active
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {oldOfficials.length} archived
            </span>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <UserPlus className="h-4 w-4" />
              Add official
            </button>
            <button
              type="button"
              onClick={() => setShowOldModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              <Clock className="h-4 w-4" />
              Archived roster
            </button>
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {officials.length > 0 ? (
            officials.map((official, idx) => (
              <motion.div
                key={official._id || idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600"
              >
                <div className="text-center">
                  <div className="mx-auto w-fit rounded-full p-0.5 ring-2 ring-slate-100 dark:ring-slate-700">
                    <img
                      src={official.image || "https://via.placeholder.com/100"}
                      alt={official.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                    {official.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{official.position}</p>
                </div>

                <div className="mt-3 flex justify-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                      official.status === "Old"
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    {official.status || "Active"}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-center gap-1 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewOfficial(official)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const prepared = prepareOfficialForEdit(official);
                      setEditOfficial(prepared);
                      const match = residents.find((r) => {
                        const fn = `${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.trim();
                        return fn === (prepared.name || "").trim();
                      });
                      setSelectedEditResidentId(match?._id || "");
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficialToDelete(official);
                      setDeleteModal(true);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 dark:border-slate-700 dark:bg-slate-800/20">
              <Users className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active officials yet</p>
              <p className="mt-1 max-w-sm text-center text-xs text-slate-500 dark:text-slate-500">
                Add an official from the resident list to build your roster.
              </p>
            </div>
          )}
        </div>

       {/* Add Modal */}
<Modal
  isOpen={showModal}
  onClose={() => {
    setShowModal(false);
    setNewOfficial(createOfficialTemplate());
    setSelectedSource("");
    setSelectedPersonId("");
  }}
  title="Add Official"
  icon={UserPlus} // 🆕 icon prop
>
  <form onSubmit={handleAddOfficial} className="space-y-6">
    {/* Auto-fill from Resident and Position */}
    <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/25">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        Quick fill
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">From resident</label>
          <select
            required
            className={FIELD_CLASS}
            value={selectedSource === "resident" ? selectedPersonId : ""}
            onChange={(e) => {
              if (e.target.value) {
                handleAutoFill("resident", e.target.value);
              } else {
                setNewOfficial(createOfficialTemplate());
                setSelectedSource("");
                setSelectedPersonId("");
              }
            }}
          >
            <option value="">Select a resident...</option>
            {residents.map((r) => {
              const fullName = `${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.trim();
              return (
                <option key={r._id} value={r._id}>
                  {fullName} {r.phone ? `(${r.phone})` : ""}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">Position</label>
          <select
            className={FIELD_CLASS}
            value={newOfficial.position}
            onChange={(e) => setNewOfficial({ ...newOfficial, position: e.target.value })}
            required
          >
            <option value="">Select Position</option>
            <option>Barangay Captain</option>
            <option>Barangay Secretary</option>
            <option>Barangay Treasurer</option>
            <option>Kagawad - Peace & Order</option>
            <option>Kagawad - Health & Sanitation</option>
            <option>Kagawad - Education</option>
            <option>Kagawad - Agriculture</option>
            <option>SK Chairman</option>
          </select>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Name and contact come from the selected resident record.
      </p>
    </div>

    {/* Grid for inputs */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">Full name</label>
        <div className={READ_ONLY_FIELD}>
          {newOfficial.name ? (
            <span className="break-words">{newOfficial.name}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Select a resident above</span>
          )}
        </div>
      </div>
      <input
        type="number"
        placeholder="Age"
        className={FIELD_CLASS}
        value={newOfficial.age}
        onChange={(e) => setNewOfficial({ ...newOfficial, age: e.target.value })}
      />
      <div>
        <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">Contact number</label>
        <div className={READ_ONLY_FIELD}>
          {newOfficial.contact ? (
            <span>{newOfficial.contact}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Select a resident above</span>
          )}
        </div>
      </div>
      <select
        className={FIELD_CLASS}
        value={newOfficial.gender || ""}
        onChange={(e) => setNewOfficial({ ...newOfficial, gender: e.target.value })}
      >
        <option value="">Select Gender</option>
        <option>Male</option>
        <option>Female</option>
      </select>
      <select
        className={FIELD_CLASS}
        value={newOfficial.address}
        onChange={(e) => setNewOfficial({ ...newOfficial, address: e.target.value })}
      >
        <option value="">Select Address</option>
        <option>Purok 1, Barangay Victory</option>
        <option>Purok 2, Barangay Victory</option>
        <option>Purok 3, Barangay Victory</option>
        <option>Purok 4, Barangay Victory</option>
        <option>Purok 5, Barangay Victory</option>
      </select>
    </div>

    <textarea
      placeholder="Responsibilities"
      className={`${FIELD_CLASS} min-h-[5.5rem] resize-y py-3`}
      value={newOfficial.responsibilities}
      onChange={(e) => setNewOfficial({ ...newOfficial, responsibilities: e.target.value })}
    />

    {/* 🆕 Status dropdown */}
          <select
            className={FIELD_CLASS}
            value={newOfficial.status}
            onChange={(e) => setNewOfficial({ ...newOfficial, status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="Old">Old</option>
          </select>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Start term
        </label>
        <input
          type="date"
          className={FIELD_CLASS}
          value={newOfficial.startTerm}
          onChange={(e) => setNewOfficial({ ...newOfficial, startTerm: e.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          End term
        </label>
        <input
          type="date"
          className={FIELD_CLASS}
          value={newOfficial.endTerm}
          onChange={(e) => setNewOfficial({ ...newOfficial, endTerm: e.target.value })}
        />
      </div>
    </div>

    {/* Image Upload */}
    <div className="flex flex-col items-center">
      <label className="mb-2 block text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Profile image
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, setNewOfficial)}
        className="w-full md:w-1/2"
      />
      {newOfficial.image && (
        <div className="mt-4 flex flex-col items-center">
          <img
            src={newOfficial.image}
            alt="Preview"
            className="w-28 h-28 rounded-full border-2 border-indigo-600 object-cover"
          />
          {selectedSource === "resident" && (
            <p className="mt-2 text-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Image from resident profile
            </p>
          )}
        </div>
      )}
    </div>

    <button
      type="submit"
      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 dark:shadow-blue-900/30"
    >
      Save official
    </button>
  </form>
</Modal>

     {/* View Modal */}
<Modal
  isOpen={!!viewOfficial}
  onClose={() => setViewOfficial(null)}
  title={
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
        <span>Official Information</span>
      </div>
    </div>
  }
  center
>
  {viewOfficial && (
    <>
      <div className="flex justify-end mb-4 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Print record
        </button>
      </div>

      <div
        ref={printRef}
        className="text-slate-800 dark:text-slate-200 print:text-black"
      >
        <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50 print:border print:shadow-none">
          <header className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-5 py-6 sm:px-8 sm:py-8 text-white print:bg-slate-900">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/60">
              Barangay Victory · Official record
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl break-words">
                  {viewOfficial.name || "—"}
                </h2>
                <p className="mt-1.5 flex items-center gap-2 text-sm text-indigo-200/95">
                  <Briefcase className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="font-medium">{viewOfficial.position || "—"}</span>
                </p>
              </div>
              <span
                className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  viewOfficial.status === "Old"
                    ? "bg-white/15 text-white ring-1 ring-white/25"
                    : "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40"
                }`}
              >
                {viewOfficial.status === "Old" ? "Former official" : "Active"}
              </span>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
              <div className="flex justify-center lg:justify-start shrink-0">
                <div className="relative">
                  {viewOfficial.image ? (
                    <img
                      src={viewOfficial.image}
                      alt={viewOfficial.name || "Official photo"}
                      className="h-36 w-36 rounded-2xl object-cover shadow-lg ring-4 ring-slate-100 dark:ring-slate-800 sm:h-40 sm:w-40"
                    />
                  ) : (
                    <div
                      className="flex h-36 w-36 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-slate-700 text-3xl font-bold text-white shadow-lg sm:h-40 sm:w-40"
                      aria-hidden
                    >
                      {(viewOfficial.name || "?").trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-8">
                <section>
                  <h3 className="mb-4 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Personal information
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Users className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        Gender
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        {viewOfficial.gender || "—"}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        Age
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        {viewOfficial.age != null && viewOfficial.age !== "" ? viewOfficial.age : "—"}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        Contact
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                        {viewOfficial.contact || "—"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        Address
                      </dt>
                      <dd className="mt-1 text-sm font-medium leading-relaxed text-slate-900 dark:text-white">
                        {viewOfficial.address || "—"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3 className="mb-4 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Term of office
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Start of term
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                        {formatDate(viewOfficial.startTerm)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        End of term
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                        {viewOfficial.endTerm
                          ? formatDate(viewOfficial.endTerm)
                          : viewOfficial.status === "Old"
                            ? "Term ended"
                            : "Currently serving"}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      Responsibilities
                    </span>
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-300 whitespace-pre-wrap">
                    {viewOfficial.responsibilities?.trim() ? viewOfficial.responsibilities : "No responsibilities on file."}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  )}
</Modal>


{/* Edit Modal */}
<Modal
  isOpen={!!editOfficial}
  onClose={() => {
    setEditOfficial(null);
    setSelectedEditResidentId("");
  }}
  title="Edit Official"
  icon={Edit2} // optional icon
>
  {editOfficial && (
    <form onSubmit={handleEditOfficial} className="space-y-6">
      <div className="space-y-3 rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/25">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Resident (sync name, contact, and related fields)
        </label>
        <select
          className={FIELD_CLASS}
          value={selectedEditResidentId}
          onChange={(e) => handleEditResidentSelect(e.target.value)}
        >
          <option value="">Select a resident to refresh details…</option>
          {residents.map((r) => {
            const fullName = `${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.trim();
            return (
              <option key={r._id} value={r._id}>
                {fullName} {r.phone ? `(${r.phone})` : ""}
              </option>
            );
          })}
        </select>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">Full name</label>
            <div className={READ_ONLY_FIELD}>
              {editOfficial.name ? (
                <span className="break-words">{editOfficial.name}</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">—</span>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">Contact number</label>
            <div className={READ_ONLY_FIELD}>
              {editOfficial.contact ? (
                <span>{editOfficial.contact}</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Select a resident above</span>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Name and contact are not typed here — pick a resident to refresh from records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className={FIELD_CLASS}
          value={editOfficial.position || ""}
          onChange={(e) => setEditOfficial({ ...editOfficial, position: e.target.value })}
        >
          <option value="">Select Position</option>
          <option>Barangay Captain</option>
          <option>Barangay Secretary</option>
          <option>Barangay Treasurer</option>
          <option>Kagawad - Peace & Order</option>
          <option>Kagawad - Health & Sanitation</option>
          <option>Kagawad - Education</option>
          <option>Kagawad - Agriculture</option>
          <option>SK Chairman</option>
        </select>
        <input
          type="number"
          placeholder="Age"
          className={FIELD_CLASS}
          value={editOfficial.age ?? ""}
          onChange={(e) => setEditOfficial({ ...editOfficial, age: e.target.value })}
        />
        <select
          className={FIELD_CLASS}
          value={editOfficial.gender || ""}
          onChange={(e) => setEditOfficial({ ...editOfficial, gender: e.target.value })}
        >
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <select
          className={FIELD_CLASS}
          value={editOfficial.address || ""}
          onChange={(e) => setEditOfficial({ ...editOfficial, address: e.target.value })}
        >
          <option value="">Select Address</option>
          <option>Purok 1, Barangay Victory</option>
          <option>Purok 2, Barangay Victory</option>
          <option>Purok 3, Barangay Victory</option>
          <option>Purok 4, Barangay Victory</option>
          <option>Purok 5, Barangay Victory</option>
        </select>
        <select
          className={`${FIELD_CLASS} md:col-span-2`}
          value={editOfficial.status || "Active"}
          onChange={(e) => setEditOfficial({ ...editOfficial, status: e.target.value })}
        >
          <option value="Active">Active</option>
          <option value="Old">Old</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Start term
        </label>
          <input
            type="date"
            className={FIELD_CLASS}
            value={toDateInputValue(editOfficial.startTerm)}
            onChange={(e) => setEditOfficial({ ...editOfficial, startTerm: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            End term
          </label>
          <input
            type="date"
            className={FIELD_CLASS}
            value={toDateInputValue(editOfficial.endTerm)}
            onChange={(e) => setEditOfficial({ ...editOfficial, endTerm: e.target.value })}
          />
        </div>
      </div>

      <textarea
        placeholder="Responsibilities"
        className={`${FIELD_CLASS} min-h-[5.5rem] resize-y py-3`}
        value={editOfficial.responsibilities}
        onChange={(e) => setEditOfficial({ ...editOfficial, responsibilities: e.target.value })}
      />


      {/* Image Upload */}
      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, setEditOfficial)}
          className="w-full md:w-1/2"
        />
        {editOfficial.image && (
          <img
            src={editOfficial.image}
            alt="Preview"
            className="mt-4 h-28 w-28 rounded-full object-cover ring-2 ring-blue-600/30 dark:ring-cyan-500/40"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-slate-900 hover:to-black dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700"
      >
        Save changes
      </button>
    </form>
  )}
</Modal>



   {/* Delete Modal */}
<Modal
  isOpen={deleteModal}
  onClose={() => setDeleteModal(false)}
  title="Confirm Deletion"
  center
>
  <div className="space-y-6 text-center">
    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
      Remove{" "}
      <strong className="font-semibold text-slate-900 dark:text-white">
        {officialToDelete?.name}
      </strong>
      ? This cannot be undone.
    </p>

    <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-3">
      <button
        type="button"
        onClick={() => setDeleteModal(false)}
        className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          if (officialToDelete?._id) handleDeleteOfficial(officialToDelete._id);
          setDeleteModal(false);
        }}
        className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
      >
        Delete official
      </button>
    </div>
  </div>
</Modal>


{/* Archived officials */}
<Modal
  isOpen={showOldModal}
  onClose={() => setShowOldModal(false)}
  title="Archived officials"
  icon={Clock}
  extraActions={
    <button
      type="button"
      onClick={handlePrintOldOfficials}
      className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-cyan-950/40"
      title="Print register"
    >
      <Printer className="h-5 w-5" />
    </button>
  }
>
  {oldOfficials.length > 0 ? (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {oldOfficials.map((official) => (
        <li
          key={official._id}
          className="flex items-center gap-4 py-4 first:pt-0"
        >
          <img
            src={official.image || logo}
            alt={official.name}
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-600"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {official.name}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{official.position}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                <span className="font-medium text-slate-600 dark:text-slate-300">Start</span>{" "}
                {formatDateWithYear(getStartTermSource(official))}
              </span>
              <span>
                <span className="font-medium text-slate-600 dark:text-slate-300">End</span>{" "}
                {formatDateWithYear(getEndTermSource(official))}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setViewOfficial(official);
              setShowOldModal(false);
            }}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
            title="View record"
          >
            <Eye className="h-5 w-5" />
          </button>
        </li>
      ))}
    </ul>
  ) : (
    <div className="py-12 text-center">
      <Clock className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-600" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No archived officials yet</p>
    </div>
  )}
</Modal>

      </div>
    </div>
  );
}





