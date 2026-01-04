import { History, Trash2, Calendar, Zap, Gauge } from 'lucide-react';
import { BillHistoryRecord } from '@/hooks/useBillHistory';

interface BillHistoryProps {
  history: BillHistoryRecord[];
  loading: boolean;
  onDelete: (id: string) => void;
  onSelect: (record: BillHistoryRecord) => void;
}

const BillHistory = ({ history, loading, onDelete, onSelect }: BillHistoryProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History size={40} className="mb-2 opacity-50" />
        <p className="text-sm">No bill history yet</p>
        <p className="text-xs">Saved calculations will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {history.map((record) => (
        <div
          key={record.id}
          className="bg-card p-3 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer group"
          onClick={() => onSelect(record)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${record.mode === 'single' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                {record.mode === 'single' ? 'Single' : 'Dual'}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={10} />
                {new Date(record.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-primary" />
            <span className="font-medium text-foreground">{record.total_units} units</span>
          </div>

          {record.mode === 'dual' ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-medium text-primary">Tk {Math.round(record.owner_bill)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant:</span>
                <span className="font-medium text-accent">Tk {Math.round(record.tenant_bill)}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Bill:</span>
              <span className="font-bold text-primary">Tk {Math.round(record.total_bill)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BillHistory;
