import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      ...options,
      unstyled: true,
      className: 'bg-green-50 text-green-900 border border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800 rounded-lg p-4 shadow-lg flex items-center gap-3 w-lg',
      descriptionClassName: 'text-green-700 dark:text-green-300 text-sm mt-1',
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      ...options,
      unstyled: true,
      className: 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800 rounded-lg p-4 shadow-lg flex items-center gap-3 w-lg',
      descriptionClassName: 'text-red-700 dark:text-red-300 text-sm mt-1',
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      ...options,
      unstyled: true,
      className: 'bg-yellow-50 text-yellow-900 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800 rounded-lg p-4 shadow-lg flex items-center gap-3 w-lg',
      descriptionClassName: 'text-yellow-700 dark:text-yellow-300 text-sm mt-1',
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      ...options,
      unstyled: true,
      className: 'bg-neutral-100 text-neutral-900 border border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-800 rounded-lg p-4 shadow-lg flex items-center gap-3 w-lg',
      descriptionClassName: 'text-neutral-700 dark:text-neutral-300 text-sm mt-1',
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      ...options,
      className: 'bg-background text-foreground border-border',
      descriptionClassName: 'text-muted-foreground',
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
      description?: string;
      duration?: number;
    },
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      description: options.description,
      duration: options.duration,
      classNames: {
        loading: 'bg-background text-foreground border-border',
        success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800',
        error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
      },
    });
  },

  custom: (component: (id: string | number) => React.ReactElement, options?: ToastOptions) => {
    return sonnerToast.custom(component, options);
  },

  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};
