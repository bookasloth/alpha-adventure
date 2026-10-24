-- 0030_deposit_config.sql — per-trek deposit (split payment) config. Charging is handled in checkout.
-- deposit_value: percent => whole number 1-100; flat => paise. balance_due_offset_days: balance due N days before departure.
-- Idempotent and additive.
alter table treks add column if not exists deposit_type text not null default 'none' check (deposit_type in ('none','percent','flat'));
alter table treks add column if not exists deposit_value bigint not null default 0 check (deposit_value >= 0);
alter table treks add column if not exists balance_due_offset_days int not null default 2 check (balance_due_offset_days between 0 and 60);
