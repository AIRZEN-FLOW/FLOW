// Badge coloré du quadrant Eisenhower (couleurs de docs/04-design-system.md).
import type { Quadrant } from "@/lib/types";
import { QUADRANTS } from "@/lib/eisenhower";

export function BadgeQuadrant({
  quadrant,
  avecLabel = true,
}: {
  quadrant: Quadrant;
  avecLabel?: boolean;
}) {
  const { court, label, couleur } = QUADRANTS[quadrant];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${couleur}26`, color: couleur }}
      title={`${court} — ${label}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: couleur }}
      />
      {avecLabel ? label : court}
    </span>
  );
}
