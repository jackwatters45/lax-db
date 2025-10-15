import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: <needs to be interface>
  interface ColumnMeta<_TData extends RowData, _TValue> {
    className?: string;
    displayName: string;
  }
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: <needs to be interface>
  interface TableMeta {
    excludePlayerIds?: string[];
  }
}
