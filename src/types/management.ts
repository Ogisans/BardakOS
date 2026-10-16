export interface ExpenseItem {
  id: string;
  title: string;
  category: 'Hammadde' | 'Lojistik' | 'İşçilik' | 'İşletme' | 'Pazarlama';
  amount: number;
  date: string;
  channel: 'Banka Transferi' | 'Nakit' | 'Kredi Kartı';
}

export type EventCategory = 'match' | 'production' | 'sales' | 'meeting' | 'other';

export interface CalendarEvent {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  time: string;
  category: EventCategory;
  description?: string;
}
