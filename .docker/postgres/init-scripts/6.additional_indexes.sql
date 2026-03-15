-- Additional indexes for improved query performance
-- Run this script on existing database instances to add missing indexes

-- High Priority Indexes

-- Composite index on company and title for lookup function performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_company_title_idx 
ON public.job_offers (company, title);

-- Index on company for frequent filtering and JOINs
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_company_idx 
ON public.job_offers (company);

-- Index on created_at for time-based queries and pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_created_at_idx 
ON public.job_offers (created_at);

-- Medium Priority Indexes

-- Index on expired for active job filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_expired_idx 
ON public.job_offers (expired);

-- Index on job_offers_id foreign key in job_applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_applications_job_offers_id_idx 
ON public.job_applications (job_offers_id);

-- Low Priority Indexes

-- Index on location for geographic queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_location_idx 
ON public.job_offers (location);

-- Index on match_score_percentage for ranking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_match_score_percentage_idx 
ON public.job_offers (match_score_percentage);

-- Additional useful indexes for job_applications table

-- Index on sender_email for user-specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_applications_sender_email_idx 
ON public.job_applications (sender_email);

-- Index on created_at for job_applications time-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_applications_created_at_idx 
ON public.job_applications (created_at);

-- Index on job_offers_process table foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_process_job_offers_id_idx 
ON public.job_offers_process (job_offers_id);

-- Index on research flags for processing status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_process_research_idx 
ON public.job_offers_process (research);

CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_process_research_email_idx 
ON public.job_offers_process (research_email);

-- Composite indexes for common query patterns

-- Index for active jobs with company and title (common filtering pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_active_company_title_idx 
ON public.job_offers (expired, company, title) 
WHERE expired = false;

-- Index for recent active jobs (common time-based filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_recent_active_idx 
ON public.job_offers (created_at DESC, expired) 
WHERE expired = false;

-- Index for high match score jobs (ranking queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_high_match_score_idx 
ON public.job_offers (match_score_percentage DESC, expired) 
WHERE expired = false;

-- Index for company-specific recent jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_company_recent_idx 
ON public.job_offers (company, created_at DESC, expired) 
WHERE expired = false;

-- Index for location-based recent jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_location_recent_idx 
ON public.job_offers (location, created_at DESC, expired) 
WHERE expired = false;

-- Index for sender email with creation time (user activity tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_applications_sender_recent_idx 
ON public.job_applications (sender_email, created_at DESC);

-- Index for job applications by job offer with creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_applications_job_offer_recent_idx 
ON public.job_applications (job_offers_id, created_at DESC);

-- Index for processing status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_process_status_idx 
ON public.job_offers_process (research, research_email, job_offers_id);

-- Index for unprocessed jobs (research = false)
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_process_unprocessed_idx 
ON public.job_offers_process (research, job_offers_id) 
WHERE research = false;

-- Index for unprocessed email research jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS job_offers_process_unprocessed_email_idx 
ON public.job_offers_process (research_email, job_offers_id) 
WHERE research_email = false;