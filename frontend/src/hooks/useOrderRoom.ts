import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

/** Joins the order:{id} room while mounted; rejoins automatically after a socket reconnect. */
export function useOrderRoom(orderId: string | undefined) {
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    const join = () => socket.emit("join:order", { orderId });

    join();
    socket.on("connect", join);
    return () => {
      socket.emit("leave:order", { orderId });
      socket.off("connect", join);
    };
  }, [orderId]);
}
