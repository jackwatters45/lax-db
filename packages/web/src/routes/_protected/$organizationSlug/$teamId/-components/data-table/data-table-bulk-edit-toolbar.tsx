import type { RowSelectionState, Table } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';
import { Edit, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type BulkEditActions = {
  onEdit?: () => void;
  onDelete?: () => void;
};

type BulkEditContextValue<TData = unknown> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
  selectedCount: number;
  actions?: BulkEditActions;
};

const BulkEditContext =
  React.createContext<BulkEditContextValue<unknown> | null>(null);

function useBulkEdit<TData = unknown>(): BulkEditContextValue<TData> {
  const context = React.use(BulkEditContext);
  if (!context) {
    throw new Error('useBulkEdit must be used within a BulkEditProvider');
  }
  return context as BulkEditContextValue<TData>;
}

type BulkEditProviderProps<TData> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
  actions?: BulkEditActions;
  children: React.ReactNode;
};

function BulkEditProvider<TData>({
  table,
  rowSelection,
  actions,
  children,
}: BulkEditProviderProps<TData>) {
  const selectedCount = Object.keys(rowSelection).length;

  const value = React.useMemo(
    () => ({
      table,
      rowSelection,
      selectedCount,
      actions,
    }),
    [table, rowSelection, selectedCount, actions],
  );

  return (
    <BulkEditContext.Provider value={value as BulkEditContextValue<unknown>}>
      {children}
    </BulkEditContext.Provider>
  );
}

type BulkEditToolbarProps = {
  children: React.ReactNode;
  className?: string;
};

type BulkEditToolbarCountProps = {
  className?: string;
};

type BulkEditToolbarClearProps = {
  className?: string;
};

type BulkEditToolbarActionsProps = {
  children: React.ReactNode;
  className?: string;
};

type BulkEditToolbarActionProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
};

function BulkEditToolbar({ children, className }: BulkEditToolbarProps) {
  const { selectedCount } = useBulkEdit();

  if (selectedCount === 0) return null;

  return (
    <TooltipProvider>
      <div className="slide-in-from-bottom-4 fixed right-0 bottom-4 left-0 z-50 flex animate-in justify-center duration-300">
        <div
          className={cn(
            'max-w-2xl rounded-3xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm',
            className,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function BulkEditToolbarCount({ className }: BulkEditToolbarCountProps) {
  const { selectedCount } = useBulkEdit();

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-accent bg-accent px-2 py-0.5 text-foreground text-xs',
        className,
      )}
    >
      {selectedCount}
    </Badge>
  );
}

function BulkEditToolbarClear({ className }: BulkEditToolbarClearProps) {
  const { table } = useBulkEdit();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetRowSelection()}
          className={cn(
            'h-6 w-6 p-0 text-muted-foreground hover:text-foreground',
            className,
          )}
        >
          <X className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Clear selection</TooltipContent>
    </Tooltip>
  );
}

function BulkEditToolbarSelection({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <BulkEditToolbarCount />
      <BulkEditToolbarClear />
    </div>
  );
}

function BulkEditToolbarActions({
  children,
  className,
}: BulkEditToolbarActionsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>{children}</div>
  );
}

function BulkEditToolbarAction({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  className,
}: BulkEditToolbarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={cn(
            'h-7 w-7 p-0',
            variant === 'destructive' &&
              'text-destructive hover:text-destructive',
            className,
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function BulkEditToolbarSeparator() {
  return <Separator orientation="vertical" className="h-4" />;
}

function BulkEditToolbarEditAction({ className }: { className?: string }) {
  const { actions } = useBulkEdit();

  if (!actions?.onEdit) {
    throw new Error(
      'BulkEditToolbarEditAction requires onEdit action to be provided to BulkEditProvider',
    );
  }

  return (
    <BulkEditToolbarAction
      icon={Edit}
      label="Edit"
      onClick={actions.onEdit}
      className={className}
    />
  );
}

function BulkEditToolbarDeleteAction({ className }: { className?: string }) {
  const { actions } = useBulkEdit();

  if (!actions?.onDelete) {
    throw new Error(
      'BulkEditToolbarDeleteAction requires onDelete action to be provided to BulkEditProvider',
    );
  }

  return (
    <BulkEditToolbarAction
      icon={Trash2}
      label="Delete"
      onClick={actions.onDelete}
      variant="destructive"
      className={className}
    />
  );
}

export {
  BulkEditProvider,
  BulkEditToolbar,
  BulkEditToolbarCount,
  BulkEditToolbarClear,
  BulkEditToolbarSelection,
  BulkEditToolbarActions,
  BulkEditToolbarAction,
  BulkEditToolbarEditAction,
  BulkEditToolbarDeleteAction,
  BulkEditToolbarSeparator,
  useBulkEdit,
};
