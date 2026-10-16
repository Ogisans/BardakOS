import type { AuthRepository, Identity } from '../repositories/auth.ts';
import type { ProfileInput } from '../types/localSession.ts';

export interface SessionState { status: 'loading' | 'signed_out' | 'ready' | 'error'; identity: Identity | null; key: string; busy: boolean; error: string }
/** Coordinates auth events and async actions; stale results cannot resurrect a signed-out user. */
export function createSessionController(repository: AuthRepository) {
  let state: SessionState = { status: 'loading', identity: null, key: '', busy: false, error: '' };
  let revision = 0;
  let action = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: SessionState) => { state = next; listeners.forEach(listener => listener()); };
  const apply = (identity: Identity | null) => {
    const previous = state.identity;
    const same = previous && identity && previous.profile.id === identity.profile.id && previous.profile.role === identity.profile.role && previous.workspaceId === identity.workspaceId;
    publish({ status: identity ? 'ready' : 'signed_out', identity, key: same ? state.key : identity ? crypto.randomUUID() : '', busy: false, error: '' });
  };
  const message = (error: unknown) => error instanceof Error ? error.message : 'İşlem tamamlanamadı. Yeniden deneyin.';
  async function refresh() {
    if (action) return;
    const ticket = ++revision;
    // Hide privileged UI while checking server membership, but preserve session key on success.
    publish({ ...state, status: 'loading', error: '' });
    try { const identity = await repository.read(); if (ticket === revision) apply(identity); }
    catch (error) { if (ticket === revision) publish({ ...state, status: 'error', busy: false, error: message(error) }); }
  }
  async function run(operation: () => Promise<Identity | null>, blockOnFailure = false) {
    if (action) throw new Error('Bir işlem zaten devam ediyor.');
    action = true;
    clearTimeout(timer);
    const ticket = ++revision;
    publish({ ...state, busy: true, error: '' });
    try { const identity = await operation(); if (ticket === revision) apply(identity); }
    catch (error) {
      if (ticket === revision) publish({ ...state, status: blockOnFailure && error instanceof Error && error.name === 'AuthAccessError' ? 'error' : state.status, busy: false, error: message(error) });
      throw error;
    } finally { action = false; }
  }
  return {
    snapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      unsubscribe = repository.subscribe(event => {
        if (event === 'signed_out') { ++revision; clearTimeout(timer); apply(null); }
        else if (!action) { clearTimeout(timer); timer = setTimeout(() => { void refresh(); }, 0); }
      });
      void refresh();
      return () => { ++revision; clearTimeout(timer); unsubscribe?.(); };
    },
    refresh,
    signIn: (email: string, password: string) => run(() => repository.signIn(email, password), true),
    saveProfile: (input: ProfileInput) => run(() => {
      if (!state.identity || state.status !== 'ready') throw new Error('Oturum doğrulanmadı.');
      return repository.saveProfile(state.identity, input);
    }),
    signOut: () => run(async () => { await repository.signOut(); return null; }),
  };
}
