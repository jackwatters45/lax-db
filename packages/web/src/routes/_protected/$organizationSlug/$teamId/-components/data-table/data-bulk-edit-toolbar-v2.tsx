import { RiDeleteBinLine, RiEditLine } from '@remixicon/react';
import type { RowSelectionState, Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BulkEditAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
};

type BulkEditToolbarProps<TData> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
  actions?: BulkEditAction[];
  onEdit?: () => void;
  onDelete?: () => void;
  floating?: boolean;
};

export function BulkEditToolbar<TData>({
  table,
  rowSelection,
  actions = [],
  onEdit,
  onDelete,
  floating = true,
}: BulkEditToolbarProps<TData>) {
  const selectedCount = Object.keys(rowSelection).length;
  const hasSelection = selectedCount > 0;

  if (!hasSelection) return null;

  const handleClear = () => {
    table.resetRowSelection();
  };

  const defaultActions: BulkEditAction[] = [
    ...(onEdit
      ? [
          {
            label: 'Edit',
            icon: <RiEditLine className="size-4" />,
            onClick: onEdit,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: 'Delete',
            icon: <RiDeleteBinLine className="size-4" />,
            onClick: onDelete,
            variant: 'destructive' as const,
          },
        ]
      : []),
  ];

  const allActions = [...defaultActions, ...actions];

  if (floating) {
    return (
      <div className="-translate-x-1/2 slide-in-from-bottom-2 fixed bottom-4 left-1/2 z-50 transform animate-in duration-200">
        <div className="max-w-2xl rounded-3xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-accent bg-accent px-2 py-0.5 text-foreground text-xs"
              >
                {selectedCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              {allActions.map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  className={`h-7 px-2 text-xs ${
                    action.variant === 'destructive'
                      ? 'text-destructive hover:text-destructive'
                      : ''
                  }`}
                >
                  <span className="mr-1">{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
      <Badge
        variant="outline"
        className="border-accent bg-accent text-primary-foreground"
      >
        {selectedCount} selected
      </Badge>
      <div className="flex items-center gap-1">
        {allActions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className={`h-8 px-2 ${
              action.variant === 'destructive'
                ? 'text-destructive hover:text-destructive'
                : ''
            }`}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 px-2"
        >
          <X className="size-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
