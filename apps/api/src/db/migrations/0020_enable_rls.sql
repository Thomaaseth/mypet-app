-- Custom SQL migration file, put your code below! --
-- Enable Row Level Security on every table in the public schema.
   -- Covers all current public tables, including better-auth's user/session/
   -- account/verification. New tables added later are NOT covered automatically —
   -- enable RLS in their own migration.
   DO $$
   DECLARE
     r RECORD;
   BEGIN
     FOR r IN
       SELECT tablename FROM pg_tables WHERE schemaname = 'public'
     LOOP
       EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
     END LOOP;
   END $$;