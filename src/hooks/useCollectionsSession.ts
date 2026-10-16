import { useCallback, useEffect, useRef, useState } from 'react';
import type { Collection, CollectionInput } from '@/types/collections';
import type { CollectionContent, CollectionContentTab, CollectionEntryInput, CollectionView } from '@/types/collectionContent';
import { emptyCollectionContent } from '@/domain/collectionContent';
import type { CollectionsRepository } from '@/repositories/collections';

/** App owns the view/cache; the injected adapter determines persistence. */
export function useCollectionsSession(repository: CollectionsRepository, enabled = true) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [contents, setContents] = useState<Record<string, CollectionContent>>({});
  const [view, setView] = useState<CollectionView>({ collectionId: null, tab: 'summary' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);

  const loadRevision = useRef(0);
  const reload = useCallback(async () => {
    if (!enabled || mutationLock.current) { if (!enabled) setLoading(false); return; }
    const ticket = ++loadRevision.current;
    setLoading(true); setLoadError(false);
    try {
      const records = await repository.list();
      const entries = await Promise.all(records.map(async record => [record.id, await repository.getContent(record.id)] as const));
      if (ticket === loadRevision.current) {
        setCollections(records); setContents(Object.fromEntries(entries));
        setView(current => current.collectionId && !records.some(record => record.id === current.collectionId) ? { collectionId: null, tab: 'summary' } : current);
      }
    } catch { if (ticket === loadRevision.current) setLoadError(true); }
    finally { if (ticket === loadRevision.current) setLoading(false); }
  }, [repository, enabled]);
  useEffect(() => { const counter = loadRevision; void reload(); return () => { ++counter.current; }; }, [reload]);

  const mutate = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (mutationLock.current) throw new Error('Bir işlem zaten devam ediyor.');
    mutationLock.current = true;
    setBusy(true);
    try { return await operation(); } finally { mutationLock.current = false; setBusy(false); }
  }, []);
  const createCollection = useCallback((input: CollectionInput) => mutate(async () => {
    const record = await repository.create(input);
    setCollections(current => [record, ...current]);
    setContents(current => ({ ...current, [record.id]: emptyCollectionContent() }));
    return record;
  }), [repository, mutate]);
  const updateCollection = useCallback((id: string, input: CollectionInput) => mutate(async () => {
    const record = await repository.update(id, input);
    setCollections(current => current.map(item => item.id === id ? record : item));
    return record;
  }), [repository, mutate]);
  const removeCollection = useCallback((id: string) => mutate(async () => {
    await repository.remove(id);
    setCollections(current => current.filter(item => item.id !== id));
    setContents(current => { const next = { ...current }; delete next[id]; return next; });
    setView(current => current.collectionId === id ? { collectionId: null, tab: 'summary' } : current);
  }), [repository, mutate]);

  const changeContent = useCallback((id: string, operation: () => Promise<CollectionContent>) => mutate(async () => {
    const next = await operation();
    setContents(current => ({ ...current, [id]: next }));
  }), [mutate]);
  const saveEntry = useCallback((id: string, input: CollectionEntryInput, entryId?: string) => changeContent(id, () => repository.saveEntry(id, input, entryId)), [repository, changeContent]);
  const removeEntry = useCallback((id: string, entryId: string) => changeContent(id, () => repository.removeEntry(id, entryId)), [repository, changeContent]);
  const attachFile = useCallback((id: string, assetId: string) => changeContent(id, () => repository.attachFile(id, assetId)), [repository, changeContent]);
  const removeFile = useCallback((id: string, fileId: string) => changeContent(id, () => repository.removeFile(id, fileId)), [repository, changeContent]);
  const openCollection = useCallback((id: string) => setView({ collectionId: id, tab: 'summary' }), []);
  const closeCollection = useCallback(() => setView({ collectionId: null, tab: 'summary' }), []);
  const setContentTab = useCallback((tab: CollectionContentTab) => setView(current => ({ ...current, tab })), []);

  return { collections, contents, view, loading, loadError, busy: busy || loading || loadError, reload, createCollection, updateCollection, removeCollection, saveEntry, removeEntry, attachFile, removeFile, openCollection, closeCollection, setContentTab };
}
