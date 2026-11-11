// Onglets de l'écran "Mes tâches" : "À faire" (/taches) et "Terminées"
// (/terminees). Les tâches terminées ont leur propre onglet pour ne pas
// alourdir la liste de ce qui reste à faire.
import Link from "next/link";

export function OngletsTaches({
  actif,
  nombreTerminees,
}: {
  actif: "a_faire" | "terminees";
  nombreTerminees?: number;
}) {
  const onglets = [
    { cle: "a_faire", href: "/taches", label: "À faire" },
    {
      cle: "terminees",
      href: "/terminees",
      label: nombreTerminees ? `Terminées (${nombreTerminees})` : "Terminées",
    },
  ] as const;

  return (
    <nav aria-label="Tâches à faire ou terminées" className="flex gap-6 border-b border-airzen-neutral/40">
      {onglets.map((o) => {
        const estActif = o.cle === actif;
        return (
          <Link
            key={o.cle}
            href={o.href}
            aria-current={estActif ? "page" : undefined}
            className={`-mb-px border-b-2 px-0.5 pb-2.5 text-sm transition-colors ${
              estActif
                ? "border-airzen-accent font-semibold text-airzen-primary"
                : "border-transparent font-medium text-airzen-secondary hover:text-airzen-primary"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
