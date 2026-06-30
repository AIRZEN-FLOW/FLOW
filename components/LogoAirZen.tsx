// Logo AIR ZEN : cercle gris-bleu avec une touche jaune (identité de la marque).
export function LogoAirZen({
  className = "",
  taille = 64,
}: {
  className?: string;
  taille?: number;
}) {
  const touche = Math.round(taille * 0.3);
  return (
    <div
      className={`relative ${className}`}
      style={{ width: taille, height: taille }}
      aria-hidden
    >
      <div
        className="rounded-full bg-airzen-primary"
        style={{ width: taille, height: taille }}
      />
      <div
        className="absolute rounded-full bg-airzen-accent"
        style={{ width: touche, height: touche, top: taille * 0.08, right: -touche * 0.15 }}
      />
    </div>
  );
}
