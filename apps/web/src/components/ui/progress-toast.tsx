'use client';

import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ProgressToastProps {
  title: string;
  description?: string;
  progress: number; // 0–100
  status: 'loading' | 'success' | 'error';
}

function ProgressToastContent({ title, description, progress, status }: ProgressToastProps) {
  return (
    <div className="w-full min-w-[280px] max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-4 overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {status === 'error'   && <XCircle className="h-4 w-4 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
          {status !== 'error' && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    status === 'success' ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Progress toast utility.
 *
 * Usage:
 *   const pt = createProgressToast('Uploading image...');
 *   pt.update(40);           // update progress
 *   pt.update(100);
 *   pt.success('Done!');     // finish with success
 *   // or
 *   pt.error('Upload failed');
 */
export function createProgressToast(title: string, description?: string) {
  const id = toast.custom(
    () => <ProgressToastContent title={title} description={description} progress={0} status="loading" />,
    { duration: Infinity },
  );

  let currentProgress = 0;

  const update = (progress: number, newDescription?: string) => {
    currentProgress = progress;
    toast.custom(
      () => (
        <ProgressToastContent
          title={title}
          description={newDescription ?? description}
          progress={progress}
          status="loading"
        />
      ),
      { id, duration: Infinity },
    );
  };

  const success = (message?: string) => {
    toast.custom(
      () => (
        <ProgressToastContent
          title={message ?? title}
          description={undefined}
          progress={100}
          status="success"
        />
      ),
      { id, duration: 3000 },
    );
  };

  const error = (message?: string) => {
    toast.custom(
      () => (
        <ProgressToastContent
          title={title}
          description={message ?? 'Something went wrong'}
          progress={currentProgress}
          status="error"
        />
      ),
      { id, duration: 4000 },
    );
  };

  return { update, success, error };
}
