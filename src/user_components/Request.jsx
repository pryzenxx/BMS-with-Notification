import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShoppingCart,
  Trash2,
  Loader2,
  Clock,
  CheckCircle2,
  X,
  RefreshCw,
  Package,
  Sparkles,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { toast } from "react-hot-toast";
import "swiper/css";
import "swiper/css/pagination";
import { appendUserActivity } from "../utils/activityLog";

const documentOptions = [
  { id: 1, name: "Residency Certificate", price: 40 },
  { id: 2, name: "Indigency Certificate", price: 30 },
  { id: 3, name: "Barangay Clearance", price: 50 },
  { id: 4, name: "Business Permit", price: 100 },
  { id: 5, name: "Certificate of Good Moral Character", price: 50 },
  { id: 6, name: "Certificate of Employment", price: 50 },
  { id: 7, name: "Solo Parent Certificate", price: 30 },
  { id: 8, name: "First Time Jobseeker Assistance", price: 25 },
  { id: 9, name: "Barangay ID", price: 100 },
];

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5000/api";

const getResidentId = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo") || "{}")?.resident?.id;
  } catch {
    return undefined;
  }
};

const cardBtnClass =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] dark:bg-sky-500 dark:hover:bg-sky-600 sm:min-h-0";

const inputClass =
  "w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

const statusStyles = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "printed")
    return "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400";
  if (s === "approved")
    return "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-400";
  if (s === "rejected")
    return "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400";
  return "bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-300";
};

