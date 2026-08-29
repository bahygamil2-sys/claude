import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

/** Subscribes to a socket.io event for the lifetime of the component. `deps` re-subscribes the handler. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void, deps: unknown[] = []) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
