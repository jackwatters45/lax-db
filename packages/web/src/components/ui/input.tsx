import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-sm',
  {
    variants: {
      variant: {
        default: '',
        data: 'absolute rounded-0 inset-0 border-none h-full shadow-none rounded-none py-0 px-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export interface DebouncedInputProps
  extends Omit<InputProps, 'value' | 'onChange'> {
  value: string | number | null;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
}

const DebouncedInput = React.forwardRef<HTMLInputElement, DebouncedInputProps>(
  (
    { value: initialValue, onDebouncedChange, debounceMs = 500, ...props },
    ref,
  ) => {
    const [value, setValue] = React.useState(initialValue ?? '');

    const debouncedUpdate = useDebouncedCallback((newValue: string) => {
      onDebouncedChange(newValue);
    }, debounceMs);

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          debouncedUpdate(e.target.value);
        }}
      />
    );
  },
);
DebouncedInput.displayName = 'DebouncedInput';

export { Input, DebouncedInput };