function RequestHistoryRow({ req, showDelete = false, onDeletePress, deleteLoadingId = null }) {
  const s = (req.status || "").toLowerCase();
  const canRemove = s === "pending";
  const busy = deleteLoadingId != null;
  const isThisDeleting = deleteLoadingId === req._id;

  return (
    <li className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 border-l-4 border-sky-500/60 pl-3 dark:border-sky-400/50">
          <p className="font-semibold text-slate-900 dark:text-white">{req.documentType}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-500 dark:text-slate-500">Purpose</span>
            <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
            <span className="break-words">{req.purpose}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {new Date(req.createdAt).toLocaleString()}
            </span>
            {req.quantity != null && Number(req.quantity) > 0 && (
              <span className="tabular-nums">Qty: {req.quantity}</span>
            )}
            {req.price != null && req.price !== "" && (
              <span className="tabular-nums">₱{req.price}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles(req.status)}`}
            >
              {req.status}
            </span>
            {showDelete && canRemove && onDeletePress && (
              <button
                type="button"
                onClick={() => onDeletePress(req)}
                disabled={busy}
                className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-rose-500/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                title="Remove request"
                aria-label="Remove pending request"
              >
                {isThisDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {s === "printed" && (
            <span className="inline-flex items-center justify-end gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Ready for pickup
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

const Request = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [purposeText, setPurposeText] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [cart, setCart] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [donePayment, setDonePayment] = useState({ status: false, method: "", message: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [isNetworkLoading, setIsNetworkLoading] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [documentRequestToDelete, setDocumentRequestToDelete] = useState(null);
  const [documentRequestDeletingId, setDocumentRequestDeletingId] = useState(null);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [requests]
  );

  const requestStats = useMemo(() => {
    let printed = 0;
    let pending = 0;
    let rejected = 0;
    for (const r of requests) {
      const s = (r.status || "").toLowerCase();
      if (s === "printed") printed += 1;
      else if (s === "rejected") rejected += 1;
      else pending += 1;
    }
    return { total: requests.length, printed, pending, rejected };
  }, [requests]);

  const recentPreview = useMemo(() => sortedRequests.slice(0, 2), [sortedRequests]);

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const handleNetworkChange = () => {
      if (connection) setIsNetworkLoading(connection.effectiveType === "2g" || connection.effectiveType === "3g");
    };
    if (connection) {
      handleNetworkChange();
      connection.addEventListener("change", handleNetworkChange);
    }
    return () => connection && connection.removeEventListener("change", handleNetworkChange);
  }, []);

  const openModal = (doc) => {
    setSelectedDoc(doc);
    setPurposeText("");
    setShowWarning(false);
  };
  const closeModal = () => {
    setSelectedDoc(null);
    setPurposeText("");
    setShowWarning(false);
  };

  const addToCartWithNote = () => {
    if (!purposeText.trim()) {
      setShowWarning(true);
      toast.error("Purpose is required!");
      return;
    }
    const existing = cart.find((item) => item.id === selectedDoc.id && item.purpose === purposeText);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === existing.id && item.purpose === existing.purpose
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else setCart([...cart, { ...selectedDoc, purpose: purposeText, quantity: 1 }]);
    toast.success(`${selectedDoc.name} added!`);
    closeModal();
  };

  const openDeleteConfirm = (id) => setDeleteId(id);
  const cancelDelete = () => setDeleteId(null);
  const confirmDelete = () => {
    setCart(cart.filter((item) => item.id !== deleteId));
    toast.success("Item removed.");
    setDeleteId(null);
  };
  const increaseQty = (id) =>
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));
  const decreaseQty = (id) =>
    setCart(
      cart.map((item) =>
        item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );

  const openPaymentModal = () =>
    cart.length === 0 ? toast.error("Cart is empty.") : setIsPaymentModalOpen(true);

  const fetchRequests = useCallback(async () => {
    const id = getResidentId();
    if (!id) return;
    try {
      setRequestsLoading(true);
      const res = await fetch(`${API_BASE}/document-requests?residentId=${id}`);
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Fetch requests error:", err);
      toast.error("Failed to load your document requests.");
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const confirmDeleteDocumentRequest = async () => {
    const target = documentRequestToDelete;
    if (!target?._id) return;
    const rid = getResidentId();
    if (!rid) {
      toast.error("Please log in again.");
      return;
    }
    setDocumentRequestDeletingId(target._id);
    try {
      const res = await fetch(
        `${API_BASE}/document-requests/${target._id}?residentId=${encodeURIComponent(rid)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Could not remove request.");
      }
      toast.success("Request removed.");
      setDocumentRequestToDelete(null);
      await fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to remove request.");
    } finally {
      setDocumentRequestDeletingId(null);
    }
  };

  const createDocumentRequests = async (method) => {
    const id = getResidentId();
    if (!id) throw new Error("Resident account not found.");
    const payloads = cart.map((item) => ({
      residentId: id,
      documentType: item.name,
      purpose: item.purpose,
      quantity: item.quantity,
      price: item.price,
      paymentMethod: method,
    }));
    for (const payload of payloads) {
      const res = await fetch(`${API_BASE}/document-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit request.");
      }
      appendUserActivity({
        type: "document-request",
        title: payload.documentType,
        description: payload.purpose,
        date: data.request?.createdAt || new Date().toISOString(),
        meta: { status: data.request?.status || "Pending", paymentMethod: method },
      });
    }
  };

  const handlePayment = async (method) => {
    if (cart.length === 0) return;
    if (!getResidentId()) {
      toast.error("Please log in again to submit requests.");
      return;
    }
    setIsLoading(true);
    try {
      await createDocumentRequests(method);
      setCart([]);
      setIsPaymentModalOpen(false);
      setDonePayment({
        status: true,
        method,
        message:
          method === "Pickup"
            ? "Pickup selected. Wait for the admin to prepare your request."
            : "Request submitted successfully.",
      });
      toast.success("Document request submitted!");
      fetchRequests();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative mx-auto w-full min-w-0 max-w-5xl px-3 pb-6 pt-1 sm:px-4 md:px-6 md:py-8"
    >
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileText className="h-5 w-5" />
            </span>
            Request documents
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Choose a certificate, add a short purpose, then checkout. Track status below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="relative inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:self-auto"
        >
          <ShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          Cart
          {cart.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1 text-[11px] font-bold text-white dark:bg-sky-500">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Document Swiper */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white px-2 pb-8 pt-4 dark:border-slate-700/80 dark:from-slate-900/50 dark:to-slate-900/30 sm:px-4">
        <Swiper
          spaceBetween={16}
          pagination={{ clickable: true, dynamicBullets: true }}
          breakpoints={{
            320: { slidesPerView: 1 },
            480: { slidesPerView: 1.15 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
          modules={[Pagination]}
          className="document-request-swiper pb-10"
        >
          {documentOptions.map((doc) => (
            <SwiperSlide key={doc.id} className="!h-auto">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="flex h-full min-h-[260px] flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700/90 dark:bg-slate-900 sm:rounded-2xl sm:p-5"
              >
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sky-600 dark:bg-slate-800 dark:text-sky-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-center text-sm font-semibold leading-snug text-slate-900 dark:text-white sm:text-base">
                    {doc.name}
                  </h3>
                  <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                    Barangay-issued document
                  </p>
                  <p className="mt-3 text-center text-lg font-bold tabular-nums text-sky-600 dark:text-sky-400">
                    ₱{doc.price}
                  </p>
                </div>
                <button type="button" onClick={() => openModal(doc)} className={`${cardBtnClass} mt-4`}>
                  Add to cart
                </button>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Purpose modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900 sm:rounded-2xl sm:p-6"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Document
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                    {selectedDoc.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-sky-600 dark:text-sky-400">₱{selectedDoc.price}</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Purpose <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={purposeText}
                onChange={(e) => {
                  setPurposeText(e.target.value);
                  if (e.target.value.trim()) setShowWarning(false);
                }}
                rows={4}
                placeholder="e.g. School enrollment, employment requirement, loan application"
                className={`${inputClass} mt-1.5`}
              />
              {showWarning && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">Purpose is required.</p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:min-h-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addToCartWithNote}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 sm:min-h-0"
                >
                  Confirm & add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close cart"
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your cart</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                {donePayment.status && donePayment.method === "Pickup" && (
                  <div className="mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2.5 text-center text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {donePayment.message}
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <ShoppingCart className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Your cart is empty</p>
                    <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
                      Add documents from the list, then proceed to payment.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.id}-${item.purpose}-${index}`}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700/80 dark:bg-slate-800/40"
                        >
                          <div className="flex gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                                {item.purpose}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-900">
                                <button
                                  type="button"
                                  onClick={() => decreaseQty(item.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  −
                                </button>
                                <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => increaseQty(item.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(item.id)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                                aria-label="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <p className="text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                ₱{item.price * item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-700/80">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Total</span>
                        <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                          ₱{totalCost}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={openPaymentModal}
                        className="mt-3 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                      >
                        Proceed to payment
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <div className="mb-4 flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Remove from cart?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This document will be removed from your cart.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment method</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Pay when you pick up your documents at the barangay hall.
              </p>

              {isLoading ? (
                <div className="mt-6 flex items-center justify-center gap-2 text-sky-600 dark:text-sky-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Submitting…</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handlePayment("Pickup")}
                    className="mt-6 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    <FileText className="h-4 w-4" />
                    Pay on pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="mt-3 w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request status — summary + modal for full list */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 sm:mt-10">
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-4 py-4 dark:border-slate-700/80 dark:from-slate-900 dark:to-slate-900/80 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">My document requests</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Submitted to barangay records</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchRequests}
                disabled={requestsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${requestsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {requests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRequestsModalOpen(true);
                    fetchRequests();
                  }}
                  className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5 opacity-90" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {requestsLoading && requests.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
              Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No requests yet</p>
              <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Add documents to your cart and complete checkout to see them here.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700/60 dark:bg-slate-800/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total
                  </p>
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                    {requestStats.total}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-amber-500/5 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/80 dark:text-amber-300/90">
                    In progress
                  </p>
                  <p className="text-lg font-bold tabular-nums text-amber-900 dark:text-amber-200">
                    {requestStats.pending}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-emerald-500/5 px-3 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/90">
                    Printed
                  </p>
                  <p className="text-lg font-bold tabular-nums text-emerald-900 dark:text-emerald-200">
                    {requestStats.printed}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-rose-500/5 px-3 py-2.5 dark:border-rose-500/20 dark:bg-rose-500/5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-800/80 dark:text-rose-300/90">
                    Rejected
                  </p>
                  <p className="text-lg font-bold tabular-nums text-rose-900 dark:text-rose-200">
                    {requestStats.rejected}
                  </p>
                </div>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Recent
              </p>
              <ul className="space-y-2">
                {recentPreview.map((req) => (
                  <RequestHistoryRow key={req._id} req={req} />
                ))}
              </ul>
              {sortedRequests.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setRequestsModalOpen(true);
                    fetchRequests();
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50/50 dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-200 dark:hover:border-sky-500/40 dark:hover:bg-sky-950/20"
                >
                  <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  View all {sortedRequests.length} requests
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Full request history modal */}
      <AnimatePresence>
        {requestsModalOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRequestsModalOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="requests-modal-title"
              className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900 sm:max-h-[85vh] sm:rounded-2xl"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-4 py-4 dark:border-slate-700/80 dark:from-slate-900 dark:to-slate-900/90 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      id="requests-modal-title"
                      className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl"
                    >
                      All document requests
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {sortedRequests.length}
                      </span>{" "}
                      {sortedRequests.length === 1 ? "record" : "records"}
                      <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
                      Newest first
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-500">
                        Pending requests can be removed with the trash icon.
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fetchRequests()}
                      disabled={requestsLoading}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Refresh list"
                    >
                      <RefreshCw className={`h-5 w-5 ${requestsLoading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestsModalOpen(false)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {sortedRequests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">
                      Total {requestStats.total}
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                      In progress {requestStats.pending}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                      Printed {requestStats.printed}
                    </span>
                    {requestStats.rejected > 0 && (
                      <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-900 dark:text-rose-200">
                        Rejected {requestStats.rejected}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                {requestsLoading && sortedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                    <p className="text-sm font-medium">Loading…</p>
                  </div>
                ) : sortedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No requests found</p>
                  </div>
                ) : (
                  <ul className="space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {sortedRequests.map((req) => (
                      <RequestHistoryRow
                        key={req._id}
                        req={req}
                        showDelete
                        deleteLoadingId={documentRequestDeletingId}
                        onDeletePress={(r) => setDocumentRequestToDelete(r)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/95 sm:px-6">
                <button
                  type="button"
                  onClick={() => setRequestsModalOpen(false)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm remove document request (from view-all modal) */}
      <AnimatePresence>
        {documentRequestToDelete && (
          <motion.div
            className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Remove this request?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {documentRequestToDelete.documentType}
                  </span>{" "}
                  will be cancelled. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDocumentRequestToDelete(null)}
                  disabled={!!documentRequestDeletingId}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteDocumentRequest}
                  disabled={!!documentRequestDeletingId}
                  className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
                >
                  {documentRequestDeletingId ? "Removing…" : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slow network overlay */}
      <AnimatePresence>
        {isNetworkLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/45 backdrop-blur-sm"
          >
            <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-900/95">
              <Loader2 className="mb-3 h-9 w-9 animate-spin text-sky-600 dark:text-sky-400" />
              <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                Slow network detected — please wait a moment.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .document-request-swiper .swiper-pagination-bullet {
          background: rgb(100 116 139);
          opacity: 0.35;
        }
        .document-request-swiper .swiper-pagination-bullet-active {
          background: rgb(14 165 233);
          opacity: 1;
        }
        .dark .document-request-swiper .swiper-pagination-bullet {
          background: rgb(148 163 184);
        }
        .dark .document-request-swiper .swiper-pagination-bullet-active {
          background: rgb(56 189 248);
        }
      `}</style>
    </motion.div>
  );
};

export default Request;
