CREATE TABLE IF NOT EXISTS public.job_offers (
    id int4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expired bool DEFAULT false,
    match_score_percentage int4 DEFAULT 0,
    company text,
    email text,
    company_url text,
    title text,
    description text,
    url text UNIQUE, 
    location text,
    salary text,
    schedule_type text,
    via text,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
