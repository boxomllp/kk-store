-- Atomic increment for sequential order numbers.
-- Called only from the create-order edge function via service role key.
create or replace function increment_order_counter()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_number integer;
begin
  update order_counter
  set last_number = last_number + 1
  where id = 1
  returning last_number into new_number;

  return new_number;
end;
$$;
