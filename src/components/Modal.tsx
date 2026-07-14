import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { registerBackHandler } from "../lib/native";
import { GlassButton, PrimaryButton } from "./primitives";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Native Android hardware Back button closes the open modal first.
  // (No-op on web — the listener simply never fires there.)
  useEffect(() => {
    if (!open) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    });
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-2xl"
        onClick={onClose}
        style={{ animation: "blurFadeUp 0.4s ease-out forwards" }}
      />
      <div
        className={cn(
          "liquid-panel blur-fade-up relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:max-h-[88dvh] sm:rounded-3xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon && <span className="text-white/70">{icon}</span>}
              <h2 className="truncate text-base font-medium tracking-tight text-white">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="liquid-glass gh grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="h-4 w-4" />}
      footer={
        <>
          <GlassButton onClick={onClose}>Cancel</GlassButton>
          <PrimaryButton
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-white/60">{message}</p>
    </Modal>
  );
}
