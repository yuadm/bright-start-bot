import { useEffect } from 'react';
import { JobApplicationPortal } from '@/components/job-application/JobApplicationPortal';

export default function JobApplication() {
  useEffect(() => {
    document.title = 'Job Application | Apply Now';
    const desc = 'Apply for open positions. Mobile-friendly job application portal.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    const canonicalHref = `${window.location.origin}/job-application`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalHref);
  }, []);

  return <JobApplicationPortal />;
}