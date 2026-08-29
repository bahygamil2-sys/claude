import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { emitDriverLocation } from "../../sockets/emitters";

type LatLng = { lat: number; lng: number };

type SimulationEntry = {
  timer: ReturnType<typeof setInterval>;
  startedAt: number;
  durationMs: number;
  start: LatLng;
  end: LatLng;
};

// In-memory only — resets on server restart, which mirrors the fact that these are
// simulated deliveries with no real driver hardware to resync from.
const activeSimulations = new Map<string, SimulationEntry>();

function bearingDegrees(from: LatLng, to: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) - Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function interpolate(start: LatLng, end: LatLng, fraction: number): LatLng {
  return { lat: start.lat + (end.lat - start.lat) * fraction, lng: start.lng + (end.lng - start.lng) * fraction };
}

export function isSimulating(orderId: string): boolean {
  return activeSimulations.has(orderId);
}

export function stopSimulation(orderId: string) {
  const entry = activeSimulations.get(orderId);
  if (entry) {
    clearInterval(entry.timer);
    activeSimulations.delete(orderId);
  }
}

export function startSimulation(params: { orderId: string; start: LatLng; end: LatLng; onComplete: () => Promise<void> }) {
  stopSimulation(params.orderId);

  const durationMs = env.TRACKING_SIM_DURATION_SECONDS * 1000;
  const startedAt = Date.now();

  const tick = async () => {
    // Ticks are async (DB write + emit); if one is still in flight when the next timer fires,
    // or a previous tick already completed the simulation, skip rather than risk double-completion.
    if (!activeSimulations.has(params.orderId)) return;

    const elapsed = Date.now() - startedAt;
    const fraction = Math.min(elapsed / durationMs, 1);
    const position = interpolate(params.start, params.end, fraction);
    const heading = bearingDegrees(params.start, params.end);
    const etaMinutes = Math.max(0, Math.round(((1 - fraction) * durationMs) / 60000));

    await prisma.order
      .update({
        where: { id: params.orderId },
        data: { driverLat: position.lat, driverLng: position.lng, driverHeading: heading, driverUpdatedAt: new Date() },
      })
      .catch(() => {
        // Order may have been deleted/reassigned mid-flight; stop quietly rather than crash a timer.
        stopSimulation(params.orderId);
      });

    emitDriverLocation({ orderId: params.orderId, lat: position.lat, lng: position.lng, heading, etaMinutes });

    if (fraction >= 1) {
      stopSimulation(params.orderId);
      await params.onComplete();
    }
  };

  const timer = setInterval(() => void tick(), env.TRACKING_SIM_TICK_MS);
  activeSimulations.set(params.orderId, { timer, startedAt, durationMs, start: params.start, end: params.end });

  void tick();
}
