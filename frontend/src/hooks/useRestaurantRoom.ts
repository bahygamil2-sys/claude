import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

/** Joins the restaurant:{id} room while mounted (live incoming-order feed); rejoins after reconnect. */
export function useRestaurantRoom(restaurantId: string | undefined) {
  useEffect(() => {
    if (!restaurantId) return;
    const socket = getSocket();
    const join = () => socket.emit("join:restaurant", { restaurantId });

    join();
    socket.on("connect", join);
    return () => {
      socket.emit("leave:restaurant", { restaurantId });
      socket.off("connect", join);
    };
  }, [restaurantId]);
}
