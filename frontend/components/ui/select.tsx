import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      icon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const id = React.useId();
    const selectId = props.id || id;

    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-casa-text-primary block select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute start-3.5 text-casa-text-muted pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full appearance-none bg-casa-surface text-casa-text-primary text-sm rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-casa-brand/20 disabled:opacity-50 disabled:bg-casa-canvas cursor-pointer',
              icon ? 'ps-10' : 'ps-3.5',
              'pe-10 py-2.5',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-casa-border-medium focus:border-casa-brand',
              className,
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute end-3.5 text-casa-text-muted pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && (
          <span className="text-[11px] font-medium text-rose-600 animate-in fade-in">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span className="text-[11px] text-casa-text-muted">{helperText}</span>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
