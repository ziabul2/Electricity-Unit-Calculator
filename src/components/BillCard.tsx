import { Home, User } from 'lucide-react';

interface BillCardProps {
  type: 'main' | 'sub';
  units: number;
  energyCost: number;
  fixedCost: number;
  totalBill: number;
}

const BillCard = ({ type, units, energyCost, fixedCost, totalBill }: BillCardProps) => {
  const isMain = type === 'main';

  return (
    <div className={`bg-card/40 backdrop-blur-md p-5 rounded-2xl shadow-soft border border-white/5 border-l-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${isMain ? 'border-l-primary' : 'border-l-accent'}`}>
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {isMain ? <Home size={80} /> : <User size={80} />}
      </div>

      <h3 className={`font-display font-bold text-sm uppercase tracking-wider mb-3 ${isMain ? 'text-primary' : 'text-accent'}`}>
        {isMain ? 'Owner Payment' : 'Tenant Payment'}
      </h3>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Energy Cost ({units} units)</span>
          <span className="font-medium text-foreground">Tk {energyCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Fixed Cost (50% D+VAT)</span>
          <span className="text-muted-foreground">Tk {fixedCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border mt-4 pt-3 flex justify-between items-center">
        <span className="font-bold text-foreground">Total</span>
        <span className={`font-display font-bold text-2xl ${isMain ? 'text-primary' : 'text-accent'}`}>
          Tk {Math.round(totalBill)}
        </span>
      </div>
    </div>
  );
};

export default BillCard;
