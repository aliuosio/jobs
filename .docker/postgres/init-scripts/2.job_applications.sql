CREATE TABLE IF NOT EXISTS public.job_applications (
    id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
    "date" timestamp,
    job_offers_id int4 UNIQUE NULL,
    sender_name text NULL,
    sender_email text NULL,
    recp_name text NULL,
    recp_email text NULL,
    company text NULL,
    title text NULL,
    "content" text NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT job_applications_pkey PRIMARY KEY (id),
    CONSTRAINT fk_job_applications_job_offer FOREIGN KEY (job_offers_id) REFERENCES public.job_offers(id) ON DELETE RESTRICT ON UPDATE CASCADE
);