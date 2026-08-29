import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const FIELD_CLASSES =
  "block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 " +
  "placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 " +
  "disabled:bg-neutral-100 disabled:text-neutral-400";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
}

function FieldChrome({ label, error, hint, id, children }: FieldWrapperProps & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : hint ? <span className="text-xs text-neutral-500">{hint}</span> : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, id, className, ...props }, ref) => (
  <FieldChrome label={label} error={error} hint={hint} id={id}>
    <input ref={ref} id={id} className={clsx(FIELD_CLASSES, error && "border-red-400 focus:border-red-500 focus:ring-red-100", className)} {...props} />
  </FieldChrome>
));
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, hint, id, className, ...props }, ref) => (
  <FieldChrome label={label} error={error} hint={hint} id={id}>
    <textarea ref={ref} id={id} className={clsx(FIELD_CLASSES, error && "border-red-400 focus:border-red-500 focus:ring-red-100", className)} {...props} />
  </FieldChrome>
));
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, hint, id, className, children, ...props }, ref) => (
  <FieldChrome label={label} error={error} hint={hint} id={id}>
    <select ref={ref} id={id} className={clsx(FIELD_CLASSES, "pe-8", error && "border-red-400 focus:border-red-500 focus:ring-red-100", className)} {...props}>
      {children}
    </select>
  </FieldChrome>
));
Select.displayName = "Select";
