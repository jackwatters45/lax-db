import { columns } from '@/components/ui/data-table/columns';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { usage } from '@/data/data';

export default function Example() {
  return (
    <>
      <h1 className="font-semibold text-gray-900 text-lg sm:text-xl dark:text-gray-50">
        Details
      </h1>
      <div className="mt-4 sm:mt-6 lg:mt-10">
        <DataTable data={usage} columns={columns} />
      </div>
    </>
  );
}
