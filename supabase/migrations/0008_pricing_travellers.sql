-- ===========================================================================
-- Alpha Adventures — 0008 child pricing + traveller age (IDEMPOTENT, additive).
-- Backs the Amazon-style booking UI: distinct child rate + per-traveller age.
-- Apply in the Supabase SQL Editor (single run is fine — no new enum values).
-- ===========================================================================

-- Child rate (absolute, paise). NULL => children charged at the adult rate.
alter table treks add column if not exists child_price bigint;

-- Per-traveller age captured in the flow.
alter table booking_travellers add column if not exists age smallint;

-- price_booking now honours the child rate (child = child_price, else adult unit).
create or replace function price_booking(
  _trek_id uuid, _departure_id uuid, _adults int, _children int,
  _addons jsonb default '[]'::jsonb
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  _base bigint; _child bigint; _override bigint;
  _unit_adult bigint; _unit_child bigint;
  _addons_total bigint := 0; _subtotal bigint; _a jsonb; _addon_price bigint; _qty int;
begin
  if _adults < 1 then raise exception 'at least one adult required' using errcode='check_violation'; end if;
  if _children < 0 then raise exception 'invalid children count' using errcode='check_violation'; end if;

  select base_price, child_price into _base, _child from treks
    where id = _trek_id and status = 'published' and deleted_at is null;
  if _base is null then raise exception 'trek not bookable' using errcode='no_data_found'; end if;

  select price_override into _override from trek_departures
    where id = _departure_id and trek_id = _trek_id and status <> 'cancelled';
  if not found then raise exception 'departure not bookable' using errcode='no_data_found'; end if;

  _unit_adult := coalesce(_override, _base);
  _unit_child := coalesce(_child, _unit_adult);

  for _a in select value from jsonb_array_elements(coalesce(_addons, '[]'::jsonb)) as t(value) loop
    select price into _addon_price from trek_addons
      where id = (_a->>'addon_id')::uuid and trek_id = _trek_id and active = true;
    if not found then raise exception 'invalid addon' using errcode='check_violation'; end if;
    _qty := coalesce((_a->>'quantity')::int, 1);
    if _qty <= 0 then raise exception 'invalid addon quantity' using errcode='check_violation'; end if;
    _addons_total := _addons_total + _addon_price * _qty;
  end loop;

  _subtotal := _unit_adult * _adults + _unit_child * _children + _addons_total;
  return jsonb_build_object(
    'currency','INR',
    'price_adult', _unit_adult, 'price_child', _unit_child,
    'addons_total', _addons_total, 'discount_amount', 0, 'tax_amount', 0,
    'subtotal', _subtotal, 'grand_total', _subtotal
  );
end $$;

-- Optional demo: give one seeded trek a child rate so the UI shows it.
-- update treks set child_price = 99900 where slug = 'harishchandragad-trek';
