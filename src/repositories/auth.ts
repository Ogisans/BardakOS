import type { LocalProfile, ProfileInput } from '../types/localSession.ts';
import { editLocalProfile, signInLocally } from '../domain/localSession.ts';
import type { CollectionsRepository } from './collections.ts';
import { createMemoryCollectionsRepository } from './collections.ts';
import { INITIAL_COLLECTIONS } from '../demo/collections.ts';
import { INITIAL_COLLECTION_CONTENT } from '../demo/collectionContent.ts';

export interface Identity { profile: LocalProfile; workspaceId: string }
export class AuthAccessError extends Error { constructor(message: string) { super(message); this.name = 'AuthAccessError'; } }
export interface AuthRepository {
  read(): Promise<Identity | null>;
  signIn(email: string, password: string): Promise<Identity>;
  saveProfile(identity: Identity, input: ProfileInput): Promise<Identity>;
  signOut(): Promise<void>;
  subscribe(callback: (event: 'signed_out' | 'changed') => void): () => void;
  collections(identity: Identity): CollectionsRepository;
}
export function createPreviewAuthRepository(): AuthRepository {
  let current: Identity | null = null;
  return {
    async read() { return current; },
    async signIn(email, password) {
      const profile = signInLocally(email, password);
      if (!profile) throw new Error('E-posta veya parola eşleşmiyor.');
      current = { profile, workspaceId: 'local-preview' };
      return current;
    },
    async saveProfile(identity, input) { current = { ...identity, profile: editLocalProfile(identity.profile, input) }; return current; },
    async signOut() { current = null; },
    subscribe() { return () => {}; },
    collections() { return createMemoryCollectionsRepository(INITIAL_COLLECTIONS, { content: INITIAL_COLLECTION_CONTENT }); },
  };
}
