import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import type { Priority } from "../lib/types";

/* Signature entrance wrapper — "blur fade up" with staggered delay */
export function FadeIn({
  children,
  delay = 0,
  className,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <div
      className={cn("blur-fade-up", className)}
      style={{ animationDelay: `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* The ONE solid accent element: white button, black text */
export function PrimaryButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* Liquid-glass pill button */
export function GlassButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "liquid-glass gh inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/85 transition hover:text-white active:scale-[0.97]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* Circular glass icon button */
export function IconButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "liquid-glass gh grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/85 transition hover:text-white active:scale-95",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* Filter / segmented pill */
export function TogglePill({
  active,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]"
          : "text-white/45 hover:text-white/90",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-medium text-white/55",
        className
      )}
    >
      {children}
    </span>
  );
}

/* Monochrome priority indicator (3 bars) */
export function PriorityBars({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const level = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  const heights = ["h-1.5", "h-2.5", "h-3.5"];
  return (
    <span
      className={cn("inline-flex items-end gap-[3px]", className)}
      title={`${priority} priority`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full",
            heights[i],
            i < level ? "bg-white/85" : "bg-white/15"
          )}
        />
      ))}
    </span>
  );
}

/* Circular check used by tasks + habits */
export function CircleCheck({
  checked,
  onClick,
  className,
  size = "md",
}: {
  checked: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const ic = size === "sm" ? "h-3 w-3" : "h-[18px] w-[18px]";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-pressed={checked}
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition active:scale-90",
        dim,
        checked
          ? "bg-white text-black"
          : "liquid-glass text-white/25 hover:text-white/70",
        className
      )}
    >
      <Check className={ic} strokeWidth={3} />
    </button>
  );
}

export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/40",
        className
      )}
    >
      {children}
    </label>
  );
}

export function Panel({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("liquid-glass rounded-3xl", className)} {...rest}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="liquid-glass grid h-12 w-12 place-items-center rounded-full text-white/40">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* Two-stage (armed) delete button to prevent accidents */
export function DeleteButton({
  onConfirm,
  className,
  label = "Delete",
}: {
  onConfirm: () => void;
  className?: string;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={cn(
        "liquid-glass gh inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.97]",
        armed ? "text-white" : "text-white/55 hover:text-white",
        className
      )}
    >
      <Trash2 className="h-4 w-4" />
      {armed ? "Confirm?" : label}
    </button>
  );
}
