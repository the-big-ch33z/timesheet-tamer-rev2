
import React from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  className?: string;
  duration?: number;
}

export interface ToastAPI {
  (props: {
    title?: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    variant?: "default" | "destructive" | "success";
    className?: string;
    duration?: number;
  }): {
    id: string;
    dismiss: () => void;
    update: (props: any) => void;
  };
  dismiss: (toastId?: string) => void;
}

export { useToast, toast } from './use-toast';
