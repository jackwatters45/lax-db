import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import TeamLayout from './_layout';
import { DataTable } from './roster-table/roster-table';
import { columns } from './roster-table/roster-table-columns';
import styles from './team.module.css';

const getData = createServerFn().handler(async () => {
  // Fetch data from your API here.
  await new Promise((resolve) => setTimeout(resolve, 1000));
  //
  return [
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      email: 'm@example.com',
    },
    // ...
  ];
});

export const Route = createFileRoute('/team/')({
  component: RouteComponent,
  loader: async () => await getData(),
});

function RouteComponent() {
  const state = Route.useLoaderData();

  console.log(state);

  return (
    <TeamLayout>
      <h2 className={styles.teamName}>Team Name</h2>
      <ul className={styles.teamList}>
        <li>Season Selector</li>
        <li>Table with roster</li>
        <li>Add player</li>
      </ul>
      <DataTable data={state} columns={columns} />
    </TeamLayout>
  );
}
