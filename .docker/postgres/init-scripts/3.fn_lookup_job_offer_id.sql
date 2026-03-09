-- -- 1. Update the function to include 'title' in the lookup
-- CREATE OR REPLACE FUNCTION fn_lookup_job_offer_id()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Look for a matching ID based on both company AND title
--     SELECT id 
--     INTO NEW.job_offers_id
--     FROM public.job_offers
--     WHERE company = NEW.company 
--     AND title = NEW.title
--     LIMIT 1;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- 2. Drop the trigger if it already exists (to ensure a clean state)
-- DROP TRIGGER IF EXISTS trg_before_insert_job_apps 
-- ON public.job_applications;

-- -- 3. Create the trigger fresh
-- CREATE TRIGGER trg_before_insert_job_apps
-- BEFORE INSERT ON public.job_applications
-- FOR EACH ROW
-- EXECUTE FUNCTION fn_lookup_job_offer_id();