
CREATE TABLE public.job_offers_process (
	id int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	job_offers_id int4 NULL,
	research bool DEFAULT false NOT NULL,
	research_email bool DEFAULT false NOT NULL,
	applied bool DEFAULT false NOT NULL,
	CONSTRAINT job_offers_process_job_offers_id_key UNIQUE (job_offers_id),
	CONSTRAINT job_offers_process_pk PRIMARY KEY (id),
	CONSTRAINT job_offers_process_job_offers_fk FOREIGN KEY (job_offers_id) REFERENCES public.job_offers(id) ON DELETE RESTRICT ON UPDATE CASCADE
);