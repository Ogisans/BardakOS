import { readBackendConfig } from '../src/domain/backendConfig.ts';

// Netlify provides these at build time. Never echo their values.
const config = readBackendConfig(process.env);
if (config.mode !== 'supabase') {
  console.error('Netlify build requires VITE_DATA_MODE=supabase and a valid public project URL/publishable or anon key.');
  process.exitCode = 1;
}
