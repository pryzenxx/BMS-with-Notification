import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { BmsToaster } from "../components/BmsToaster";
import { ClipboardList, X, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FIELD_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100";
const LABEL_CLASS =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const FIELD_READ_ONLY =
  "w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 opacity-90 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200";

export default function ModalAddResident({ isOpen, onClose, onResidentAdded }) {
  const [formData, setFormData] = useState({
  lastName: "", firstName: "",  middleName: "", fullName: "", birthdate: "", placeOfBirth: "", age: "",
  gender: "", civilStatus: "", nationality: "",  religion: "", address: "",  purok: "", phone: "",
  education: "", occupation: "", headOfFamily: "", householdNumber: "",
  householdHeadName: "", relationshipToHead: "", emergencyPerson: "", emergencyRelation: "", emergencyNumber: "",
  applicantSignature: "",  dateApplied: "", verifiedBy: "", positionOfVerifier: "",  dateVerified: "", pwd: "",
  member4ps: "",  memberIps: "", seniorCitizen: "", transferred: "", });
  
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

 const handleBirthdateChange = (e) => {
  let value = e.target.value.replace(/\D/g, ""); // remove non-digits

  // auto-insert slashes for yyyy/mm/dd
  if (value.length > 4 && value.length <= 6) {
    value = value.slice(0, 4) + "/" + value.slice(4);
  } else if (value.length > 6) {
    value = value.slice(0, 4) + "/" + value.slice(4, 6) + "/" + value.slice(6, 8);
  }

  // calculate age if full date is entered
  let age = "";
  if (value.length === 10) {
    const [yyyy, mm, dd] = value.split("/").map(Number);
    const birthdate = new Date(yyyy, mm - 1, dd);
    const today = new Date();
    age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
  }

  setFormData((prev) => ({ ...prev, birthdate: value, age }));
  };

  // ✅ Auto-fill full name
  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    updatedData.fullName = `${updatedData.firstName || ""} ${updatedData.middleName || ""} ${updatedData.lastName || ""}`.trim();
    setFormData(updatedData);
  };

  // ✅ Validation
  const requiredFields = {
    1: ["firstName", "lastName", "birthdate", "gender", "civilStatus"],
    2: ["address", "phone" , "purok"],
    5: ["transferred"],
  };

  // Pure check: returns true if all required fields are filled
const isStepValid = () => {
  const fields = requiredFields[step] || [];
  return fields.every((f) => {
    const value = formData[f];
    return value !== undefined && value !== null && value.toString().trim() !== "";
  });
};

// Side-effect validation: sets errors, returns true/false
const stepValid = () => {
  const fields = requiredFields[step] || [];
  const newErrors = {};
  let valid = true;

  fields.forEach((f) => {
    const value = formData[f];
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      newErrors[f] = true;
      valid = false;
    }
  });

  setErrors((prev) => ({ ...prev, ...newErrors }));
  return valid;
};


  // ✅ Submit handler
   const handleSubmit = async (e) => {
    e.preventDefault();

   // ✅ Only validate and save on Step 5
    if (step !== totalSteps) {
      nextStep();
       return;
     }

  // 1️⃣ Validate required fields
    const allRequired = [
      "firstName", "lastName", "birthdate", "gender", "civilStatus", 
      "address", "phone", "purok", "nationality", "religion",
      "transferred"
    ];

  const missing = allRequired.filter((field) => !formData[field]?.trim());
  const newErrors = {};
  missing.forEach(f => { newErrors[f] = true; });
  setErrors(newErrors);

  if (missing.length > 0) {
  
    return;
  }

  
  // 2️⃣ Validate numeric fields (e.g., phone)
  if (formData.phone && isNaN(formData.phone)) {
    setErrors(prev => ({ ...prev, phone: true }));
    return;
  }

  // 3️⃣ Validate birthdate format
  if (formData.birthdate && isNaN(Date.parse(formData.birthdate))) {
    setErrors(prev => ({ ...prev, birthdate: true }));
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/api/residents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to add resident.");
    }
    toast.success("Resident added successfully!");
    onResidentAdded && onResidentAdded();
    onClose();
  } catch (error) {
    console.error("Add resident error:", error);
    toast.error(`Failed to add resident. ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const nextStep = () => {
  if (!stepValid()) return; // stop if validation fails

  const fields = requiredFields[step] || [];
  setErrors((prev) => {
    const cleaned = { ...prev };
    fields.forEach(f => delete cleaned[f]); 
    return cleaned;
  });

  setStep((s) => Math.min(totalSteps, s + 1));
};

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // Dropdown options
  const nationalityOptions = ["Filipino", "American", "Chinese", "Other"];
  const religionOptions = ["Catholic", "Protestant", "Islam", "Other"];
  const purokOptions = ["Purok-1", "Purok-2", "Purok-3", "Purok-4", "Purok-5"]; 
  const educationOptions = ["No Formal Education", "Elementary", "High School", "College", "Vocational", "Post Graduate"];
  const occupationOptions = ["Unemployed", "Student", "Farmer", "Teacher", "Driver", "Business Owner", "Office Worker", "Others"];
 


  return (
    <>
      <BmsToaster position="top-center" reverseOrder={false} />

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
          aria-labelledby="add-resident-title"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/95">
            <h2
              id="add-resident-title"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </span>
              Add resident
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
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
              Step {step} of {totalSteps}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-8">
            {step === 1 && (
              <Section title={<><PersonIcon /> Personal Information</>}>
                <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleNameChange} placeholder="Enter first name" error={errors.firstName} />
                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleNameChange} placeholder="Enter middle name" />
                <Input label="Last Name *" name="lastName" value={formData.lastName} onChange={handleNameChange} placeholder="Enter last name" error={errors.lastName} />
                <Input label="Full Name" name="fullName" value={formData.fullName} readOnly />
                <Input label="Birthdate *" name="birthdate" type="text" value={formData.birthdate} onChange={handleBirthdateChange} placeholder="yyyy/mm/dd" maxLength={10} error={errors.birthdate} />
                <Input label="Age" name="age" value={formData.age} readOnly />
                <Input label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleNameChange} placeholder="Enter place of birth" />
                <Dropdown label="Gender *" name="gender" value={formData.gender} onChange={handleNameChange} options={["Male","Female","Other"]} error={errors.gender} />
                <Dropdown label="Civil Status *" name="civilStatus" value={formData.civilStatus} onChange={handleNameChange} options={["Single","Married","Widowed","Separated","Divorced"]} error={errors.civilStatus} />
                <Dropdown label="Nationality *" name="nationality" value={formData.nationality} onChange={handleNameChange} options={nationalityOptions} error={errors.nationality} />
                <Dropdown label="Religion *" name="religion" value={formData.religion} onChange={handleNameChange} options={religionOptions} error={errors.religion} />
              </Section>
            )}

            {step === 2 && (
              <>
                <Section title={<><HouseIcon /> Contact & Address</>}>
                  <Input label="Address *" name="address" value={formData.address} onChange={handleNameChange} placeholder="Enter address" error={errors.address} />                
                  <Dropdown label="Purok *" name="purok" value={formData.purok} onChange={handleNameChange} options={purokOptions} error={errors.purok} />            
                  <Input  label="Phone *"  name="phone"  value={formData.phone}                                 
                  onChange={(e) => {                
                             const value = e.target.value.replace(/\D/g, "");
                             setFormData((prev) => ({ ...prev, phone: value })); }}                     
                             placeholder="Enter phone number"
                             error={errors.phone}
                             maxLength={11}
                            />
                </Section>
              </>
            )}

            {step === 3 && (
              <>
                <Section title={<><EducationIcon /> Education & Occupation</>}>
                  <Dropdown label="Education Level" name="education" value={formData.education} onChange={handleNameChange} options={educationOptions} error={errors.education} />
                  <Dropdown label="Occupation Type" name="occupation" value={formData.occupation} onChange={handleNameChange} options={occupationOptions} error={errors.occupation} />
                </Section>
                <Section title={<><PersonIcon /> Household Information</>}>
                  <Input label="Head of Family" name="headOfFamily" value={formData.headOfFamily} onChange={handleNameChange} placeholder="Enter head of family" />
                  <Input label="Household Head Name" name="householdHeadName" value={formData.householdHeadName} onChange={handleNameChange} placeholder="Enter household head name" />
                  <Input label="Relationship to Head" name="relationshipToHead" value={formData.relationshipToHead} onChange={handleNameChange} placeholder="Enter relationship" />
                  <Input  label="Household Number" name="householdNumber"  type="number" min="1" step="1"  value={formData.householdNumber}  onChange={handleNameChange}  placeholder="Enter household number" />                           
                </Section>
              </>
            )}

            {step === 4 && (
              <>
                <Section title={<><EmergencyIcon /> Emergency Contact</>}>
                  <Input label="Emergency Person" name="emergencyPerson" value={formData.emergencyPerson} onChange={handleNameChange} placeholder="Enter emergency contact name" />
                  <Input label="Emergency Relation" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleNameChange} placeholder="Enter relation" />
                  <Input label="Emergency Number" name="emergencyNumber" value={formData.emergencyNumber} onChange={handleNameChange} placeholder="Enter phone number" />
                </Section>
                <Section title={<><PersonIcon /> Verification Details</>}>
                  <Input label="Applicant Signature" name="applicantSignature" value={formData.applicantSignature} onChange={handleNameChange} placeholder="Enter signature" />
                  <Input label="Date Applied" name="dateApplied" type="date" value={formData.dateApplied} onChange={handleNameChange} />
                  <Input label="Verified By" name="verifiedBy" value={formData.verifiedBy} onChange={handleNameChange} placeholder="Enter verifier name" />
                  <Input label="Position of Verifier" name="positionOfVerifier" value={formData.positionOfVerifier} onChange={handleNameChange} placeholder="Enter verifier position" />
                  <Input label="Date Verified" name="dateVerified" type="date" value={formData.dateVerified} onChange={handleNameChange} />
                </Section>
              </>
            )}

            {step === 5 && (
                <Section title={<><StarIcon /> Special Memberships</>}>
                  <Dropdown label="PWD" name="pwd" value={formData.pwd} onChange={handleNameChange} options={["Yes","No"]} />
                  <Dropdown label="4Ps Member" name="member4ps" value={formData.member4ps} onChange={handleNameChange} options={["Yes","No"]} />
                  <Dropdown label="IPs Member" name="memberIps" value={formData.memberIps} onChange={handleNameChange} options={["Yes","No"]} />
                  <Dropdown label="Senior Citizen" name="seniorCitizen" value={formData.seniorCitizen} onChange={handleNameChange} options={["Yes","No"]} />
                  <Dropdown label="Transferred Status" name="transferred" value={formData.transferred} onChange={handleNameChange} options={["Yes","No"]} /> {/* ✅ new */}
               </Section>
            )}


            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:px-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                >
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                >
                  Cancel
                </button>
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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
                    "Save resident"
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

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  readOnly,
  placeholder,
  error,
}) {
  // Helper: auto-format phone numbers as 0912-345-6789
  const formatPhone = (num) => {
    const digits = num.replace(/\D/g, "").slice(0, 11); // only numbers, 11 digits max
    const match = digits.match(/^(\d{0,4})(\d{0,3})(\d{0,4})$/);
    if (!match) return digits;
    const [, p1, p2, p3] = match;
    return [p1, p2, p3].filter(Boolean).join("-");
  };

  const handleInputChange = (e) => {
    let val = e.target.value;

    if (name === "phone" || name === "emergencyNumber") {
      // Format the phone for display
      const formatted = formatPhone(val);
      // Get raw numeric value
      const raw = formatted.replace(/\D/g, "");
      onChange({ target: { name, value: raw } });
    } else {
      onChange(e);
    }
  };

  // For display: show formatted number, not raw digits
  const displayValue =
    name === "phone" || name === "emergencyNumber"
      ? formatPhone(value || "")
      : value || "";

  return (
    <div className="flex flex-col">
      <label className={`${LABEL_CLASS} ${error ? "text-red-600 dark:text-red-400" : ""}`}>{label}</label>

      <input
        type={type}
        name={name}
        value={displayValue}
        placeholder={error ? "This field is required" : placeholder || ""}
        onChange={handleInputChange}
        readOnly={readOnly}
        required={label.includes("*")}
        className={`${readOnly ? FIELD_READ_ONLY : FIELD_CLASS} ${
          error ? "border-red-400 ring-2 ring-red-500/20 dark:border-red-500/50" : ""
        }`}
      />

      {error && (
        <span className="text-xs text-red-600 mt-1">
          {name === "firstName" && "First name is required."}
          {name === "middleName" && "Middle name is required."}
          {name === "lastName" && "Last name is required."}
          {name === "birthdate" && "Please enter a valid birthdate."}
          {name === "gender" && "Please select a gender."}
          {name === "civilStatus" && "Please select civil status."}
          {name === "nationality" && "Please select nationality."}
          {name === "religion" && "Please select religion."}
          {name === "address" && "Address is required."}
          {name === "purok" && "Please select a purok."}
          {name === "phone" && "Phone must be numeric and up to 11 digits."}
          {name === "education" && "Please select education level."}
          {name === "occupation" && "Please select occupation."}
          {name === "voterStatus" && "Please select voter status."}
          {name === "precinctNumber" && "Precinct number is required."}
          {name === "emergencyPerson" && "Please enter an emergency contact."}
          {name === "emergencyNumber" &&
            "Emergency number must be numeric and up to 11 digits."}
          {name === "verifiedBy" && "Verifier name is required."}
          {name === "positionOfVerifier" && "Verifier position is required."}
          {![
            "firstName",
            "middleName",
            "lastName",
            "birthdate",
            "gender",
            "civilStatus",
            "nationality",
            "religion",
            "address",
            "purok",
            "phone",
            "education",
            "occupation",
            "voterStatus",
            "precinctNumber",
            "emergencyPerson",
            "emergencyNumber",
            "verifiedBy",
            "positionOfVerifier",
          ].includes(name) && "This field is required or invalid."}
        </span>
      )}
    </div>
  );
}

/* ✅ Dropdown component remains the same, but slightly cleaned */
function Dropdown({ label, name, value, onChange, options, error }) {
  return (
    <div className="flex flex-col">
      <label className={`${LABEL_CLASS} ${error ? "text-red-600 dark:text-red-400" : ""}`}>{label}</label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`${FIELD_CLASS} ${error ? "border-red-400 ring-2 ring-red-500/20 dark:border-red-500/50" : ""}`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-red-600 mt-1">
          
          {name === "gender" && "Please select a gender."}
          {name === "civilStatus" && "Please select a civil status."}
          {name === "nationality" && "Please select a nationality."}
          {name === "religion" && "Please select a religion."}
          {name === "purok" && "Please select a purok."}
          {name === "voterStatus" && "Please select a voter status."}
          {name === "education" && "Please select an education level."}
          {name === "occupation" && "Please select an occupation."}
          {name === "pwd" && "Please select Yes or No."}
          {name === "member4ps" && "Please select Yes or No."}
          {name === "memberIps" && "Please select Yes or No."}
          {name === "seniorCitizen" && "Please select Yes or No."}
          {![
            "gender",
            "civilStatus",
            "nationality",
            "religion",
            "purok",
            "voterStatus",
            "education",
            "occupation",
            "pwd",
            "member4ps",
            "memberIps",
            "seniorCitizen",
          ].includes(name) && "This selection is required."}
           {name === "transferred" && "Please select transferred status."}
        </span>
      )}
    </div>
  );
}


function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

/* ✅ Extra Section Icons */
function PersonIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zM6 20v-2c0-2.21 3.58-4 6-4s6 1.79 6 4v2H6z" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-8z" />
    </svg>
  );
}

function EducationIcon() {
  return (
    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14v7M12 14L3 9m9 5l9-5" />
    </svg>
  );
}

function EmergencyIcon() {
  return (
    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
