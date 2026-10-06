'use client';

export default function Loading() {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-10 h-10 border-3 border-casa-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-casa-text-muted">
        Loading CASA Admin Governance Portal...
      </p>
    </div>
  );
}
