import { type Config, defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/**/*.sql.ts', './src/**/*.view.ts'],
  out: './migrations',
  dbCredentials: {
    ssl: true,
    host: Resource.Database.host,
    port: Resource.Database.port,
    user: Resource.Database.username,
    password: Resource.Database.password,
    database: Resource.Database.database,
  },
  verbose: true,
  strict: true,
}) satisfies Config;
