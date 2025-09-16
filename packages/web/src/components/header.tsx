import { Link } from '@tanstack/react-router';

export default function HeaderTmp() {
  return (
    <header className="flex items-center justify-between gap-2 border-border border-b p-2">
      <nav className="flex gap-2 text-lg">
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
      </nav>
      <div />
    </header>
  );
}
