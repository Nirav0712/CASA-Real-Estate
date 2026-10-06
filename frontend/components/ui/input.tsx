import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      clearable,
      onClear,
      value,
      disabled,
      ...props
    },
    ref,
  ) => {
    const id = React.useId();
    const inputId = props.id || id;

    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-casa-text-primary block select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {prefixIcon && (
            <div className="absolute start-3.5 text-casa-text-muted pointer-events-none flex items-center justify-center">
              {prefixIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full bg-casa-surface text-casa-text-primary text-sm rounded-xl border transition-all duration-150 placeholder:text-casa-text-muted focus:outline-none focus:ring-2 focus:ring-casa-brand/20 disabled:opacity-50 disabled:bg-casa-canvas',
              prefixIcon ? 'ps-10' : 'ps-3.5',
              suffixIcon || (clearable && value) ? 'pe-10' : 'pe-3.5',
              'py-2.5',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-casa-border-medium focus:border-casa-brand',
              className,
            )}
            {...props}
          />

          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear input"
              className="absolute end-3 p-1 rounded-md text-casa-text-muted hover:text-casa-text-primary hover:bg-casa-subtle transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {!clearable && suffixIcon && (
            <div className="absolute end-3.5 text-casa-text-muted pointer-events-none flex items-center justify-center">
              {suffixIcon}
            </div>
          )}
        </div>

        {error && (
          <span className="text-[11px] font-medium text-rose-600 animate-in fade-in">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span className="text-[11px] text-casa-text-muted">
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
