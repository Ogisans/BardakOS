import type { CalendarEvent } from '../types/management';

// Fictional teams, events and dates. No actual fixture or private launch plan.
export const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 'demo-match-a', date: '2026-10-18', time: '14:00', title: 'Kuzey Takımı', category: 'match', description: 'Karşılaşma öncesi saha hazırlığı.' },
  { id: 'demo-meeting', date: '2026-10-20', time: '10:00', title: 'Koleksiyon planlama toplantısı', category: 'meeting' },
  { id: 'demo-production', date: '2026-10-22', time: '11:00', title: 'Numune değerlendirmesi', category: 'production' },
  { id: 'demo-sales', date: '2026-10-25', time: '13:00', title: 'Sahil satış standı', category: 'sales' },
  { id: 'demo-match-b', date: '2026-10-29', time: '16:00', title: 'Güney Takımı', category: 'match' },
];
