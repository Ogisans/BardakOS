export type CollectionStatus = 'planning' | 'sampling' | 'production' | 'on_sale' | 'archived';
export type FinanceQuality = 'unverified' | 'approximate' | 'confirmed';

export interface CollectionInput {
  name: string;
  description: string;
  status: CollectionStatus;
  startDate: string | null;
  targetDate: string | null;
  productionTarget: number | null;
  producedQuantity: number | null;
  salesTarget: number | null;
  soldQuantity: number | null;
  plannedBudget: number | null;
  actualRevenue: number | null;
  actualExpense: number | null;
  financeQuality: FinanceQuality;
  notes: string;
}

export interface Collection extends CollectionInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  manuallyEdited: boolean;
  source: { title: string; date: string; note: string } | null;
}

export type CollectionFormValues = { [K in keyof CollectionInput]: string };
export type CollectionErrors = Partial<Record<keyof CollectionInput, string>>;
