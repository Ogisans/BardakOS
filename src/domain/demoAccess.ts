import type { BackendConfig } from './backendConfig.ts';

/** Delivery-only convenience. It fills fictional credentials; Auth still decides access. */
export function demoAccountFillEnabled(config: BackendConfig, deliveryFlag?: string): boolean {
  return config.mode === 'preview' || (config.mode === 'supabase' && deliveryFlag === 'true');
}
