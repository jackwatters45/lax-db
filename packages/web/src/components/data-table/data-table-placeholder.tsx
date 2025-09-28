import { TableCell, TableRow } from '@/components/ui/table';

interface TableLoadingPlaceholderProps {
  colSpan: number;
  message?: string;
}

export function TableInitializingPlaceholder(
  props: TableLoadingPlaceholderProps,
) {
  return (
    <TableRow>
      <TableCell colSpan={props.colSpan} className="h-24 text-center">
        Initializing table...
      </TableCell>
    </TableRow>
  );
}

export function TableLoadingPlaceholder(props: TableLoadingPlaceholderProps) {
  return (
    <TableRow>
      <TableCell colSpan={props.colSpan} className="h-24 text-center">
        {props.message || 'Loading data...'}
      </TableCell>
    </TableRow>
  );
}

export function TableEmptyPlaceholder(props: TableLoadingPlaceholderProps) {
  return (
    <TableRow>
      <TableCell colSpan={props.colSpan} className="h-24 text-center">
        No results.
      </TableCell>
    </TableRow>
  );
}

interface TableVirtualScrollPlaceholderProps {
  height: number;
  colSpan: number;
}

export function TableTopPaddingPlaceholder(
  props: TableVirtualScrollPlaceholderProps,
) {
  return (
    <tr>
      <td style={{ height: `${props.height}px` }} colSpan={props.colSpan} />
    </tr>
  );
}

export function TableBottomPaddingPlaceholder(
  props: TableVirtualScrollPlaceholderProps,
) {
  return (
    <tr>
      <td style={{ height: `${props.height}px` }} colSpan={props.colSpan} />
    </tr>
  );
}
