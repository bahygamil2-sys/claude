import type { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setIO(instance: SocketIOServer) {
  io = instance;
}

/** Full room-emit helpers live in sockets/emitters.ts; this is the raw accessor they build on. */
export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO server not initialized yet");
  return io;
}
