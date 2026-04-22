import { useState, useEffect, useCallback } from 'react';
import type { JobLink, JobStatus } from '../../types';
import { JobLinkSkeleton } from '../ui/loading';
import Button from '../ui/button';
import DescriptionModal from '../modal/descriptionModal';

const STORAGE_KEY = 'job-links';

function loadJobs(): JobLink[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: JobLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function exportToCSV(jobs: JobLink[]): void {
  const headers = ['Title', 'Company', 'URL', 'Status', 'Applied At', 'Created At'];
  const rows = jobs.map((job) => [
    job.title,
    job.company,
    job.url,
    job.status,
    job.appliedAt || '',
    job.createdAt,
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface JobLinkItemProps {
  job: JobLink;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: JobStatus) => void;
  onSaveDescription: (id: string) => void;
}

function JobLinkItem({ job, onDelete, onStatusChange, onSaveDescription }: JobLinkItemProps) {
  const statusColors: Record<JobStatus, string> = {
    applied: 'bg-green-500',
    in_progress: 'bg-yellow-500',
    not_applied: 'bg-gray-400',
  };

  const statusLabels: Record<JobStatus, string> = {
    applied: 'Applied',
    in_progress: 'In Progress',
    not_applied: 'Not Applied',
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={() => {
            const next: Record<JobStatus, JobStatus> = {
              not_applied: 'in_progress',
              in_progress: 'applied',
              applied: 'not_applied',
            };
            onStatusChange(job.id, next[job.status]);
          }}
          className={`flex-shrink-0 w-3 h-3 mt-1 rounded-full ${statusColors[job.status]} hover:opacity-80 transition-opacity`}
          title={`Status: ${statusLabels[job.status]}`}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{job.title}</h3>
          <p className="text-sm text-gray-500 truncate">{job.company}</p>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate block"
          >
            {job.url}
          </a>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSaveDescription(job.id)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Save description"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function JobLinksTab() {
  const [jobs, setJobs] = useState<JobLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplied, setShowApplied] = useState(false);
  const [descriptionModal, setDescriptionModal] = useState<{ isOpen: boolean; jobId?: string }>({
    isOpen: false,
  });

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const stored = loadJobs();
      setJobs(stored);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = (id: string) => {
    const updated = jobs.filter((j) => j.id !== id);
    saveJobs(updated);
    setJobs(updated);
  };

  const handleStatusChange = (id: string, status: JobStatus) => {
    const updated = jobs.map((j) =>
      j.id === id
        ? {
            ...j,
            status,
            appliedAt: status === 'applied' ? new Date().toISOString() : j.appliedAt,
            updatedAt: new Date().toISOString(),
          }
        : j
    );
    saveJobs(updated);
    setJobs(updated);
  };

  const handleRefresh = () => {
    fetchJobs();
  };

  const handleExport = () => {
    exportToCSV(jobs);
  };

  const handleSaveDescription = (jobId: string) => {
    setDescriptionModal({ isOpen: true, jobId });
  };

  const handleDescriptionSave = (description: string) => {
    console.log('Saving description for job:', descriptionModal.jobId, description);
  };

  const filteredJobs = showApplied ? jobs : jobs.filter((j) => j.status !== 'applied');
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (a.status === 'applied' && b.status !== 'applied') return 1;
    if (b.status === 'applied' && a.status !== 'applied') return -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2" id="job-links-toolbar">
        <Button size="sm" onClick={handleRefresh} id="refresh-links-btn">
          Refresh
        </Button>
        <Button size="sm" variant="secondary" onClick={handleExport} id="export-applied-btn">
          Export
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm" id="show-applied-toggle">
        <input
          type="checkbox"
          checked={showApplied}
          onChange={(e) => setShowApplied(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Show applied
      </label>

      {loading ? (
        <JobLinkSkeleton />
      ) : error ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <Button size="sm" variant="ghost" onClick={fetchJobs} className="mt-2">
            Retry
          </Button>
        </div>
      ) : sortedJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No job links yet</p>
          <p className="text-sm mt-1">Click Refresh to load jobs</p>
        </div>
      ) : (
        <div className="space-y-2" id="job-links-list">
          {sortedJobs.map((job) => (
            <JobLinkItem
              key={job.id}
              job={job}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onSaveDescription={handleSaveDescription}
            />
          ))}
        </div>
      )}

      <DescriptionModal
        isOpen={descriptionModal.isOpen}
        onClose={() => setDescriptionModal({ isOpen: false })}
        onSave={handleDescriptionSave}
        jobTitle={jobs.find((j) => j.id === descriptionModal.jobId)?.title}
      />
    </div>
  );
}

export default JobLinksTab;