-- One store per owner (single-store accounts until multi-location exists).
-- The upsert-style client select-then-insert can race; this makes the DB the referee.
alter table public.stores add constraint stores_owner_unique unique (owner);
