
export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
}

export interface ToastAPI {
  (props: {
    title?: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    variant?: "default" | "destructive" | "success";
  }): void;
  dismiss: (toastId?: string) => void;
}
