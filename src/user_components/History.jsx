import React, { useEffect, useState, useRef } from "react";
import { FileText, Clock, CreditCard, Trash2, Printer, X, User, RefreshCw, LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";
import logo1 from "../assets/logo1.png";
import { readUserActivity, clearUserActivity } from "../utils/activityLog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const History = () => {
  const [history, setHistory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const historyRef = useRef();

  const fetchDocumentRequests = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const residentId = userInfo?.resident?.id || userInfo?.resident?._id;
      if (!residentId) return [];

      const res = await fetch(`${API_URL}/api/document-requests?residentId=${residentId}`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error fetching document requests:", err);
      return [];
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [requests, activities] = await Promise.all([
        fetchDocumentRequests(),
        Promise.resolve(readUserActivity()),
      ]);

      const combined = [];

      // Add document requests
      requests.forEach((req) => {
        combined.push({
          id: req._id || req.id,
          type: "document_request",
          title: req.documentType || "Document Request",
          description: `Purpose: ${req.purpose || "N/A"}`,
          status: req.status || "Pending",
          paymentMethod: "Pickup",
          price: "0",
          date: req.createdAt
            ? new Date(req.createdAt).toLocaleString()
            : new Date().toLocaleString(),
          meta: { requestId: req._id, purpose: req.purpose },
        });
      });

      // Add profile changes and other activities
      activities.forEach((activity) => {
        combined.push({
          id: activity.id,
          type: activity.type || "general",
          title: activity.title || "Activity",
          description: activity.description || "",
          status: activity.meta?.status || "",
          paymentMethod: activity.meta?.paymentMethod || "",
          price: activity.meta?.price || "",
          date: activity.date
            ? new Date(activity.date).toLocaleString()
            : new Date().toLocaleString(),
          meta: activity.meta || {},
        });
      });

      // Sort by date (newest first)
      combined.sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(combined);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const confirmClear = () => setShowConfirm(true);

  const clearHistory = () => {
    clearUserActivity();
    setHistory((prev) => prev.filter((item) => item.type !== "profile_update" && item.type !== "general"));
    setShowConfirm(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "document_request":
        return <FileText className="text-indigo-600 dark:text-indigo-400" size={20} />;
      case "profile_update":
        return <User className="text-blue-600 dark:text-blue-400" size={20} />;
      default:
        return <FileText className="text-gray-600 dark:text-gray-400" size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "document_request":
        return "from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60";
      case "profile_update":
        return "from-blue-100 to-cyan-100 dark:from-blue-900/60 dark:to-cyan-900/60";
      default:
        return "from-gray-100 to-slate-100 dark:from-gray-900/60 dark:to-slate-900/60";
    }
  };

  const getStatusClass = (status) => {
    if (status === "Approved" || status === "Printed") {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30";
    }
    if (status === "Pending") {
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30";
    }
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-600";
  };

  const totalTransactions = history.length;
  const pendingCount = history.filter((item) => item.status === "Pending").length;
  const approvedCount = history.filter((item) => item.status === "Approved" || item.status === "Printed").length;

  const printHistory = () => {
    const historyData = history;

    const listHTML = historyData
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.title || "—"}</td>
        <td>${item.description || "—"}</td>
        <td>${item.status || "—"}</td>
        <td>${item.paymentMethod || "—"}</td>
        <td>${item.price ? `₱${item.price}` : "—"}</td>
        <td>${item.date || "—"}</td>
      </tr>
    `
      )
      .join("");

    const win = window.open("", "_blank");

    win.document.write(`
  <html>
    <head>
      <title>Transaction History - Barangay Victory</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 30px;
          color: #111;
          position: relative;
        }

        body::before {
          content: "Barangay Victory";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 90px;
          color: rgba(0,0,0,0.06);
          z-index: 0;
          pointer-events: none;
        }

        .report-container {
          border: 2px solid #111;
          padding: 35px;
          border-radius: 10px;
          position: relative;
          z-index: 1;
          background: #fff;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header img {
          width: 100px;
          height: auto;
        }

        .header-center {
          text-align: center;
          flex: 1;
          line-height: 1.3;
        }

        .header-center h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .header-center h2 {
          font-size: 20px;
          margin: 0;
          font-weight: 500;
        }

        hr {
          border: none;
          border-top: 2px solid #111;
          margin: 10px 0 15px 0;
        }

        .description {
          text-align: center;
          font-size: 15px;
          margin-bottom: 25px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          margin-top: 10px;
        }

        th, td {
          border: 1px solid #111;
          padding: 8px 10px;
          text-align: left;
        }

        th {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          color: #fff;
          font-weight: 600;
          text-transform: uppercase;
        }

        tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        tr:hover {
          background-color: #e5e7eb;
        }

        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          text-align: center;
        }

        .signature-block {
          width: 45%;
        }

        .signature-line {
          margin-top: 50px;
          border-top: 1px solid #111;
          padding-top: 5px;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 13px;
          color: #333;
          border-top: 1px solid #111;
          padding-top: 5px;
        }

        @media print {
          body { margin: 15px; }
          th { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <img src="${logo}" alt="Logo Left" />
          <div class="header-center">
            <h1>Barangay Victory</h1>
            <h2>Transaction History</h2>
            <hr/>
          </div>
          <img src="${logo1}" alt="Logo Right" />
        </div>

        <div class="description">
          This report shows all transactions including document requests and profile changes with their dates.
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Transaction</th>
              <th>Description</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Price</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${listHTML}
          </tbody>
        </table>

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
          <p>Barangay Victory, Municipality of Tubay, Agusan del Norte, Philippines</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
  </html>
  `);

    win.document.close();
    win.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white font-poppins">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                Resident Portal
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
            Transaction History
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                View your requests, profile updates, and other account activities in one place.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <List size={14} />
                  List
                </button>
              </div>

              <button
                onClick={loadHistory}
                disabled={loading}
                className="group inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button
                onClick={printHistory}
                className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 hover:shadow"
              >
                <Printer size={16} />
                Print
              </button>

              <button
                onClick={confirmClear}
                className="group inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 hover:shadow"
              >
                <Trash2 size={16} />
                Clear Local
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Records</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{totalTransactions}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10">
            <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-300">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800 dark:text-amber-200">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10">
            <p className="text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Approved / Printed</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">{approvedCount}</p>
          </div>
        </div>

      {/* History Grid */}
      <div ref={historyRef}>
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading transactions...
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center italic text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            No transaction history yet. Start requesting documents or updating your profile!
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {history.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03, y: -4 }}
                className={
                  viewMode === "grid"
                    ? "flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    : "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                }
              >
                <div className={viewMode === "grid" ? "" : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"}>
                  <div className={viewMode === "grid" ? "" : "min-w-0"}>
                    {/* Transaction Info */}
                    <div className="flex items-center mb-3 gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <span className="font-semibold text-base sm:text-lg text-slate-800 dark:text-white">{item.title}</span>
                    </div>

                    <p className={`text-sm leading-6 text-slate-600 dark:text-slate-300 ${viewMode === "grid" ? "mb-4" : "mb-3 line-clamp-2"}`}>
                      {item.description}
                    </p>
                  </div>

                  <div className={viewMode === "grid" ? "" : "sm:ml-6 sm:min-w-[280px]"}>
                    {/* Status */}
                    {item.status && (
                      <div className={viewMode === "grid" ? "mb-3" : "mb-3 sm:text-right"}>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}

                    {/* Payment & Price */}
                    {(item.paymentMethod || item.price) && (
                      <div
                        className={`flex items-center ${
                          viewMode === "grid"
                            ? "justify-between border-t border-slate-200 dark:border-slate-700 pt-3 mb-3"
                            : "justify-between sm:justify-end sm:gap-6 border-t border-slate-200 dark:border-slate-700 pt-3 mb-3"
                        }`}
                      >
                        {item.paymentMethod && (
                          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                            <CreditCard size={16} />
                            {item.paymentMethod}
                          </div>
                        )}
                        {item.price && (
                          <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                            ₱{item.price}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    <div
                      className={`flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${
                        viewMode === "grid"
                          ? "mt-3 border-t border-slate-100 pt-3 dark:border-slate-800"
                          : "sm:justify-end"
                      }`}
                    >
                      <Clock size={14} />
                      {item.date}
                    </div>
                  </div>
                </div>
                {viewMode === "list" && (
                  <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    Transaction Record
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl mx-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-md p-1 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="text-slate-500 hover:text-rose-500" />
                </button>
              </div>
              <h2 className="mb-2 text-xl font-bold text-rose-600 dark:text-rose-400">
                Clear Local Activity History?
              </h2>
              <p className="mb-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                This will permanently delete your local activity log (profile changes, etc.). Document requests from the server will remain and can be refreshed.
                Are you sure you want to continue?
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={clearHistory}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white shadow-sm transition-all hover:bg-rose-700"
                >
                  Yes, Clear Local
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
