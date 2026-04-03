import React, { useState, useEffect } from "react";
import Modal from "../admin_components/Modal";
import { motion } from "framer-motion";
import { PlusCircle, Users, Trash2, Eye, House, Edit2, CheckCircle, AlertTriangle, XCircle, Search, Phone, UserCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { BmsToaster } from "../components/BmsToaster";
import { API_BASE } from "../utils/apiBase";
const API_URL = API_BASE;
const normalizePhone = (value = "") => value.replace(/\D/g, "").slice(0, 11);
const isValidPhone = (value = "") => normalizePhone(value).length === 11;

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";
const READ_ONLY_FIELD =
  "flex min-h-[50px] w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100";
const LABEL_CLASS =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export default function PurokPanel() {
  const [puroks, setPuroks] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedPurok, setSelectedPurok] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPurok, setNewPurok] = useState({ name: "", president: "", presidentPhone: "", presidentId: "" });
  const [purokToDelete, setPurokToDelete] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [editPurok, setEditPurok] = useState(null);
  const [selectedPresidentId, setSelectedPresidentId] = useState("");
  const [selectedEditPresidentId, setSelectedEditPresidentId] = useState("");
  const [residentSearchTerm, setResidentSearchTerm] = useState("");
  const [residentStatusFilter, setResidentStatusFilter] = useState("all");

  // Purok options (1-6)
  const purokOptions = ["Purok - 1", "Purok - 2", "Purok - 3", "Purok - 4", "Purok - 5", "Purok - 6"];

  // Normalize purok name for flexible matching
  // Handles: "Purok 1", "Purok-1", "Purok - 1", "purok 1", etc.
  const normalizePurokName = (name) => {
    if (!name) return "";
    return name
      .trim()
      .toLowerCase()
      .replace(/\s*-\s*/g, " ") // Replace " - " or "-" with space
      .replace(/\s+/g, " ")     // Normalize multiple spaces to single space
      .replace(/^purok\s*/i, "purok "); // Ensure "purok" prefix
  };

  // Get active residents for president selection
  const activeResidents = residents.filter(r => r.status === "Active");

  // Handle president selection from residents
  const handlePresidentSelect = (residentId) => {
    if (!residentId) {
      setSelectedPresidentId("");
      setNewPurok((prev) => ({
        ...prev,
        president: "",
        presidentPhone: "",
        presidentId: "",
      }));
      return;
    }
    const resident = activeResidents.find(r => (r._id || r.id) === residentId);
    if (resident) {
      setSelectedPresidentId(residentId);
      setNewPurok((prev) => ({
        ...prev,
        president: `${resident.firstName} ${resident.lastName}`.trim(),
        presidentPhone: normalizePhone(resident.phone || ""),
        presidentId: residentId,
      }));
    }
  };

  // Handle president selection for edit
  const handleEditPresidentSelect = (residentId) => {
    if (!editPurok) return;
    if (!residentId) {
      setSelectedEditPresidentId("");
      setEditPurok((prev) => ({
        ...prev,
        president: "",
        presidentPhone: "",
        presidentId: "",
      }));
      return;
    }
    const resident = activeResidents.find(r => (r._id || r.id) === residentId);
    if (resident) {
      setSelectedEditPresidentId(residentId);
      setEditPurok((prev) => ({
        ...prev,
        president: `${resident.firstName} ${resident.lastName}`.trim(),
        presidentPhone: normalizePhone(resident.phone || ""),
        presidentId: residentId,
      }));
    }
  };

  useEffect(() => {
    fetchPuroks();
    fetchResidents();
  }, []);

  const fetchPuroks = async () => {
    try {
      const res = await fetch(`${API_URL}/puroks`);
      const data = await res.json();
      setPuroks(data);
    } catch (error) {
      console.error("Error fetching puroks:", error);
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" /> Failed to fetch puroks.
        </div>,
        { style: { background: "#fee2e2", color: "#b91c1c" } }
      );
    }
  };

  const fetchResidents = async () => {
    try {
      // Fetch residents with profile images
      const res = await fetch(`${API_URL}/residents?includeImages=true`);
      const data = await res.json();
      // Filter to only get residents (not admins) and ensure we have all residents
      const allResidents = Array.isArray(data) ? data.filter(r => r.role === "resident" || !r.role) : [];
      setResidents(allResidents);
      console.log("Fetched residents:", allResidents.length);
      console.log("Sample puroks:", allResidents.slice(0, 10).map(r => ({ name: `${r.firstName} ${r.lastName}`, purok: r.purok })));
    } catch (error) {
      console.error("Error fetching residents:", error);
      // Fallback: try without images
      try {
        const res = await fetch(`${API_URL}/residents`);
        const data = await res.json();
        const allResidents = Array.isArray(data) ? data.filter(r => r.role === "resident" || !r.role) : [];
        setResidents(allResidents);
      } catch (fallbackError) {
        console.error("Error fetching residents (fallback):", fallbackError);
        toast.error(
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Failed to fetch residents.
          </div>,
          { style: { background: "#fef9c3", color: "#92400e" } }
        );
      }
    }
  };

  const handleAddPurok = async (e) => {
    e.preventDefault();
    if (!newPurok.name || !newPurok.president || !newPurok.presidentPhone) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Please fill all fields.
        </div>,
        { style: { background: "#fef9c3", color: "#92400e" } }
      );
      return;
    }
    const cleanedPhone = normalizePhone(newPurok.presidentPhone);
    if (!isValidPhone(cleanedPhone)) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Contact number must be exactly 11 digits.
        </div>,
        {
          style: { background: "#fee2e2", color: "#991b1b" },
        }
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/puroks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPurok, presidentPhone: cleanedPhone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add purok");
      }
      await fetchPuroks();
      setNewPurok({ name: "", president: "", presidentPhone: "", presidentId: "" });
      setSelectedPresidentId("");
      setShowAddModal(false);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Purok added successfully!
        </div>,
        {
          duration: 2000,
          style: { background: "#dcfce7", color: "#166534" },
        }
      );
    } catch (error) {
      console.error("Error adding purok:", error);
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" /> {error.message}
        </div>,
        {
          duration: 2000,
          style: { background: "#fee2e2", color: "#991b1b" },
        }
      );
    }
  };

  const confirmRemovePurok = async () => {
    try {
      const res = await fetch(`${API_URL}/puroks/${purokToDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete purok");
      await fetchPuroks();
      setPurokToDelete(null);
      setSelectedPurok(null);
      toast.success(
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Purok removed successfully.
        </div>,
        {
          duration: 2000,
          style: { background: "#dcfce7", color: "#166534" },
        }
      );
    } catch (error) {
      console.error("Error deleting purok:", error);
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" /> {error.message}
        </div>,
        {
          duration: 2000,
          style: { background: "#fee2e2", color: "#991b1b" },
        }
      );
    }
  };

  const handleUpdatePurok = async (e) => {
    e.preventDefault();
    if (!editPurok?.president || !editPurok?.presidentPhone) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Please provide president name and contact.
        </div>,
        {
          style: { background: "#fef9c3", color: "#92400e" },
        }
      );
      return;
    }
    const cleanedPhone = normalizePhone(editPurok.presidentPhone);
    if (!isValidPhone(cleanedPhone)) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Contact number must be exactly 11 digits.
        </div>,
        {
          style: { background: "#fee2e2", color: "#991b1b" },
        }
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/puroks/${editPurok._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editPurok.name,
          president: editPurok.president,
          presidentPhone: cleanedPhone,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update purok");
      }
      await fetchPuroks();
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Purok updated successfully!
        </div>,
        {
          duration: 2000,
          style: { background: "#dcfce7", color: "#166534" },
        }
      );
      setEditPurok(null);
    } catch (error) {
      console.error("Error updating purok:", error);
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" /> {error.message}
        </div>,
        {
          duration: 2000,
          style: { background: "#fee2e2", color: "#991b1b" },
        }
      );
    }
  };

  const totalResidentsInPuroks = puroks.reduce((acc, p) => {
    const n = residents.filter((r) => {
      const residentPurok = normalizePurokName(r.purok);
      const purokName = normalizePurokName(p.name);
      if (!residentPurok || residentPurok === "n/a" || residentPurok === "") return false;
      return residentPurok === purokName;
    }).length;
    return acc + n;
  }, 0);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <BmsToaster position="top-center" reverseOrder={false} />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <House className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Barangay puroks
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Organize areas, assign purok presidents, and view residents by purok.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <House className="h-3.5 w-3.5 text-slate-400" />
              {puroks.length} {puroks.length === 1 ? "purok" : "puroks"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {totalResidentsInPuroks} mapped residents
            </span>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <PlusCircle className="h-4 w-4" />
              Add purok
            </button>
          </div>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {puroks.length > 0 ? (
            puroks.map((purok, idx) => {
              const purokResidents = residents.filter(
                (r) => {
                  const residentPurok = normalizePurokName(r.purok);
                  const purokName = normalizePurokName(purok.name);
                  
                  // Skip if resident purok is empty, "N/A", or null
                  if (!residentPurok || residentPurok === "n/a" || residentPurok === "") {
                    return false;
                  }
                  
                  return residentPurok === purokName;
                }
              );

              return (
                <motion.div
                  key={purok._id || idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-cyan-400">
                      <House className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{purok.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Purok area</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {purokResidents.length}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          President
                        </p>
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{purok.president}</p>
                      </div>
                    </div>
                    {purok.presidentPhone && (
                      <div className="mt-2 flex items-center gap-2 border-t border-slate-200/80 pt-2 dark:border-slate-700">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">{purok.presidentPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/80">
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4 text-slate-400" />
                      Residents
                    </span>
                    <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{purokResidents.length}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-1 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedPurok(purok)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const matchingResident = activeResidents.find(
                          (r) => `${r.firstName} ${r.lastName}`.trim() === purok.president
                        );
                        setEditPurok({
                          ...purok,
                          presidentPhone: normalizePhone(purok.presidentPhone || ""),
                          presidentId: matchingResident ? matchingResident._id || matchingResident.id : "",
                        });
                        setSelectedEditPresidentId(matchingResident ? matchingResident._id || matchingResident.id : "");
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurokToDelete(purok)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 dark:border-slate-700 dark:bg-slate-800/20">
              <House className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No puroks yet</p>
              <p className="mt-1 max-w-sm text-center text-xs text-slate-500 dark:text-slate-500">
                Add a purok to organize residents by area and assign a president.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <PlusCircle className="h-4 w-4" />
                Create first purok
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewPurok({ name: "", president: "", presidentPhone: "", presidentId: "" });
          setSelectedPresidentId("");
        }}
        title="Add purok"
        center
      >
        <form onSubmit={handleAddPurok} className="space-y-5">
          <div>
            <label className={LABEL_CLASS}>
              Purok name <span className="text-red-500">*</span>
            </label>
            <select
              required
              className={FIELD_CLASS}
              value={newPurok.name}
        onChange={(e) => {
          const selectedName = e.target.value;
          // Check if purok already exists
          const exists = puroks.find(p => p.name === selectedName);
          if (exists) {
            toast.error(
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> This purok already exists.
              </div>,
              { style: { background: "#fee2e2", color: "#991b1b" } }
            );
            return;
          }
          setNewPurok({ ...newPurok, name: selectedName });
        }}
      >
        <option value="">Select Purok</option>
        {purokOptions.map((purok) => (
          <option key={purok} value={purok} disabled={puroks.some(p => p.name === purok)}>
            {purok} {puroks.some(p => p.name === purok) ? "(Already exists)" : ""}
          </option>
        ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>
              President (from residents) <span className="text-red-500">*</span>
            </label>
            <select
              required
              className={FIELD_CLASS}
              value={selectedPresidentId}
              onChange={(e) => handlePresidentSelect(e.target.value)}
            >
              <option value="">Select president</option>
              {activeResidents.map((resident) => (
                <option key={resident._id || resident.id} value={resident._id || resident.id}>
                  {resident.firstName} {resident.lastName} — {resident.phone || "No phone"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>
              President name <span className="text-red-500">*</span>
            </label>
            <div className={READ_ONLY_FIELD}>
              {newPurok.president ? (
                <span>{newPurok.president}</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Select a president above</span>
              )}
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>
              President contact <span className="text-red-500">*</span>
            </label>
            <div className={READ_ONLY_FIELD}>
              {newPurok.presidentPhone ? (
                <span>{newPurok.presidentPhone}</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Select a president above</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setNewPurok({ name: "", president: "", presidentPhone: "", presidentId: "" });
                setSelectedPresidentId("");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <PlusCircle className="h-4 w-4" /> Save purok
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editPurok}
        onClose={() => {
          setEditPurok(null);
          setSelectedEditPresidentId("");
        }}
        title="Edit purok"
        center
      >
        {editPurok && (
          <form onSubmit={handleUpdatePurok} className="space-y-5">
            <div>
              <label className={LABEL_CLASS}>Purok name</label>
              <input type="text" value={editPurok.name} disabled className={`${FIELD_CLASS} cursor-not-allowed opacity-80`} />
            </div>
            <div>
              <label className={LABEL_CLASS}>
                President (from residents) <span className="text-red-500">*</span>
              </label>
              <select
                className={FIELD_CLASS}
                value={selectedEditPresidentId || editPurok.presidentId || ""}
                onChange={(e) => handleEditPresidentSelect(e.target.value)}
              >
                <option value="">Select president</option>
                {activeResidents.map((resident) => (
                  <option key={resident._id || resident.id} value={resident._id || resident.id}>
                    {resident.firstName} {resident.lastName} — {resident.phone || "No phone"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>
                President name <span className="text-red-500">*</span>
              </label>
              <div className={READ_ONLY_FIELD}>
                {editPurok.president ? (
                  <span>{editPurok.president}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Select a president above</span>
                )}
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>
                President contact <span className="text-red-500">*</span>
              </label>
              <div className={READ_ONLY_FIELD}>
                {editPurok.presidentPhone ? (
                  <span>{editPurok.presidentPhone}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Select a president above</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditPurok(null);
                  setSelectedEditPresidentId("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Edit2 className="h-4 w-4" /> Save changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedPurok}
        onClose={() => {
          setSelectedPurok(null);
          setResidentSearchTerm("");
          setResidentStatusFilter("all");
        }}
        title={selectedPurok ? `Residents — ${selectedPurok.name}` : "Residents"}
        size="xl"
        center
      >
        {selectedPurok && (() => {
    // More robust purok matching - handles different formats
    const purokResidents = residents.filter((r) => {
      if (r.status === "Rejected") return false;
      const residentPurok = normalizePurokName(r.purok);
      const selectedPurokName = normalizePurokName(selectedPurok.name);

      if (!residentPurok || residentPurok === "n/a" || residentPurok === "") {
        return false;
      }

      return residentPurok === selectedPurokName;
    });

    const filteredResidents = purokResidents.filter((resident) => {
      const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
      const matchesSearch =
        !residentSearchTerm || fullName.includes(residentSearchTerm.toLowerCase());

      const matchesStatus =
        residentStatusFilter === "all" ||
        resident.status?.toLowerCase() === residentStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    const stats = {
      total: purokResidents.length,
      active: purokResidents.filter((r) => r.status === "Active").length,
      pending: purokResidents.filter((r) => r.status === "Pending").length,
    };

          return (
            <>
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="min-w-0 break-words text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                    {selectedPurok.name}
                  </h3>
                  <span className="inline-flex w-fit shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                    {stats.total} {stats.total === 1 ? "resident" : "residents"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <span className="text-slate-500 dark:text-slate-400">President</span>
                    <p className="mt-0.5 font-medium break-words text-slate-900 dark:text-white">{selectedPurok.president}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-500 dark:text-slate-400">Contact</span>
                    <p className="mt-0.5 font-medium break-words text-slate-900 dark:text-white">
                      {selectedPurok.presidentPhone || "N/A"}
                    </p>
                  </div>
                </div>
                {stats.total === 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    No residents matched this purok. Ensure resident records use a purok value that matches “{selectedPurok.name}” (e.g. Purok 1, Purok-1, Purok - 1).
                  </div>
                )}
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-2xl">{stats.active}</div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Active</div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-center dark:border-amber-900/40 dark:bg-amber-950/30">
                  <div className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400 sm:text-2xl">{stats.pending}</div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Pending</div>
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name…"
                    className={`${FIELD_CLASS} pl-10`}
                    value={residentSearchTerm}
                    onChange={(e) => setResidentSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className={`${FIELD_CLASS} w-full shrink-0 sm:w-44`}
                  value={residentStatusFilter}
                  onChange={(e) => setResidentStatusFilter(e.target.value)}
                >
                  <option value="all">All (shown)</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="w-full">
                {filteredResidents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
                    {filteredResidents.map((resident) => {
                      const profileImage = resident.profileImageBase64 || resident.profileImage;
                      const name = `${resident.firstName} ${resident.lastName}`.trim();

                      return (
                        <motion.button
                          key={resident._id || resident.id}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          className="group flex cursor-pointer flex-col items-center rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600 sm:p-3"
                          onClick={() => setSelectedResident(resident)}
                        >
                          <div className="relative mb-2 shrink-0">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt={name}
                                className="h-14 w-14 rounded-full border-2 border-slate-100 object-cover shadow-sm sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] dark:border-slate-700"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const el = e.target.nextElementSibling;
                                  if (el) el.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-100 bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white shadow-sm sm:h-16 sm:w-16 sm:text-lg md:h-[4.5rem] md:w-[4.5rem] md:text-xl dark:border-slate-700 ${profileImage ? "hidden" : ""}`}
                            >
                              {resident.firstName?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          </div>
                          <span className="line-clamp-2 w-full break-words px-0.5 text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100 sm:text-sm">
                            {name || "—"}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {residentSearchTerm || residentStatusFilter !== "all"
                        ? "No residents match your filters."
                        : "No residents found in this purok."}
                    </p>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </Modal>

      <Modal
        isOpen={!!selectedResident}
        onClose={() => setSelectedResident(null)}
        title="Resident details"
        size="lg"
        center
      >
        {selectedResident && (() => {
          const profileImage = selectedResident.profileImageBase64 || selectedResident.profileImage;
          const statusPill = {
            Active: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300",
            Pending: "bg-amber-100 text-amber-900 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200",
            Rejected: "bg-red-100 text-red-800 ring-1 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300",
          };
          const statusClass =
            statusPill[selectedResident.status] ||
            "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300";

          return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-900 p-5 dark:from-slate-900 dark:to-slate-950">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={`${selectedResident.firstName} ${selectedResident.lastName}`}
                        className="h-24 w-24 rounded-full border-4 border-white/20 object-cover shadow-lg ring-2 ring-white/10"
                        onError={(e) => {
                          e.target.style.display = "none";
                          const sib = e.target.nextElementSibling;
                          if (sib) sib.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-bold text-white shadow-lg ring-2 ring-white/10 backdrop-blur-sm ${profileImage ? "hidden" : ""}`}
                    >
                      {selectedResident.firstName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}
                    >
                      {selectedResident.status || "—"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white sm:text-2xl">
                      {selectedResident.firstName} {selectedResident.lastName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {selectedResident.purok || "N/A"} · {selectedResident.age ? `${selectedResident.age} years` : "Age N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-cyan-400" />
                    <div>
                      <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Phone</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                    <div>
                      <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Gender</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.gender || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <House className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                    <div>
                      <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Purok</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.purok || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <Eye className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                    <div>
                      <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Age</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.age || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {selectedResident.address && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/25">
                    <div className="flex gap-3">
                      <House className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-cyan-400" />
                      <div>
                        <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Address</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{selectedResident.address}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2">
                  <div>
                    <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Civil status</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.civilStatus || "N/A"}</p>
                  </div>
                  <div>
                    <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Nationality</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.nationality || "N/A"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className={LABEL_CLASS.replace("mb-2 ", "mb-1 ")}>Religion</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedResident.religion || "N/A"}</p>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedResident(null)}
                    className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={!!purokToDelete} onClose={() => setPurokToDelete(null)} title="Remove purok" center>
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100 dark:bg-red-950/40 dark:ring-red-900/50">
              <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Remove <strong className="text-slate-900 dark:text-white">{purokToDelete?.name}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPurokToDelete(null)}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRemovePurok}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
