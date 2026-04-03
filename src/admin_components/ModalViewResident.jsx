import React, { useRef, useEffect, useState } from "react";
import { User, X, Printer } from "lucide-react";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";
import { API_ORIGIN } from "../utils/apiBase";

const API_URL = API_ORIGIN;

const yn = (v) => (String(v ?? "").toLowerCase() === "yes" ? "Yes" : "No");

export default function ModalViewResident({ isOpen, onClose, resident }) {
  const printRef = useRef(null);
  const [residentData, setResidentData] = useState(resident);

  useEffect(() => {
    if (isOpen && resident?._id) {
      fetch(`${API_URL}/api/residents/${resident._id}`)
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server error ${res.status}: ${text}`);
          }
          return res.json();
        })
        .then((data) => setResidentData(data))
        .catch((err) => console.error("Error fetching resident:", err.message));
    }
  }, [isOpen, resident]);

  if (!isOpen || !residentData) return null;

  const handlePrint = () => {
    const fullName = `${residentData.firstName || ""} ${residentData.middleName || ""} ${residentData.lastName || ""}`.trim() || residentData.fullName || "N/A";
    const getMemberships = (r) => {
      const m = [];
      if (r.pwd?.toLowerCase() === "yes") m.push("PWD");
      if (r.member4ps?.toLowerCase() === "yes") m.push("4Ps");
      if (r.memberIps?.toLowerCase() === "yes") m.push("IPs");
      if (r.seniorCitizen?.toLowerCase() === "yes") m.push("Senior Citizen");
      return m.length > 0 ? m.join(", ") : "None";
    };

    const win = window.open("", "_blank");
    const logoURL = window.location.origin + logo;
    const logo1URL = window.location.origin + logo1;

    win.document.write(`
    <html>
    <head>
      <title>Resident Record - ${fullName}</title>
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
          width: 35%;
          background: #f3f4f6;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        tr:nth-child(even) {
          background-color: #fafafa;
        }

        .photo-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: 20px 0;
          gap: 20px;
        }

        .photo-box {
          text-align: center;
        }

        .photo-box img {
          width: 120px;
          height: 120px;
          border: 2px solid #000;
          border-radius: 4px;
          object-fit: cover;
          margin-bottom: 5px;
        }

        .photo-box p {
          font-size: 12px;
          margin: 0;
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
          <img src="${logoURL}" alt="Barangay Logo Left" />
          <div class="header-center">
            <h1>Republic of the Philippines</h1>
            <h2>Province of Agusan del Norte</h2>
            <h3>Municipality of Tubay</h3>
            <h1><strong>Barangay Victory</strong></h1>
            <hr />
            <p><strong>Resident Information Record</strong></p>
          </div>
          <img src="${logo1URL}" alt="Barangay Logo Right" />
        </div>

        <div class="certificate-number">
          Record No.: BV-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}
        </div>

        <div class="description">
          <p>
            This document contains the official resident information record for
            <strong>${fullName}</strong>, registered under the jurisdiction of
            <strong>Barangay Victory</strong>, Municipality of Tubay, Province of Agusan del Norte.
            This record is generated for administrative, record-keeping, and verification purposes.
          </p>
        </div>

        <div class="photo-section">
          <div class="photo-box">
            ${residentData.profileImageBase64 || residentData.photoUrl
              ? `<img src="${residentData.profileImageBase64 || residentData.photoUrl}" alt="Profile Photo" />`
              : '<div style="width: 120px; height: 120px; border: 2px solid #000; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px;">N/A</div>'
            }
            <p><strong>Profile Photo</strong></p>
          </div>
          <div class="photo-box">
            ${residentData.idPhotoBase64 || residentData.idImage
              ? `<img src="${residentData.idPhotoBase64 || residentData.idImage}" alt="ID Photo" />`
              : '<div style="width: 120px; height: 120px; border: 2px solid #000; background: #f3f4f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 5px;">N/A</div>'
            }
            <p><strong>ID Photo</strong></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Information</th>
            </tr>
          </thead>
          <tbody>
            <tr><th>Full Name</th><td>${fullName}</td></tr>
            <tr><th>First Name</th><td>${residentData.firstName || "—"}</td></tr>
            <tr><th>Middle Name</th><td>${residentData.middleName || "—"}</td></tr>
            <tr><th>Last Name</th><td>${residentData.lastName || "—"}</td></tr>
            <tr><th>Birthdate</th><td>${residentData.birthdate ? new Date(residentData.birthdate).toLocaleDateString() : "—"}</td></tr>
            <tr><th>Place of Birth</th><td>${residentData.placeOfBirth || "—"}</td></tr>
            <tr><th>Age</th><td>${residentData.age || "—"}</td></tr>
            <tr><th>Gender</th><td>${residentData.gender || "—"}</td></tr>
            <tr><th>Civil Status</th><td>${residentData.civilStatus || "—"}</td></tr>
            <tr><th>Nationality</th><td>${residentData.nationality || "—"}</td></tr>
            <tr><th>Religion</th><td>${residentData.religion || "—"}</td></tr>
            <tr><th>Address</th><td>${residentData.address || "—"}</td></tr>
            <tr><th>Purok</th><td>${residentData.purok || "—"}</td></tr>
            <tr><th>Phone</th><td>${residentData.phone || "—"}</td></tr>
            <tr><th>Education</th><td>${residentData.education || "—"}</td></tr>
            <tr><th>Occupation</th><td>${residentData.occupation || "—"}</td></tr>
            <tr><th>Voter Status</th><td>${residentData.voterStatus || "—"}</td></tr>
            <tr><th>Precinct Number</th><td>${residentData.precinctNumber || "—"}</td></tr>
            <tr><th>Household Number</th><td>${residentData.householdNumber || residentData.household || "—"}</td></tr>
            <tr><th>Head of Family</th><td>${residentData.headOfFamily || "—"}</td></tr>
            <tr><th>Household Head Name</th><td>${residentData.householdHeadName || "—"}</td></tr>
            <tr><th>Relationship to Head</th><td>${residentData.relationshipToHead || "—"}</td></tr>
            <tr><th>Emergency Person</th><td>${residentData.emergencyPerson || "—"}</td></tr>
            <tr><th>Emergency Relation</th><td>${residentData.emergencyRelation || "—"}</td></tr>
            <tr><th>Emergency Number</th><td>${residentData.emergencyNumber || "—"}</td></tr>
            <tr><th>Membership</th><td>${getMemberships(residentData)}</td></tr>
            <tr><th>Status</th><td>${residentData.status || "—"}</td></tr>
            <tr><th>Date Applied</th><td>${residentData.dateApplied ? new Date(residentData.dateApplied).toLocaleDateString() : "—"}</td></tr>
            <tr><th>Verified By</th><td>${residentData.verifiedBy || "—"}</td></tr>
            <tr><th>Position of Verifier</th><td>${residentData.positionOfVerifier || "—"}</td></tr>
            <tr><th>Date Verified</th><td>${residentData.dateVerified ? new Date(residentData.dateVerified).toLocaleDateString() : "—"}</td></tr>
          </tbody>
        </table>

        <div class="legal">
          <p>This document is certified true and correct as per records of Barangay Victory, Tubay, Agusan del Norte.</p>
          <p>Unauthorized reproduction or falsification of this record is punishable under Philippine law.</p>
        </div>

        <div class="signature-section">
          <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>Resident's Signature</strong></p>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>Prepared by:</strong></p>
            <p><em>Barangay Secretary</em></p>
          </div>
        </div>

        <div class="signature-section">
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


  const profileSrc =
    residentData.profileImageBase64 || residentData.profileImage || residentData.photoUrl || null;
  const idSrc = residentData.idPhotoBase64 || residentData.idImage || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] print:bg-transparent md:items-center md:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 print:max-h-none print:overflow-visible md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-resident-title"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-5 py-4 print:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <h2
            id="view-resident-title"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <User className="h-5 w-5" aria-hidden />
            </span>
            Resident details
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
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

        <div
          ref={printRef}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain bg-slate-50/80 p-5 text-sm sm:p-8 dark:bg-slate-950/50 print:overflow-visible print:bg-white print:text-black"
        >
          {/* 🧾 Professional Print Header */}
          <div className="hidden print:block text-center mb-6">
            <img
              src="/logo.png"
              alt="Barangay Logo"
              className="mx-auto mb-3 w-16 h-16 object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900 uppercase">
              Barangay Resident Information Report
            </h1>
            <p className="text-gray-700 text-sm max-w-xl mx-auto mt-1">
              This report contains the verified personal and demographic details of the
              resident as recorded in the Barangay Management Information System.
            </p>
            <hr className="mt-3 border-gray-300" />
          </div>

          <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200 text-xl font-bold text-slate-600 ring-2 ring-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                {profileSrc ? (
                  <img src={profileSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  residentData.firstName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {residentData.fullName ||
                    `${residentData.firstName || ""} ${residentData.lastName || ""}`.trim() ||
                    "N/A"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {residentData.role === "admin" ? "Administrator" : "Resident"}
                </p>
              </div>
            </div>
            <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-32 dark:border-slate-700 dark:bg-slate-800/80">
              {idSrc ? (
                <img src={idSrc} alt="ID" className="h-full w-full object-cover" />
              ) : (
                <span className="px-2 text-center text-xs text-slate-400">No ID image</span>
              )}
            </div>
          </div>

          {/* Sections */}
          <Section title={<><PersonIcon /> Personal information</>}>
            <Field label="First name" value={residentData.firstName} />
            <Field label="Middle name" value={residentData.middleName} />
            <Field label="Last name" value={residentData.lastName} />
            <Field label="Full name" value={residentData.fullName} />
            <Field
              label="Birthdate"
              value={
                residentData.birthdate
                  ? new Date(residentData.birthdate).toLocaleDateString()
                  : undefined
              }
            />
            <Field label="Place of birth" value={residentData.placeOfBirth} />
            <Field label="Age" value={residentData.age} />
            <Field label="Gender" value={residentData.gender} />
            <Field label="Civil status" value={residentData.civilStatus} />
            <Field label="Nationality" value={residentData.nationality} />
            <Field label="Religion" value={residentData.religion} />
          </Section>

          <Section title={<><HomeIcon /> Contact & address</>}>
            <Field label="Address" value={residentData.address} />
            <Field label="Phone" value={residentData.phone} />
            <Field label="Purok" value={residentData.purok} />
            <Field label="Household" value={residentData.household} />
          </Section>

          <Section title={<><VoterIcon /> Voter information</>}>
            <Field label="Voter status" value={residentData.voterStatus} />
            <Field label="Precinct number" value={residentData.precinctNumber} />
          </Section>

          <Section title={<><EducationIcon /> Education & occupation</>}>
            <Field label="Educational attainment" value={residentData.education} />
            <Field label="Occupation" value={residentData.occupation} />
          </Section>

          <Section title={<><FamilyIcon /> Household information</>}>
            <Field label="Head of family" value={residentData.headOfFamily} />
            <Field label="Household head name" value={residentData.householdHeadName} />
            <Field label="Relationship to head" value={residentData.relationshipToHead} />
          </Section>

          <Section title={<><EmergencyIcon /> Emergency contact</>}>
            <Field label="Emergency person" value={residentData.emergencyPerson} />
            <Field label="Relation" value={residentData.emergencyRelation} />
            <Field label="Contact number" value={residentData.emergencyNumber} />
          </Section>

          <Section title={<><StarIcon /> Special memberships</>}>
            <Field label="PWD" value={yn(residentData.pwd)} />
            <Field label="4Ps" value={yn(residentData.member4ps)} />
            <Field label="IPs" value={yn(residentData.memberIps)} />
            <Field label="Senior citizen" value={yn(residentData.seniorCitizen)} />
          </Section>

          <Section title={<><VerificationIcon /> Verification</>}>
            <Field label="Applicant signature" value={residentData.applicantSignature} />
            <Field label="Date applied" value={residentData.dateApplied} />
            <Field label="Verified by" value={residentData.verifiedBy} />
            <Field label="Position of verifier" value={residentData.positionOfVerifier} />
            <Field label="Date verified" value={residentData.dateVerified} />
          </Section>

          <Section title={<><SettingsIcon /> System</>}>
            <Field label="Username" value={residentData.username} />
            <Field label="Role" value={residentData.role} />
            <Field
              label="Status"
              value={
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    residentData.status === "Active"
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : residentData.status === "Pending"
                        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-600/15 dark:bg-amber-950/40 dark:text-amber-200"
                        : "bg-red-50 text-red-800 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                >
                  {residentData.status || "—"}
                </span>
              }
            />
            <Field
              label="Created at"
              value={
                residentData.createdAt
                  ? new Date(residentData.createdAt).toLocaleString()
                  : undefined
              }
            />
          </Section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/90 px-5 py-4 print:hidden dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
        {title}
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Field({ label, value }) {
  const display =
    value === null || value === undefined || value === ""
      ? "N/A"
      : typeof value === "object" && React.isValidElement(value)
        ? value
        : String(value);
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{display}</span>
    </div>
  );
}

/* ✅ SVG Icons for section headers */
function UserIcon() {
  return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A6 6 0 0112 14a6 6 0 016.879 3.804M12 12a4 4 0 100-8 4 4 0 000 8z" /></svg>;
}
function PersonIcon() { return <UserIcon />; }
function HomeIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /></svg>; }
function VoterIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 7h10v10H7V7z" /></svg>; }
function EducationIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422v5.844L12 21l-6.16-4.578v-5.844L12 14z"/></svg>; }
function FamilyIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2 0 4 1 4 4v4H8v-4c0-3 2-4 4-4zM6 8a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z"/></svg>; }
function EmergencyIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>; }
function StarIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.783.57-1.838-.197-1.538-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.065 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z"/></svg>; }
function VerificationIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>; }
function SettingsIcon() { return <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>; }
