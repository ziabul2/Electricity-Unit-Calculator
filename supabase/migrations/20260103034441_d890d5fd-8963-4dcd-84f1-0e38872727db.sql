-- Create bill_history table for storing calculations
CREATE TABLE public.bill_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_prev_reading NUMERIC NOT NULL,
  main_curr_reading NUMERIC NOT NULL,
  sub_prev_reading NUMERIC NOT NULL,
  sub_curr_reading NUMERIC NOT NULL,
  total_units NUMERIC NOT NULL,
  sub_units NUMERIC NOT NULL,
  own_units NUMERIC NOT NULL,
  average_rate NUMERIC NOT NULL,
  demand_charge NUMERIC NOT NULL,
  vat_rate NUMERIC NOT NULL,
  owner_bill NUMERIC NOT NULL,
  tenant_bill NUMERIC NOT NULL,
  total_bill NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bill_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view bill history"
ON public.bill_history
FOR SELECT
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can create bill history"
ON public.bill_history
FOR INSERT
WITH CHECK (true);

-- Create policy for public delete access
CREATE POLICY "Anyone can delete bill history"
ON public.bill_history
FOR DELETE
USING (true);