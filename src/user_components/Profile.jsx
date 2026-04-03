import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Pencil,
  Save,
  X,
  Loader2,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Users,
  Heart,
  Home,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { appendUserActivity } from "../utils/activityLog";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

/** Align with admin PurokPanel: flexible match for "Purok-1" vs "Purok - 1" */
const normalizePurokKey = (name) => {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^purok\s*/i, "purok ");
};

const matchPurokToAdminList = (raw, adminNames) => {
  if (!raw || !adminNames?.length) return raw || "";
  const exact = adminNames.find((n) => n === raw);
  if (exact) return exact;
  const key = normalizePurokKey(raw);
  return adminNames.find((n) => normalizePurokKey(n) === key) || raw;
};

const normalizeResidentPayload = (data = {}) => ({
  id: data._id || data.id || "",
  firstName: data.firstName || "",
  lastName: data.lastName || "",
  name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
  email: data.email || "",
  mobile: data.phone || "",
  age: data.age || "",
  address: data.address || "",
  status: data.civilStatus || "",
  household: data.household || data.householdNumber || "",
  registered: data.dateVerified
    ? new Date(data.dateVerified).toLocaleDateString()
    : data.createdAt
      ? new Date(data.createdAt).toLocaleDateString()
      : "",
  photoBase64: data.profileImageBase64 || "",
  photoPreview: data.profileImageBase64 || "",
  purok: data.purok || "",
});

const compressAndConvertImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload a valid image file (JPG, PNG, etc.)"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Image too large (max 5MB). Please choose a smaller one."));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;

      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        reject(new Error("Failed to process image. Please try another file."));
      };
    };

    reader.onerror = () => {
      reject(new Error("Error reading file. Please try again."));
    };

    reader.readAsDataURL(file);
  });
};

const inputClass =
  "mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:min-h-0 sm:py-2 sm:text-sm dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400";

const selectClass =
  "mt-1 w-full min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:min-h-0 sm:py-2 sm:text-sm dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-400";

const labelClass =
  "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

const valueClass = "mt-1 text-sm text-slate-800 dark:text-slate-100";

const sectionCardClass =
  "rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 sm:p-4 md:p-5 dark:border-slate-700/80 dark:bg-slate-800/30";

