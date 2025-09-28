import type { RemixiconComponentType } from '@remixicon/react';
import { RiDeleteBinLine, RiEdit2Line, RiMoreFill } from '@remixicon/react';
import type { Row } from '@tanstack/react-table';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type RowActions<TData = unknown> = {
  onEdit?: (row: Row<TData>) => void;
  onDelete?: (row: Row<TData>) => void;
};

type RowActionsContextValue<TData = unknown> = {
  row: Row<TData>;
  actions?: RowActions<TData>;
};

const RowActionsContext = React.createContext<RowActionsContextValue | null>(
  null,
);

function useRowActions<TData = unknown>(): RowActionsContextValue<TData> {
  const context = React.useContext(RowActionsContext);
  if (!context) {
    throw new Error('useRowActions must be used within a RowActionsProvider');
  }
  return context as RowActionsContextValue<TData>;
}

type RowActionsProviderProps<TData> = {
  row: Row<TData>;
  actions?: RowActions<TData>;
  children: React.ReactNode;
};

function RowActionsProvider<TData>({
  row,
  actions,
  children,
}: RowActionsProviderProps<TData>) {
  const value = React.useMemo(
    () => ({
      row,
      actions,
    }),
    [row, actions],
  );

  return (
    <RowActionsContext.Provider value={value as RowActionsContextValue}>
      {children}
    </RowActionsContext.Provider>
  );
}

type RowActionsDropdownProps = {
  children: React.ReactNode;
  className?: string;
};

function RowActionsDropdown({ children, className }: RowActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'group aspect-square p-1.5 hover:border hover:border-border data-[state=open]:border-border data-[state=open]:bg-muted',
            className,
          )}
        >
          <RiMoreFill
            className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground group-data-[state=open]:text-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type RowActionItemProps = {
  icon?: RemixiconComponentType;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
};

function RowActionItem({
  icon: Icon,
  children,
  onClick,
  variant = 'default',
  className,
}: RowActionItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        'gap-2',
        variant === 'destructive' && 'text-destructive focus:text-destructive',
        className,
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </DropdownMenuItem>
  );
}

function RowActionEditItem({ className }: { className?: string }) {
  const { actions, row } = useRowActions();

  if (!actions?.onEdit) {
    throw new Error(
      'RowActionEditItem requires onEdit action to be provided to RowActionsProvider',
    );
  }

  return (
    <RowActionItem
      icon={RiEdit2Line}
      onClick={() => actions.onEdit?.(row)}
      className={className}
    >
      Edit
    </RowActionItem>
  );
}

function RowActionDeleteItem({ className }: { className?: string }) {
  const { actions, row } = useRowActions();

  if (!actions?.onDelete) {
    throw new Error(
      'RowActionDeleteItem requires onDelete action to be provided to RowActionsProvider',
    );
  }

  return (
    <RowActionItem
      icon={RiDeleteBinLine}
      onClick={() => actions.onDelete?.(row)}
      variant="destructive"
      className={className}
    >
      Delete
    </RowActionItem>
  );
}

function RowActionSeparator() {
  return <DropdownMenuSeparator />;
}

// Legacy component for backwards compatibility
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  return (
    <RowActionsProvider row={row}>
      <RowActionsDropdown>
        <RowActionItem>Add</RowActionItem>
        <RowActionItem>Edit</RowActionItem>
        <RowActionItem variant="destructive">Delete</RowActionItem>
      </RowActionsDropdown>
    </RowActionsProvider>
  );
}

export {
  RowActionsProvider,
  RowActionsDropdown,
  RowActionItem,
  RowActionEditItem,
  RowActionDeleteItem,
  RowActionSeparator,
  useRowActions,
};
