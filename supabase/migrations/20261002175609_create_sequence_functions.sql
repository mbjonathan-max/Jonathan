/*
# Create sequence helper functions for order and invoice numbers

## Description
Creates two SECURITY DEFINER functions that atomically increment and return
the next value from the order_number_seq and invoice_number_seq sequences.
These are called from the frontend during checkout to generate unique
order numbers (CMD-YYYY-NNNNNN) and invoice numbers (FAC-YYYY-NNNNNN).

## Functions
1. nextval_order_seq() — returns next int from order_number_seq
2. nextval_invoice_seq() — returns next int from invoice_number_seq

## Security
Both functions are SECURITY DEFINER so the anon/authenticated roles can
call them despite sequences requiring ownership privileges to advance.
*/

CREATE OR REPLACE FUNCTION public.nextval_order_seq()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT nextval('order_number_seq');
$$;

CREATE OR REPLACE FUNCTION public.nextval_invoice_seq()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT nextval('invoice_number_seq');
$$;

GRANT EXECUTE ON FUNCTION public.nextval_order_seq() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nextval_invoice_seq() TO authenticated;
