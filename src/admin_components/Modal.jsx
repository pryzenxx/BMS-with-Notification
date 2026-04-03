import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const sizeToClass = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  center,
  size = "md",
  icon: _unusedIcon,
}) => {
  const maxW = sizeToClass[size] || sizeToClass.md;

  if (center) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] md:items-center md:p-4">
            <motion.div
              key="modal-center-backdrop"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              key="modal-center-panel"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className={`relative z-10 flex max-h-[min(90vh,920px)] w-full ${maxW} flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:rounded-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-5 sm:py-4">
                <div className="min-w-0 flex-1 text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  {title}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-[400px]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/95">
              <h2 className="min-w-0 pr-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                type="button"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
