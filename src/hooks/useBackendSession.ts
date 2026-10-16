import { useEffect, useState, useSyncExternalStore } from 'react';
import { createSessionController } from '../domain/sessionController';
import type { AuthRepository } from '../repositories/auth';

export function useBackendSession(repository: AuthRepository) {
  const [controller] = useState(() => createSessionController(repository));
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  useEffect(() => controller.start(), [controller]);
  return { ...state, signIn: controller.signIn, signOut: controller.signOut, saveProfile: controller.saveProfile, retry: controller.refresh };
}
