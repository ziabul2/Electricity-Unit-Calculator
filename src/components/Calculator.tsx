import { useState } from 'react';
import { Calculator as CalcIcon, Zap, Split, CheckCircle, RefreshCcw, Download, Save, History, Gauge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import MeterInput from './MeterInput';
import BillCard from './BillCard';
import BillHistory from './BillHistory';
import { useBillHistory, BillHistoryRecord } from '@/hooks/useBillHistory';

type BillingMode = 'single' | 'dual';

interface BillResult {
  totalUnits: number;
  subUnits: number;
  ownUnits: number;
  averageRate: number;
  subTotalBill: number;
  ownTotalBill: number;
  subEnergyCost: number;
  ownEnergyCost: number;
  halfDemand: number;
  halfVat: number;
  totalEnergyCost: number;
}

const Calculator = () => {
  const { toast } = useToast();
  const { history, loading, saveBill, deleteBill } = useBillHistory();

  const [mode, setMode] = useState<BillingMode>('single');
  const [mainPrev, setMainPrev] = useState('');
  const [mainCurr, setMainCurr] = useState('');
  const [subPrev, setSubPrev] = useState('');
  const [subCurr, setSubCurr] = useState('');
  const [demandCharge, setDemandCharge] = useState('42');
  const [vatRate, setVatRate] = useState('5');
  const [result, setResult] = useState<BillResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const calculateBill = () => {
    const mP = parseFloat(mainPrev) || 0;
    const mC = parseFloat(mainCurr) || 0;
    const demand = parseFloat(demandCharge) || 0;
    const vatPercent = parseFloat(vatRate) || 0;

    if (mC < mP) {
      toast({
        title: "Invalid Reading",
        description: "Current reading cannot be less than previous reading.",
        variant: "destructive",
      });
      return;
    }

    const totalUnits = mC - mP;
    let subUnits = 0;
    let ownUnits = totalUnits;

    if (mode === 'dual') {
      const sP = parseFloat(subPrev) || 0;
      const sC = parseFloat(subCurr) || 0;

      if (sC < sP) {
        toast({
          title: "Invalid Reading",
          description: "Sub meter current reading cannot be less than previous.",
          variant: "destructive",
        });
        return;
      }

      subUnits = sC - sP;

      if (subUnits > totalUnits) {
        toast({
          title: "Invalid Reading",
          description: "Sub meter units cannot exceed main meter units.",
          variant: "destructive",
        });
        return;
      }

      ownUnits = totalUnits - subUnits;
    }

    // NESCO Slab Calculation
    let totalEnergyCost = 0;
    if (totalUnits <= 75) {
      totalEnergyCost = totalUnits * 5.26;
    } else {
      const firstSlab = 75 * 5.26;
      const remaining = totalUnits - 75;
      const secondSlab = remaining * 7.20;
      totalEnergyCost = firstSlab + secondSlab;
    }

    const averageRate = totalUnits > 0 ? totalEnergyCost / totalUnits : 0;
    const subEnergyCost = subUnits * averageRate;
    const ownEnergyCost = ownUnits * averageRate;

    const totalTaxable = totalEnergyCost + demand;
    const totalVatAmount = (totalTaxable * vatPercent) / 100;

    let halfDemand = demand;
    let halfVat = totalVatAmount;
    let subTotalBill = 0;
    let ownTotalBill = totalEnergyCost + demand + totalVatAmount;

    if (mode === 'dual') {
      halfDemand = demand / 2;
      halfVat = totalVatAmount / 2;
      subTotalBill = subEnergyCost + halfDemand + halfVat;
      ownTotalBill = ownEnergyCost + halfDemand + halfVat;
    }

    setResult({
      totalUnits,
      subUnits,
      ownUnits,
      averageRate,
      subTotalBill,
      ownTotalBill,
      subEnergyCost,
      ownEnergyCost,
      halfDemand,
      halfVat,
      totalEnergyCost,
    });

    toast({
      title: "Calculation Complete!",
      description: `Bill for ${totalUnits} units calculated.`,
    });
  };

  const reset = () => {
    setMainPrev('');
    setMainCurr('');
    setSubPrev('');
    setSubCurr('');
    setResult(null);
  };

  const handleSaveBill = () => {
    if (!result) return;

    saveBill({
      mode,
      mainPrev: parseFloat(mainPrev) || 0,
      mainCurr: parseFloat(mainCurr) || 0,
      subPrev: parseFloat(subPrev) || 0,
      subCurr: parseFloat(subCurr) || 0,
      totalUnits: result.totalUnits,
      subUnits: result.subUnits,
      ownUnits: result.ownUnits,
      averageRate: result.averageRate,
      demandCharge: parseFloat(demandCharge) || 0,
      vatRate: parseFloat(vatRate) || 0,
      ownerBill: result.ownTotalBill,
      tenantBill: result.subTotalBill,
      totalBill: mode === 'single' ? result.ownTotalBill : result.ownTotalBill + result.subTotalBill,
    });
  };

  const handleSelectHistory = (record: BillHistoryRecord) => {
    setMode(record.mode);
    setMainPrev(String(record.main_prev_reading));
    setMainCurr(String(record.main_curr_reading));
    setSubPrev(String(record.sub_prev_reading));
    setSubCurr(String(record.sub_curr_reading));
    setDemandCharge(String(record.demand_charge));
    setVatRate(String(record.vat_rate));

    const totalEnergyCost = Number(record.total_units) * Number(record.average_rate);

    setResult({
      totalUnits: Number(record.total_units),
      subUnits: Number(record.sub_units),
      ownUnits: Number(record.own_units),
      averageRate: Number(record.average_rate),
      subTotalBill: Number(record.tenant_bill),
      ownTotalBill: Number(record.owner_bill),
      subEnergyCost: Number(record.sub_units) * Number(record.average_rate),
      ownEnergyCost: Number(record.own_units) * Number(record.average_rate),
      halfDemand: record.mode === 'single' ? Number(record.demand_charge) : Number(record.demand_charge) / 2,
      halfVat: record.mode === 'single'
        ? ((totalEnergyCost + Number(record.demand_charge)) * Number(record.vat_rate) / 100)
        : ((totalEnergyCost + Number(record.demand_charge)) * Number(record.vat_rate) / 100) / 2,
      totalEnergyCost,
    });

    setShowHistory(false);
  };

  const exportPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Electricity Bill Breakdown", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} | Mode: ${mode === 'single' ? 'Single Meter' : 'Dual Meter'}`, pageWidth / 2, 32, { align: 'center' });

    // Summary Box
    doc.setTextColor(60, 60, 60);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, 50, pageWidth - 30, 30, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Consumption Summary", 20, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Units: ${result.totalUnits}`, 20, 70);
    doc.text(`Average Rate: Tk ${result.averageRate.toFixed(2)}/unit`, 80, 70);
    const totalBill = mode === 'single' ? result.ownTotalBill : result.ownTotalBill + result.subTotalBill;
    doc.text(`Total Bill: Tk ${Math.round(totalBill)}`, 150, 70);

    if (mode === 'single') {
      // Single Meter Section
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(15, 90, pageWidth - 30, 60, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("BILL DETAILS", 20, 105);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Units Consumed: ${result.totalUnits}`, 20, 120);
      doc.text(`Energy Cost: Tk ${result.totalEnergyCost.toFixed(2)}`, 20, 130);
      doc.text(`Demand Charge: Tk ${result.halfDemand.toFixed(2)}`, 100, 120);
      doc.text(`VAT (${vatRate}%): Tk ${result.halfVat.toFixed(2)}`, 100, 130);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: Tk ${Math.round(result.ownTotalBill)}`, pageWidth - 20, 145, { align: 'right' });
    } else {
      // Owner Section
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(15, 90, pageWidth - 30, 50, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("OWNER PAYMENT", 20, 102);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Units Consumed: ${result.ownUnits}`, 20, 115);
      doc.text(`Energy Cost: Tk ${result.ownEnergyCost.toFixed(2)}`, 20, 125);
      doc.text(`Fixed Cost (50% Demand + VAT): Tk ${(result.halfDemand + result.halfVat).toFixed(2)}`, 100, 115);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: Tk ${Math.round(result.ownTotalBill)}`, pageWidth - 20, 130, { align: 'right' });

      // Tenant Section
      doc.setFillColor(6, 182, 212);
      doc.roundedRect(15, 150, pageWidth - 30, 50, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("TENANT PAYMENT", 20, 162);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Units Consumed: ${result.subUnits}`, 20, 175);
      doc.text(`Energy Cost: Tk ${result.subEnergyCost.toFixed(2)}`, 20, 185);
      doc.text(`Fixed Cost (50% Demand + VAT): Tk ${(result.halfDemand + result.halfVat).toFixed(2)}`, 100, 175);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: Tk ${Math.round(result.subTotalBill)}`, pageWidth - 20, 190, { align: 'right' });
    }

    // Rate Info
    const yPos = mode === 'single' ? 170 : 215;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("NESCO Slab Rates: 0-75 units @ Tk 5.26/unit | 75+ units @ Tk 7.20/unit", pageWidth / 2, yPos, { align: 'center' });
    if (mode === 'dual') {
      doc.text("Fixed costs (Demand Charge + VAT) are split 50/50 between owner and tenant.", pageWidth / 2, yPos + 10, { align: 'center' });
    }

    // Footer
    doc.setFontSize(8);
    doc.text("Generated by Unit Calculator", pageWidth / 2, 280, { align: 'center' });

    doc.save(`electricity-bill-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF Exported",
      description: "Bill breakdown has been downloaded.",
    });
  };

  return (
    <div className="glass w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel: Inputs */}
      <div className="w-full lg:w-5/12 dark-gradient p-6 text-foreground flex flex-col justify-between border-r border-white/5">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h1 className="font-display text-xl font-bold flex items-center gap-2">
              <Zap className="text-primary" size={24} /> Unit Calculator
            </h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-all ${showHistory ? 'bg-primary text-primary-foreground' : 'bg-energy-slate/50 text-muted-foreground hover:bg-energy-slate'}`}
            >
              <History size={18} />
            </button>
          </div>
          <p className="text-muted-foreground text-xs mb-4">Electricity Bill Calculator</p>

          {showHistory ? (
            <BillHistory
              history={history}
              loading={loading}
              onDelete={deleteBill}
              onSelect={handleSelectHistory}
            />
          ) : (
            <>
              {/* Mode Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setMode('single'); setResult(null); }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'single' ? 'energy-gradient text-white shadow-energy' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                >
                  <Gauge size={16} /> Single Meter
                </button>
                <button
                  onClick={() => { setMode('dual'); setResult(null); }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'dual' ? 'energy-gradient text-white shadow-energy' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                >
                  <Split size={16} /> Dual Meter
                </button>
              </div>

              <div className="space-y-4">
                <MeterInput
                  type="main"
                  prevValue={mainPrev}
                  currValue={mainCurr}
                  onPrevChange={setMainPrev}
                  onCurrChange={setMainCurr}
                  label={mode === 'single' ? 'Meter Reading' : 'Main Meter (Total)'}
                />

                {mode === 'dual' && (
                  <MeterInput
                    type="sub"
                    prevValue={subPrev}
                    currValue={subCurr}
                    onPrevChange={setSubPrev}
                    onCurrChange={setSubCurr}
                    label="Sub Meter (Tenant)"
                  />
                )}

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Demand Charge (Tk)</label>
                    <input
                      type="number"
                      value={demandCharge}
                      onChange={(e) => setDemandCharge(e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 text-sm py-2 focus:border-primary outline-none transition-colors text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">VAT (%)</label>
                    <input
                      type="number"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 text-sm py-2 focus:border-primary outline-none transition-colors text-foreground"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {!showHistory && (
          <button
            onClick={calculateBill}
            className="mt-6 w-full energy-gradient text-primary-foreground font-bold py-3.5 rounded-xl shadow-energy hover:shadow-lg transition-all flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            Calculate Bill <Zap size={18} />
          </button>
        )}
      </div>

      {/* Right Panel: Results */}
      <div className="w-full lg:w-7/12 p-6 bg-secondary/50 relative">
        {result ? (
          <div className="h-full flex flex-col justify-between animate-fade-in">
            <div className="mb-4 flex flex-wrap justify-between items-center gap-2 border-b border-border pb-3">
              <h2 className="font-display text-foreground font-bold text-lg">Bill Breakdown</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground font-medium">
                  Rate: Tk {result.averageRate.toFixed(2)}/unit
                </span>
                <button
                  onClick={handleSaveBill}
                  className="flex items-center gap-1 text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full font-medium hover:bg-accent/90 transition-colors"
                >
                  <Save size={12} /> Save
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {mode === 'single' ? (
                /* Single Meter Result */
                <div className="bg-card/40 backdrop-blur-md p-5 rounded-2xl shadow-soft border border-white/5 border-l-4 border-l-primary relative overflow-hidden">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-3 text-primary">
                    Bill Details
                  </h3>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Units Consumed</span>
                      <span className="font-medium text-foreground">{result.totalUnits} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Energy Cost</span>
                      <span className="font-medium text-foreground">Tk {result.totalEnergyCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Demand Charge</span>
                      <span className="font-medium text-foreground">Tk {result.halfDemand.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT ({vatRate}%)</span>
                      <span className="font-medium text-foreground">Tk {result.halfVat.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-border mt-4 pt-3 flex justify-between items-center">
                    <span className="font-bold text-foreground">Total Payable</span>
                    <span className="font-display font-bold text-2xl text-primary">
                      Tk {Math.round(result.ownTotalBill)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Dual Meter Results */
                <>
                  <BillCard
                    type="main"
                    units={result.ownUnits}
                    energyCost={result.ownEnergyCost}
                    fixedCost={result.halfDemand + result.halfVat}
                    totalBill={result.ownTotalBill}
                  />

                  <BillCard
                    type="sub"
                    units={result.subUnits}
                    energyCost={result.subEnergyCost}
                    fixedCost={result.halfDemand + result.halfVat}
                    totalBill={result.subTotalBill}
                  />

                  {/* Summary */}
                  <div className="text-center mt-3">
                    <div className="inline-flex items-center gap-2 energy-gradient px-5 py-2.5 rounded-full text-sm font-bold text-primary-foreground shadow-energy">
                      <CheckCircle size={16} /> Total Payable: Tk {Math.round(result.ownTotalBill + result.subTotalBill)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={reset}
              className="mt-5 w-full flex justify-center items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
            >
              <RefreshCcw size={14} /> Reset
            </button>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="relative">
              <div className="absolute inset-0 energy-gradient rounded-full blur-2xl opacity-20 animate-pulse-soft"></div>
              <Zap size={72} className="relative text-primary stroke-1 mb-4" />
            </div>
            <p className="text-center text-sm font-medium mt-2">
              Enter meter readings<br />
              <span className="text-xs text-muted-foreground">to calculate your bill</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;
