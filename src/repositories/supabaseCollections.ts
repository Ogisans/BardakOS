import type { SupabaseClient } from '@supabase/supabase-js';
import type { Collection, CollectionInput } from '../types/collections.ts';
import type { CollectionContent, CollectionEntry, CollectionEntryInput } from '../types/collectionContent.ts';
import type { CollectionsRepository } from './collections.ts';
import { normalizeCollection } from '../domain/collections.ts';
import { normalizeContentEntry } from '../domain/collectionContent.ts';
import { collectionAsset } from '../demo/collectionAssets.ts';

export function collectionPayload(input: CollectionInput) {
  const value = normalizeCollection(input);
  return { name: value.name, description: value.description, status: value.status, start_date: value.startDate, target_date: value.targetDate,
    production_target: value.productionTarget, produced_quantity: value.producedQuantity, sales_target: value.salesTarget, sold_quantity: value.soldQuantity,
    planned_budget: value.plannedBudget, actual_revenue: value.actualRevenue, actual_expense: value.actualExpense, finance_quality: value.financeQuality, notes: value.notes };
}
type CollectionRow = ReturnType<typeof collectionPayload> & { id: string; created_at: string; updated_at: string; manually_edited: boolean };
export function collectionFromRow(row: CollectionRow): Collection {
  return { ...normalizeCollection({ name: row.name, description: row.description, status: row.status, startDate: row.start_date, targetDate: row.target_date,
    productionTarget: row.production_target, producedQuantity: row.produced_quantity, salesTarget: row.sales_target, soldQuantity: row.sold_quantity,
    plannedBudget: row.planned_budget, actualRevenue: row.actual_revenue, actualExpense: row.actual_expense, financeQuality: row.finance_quality, notes: row.notes }),
    id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, manuallyEdited: row.manually_edited, source: null };
}
export function entryPayload(input: CollectionEntryInput) {
  const value = normalizeContentEntry(input);
  return { kind: value.kind, title: value.title, notes: value.notes, status: value.status, date: value.date,
    sku: value.kind === 'product' ? value.sku : '', quantity: value.kind === 'product' ? value.quantity : null, unit_price: value.kind === 'product' ? value.unitPrice : null };
}
type EntryRow = ReturnType<typeof entryPayload> & { id: string };
function entryFromRow(row: EntryRow): CollectionEntry {
  const base = { title: row.title, notes: row.notes, status: row.status, date: row.date };
  const input: CollectionEntryInput = row.kind === 'product' ? { ...base, kind: 'product', sku: row.sku, quantity: row.quantity, unitPrice: row.unit_price } : { ...base, kind: row.kind };
  return { ...normalizeContentEntry(input), id: row.id };
}
const collectionColumns = 'id,name,description,status,start_date,target_date,production_target,produced_quantity,sales_target,sold_quantity,planned_budget,actual_revenue,actual_expense,finance_quality,notes,created_at,updated_at,manually_edited';
const entryColumns = 'id,kind,title,notes,status,date,sku,quantity,unit_price';
const failure = () => new Error('İşlem doğrulanamadı. Bağlantı ve erişimi kontrol edin; listeyi yenileyerek kaydın durumunu görün.');

/** Workspace filters aid correctness; database policies remain the authorization boundary. */
export function createSupabaseCollectionsRepository(client: SupabaseClient, workspaceId: string): CollectionsRepository {
  const parent = () => client.from('bardak_collections').select('id').eq('workspace_id', workspaceId);
  const entries = () => client.from('bardak_entries');
  const files = () => client.from('bardak_file_references');
  async function getContent(id: string): Promise<CollectionContent> {
    const visible = await parent().eq('id', id).single();
    if (visible.error) throw failure();
    const [content, references] = await Promise.all([
      entries().select(entryColumns).eq('workspace_id', workspaceId).eq('collection_id', id).order('created_at').order('id'),
      files().select('id,asset_id').eq('workspace_id', workspaceId).eq('collection_id', id).order('created_at').order('id'),
    ]);
    if (content.error || references.error) throw failure();
    return { entries: (content.data as EntryRow[]).map(entryFromRow), files: references.data.map(row => ({ id: row.id, assetId: row.asset_id })) };
  }
  return {
    async list() {
      const { data, error } = await client.from('bardak_collections').select(collectionColumns).eq('workspace_id', workspaceId).order('created_at', { ascending: false }).order('id');
      if (error) throw failure();
      return (data as CollectionRow[]).map(collectionFromRow);
    },
    async create(input) {
      const { data, error } = await client.from('bardak_collections').insert({ ...collectionPayload(input), workspace_id: workspaceId }).select(collectionColumns).single();
      if (error) throw failure();
      return collectionFromRow(data as CollectionRow);
    },
    async update(id, input) {
      const { data, error } = await client.from('bardak_collections').update(collectionPayload(input)).eq('workspace_id', workspaceId).eq('id', id).select(collectionColumns).single();
      if (error) throw failure();
      return collectionFromRow(data as CollectionRow);
    },
    async remove(id) {
      const { data, error } = await client.from('bardak_collections').delete().eq('workspace_id', workspaceId).eq('id', id).select('id').single();
      if (error || !data) throw failure();
    },
    getContent,
    async saveEntry(id, input, entryId) {
      const payload = entryPayload(input);
      const { kind, ...fields } = payload;
      const request = entryId
        ? entries().update(fields).eq('workspace_id', workspaceId).eq('collection_id', id).eq('id', entryId).eq('kind', kind)
        : entries().insert({ ...payload, workspace_id: workspaceId, collection_id: id });
      const { error } = await request.select('id').single();
      if (error) throw failure();
      return getContent(id);
    },
    async removeEntry(id, entryId) {
      const { error } = await entries().delete().eq('workspace_id', workspaceId).eq('collection_id', id).eq('id', entryId).select('id').single();
      if (error) throw failure();
      return getContent(id);
    },
    async attachFile(id, assetId) {
      if (!collectionAsset(assetId)) throw new Error('Çalışma dosyası bulunamadı.');
      const { error } = await files().insert({ workspace_id: workspaceId, collection_id: id, asset_id: assetId }).select('id').single();
      if (error) throw failure();
      return getContent(id);
    },
    async removeFile(id, fileId) {
      const { error } = await files().delete().eq('workspace_id', workspaceId).eq('collection_id', id).eq('id', fileId).select('id').single();
      if (error) throw failure();
      return getContent(id);
    },
  };
}
