import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

/** Joins the admin:ops room while mounted (live platform-wide activity feed); rejoins after reconnect. */
export function useAdminOpsRoom() {
  useEffect(() => {
    const socket = getSocket();
    const join = () => socket.emit("join:adminOps");

    join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
    };
  }, []);
}
