
import React from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  className?: string; // Add className property
  duration?: number;  // Add duration property
}

export interface ToastAPI {
  (props: {
    title?: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    variant?: "default" | "destructive" | "success";
    className?: string; // Add className property
    duration?: number;  // Add duration property
  }): {
    id: string;
    dismiss: () => void;
    update: (props: any) => void;
  };
  dismiss: (toastId?: string) => void;
}

export { useToast, toast } from './use-toast';
