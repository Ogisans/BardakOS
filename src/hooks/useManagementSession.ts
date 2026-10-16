import { useCallback, useState } from 'react';
import { INITIAL_EVENTS } from '@/demo/calendar';
import { INITIAL_EXPENSES } from '@/demo/finance';
import type { CalendarEvent, ExpenseItem } from '@/types/management';

/** App owns this session: changing tabs/modes keeps records; reloading still resets them. */
export function useManagementSession() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const addExpense = useCallback((expense: ExpenseItem) => {
    setExpenses((current) => [expense, ...current]);
  }, []);

  return { expenses, addExpense, events, setEvents };
}
