import { TOAST_REMOVE_DELAY } from "./types";
import { dispatch } from "./store";

let count = 0

// Map to keep track of toast timeouts
export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}
