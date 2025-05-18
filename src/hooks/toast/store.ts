
import { State, Action } from "./types"
import { reducer } from "./reducer"

// Listeners and memory state for the toast store
export const listeners: Array<(state: State) => void> = []

export let memoryState: State = { toasts: [] }

// Dispatch function to handle actions
export function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}
