import type { Side } from "../state/types";

export type TapHalvesHandler = (side: Side) => void;

export function attachTapHalvesInput(
  el: HTMLElement,
  onTap: TapHalvesHandler
): () => void {
  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side: Side = x < rect.width / 2 ? "left" : "right";
    onTap(side);
  };

  el.addEventListener("pointerdown", onPointerDown, { passive: false });
  return () => el.removeEventListener("pointerdown", onPointerDown);
}
