import { Home, User, Gauge } from 'lucide-react';

interface MeterInputProps {
  type: 'main' | 'sub';
  prevValue: string;
  currValue: string;
  onPrevChange: (value: string) => void;
  onCurrChange: (value: string) => void;
  label?: string;
}

const MeterInput = ({ type, prevValue, currValue, onPrevChange, onCurrChange, label }: MeterInputProps) => {
  const isMain = type === 'main';
  const displayLabel = label || (isMain ? 'Main Meter (Total)' : 'Sub Meter (Tenant)');

  return (
    <div className="bg-energy-slate/30 p-4 rounded-2xl border border-white/5 transition-all hover:border-primary/40 group/input">
      <div className={`flex items-center gap-2 mb-3 text-sm font-semibold ${isMain ? 'text-primary' : 'text-accent'}`}>
        {isMain ? <Gauge size={18} /> : <User size={18} />}
        {displayLabel}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Previous</label>
          <input
            type="number"
            placeholder="0"
            value={prevValue}
            onChange={(e) => onPrevChange(e.target.value)}
            className={`w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all focus:ring-2 ${isMain ? 'focus:ring-primary/40 focus:border-primary/50' : 'focus:ring-accent/40 focus:border-accent/50'}`}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Current</label>
          <input
            type="number"
            placeholder="0"
            value={currValue}
            onChange={(e) => onCurrChange(e.target.value)}
            className={`w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all focus:ring-2 ${isMain ? 'focus:ring-primary/40 focus:border-primary/50' : 'focus:ring-accent/40 focus:border-accent/50'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default MeterInput;
