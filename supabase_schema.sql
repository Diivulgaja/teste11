-- supabase_schema.sql
-- Create a table to store orders migrated from Firestore.
-- Assumes Firestore document ID will be stored in 'id' (text).
-- Adjust columns according to your Firestore document structure.

create table if not exists doceeser_pedidos (
  id text primary key,
  data jsonb, -- full Firestore document content (for flexible storage)
  status text,
  createdAt timestamptz
);

-- Index on createdAt for ordering
create index if not exists idx_pedidos_createdat on doceeser_pedidos (createdAt desc);