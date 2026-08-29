import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";

/**
 * Keeps one socket.io connection alive for the whole app while the user is authenticated.
 * `ready` must stay false until the session bootstrap (POST /auth/refresh) has resolved —
 * `user` is persisted across reloads but `accessToken` is memory-only, so connecting before
 * bootstrap completes would hand the socket handshake a null token and fail authentication.
 */
export function useSocketConnection(ready: boolean) {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!ready || !userId) return;
    connectSocket();
    return () => disconnectSocket();
  }, [ready, userId]);
}
