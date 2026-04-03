import { Toaster, ToastBar } from "react-hot-toast";

/** Theme-aware tokens (see index.css :root / .dark) */
export const bmsToastOptions = {
  duration: 4000,
  removeDelay: 320,
  className: "bms-toast-surface",
  style: {
    borderRadius: "16px",
    padding: "14px 18px",
    fontWeight: 600,
    fontSize: "0.9375rem",
    lineHeight: 1.45,
    background: "var(--bms-toast-bg)",
    color: "var(--bms-toast-fg)",
    border: "1px solid var(--bms-toast-border)",
    boxShadow: "var(--bms-toast-shadow)",
    backdropFilter: "blur(14px) saturate(1.15)",
    WebkitBackdropFilter: "blur(14px) saturate(1.15)",
    maxWidth: "min(calc(100vw - 32px), 400px)",
  },
  success: {
    duration: 3500,
    iconTheme: { primary: "#ffffff", secondary: "#059669" },
    style: {
      border: "1px solid var(--bms-toast-border-success)",
      boxShadow: "var(--bms-toast-shadow-success)",
    },
  },
  error: {
    duration: 5000,
    iconTheme: { primary: "#ffffff", secondary: "#e11d48" },
    style: {
      border: "1px solid var(--bms-toast-border-error)",
      boxShadow: "var(--bms-toast-shadow-error)",
    },
  },
  loading: {
    iconTheme: { primary: "#e0f2fe", secondary: "#0ea5e9" },
    style: {
      border: "1px solid var(--bms-toast-border-loading)",
    },
  },
};

/**
 * react-hot-toast with glass styling + outer motion wrapper (index.css `.bms-toast-motion`).
 */
export function BmsToaster({ position = "top-center", gutter = 14, toastOptions, ...rest }) {
  const merged = { ...bmsToastOptions, ...toastOptions };
  return (
    <Toaster
      position={position}
      gutter={gutter}
      toastOptions={merged}
      containerClassName="bms-toaster-root"
      {...rest}
    >
      {(t) => (
        <div className="bms-toast-motion pointer-events-auto">
          <ToastBar toast={t} position={t.position || position} />
        </div>
      )}
    </Toaster>
  );
}
