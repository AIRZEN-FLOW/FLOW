// Badge coloré du quadrant Eisenhower (couleurs de docs/04-design-system.md).
// Texte foncé systématique (lisible sur toutes les couleurs, y compris les
// plus claires de Q3/Q4) + fond teinté + pastille pleine couleur : le code
// couleur reste identifiable même par une personne daltonienne (le libellé
// textuel porte l'information, la couleur la renforce).
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-airzen-primary"
      style={{ backgroundColor: `${couleur}40` }}
      title={`${court} — ${label}`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: couleur }} />
      {avecLabel ? label : court}
    </span>
  );
}
