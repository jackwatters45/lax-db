import { schema } from '@lax-db/zero/schemas';
import { Zero } from '@rocicorp/zero';
import { ZeroProvider } from '@rocicorp/zero/react';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    // links: [
    //   {
    //     rel: 'stylesheet',
    //     href: appCss,
    //   },
    // ],
  }),

  component: () => (
    <RootDocument>
      <Providers>
        <Outlet />
      </Providers>
      <TanStackRouterDevtools />
    </RootDocument>
  ),
});

const z = new Zero({
  userID: 'your-user-id',
  auth: 'your-auth-token',
  server: import.meta.env.VITE_PUBLIC_SERVER,
  schema,
});

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ZeroProvider zero={z}>{children}</ZeroProvider>;
};

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
