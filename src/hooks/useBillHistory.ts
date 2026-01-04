import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface BillHistoryRecord {
  id: string;
  mode: 'single' | 'dual';
  main_prev_reading: number;
  main_curr_reading: number;
  sub_prev_reading: number;
  sub_curr_reading: number;
  total_units: number;
  sub_units: number;
  own_units: number;
  average_rate: number;
  demand_charge: number;
  vat_rate: number;
  owner_bill: number;
  tenant_bill: number;
  total_bill: number;
  created_at: string;
}

export interface SaveBillData {
  mode: 'single' | 'dual';
  mainPrev: number;
  mainCurr: number;
  subPrev: number;
  subCurr: number;
  totalUnits: number;
  subUnits: number;
  ownUnits: number;
  averageRate: number;
  demandCharge: number;
  vatRate: number;
  ownerBill: number;
  tenantBill: number;
  totalBill: number;
}

const STORAGE_KEY = 'ziabul_bill_history';

export const useBillHistory = () => {
  const [history, setHistory] = useState<BillHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadHistory = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BillHistoryRecord[];
        setHistory(parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
    setLoading(false);
  };

  const saveBill = (billData: SaveBillData): boolean => {
    try {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const newRecord: BillHistoryRecord = {
        id,
        mode: billData.mode,
        main_prev_reading: billData.mainPrev,
        main_curr_reading: billData.mainCurr,
        sub_prev_reading: billData.subPrev,
        sub_curr_reading: billData.subCurr,
        total_units: billData.totalUnits,
        sub_units: billData.subUnits,
        own_units: billData.ownUnits,
        average_rate: billData.averageRate,
        demand_charge: billData.demandCharge,
        vat_rate: billData.vatRate,
        owner_bill: billData.ownerBill,
        tenant_bill: billData.tenantBill,
        total_bill: billData.totalBill,
        created_at: new Date().toISOString(),
      };

      // Get fresh history from localStorage to avoid state sync issues
      const currentStored = localStorage.getItem(STORAGE_KEY);
      const currentHistory = currentStored ? JSON.parse(currentStored) : [];
      const updatedHistory = [newRecord, ...currentHistory].slice(0, 50);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      toast({
        title: "Bill Saved Successfully",
        description: "Your calculation has been saved locally.",
      });
      return true;
    } catch (error) {
      console.error('Save bill error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save bill to local storage.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteBill = (id: string): boolean => {
    try {
      const updatedHistory = history.filter(record => record.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      toast({
        title: "Deleted",
        description: "Bill removed from history.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bill.",
        variant: "destructive",
      });
      return false;
    }
  };

  const clearHistory = (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
      toast({
        title: "Cleared",
        description: "All history has been cleared.",
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return { history, loading, saveBill, deleteBill, clearHistory, refetch: loadHistory };
};
