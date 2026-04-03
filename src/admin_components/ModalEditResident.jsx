import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { BmsToaster } from "../components/BmsToaster";
import { Pencil, X, Loader2 } from "lucide-react";
import { API_ORIGIN } from "../utils/apiBase";

const API_URL = API_ORIGIN;

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";
const LABEL_CLASS =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const FIELD_READ_ONLY =
  "w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 opacity-90 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200";

export default function ModalEditResident({ isOpen, onClose, residentData, onResidentUpdated, onSave }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    fullName: "",
    birthdate: "",
    placeOfBirth: "",
    age: "",
    gender: "",
    civilStatus: "",
    nationality: "",
    religion: "",
    address: "",
    purok: "",
    phone: "",
    education: "",
    occupation: "",
    headOfFamily: "",
    householdHeadName: "",
    relationshipToHead: "",
    householdNumber: "",
    status: "",
    emergencyPerson: "",
    emergencyRelation: "",
    emergencyNumber: "",
    applicantSignature: "",
    dateApplied: "",
    verifiedBy: "",
    positionOfVerifier: "",
    dateVerified: "",
    pwd: "",
    member4ps: "",
    memberIps: "",
    seniorCitizen: "",
  });

  const residentId =
    residentData?._id || residentData?.id || formData?._id || "";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const sanitizeFormData = (data) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip _id and id fields as they're in the URL, not the body
      if (key === "_id" || key === "id") continue;
      
      if (value === null || value === undefined) sanitized[key] = "";
      else if (typeof value === "string") sanitized[key] = value.trim();
      else sanitized[key] = String(value);
    }
    return sanitized;
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "";
    const diff = Date.now() - new Date(birthdate).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    // If residentData prop is provided, use it directly
    if (residentData) {
      const cleanData = sanitizeFormData({
        ...residentData,
        _id: residentData._id || residentData.id || "",
        birthdate: formatDate(residentData.birthdate),
        dateApplied: formatDate(residentData.dateApplied),
        dateVerified: formatDate(residentData.dateVerified),
        fullName: `${residentData.firstName || ""} ${residentData.middleName || ""} ${residentData.lastName || ""}`.trim(),
        age: residentData.birthdate ? calculateAge(residentData.birthdate) : "",
      });
      setFormData(cleanData);
      return;
    }
    
    // Otherwise, fetch from API if we have a residentId
    const fetchResident = async () => {
      if (!residentId) return;
      try {
        const res = await fetch(`${API_URL}/api/residents/${residentId}`);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        // Handle both response formats: { resident } or direct object
        const resident = data.resident || data;
        setFormData(
          sanitizeFormData({
            ...resident,
            _id: resident._id || resident.id,
            birthdate: formatDate(resident.birthdate),
            dateApplied: formatDate(resident.dateApplied),
            dateVerified: formatDate(resident.dateVerified),
            fullName: `${resident.firstName || ""} ${resident.middleName || ""} ${resident.lastName || ""}`.trim(),
            age: resident.birthdate ? calculateAge(resident.birthdate) : "",
          })
        );
      } catch (err) {
        console.error("Error fetching resident:", err);
        toast.error("Failed to fetch resident data.");
      }
    };
    fetchResident();
  }, [isOpen, residentData, residentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ?? "" }));
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    updated.fullName = `${updated.firstName || ""} ${updated.middleName || ""} ${updated.lastName || ""}`.trim();
    setFormData(updated);
  };

  const handleBirthdateChange = (e) => {
    const birthdate = e.target.value;
    const age = birthdate ? calculateAge(birthdate) : "";
    setFormData((prev) => ({ ...prev, birthdate, age }));
  };

  // ✅ Modern toast helper for errors
  const showErrorToast = (icon, message, bgColor = "bg-red-600", textColor = "text-white") => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-toast-in" : "animate-toast-out"
          } flex items-center gap-3 ${bgColor} ${textColor} px-6 py-4 rounded-xl shadow-lg border border-red-500 error-pop`}
          style={{
            justifyContent: "center",
            textAlign: "center",
            minWidth: "300px",
            maxWidth: "400px",
          }}
        >
          <span className="flex-shrink-0">{icon}</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
      ),
      { position: "top-center", duration: 4000 }
    );
  };

  // ✅ Parse error message to get user-friendly text
  const parseErrorMessage = (error) => {
    const errorMessage = error.message || error.toString() || "";
    const lowerError = errorMessage.toLowerCase();

    // Check for MongoDB duplicate key error (E11000)
    if (lowerError.includes("e11000") || lowerError.includes("duplicate key")) {
      if (lowerError.includes("phone")) {
        return "Phone number already exists. Please use a different number.";
      }
      return "This information already exists in the system. Please use different values.";
    }

    // Check for duplicate phone number (various formats)
    if (lowerError.includes("phone") && (lowerError.includes("already") || lowerError.includes("duplicate") || lowerError.includes("registered") || lowerError.includes("exists"))) {
      return "Phone number already exists. Please use a different number.";
    }

    // Check for duplicate/existing data
    if (lowerError.includes("already exists") || lowerError.includes("duplicate")) {
      return "This information already exists in the system.";
    }

    // Check for validation errors
    if (lowerError.includes("validation") || lowerError.includes("invalid")) {
      return "Invalid data provided. Please check your input.";
    }

    // Check for phone validation
    if (lowerError.includes("phone") && (lowerError.includes("valid") || lowerError.includes("required"))) {
      return "Please enter a valid phone number.";
    }

    // Check for not found errors
    if (lowerError.includes("not found") || lowerError.includes("404")) {
      return "Resident not found. Please refresh and try again.";
    }

    // Try to extract JSON message if error is a JSON string
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed.message) {
        const parsedLower = parsed.message.toLowerCase();
        // Re-check parsed message for specific errors
        if (parsedLower.includes("phone") && (parsedLower.includes("already") || parsedLower.includes("duplicate") || parsedLower.includes("exists"))) {
          return "Phone number already exists. Please use a different number.";
        }
        return parsed.message;
      }
    } catch {
      // Not JSON, continue with original message
    }

    // Return cleaned error message or default
    return errorMessage.length > 100 
      ? "Failed to update resident. Please check your input and try again." 
      : errorMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!residentId) {
      toast.error("Missing resident ID. Please reopen the modal.");
      return;
    }
    setLoading(true);
    try {
      const sanitizedData = sanitizeFormData(formData);
      const res = await fetch(`${API_URL}/api/residents/${residentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });
      
      // Read the response body once
      let responseData;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { message: text || "Failed to update resident" };
        }
      }
      
      if (!res.ok) {
        const errorMessage = responseData.message || responseData.error || "Failed to update resident";
        throw new Error(errorMessage);
      }
      
      // Parse the response - backend returns { message, resident }
      const updatedData = responseData.resident || responseData;
      
      // Call onSave if provided (for ResidentsPanel compatibility), otherwise use onResidentUpdated
      if (onSave) {
        onSave(updatedData);
      } else if (onResidentUpdated) {
        onResidentUpdated(updatedData);
      }
      
      toast.success("Resident updated successfully!");
      onClose();
    } catch (err) {
      console.error("Error updating:", err);
      toast.error(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((p) => Math.min(p + 1, totalSteps));
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));
  const progressPercent = (currentStep / totalSteps) * 100;

  if (!isOpen) return null;

  return (
    <>
      <BmsToaster position="top-center" />
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] md:items-center md:p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-resident-title"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/95">
            <h2
              id="edit-resident-title"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Pencil className="h-5 w-5" aria-hidden />
              </span>
              Edit resident
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-8">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <Section title="Personal Information">
                <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleNameChange} />
                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleNameChange} />
                <Input label="Last Name *" name="lastName" value={formData.lastName} onChange={handleNameChange} />
                <Input label="Full Name" name="fullName" value={formData.fullName} readOnly />
                <Input label="Birthdate *" type="date" name="birthdate" value={formData.birthdate} onChange={handleBirthdateChange} />
                <Input label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} />
                <Input label="Age" name="age" value={formData.age} readOnly />
                <Dropdown label="Gender *" name="gender" value={formData.gender} onChange={handleInputChange} options={["Male","Female","Other"]} />
                <Dropdown label="Civil Status" name="civilStatus" value={formData.civilStatus} onChange={handleInputChange} options={["Single","Married","Widowed","Separated"]} />
                <Dropdown label="Nationality" name="nationality" value={formData.nationality} onChange={handleInputChange} options={["Filipino","Other"]} />
                <Dropdown label="Religion" name="religion" value={formData.religion} onChange={handleInputChange} options={["Catholic","Iglesia","Islam","Others"]} />
              </Section>
            )}

            {/* Step 2: Contact & Address */}
            {currentStep === 2 && (
              <Section title="Contact & Address">
                <Input label="Address *" name="address" value={formData.address} onChange={handleInputChange} />
                <Dropdown label="Purok *" name="purok" value={formData.purok} onChange={handleInputChange} options={["Purok-1","Purok-2","Purok-3","Purok-4","Purok-5"]} />
                <Input label="Phone *" name="phone" value={formData.phone} onChange={handleInputChange} />
              </Section>
            )}
            {/* Step 3: Education & Occupation */}
            {currentStep === 3 && (
              <Section title="Education & Occupation">
                <Dropdown label="Education" name="education" value={formData.education} onChange={handleInputChange} options={["None","Elementary","High School","College","Postgraduate"]} />
                <Dropdown label="Occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} options={["Farmer","Teacher","Business","Government","Other"]} />
              </Section>
            )}

            {/* Step 4: Household */}
            {currentStep === 4 && (
              <Section title="Household Information">
                <Input label="Head of Family" name="headOfFamily" value={formData.headOfFamily} onChange={handleInputChange} />
                <Input label="Household Head Name" name="householdHeadName" value={formData.householdHeadName} onChange={handleInputChange} />
                <Input label="Relationship to Head" name="relationshipToHead" value={formData.relationshipToHead} onChange={handleInputChange} />
                <Input label="Household Number"  name="householdNumber" type="number" value={formData.householdNumber}onChange={handleInputChange} placeholder="Enter household number" />    
              </Section>
            )}

            {/* Step 5: Emergency */}
            {currentStep === 5 && (
              <Section title="Emergency Contact">
                <Input label="Emergency Person" name="emergencyPerson" value={formData.emergencyPerson} onChange={handleInputChange} />
                <Input label="Emergency Relation" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleInputChange} />
                <Input label="Emergency Number" name="emergencyNumber" value={formData.emergencyNumber} onChange={handleInputChange} />
              </Section>
            )}

            {/* Step 6: Verification */}
            {currentStep === 6 && (
              <Section title="Verification & Membership">
                <Input label="Applicant Signature" name="applicantSignature" value={formData.applicantSignature} onChange={handleInputChange} />
                <Input label="Date Applied" type="date" name="dateApplied" value={formData.dateApplied} onChange={handleInputChange} />
                <Input label="Verified By" name="verifiedBy" value={formData.verifiedBy} onChange={handleInputChange} />
                <Input label="Position of Verifier" name="positionOfVerifier" value={formData.positionOfVerifier} onChange={handleInputChange} />
                <Input label="Date Verified" type="date" name="dateVerified" value={formData.dateVerified} onChange={handleInputChange} />
                <Dropdown label="PWD" name="pwd" value={formData.pwd} onChange={handleInputChange} options={["Yes","No"]} />
                <Dropdown label="Member of 4Ps" name="member4ps" value={formData.member4ps} onChange={handleInputChange} options={["Yes","No"]} />
                <Dropdown label="Member of IPs" name="memberIps" value={formData.memberIps} onChange={handleInputChange} options={["Yes","No"]} />
                <Dropdown label="Senior Citizen" name="seniorCitizen" value={formData.seniorCitizen} onChange={handleInputChange} options={["Yes","No"]} />
                 <Dropdown label="Status"  name="status"  value={formData.status}  onChange={handleInputChange} options={["Active", "Transferred"]}/>
              </Section>
            )}

            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:px-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                  currentStep === 1
                    ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                }`}
              >
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* === UI Helpers === */
function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", readOnly }) {
  const handleChange = (e) => {
    let val = e.target.value;
    if (["phone", "emergencyNumber"].includes(name)) {
      val = val.replace(/\D/g, "").slice(0, 11);
    }
    if (name === "householdNumber") {
      val = val.replace(/\D/g, "");
    }

    onChange({ target: { name, value: val } });
  };

  return (
    <div className="flex flex-col">
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        placeholder={`Enter ${label.replace(/\s*\*/g, "").toLowerCase()}`}
        onChange={handleChange}
        readOnly={readOnly}
        required={label.includes("*")}
        className={readOnly ? FIELD_READ_ONLY : FIELD_CLASS}
      />
    </div>
  );
}

function Dropdown({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col">
      <label className={LABEL_CLASS}>{label}</label>
      <select name={name} value={value || ""} onChange={onChange} className={FIELD_CLASS}>
        <option value="">Select {label.replace(/\s*\*/g, "")}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
