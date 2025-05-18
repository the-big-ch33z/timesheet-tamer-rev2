
import type { ToastActionElement } from "@/components/ui/toast"
import { ToastAPI, ToasterToast } from "./types"
import { dispatch } from "./store"
import { genId } from "./utils"

// Define the toast function with proper typing
const toast = ((props: {
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success";
  className?: string;
  duration?: number;
}) => {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
    
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}) as ToastAPI

// Add the dismiss method to the toast function to match ToastAPI
toast.dismiss = (toastId?: string) => {
  dispatch({ type: "DISMISS_TOAST", toastId })
}

export { toast }
