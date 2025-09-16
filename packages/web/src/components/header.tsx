import { Link } from '@tanstack/react-router';

export default function HeaderTmp() {
  return (
    <>
      <div className="flex gap-2 p-2 text-lg">
        <Link
          to="/"
          activeProps={{
            className: 'font-bold',
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>{' '}
        <Link
          to="/team"
          activeProps={{
            className: 'font-bold',
          }}
        >
          Team
        </Link>
      </div>
      <hr />
    </>
  );
}
