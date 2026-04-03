import React, { useState, useEffect, useMemo, useRef } from "react";
import { Printer, FileText, Loader2, ChevronDown, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";
import { API_BASE } from "../utils/apiBase";

const formatMoney = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const txnRowKey = (txn, index) => txn._id || txn.id || `txn-${index}`;

const TransactionPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const printMenuRef = useRef(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/document-requests/transactions`);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        toast.error("Failed to load transactions");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDocClick = (e) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  const totals = useMemo(() => {
    const count = transactions.length;
    const sum = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    return { count, sum };
  }, [transactions]);

  const generateReportHTML = () => {
    const listHTML = transactions
      .map((txn, index) => {
        const formattedDate = txn.date
          ? new Date(txn.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "N/A";
        const amount = formatMoney(txn.amount);
        return `
      <tr>
        <td>${index + 1}</td>
        <td>${txn.name ?? "—"}</td>
        <td>${txn.document ?? "—"}</td>
        <td>₱${amount}</td>
        <td>${txn.payment ?? "—"}</td>
        <td>${formattedDate}</td>
      </tr>
    `;
      })
      .join("");

    return `
    <html>
    <head>
      <title>Transaction Report - Barangay Victory</title>
      <style>
        body { font-family: 'Times New Roman', serif; margin: 40px; color: #000; position: relative; }
        body::before { content: "Barangay Victory"; position: absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-25deg); font-size:90px; color:rgba(0,0,0,0.08); z-index:0; pointer-events:none; }
        .report-container { border:3px double #000; padding:40px; border-radius:8px; position:relative; z-index:1; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; }
        .header img { width:100px; height:auto; }
        .header-center { text-align:center; flex:1; line-height:1.4; }
        .header-center h1 { font-size:22px; font-weight:bold; margin:0; }
        .header-center h2 { font-size:20px; margin:0; }
        .header-center h3 { font-size:18px; font-weight:600; margin:0; }
        .header-center p { margin:5px 0; font-style:italic; font-size:15px; }
        hr { border:none; border-top:2px solid #000; margin:10px 0 20px 0; }
        .certificate-number { text-align:right; font-size:14px; font-style:italic; margin-bottom:10px; }
        .description { text-align:center; font-size:15px; margin-bottom:25px; line-height:1.7; }
        table { width:100%; border-collapse: collapse; font-size:14px; margin-top:10px; }
        th, td { border:1px solid #000; padding:8px 10px; text-align:left; }
        th { background:#f3f4f6; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; }
        tr:nth-child(even) { background-color:#fafafa; }
        tr:hover { background-color:#f1f5f9; }
        .legal { margin-top:25px; font-size:13px; text-align:center; font-style:italic; color:#444; }
        .signature-section { margin-top:60px; display:flex; justify-content:space-between; font-size:14px; text-align:center; }
        .signature-block { width:45%; }
        .signature-line { margin-top:60px; border-top:1px solid #000; padding-top:5px; }
        .footer { margin-top:50px; text-align:center; font-size:13px; color:#333; border-top:1px solid #000; padding-top:5px; }
        @media print { body { margin:20px; } }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <img src="${logo}" alt="Logo Left" />
          <div class="header-center">
            <h1>Republic of the Philippines</h1>
            <h2>Province of Agusan del Norte</h2>
            <h3>Municipality of Tubay</h3>
            <h1><strong>Barangay Victory</strong></h1>
            <hr />
            <p><strong>Official Transaction Report</strong></p>
          </div>
          <img src="${logo1}" alt="Logo Right" />
        </div>

        <div class="certificate-number">
          Report No.: TR-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}
        </div>

        <div class="description">
          <p>
            The following table represents the official transactions recorded under the jurisdiction of
            <strong>Barangay Victory</strong>. This report is generated for administrative, record-keeping, and verification purposes.
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Full Name</th>
              <th>Document</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${listHTML}
          </tbody>
        </table>

        <div class="legal">
          <p>This document is certified true and correct as per records of Barangay Victory, Tubay, Agusan del Norte.</p>
          <p>Unauthorized reproduction or falsification of this report is punishable under Philippine law.</p>
        </div>

        <div class="signature-section">
          <div class="signature-block">
            <div class="signature-line"></div>
            <p><strong>Prepared by:</strong></p>
            <p><em>Barangay Secretary</em></p>
          </div>
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
  `;
  };

  const handlePrintOption = () => {
    const reportHTML = generateReportHTML();
    const win = window.open("", "_blank");
    win.document.write(reportHTML);
    win.document.close();
    win.print();
    setDropdownOpen(false);
  };

  return (
    <div className="min-h-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <Receipt className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Transaction records
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Document request payments and fees — official registry for reporting and print.
            </p>
          </div>
        </div>

        <div className="relative shrink-0" ref={printMenuRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
          >
            <Printer className="h-4 w-4" />
            Print report
            <ChevronDown className={`h-4 w-4 transition ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200/80 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handlePrintOption}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Printer className="h-4 w-4 shrink-0 text-slate-500" />
                Print / Save as PDF
              </button>
              <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Use your browser print dialog — choose “Save as PDF” to export.
              </p>
            </div>
          )}
        </div>
      </div>

      {!loading && transactions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total entries
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{totals.count}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total amount (PHP)
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              ₱{formatMoney(totals.sum)}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Registry</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">All rows from document request transactions</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading transactions…</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No transactions found</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Completed document payments will appear here.</p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    #
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Document
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Payment
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((txn, index) => (
                  <motion.tr
                    key={txnRowKey(txn, index)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
                    className="transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/25"
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <span className="line-clamp-2" title={txn.name ?? ""}>
                        {txn.name ?? "—"}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-slate-700 dark:text-slate-300">
                      <span className="line-clamp-2" title={txn.document ?? ""}>
                        {txn.document ?? "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-slate-800 dark:text-slate-200">
                      ₱{formatMoney(txn.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{txn.payment ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                      {txn.date
                        ? new Date(txn.date).toLocaleDateString(undefined, { dateStyle: "medium" })
                        : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionPanel;