function FieldRow({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <div className={labelClass}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
        {label}
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [puroks, setPuroks] = useState([]);
  const fileInputRef = useRef(null);

  const purokNames = useMemo(
    () =>
      [...new Set(puroks.map((p) => p?.name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      ),
    [puroks]
  );

  const fetchPuroksFromAdmin = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/puroks`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      setPuroks(data);
      return [...new Set(data.map((p) => p?.name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    } catch (err) {
      console.error("Purok list load error:", err);
      return [];
    }
  }, []);

  const fetchResidentById = useCallback(async (residentId) => {
    const res = await fetch(`${API_BASE}/residents/${residentId}`);
    if (!res.ok) throw new Error("Failed to load profile");
    const data = await res.json();
    return normalizeResidentPayload(data);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = localStorage.getItem("userInfo");
        if (!stored) {
          setInitialLoading(false);
          return;
        }
        const parsed = JSON.parse(stored);
        if (!parsed?.resident?.id) {
          setInitialLoading(false);
          return;
        }

        await fetchPuroksFromAdmin();
        const normalized = await fetchResidentById(parsed.resident.id);

        setProfileData(normalized);
        setEditedProfile({ ...normalized });
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [fetchPuroksFromAdmin, fetchResidentById]);

  const openEdit = async () => {
    const stored = localStorage.getItem("userInfo");
    if (!stored) return;
    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch {
      return;
    }
    const id = parsed?.resident?.id;
    if (!id) return;

    try {
      const adminPurokNames = await fetchPuroksFromAdmin();
      const fresh = await fetchResidentById(id);
      setProfileData(fresh);
      setEditedProfile({
        ...fresh,
        purok: matchPurokToAdminList(fresh.purok, adminPurokNames),
      });
      setEditMode(true);
    } catch (err) {
      console.error("openEdit:", err);
      toast.error("Could not refresh profile for editing.");
    }
  };

  const handleSave = async () => {
    if (!editedProfile?.id) return;

    setLoading(true);
    try {
      const body = {
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        phone: editedProfile.mobile,
        civilStatus: editedProfile.status,
        householdNumber: editedProfile.household,
        purok: (editedProfile.purok || profileData.purok || "").trim() || "N/A",
      };

      if (editedProfile.age !== "" && editedProfile.age != null) {
        const n = Number(String(editedProfile.age).trim());
        if (!Number.isNaN(n) && n >= 0) body.age = n;
      }

      if (editedProfile.photoBase64 !== profileData.photoBase64) {
        body.profileImageBase64 = editedProfile.photoBase64;
      }

      const res = await fetch(`${API_BASE}/residents/${editedProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(responseData.message || "Failed to update profile");

      const updatedFromServer = responseData.resident
        ? normalizeResidentPayload(responseData.resident)
        : {
            ...editedProfile,
            photoBase64: editedProfile.photoBase64 || profileData.photoBase64,
            photoPreview: editedProfile.photoPreview || profileData.photoPreview,
          };

      setProfileData(updatedFromServer);
      setEditedProfile({ ...updatedFromServer });
      setEditMode(false);
      toast.success("Profile updated successfully!");

      const stored = localStorage.getItem("userInfo");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.resident) {
            parsed.resident.firstName = updatedFromServer.firstName;
            parsed.resident.lastName = updatedFromServer.lastName;
            parsed.resident.phone = updatedFromServer.mobile;
            parsed.resident.purok = updatedFromServer.purok;
            parsed.resident.profileImageBase64 = updatedFromServer.photoBase64;
            localStorage.setItem("userInfo", JSON.stringify(parsed));
            localStorage.setItem("user", JSON.stringify(parsed.resident));
          }
        } catch (err) {
          console.error("Failed to update local storage user:", err);
        }
      }

      window.dispatchEvent(new Event("userInfoUpdated"));
      appendUserActivity({
        type: "profile",
        title: "Profile Updated",
        description: "Updated personal information.",
        date: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-20 sm:rounded-2xl sm:py-24 dark:border-slate-700/80 dark:bg-slate-900/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-sky-600 dark:text-sky-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full min-w-0 max-w-4xl rounded-xl border border-slate-200/80 bg-white px-4 py-12 text-center sm:rounded-2xl sm:px-6 sm:py-14 dark:border-slate-700/80 dark:bg-slate-900/50"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <User className="h-7 w-7 text-slate-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No profile yet</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-slate-600 dark:text-slate-400">
          Your resident record is not available. Please wait for barangay approval or contact the office if this persists.
        </p>
      </motion.div>
    );
  }

  const avatarFallback =
    profileData?.name && profileData.name.trim()
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=e2e8f0&color=475569`
      : "https://ui-avatars.com/api/?name=Resident&background=e2e8f0&color=475569";
  const avatarSrc = editMode
    ? editedProfile?.photoPreview || profileData?.photoPreview || avatarFallback
    : profileData?.photoPreview || avatarFallback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto w-full min-w-0 max-w-4xl space-y-4 px-3 pb-4 pt-1 sm:space-y-6 sm:px-4 sm:pb-6 sm:pt-2 md:px-6"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:rounded-2xl dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
        {/* Hero */}
        <div className="relative border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 px-3 py-5 sm:px-6 sm:py-7 md:px-8 md:py-8 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 flex-row items-start gap-3 sm:gap-5">
              <div className="relative shrink-0">
                <img
                  src={avatarSrc}
                  alt={profileData.name || "Profile photo"}
                  className="h-20 w-20 rounded-xl object-cover shadow-md ring-2 ring-white dark:ring-slate-800 sm:h-28 sm:w-28 sm:rounded-2xl sm:ring-4 md:h-32 md:w-32"
                />
                {editMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sky-600 shadow-lg transition hover:bg-slate-50 sm:-bottom-1 sm:-right-1 sm:h-10 sm:w-10 sm:rounded-xl dark:border-slate-600 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700"
                      aria-label="Change photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const base64 = await compressAndConvertImage(file);
                            setEditedProfile({
                              ...editedProfile,
                              photoPreview: base64,
                              photoBase64: base64,
                            });
                            toast.success("Photo ready to save.");
                          } catch (err) {
                            console.error("Image upload error:", err);
                            toast.error(err.message || "Failed to process image.");
                          }
                        }
                      }}
                    />
                  </>
                )}
              </div>

              <div className="min-w-0 flex-1 text-left">
                {editMode ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        <User className="h-3.5 w-3.5" />
                        First name
                      </label>
                      <input
                        value={editedProfile.firstName}
                        placeholder="First name"
                        onChange={(e) => {
                          const firstName = e.target.value;
                          setEditedProfile((prev) => ({
                            ...prev,
                            firstName,
                            name: `${firstName} ${prev.lastName || ""}`.trim(),
                          }));
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <User className="h-3.5 w-3.5" />
                        Last name
                      </label>
                      <input
                        value={editedProfile.lastName}
                        placeholder="Last name"
                        onChange={(e) => {
                          const lastName = e.target.value;
                          setEditedProfile((prev) => ({
                            ...prev,
                            lastName,
                            name: `${prev.firstName || ""} ${lastName}`.trim(),
                          }));
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
                      {profileData.name || "Resident"}
                    </h1>
                    {profileData.email && (
                      <p className="mt-2 flex items-start gap-2 break-words text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                        <span className="min-w-0">{profileData.email}</span>
                      </p>
                    )}
                    <p className="mt-1 flex items-start gap-2 break-words text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                      <span className="min-w-0">{profileData.mobile || "—"}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
              {editMode ? (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    onClick={handleSave}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-600"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    onClick={() => {
                      setEditMode(false);
                      setEditedProfile(profileData);
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </motion.button>
                </>
              ) : (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openEdit()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-3 sm:space-y-5 sm:p-5 md:p-8">
          {editMode && (
            <div className={sectionCardClass}>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Contact</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Phone number used for barangay updates and notifications.
              </p>
              <div className="mt-4 w-full max-w-md">
                <FieldRow icon={Phone} label="Mobile">
                  <input
                    value={editedProfile.mobile}
                    inputMode="numeric"
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setEditedProfile({ ...editedProfile, mobile: sanitized });
                    }}
                    className={inputClass}
                  />
                </FieldRow>
              </div>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={sectionCardClass}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Home className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                Residence
              </h2>
              <div className="mt-4 grid gap-4">
                <FieldRow icon={MapPin} label="Address">
                  {editMode ? (
                    <>
                      <p
                        className={`${valueClass} break-words rounded-lg border border-dashed border-slate-200 bg-slate-100/90 px-3 py-2.5 text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200`}
                      >
                        {profileData.address || "—"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Maintained by the barangay office. To change your address, contact the barangay staff.
                      </p>
                    </>
                  ) : (
                    <p className={`${valueClass} break-words`}>{profileData.address || "—"}</p>
                  )}
                </FieldRow>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow icon={Users} label="Purok">
                    {editMode ? (
                      <>
                        <select
                          value={editedProfile.purok ?? ""}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, purok: e.target.value })
                          }
                          className={selectClass}
                        >
                          <option value="">Select purok</option>
                          {editedProfile.purok &&
                            !purokNames.some(
                              (n) => normalizePurokKey(n) === normalizePurokKey(editedProfile.purok)
                            ) && (
                              <option value={editedProfile.purok}>
                                {editedProfile.purok} (current — not in admin list)
                              </option>
                            )}
                          {purokNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          Same purok list as Barangay Admin → Purok management.
                        </p>
                      </>
                    ) : (
                      <p className={valueClass}>{profileData.purok || "—"}</p>
                    )}
                  </FieldRow>
                  <FieldRow icon={Hash} label="Household no.">
                    {editMode ? (
                      <input
                        value={editedProfile.household ?? ""}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, household: e.target.value })
                        }
                        className={inputClass}
                      />
                    ) : (
                      <p className={valueClass}>{profileData.household || "—"}</p>
                    )}
                  </FieldRow>
                </div>
              </div>
            </div>

            <div className={sectionCardClass}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Heart className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                Personal
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FieldRow icon={Calendar} label="Age">
                  {editMode ? (
                    <input
                      value={editedProfile.age ?? ""}
                      onChange={(e) =>
                        setEditedProfile({ ...editedProfile, age: e.target.value })
                      }
                      className={inputClass}
                    />
                  ) : (
                    <p className={valueClass}>{profileData.age || "—"}</p>
                  )}
                </FieldRow>
                <FieldRow icon={Shield} label="Civil status">
                  {editMode ? (
                    <select
                      value={editedProfile.status}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          status: e.target.value,
                        })
                      }
                      className={selectClass}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  ) : (
                    <p className={valueClass}>{profileData.status || "—"}</p>
                  )}
                </FieldRow>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 p-3 sm:p-4 md:p-5 dark:border-slate-700/60 dark:bg-slate-800/40">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Official record</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              These fields are maintained by the system and cannot be edited here.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FieldRow icon={Hash} label="Barangay ID">
                <p className={`${valueClass} break-all font-mono text-xs sm:text-sm`}>{profileData.id || "—"}</p>
              </FieldRow>
              <FieldRow icon={Calendar} label="Registered since">
                <p className={valueClass}>{profileData.registered || "—"}</p>
              </FieldRow>
            </div>
          </div>
        </div>

        {/* Mobile-friendly action bar */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/80 bg-slate-50/50 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-700/80 dark:bg-slate-800/30 sm:hidden">
          {editMode ? (
            <>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                onClick={() => {
                  setEditMode(false);
                  setEditedProfile(profileData);
                }}
                className="flex-1 min-h-[48px] rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                onClick={handleSave}
                className="flex-1 min-h-[48px] rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white dark:bg-sky-500"
              >
                {loading ? "Saving…" : "Save"}
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => openEdit()}
              className="w-full min-h-[48px] rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Edit profile
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
