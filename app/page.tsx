"use client";

// Écran principal "Aujourd'hui" — fil de suggestions (Étape 4).
// Croise énergie du moment × temps disponible × quadrant Eisenhower.
import { useMemo, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { BandeauEnergie } from "@/components/BandeauEnergie";
import { CarteTache } from "@/components/CarteTache";
import { useTaches } from "@/lib/hooks/useTaches";
import { useEnergieMoment } from "@/lib/hooks/useEnergieMoment";
import { calculerSuggestions, type TempsDisponible } from "@/lib/matching";
import { tsEnDate } from "@/lib/format";

const OPTIONS_TEMPS: { valeur: TempsDisponible; label: string }[] = [
  { valeur: 15, label: "15 min" },
  { valeur: 30, label: "30 min" },
  { valeur: 60, label: "1 h" },
  { valeur: "plus", label: "Plus" },
];

function EcranAujourdhui() {
  const { taches, chargement, terminer } = useTaches();
  const { energieEffective, ajustementManuel, definirOverride, reinitialiser } =
    useEnergieMoment();
  const [tempsDisponible, setTempsDisponible] = useState<TempsDisponible>(30);

  const suggestions = useMemo(() => {
    const avecEcheance = taches.map((t) => ({
      ...t,
      echeanceDate: tsEnDate(t.dateEcheance),
    }));
    return calculerSuggestions(avecEcheance, energieEffective, tempsDisponible, 5);
  }, [taches, energieEffective, tempsDisponible]);

  const aucuneTache =
    !chargement &&
    taches.filter((t) => t.statut !== "terminee" && t.statut !== "annulee").length === 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-airzen-primary">Aujourd&apos;hui</h1>

      <BandeauEnergie
        energieEffective={energieEffective}
        ajustementManuel={ajustementManuel}
        onDefinir={definirOverride}
        onReinitialiser={reinitialiser}
      />

      <section className="flex flex-col gap-2">
        <p className="text-sm text-airzen-secondary">Combien de temps avez-vous là, maintenant ?</p>
        <div className="flex flex-wrap gap-2">
          {OPTIONS_TEMPS.map((o) => (
            <button
              key={String(o.valeur)}
              type="button"
              onClick={() => setTempsDisponible(o.valeur)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                tempsDisponible === o.valeur
                  ? "bg-airzen-primary font-medium text-white"
                  : "bg-white text-airzen-secondary shadow-sm hover:bg-airzen-bg"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-airzen-neutral">
          Suggestions pour ce moment
        </h2>

        {chargement ? (
          <p className="text-sm font-light text-airzen-secondary">Chargement…</p>
        ) : aucuneTache ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-light text-airzen-secondary">
              Vous n&apos;avez pas encore de tâche.
            </p>
            <Link
              href="/taches"
              className="mt-4 inline-block rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90"
            >
              Ajouter ma première tâche
            </Link>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-light text-airzen-secondary">
              Rien ne colle parfaitement à ce créneau et à votre énergie là, maintenant.
              C&apos;est peut-être le bon moment pour souffler 🌿
            </p>
          </div>
        ) : (
          suggestions.map((s) => (
            <CarteTache
              key={s.tache.id}
              tache={s.tache}
              raison={s.raison}
              attenue={s.secondPlan}
              onTerminer={(t) => terminer(t.id)}
            />
          ))
        )}
      </section>

      <Link
        href="/taches"
        className="self-start text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
      >
        Gérer toutes mes tâches →
      </Link>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <AppShell>
        <EcranAujourdhui />
      </AppShell>
    </RequireAuth>
  );
}
