import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  type ColumnMeta<_TData extends RowData, _TValue> = {
    className?: string;
    displayName: string;
  };
  type TableMeta = {
    excludePlayerIds?: string[];
  };
}
