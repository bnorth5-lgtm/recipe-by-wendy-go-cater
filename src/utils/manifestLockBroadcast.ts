import {
  MANIFEST_COORDINATE_LOCK_CHANNEL,
  MANIFEST_COORDINATE_LOCK_EVENT,
  MANIFEST_COORDINATE_LOCK_STORAGE_KEY,
  type ManifestCoordinateLockDetail,
  type SerializedManifestElement,
} from "@/lib/crisisEvents";
import type { MapElementData } from "@/utils/geoMath";

function slimElementsForPins(elements: MapElementData[]): SerializedManifestElement[] {
  return elements.map((e) => ({
    id: e.id,
    type: e.type,
    x: e.x,
    y: e.y,
    rotation: e.rotation,
    guests: e.guests ?? 0,
  }));
}

/** Broadcast finalized manifest pins to same-origin PWAs/workers via channel, window event, and localStorage fallback. */
export function broadcastManifestCoordinateLock(
  detail: Omit<ManifestCoordinateLockDetail, "elements"> & { elements: MapElementData[] },
): void {
  if (typeof window === "undefined") return;

  const payload: ManifestCoordinateLockDetail = {
    ...detail,
    elements: slimElementsForPins(detail.elements),
  };

  window.dispatchEvent(
    new CustomEvent(MANIFEST_COORDINATE_LOCK_EVENT, { detail: payload }),
  );

  try {
    const bc = new BroadcastChannel(MANIFEST_COORDINATE_LOCK_CHANNEL);
    bc.postMessage(payload);
    bc.close();
  } catch {
    // ignore unsupported environments
  }

  try {
    localStorage.setItem(MANIFEST_COORDINATE_LOCK_STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(`${MANIFEST_COORDINATE_LOCK_STORAGE_KEY}:updated`, String(Date.now()));
  } catch {
    // quota / privacy mode
  }
}
