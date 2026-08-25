"use client";

// Formulaire de création / édition de tâche (voir docs/04-design-system.md §3).
// Pensé pour être rapide : titre + durée + importance + énergie visibles d'emblée,
// le reste replié sous "Plus d'options" pour ne pas intimider.
import { useState, type FormEvent } from "react";
import type {
  Jour,
  NiveauEnergie,
  NiveauImportance,
  NiveauPlaisir,
  Projet,
  SaisieTache,
  Tache,
} from "@/lib/types";
import { JOURS_SEMAINE } from "@/lib/types";
import { tsEnDate, dateEnValeurInput } from "@/lib/format";

type Frequence = "aucune" | "quotidienne" | "hebdomadaire" | "mensuelle";

const OPTIONS_FREQUENCE: { valeur: Frequence; label: string }[] = [
  { valeur: "aucune", label: "Aucune" },
  { valeur: "quotidienne", label: "Chaque jour" },
  { valeur: "hebdomadaire", label: "Chaque semaine" },
  { valeur: "mensuelle", label: "Chaque mois" },
];

const LIBELLE_JOUR_COURT: Record<Jour, string> = {
  lundi: "L",
  mardi: "Ma",
  mercredi: "Me",
  jeudi: "J",
  vendredi: "V",
  samedi: "S",
  dimanche: "D",
};

const DUREES_RAPIDES = [15, 30, 45, 60, 90];

const OPTIONS_IMPORTANCE: { valeur: NiveauImportance; label: string }[] = [
  { valeur: "haute", label: "Haute" },
  { valeur: "moyenne", label: "Moyenne" },
  { valeur: "basse", label: "Basse" },
];

const OPTIONS_ENERGIE: { valeur: NiveauEnergie; label: string }[] = [
  { valeur: "haute", label: "Haute" },
  { valeur: "moyenne", label: "Moyenne" },
  { valeur: "basse", label: "Basse" },
];

const OPTIONS_PLAISIR: { valeur: NiveauPlaisir; label: string }[] = [
  { valeur: "basse", label: "Corvée" },
  { valeur: "moyenne", label: "Neutre" },
  { valeur: "haute", label: "Plaisir" },
];

function Chips<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { valeur: T; label: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            valeur === o.valeur
              ? "bg-airzen-primary font-medium text-white"
              : "bg-airzen-bg text-airzen-secondary hover:bg-airzen-neutral/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-airzen-primary">{label}</span>
      {children}
    </div>
  );
}

interface FormulaireTacheProps {
  onValider: (saisie: SaisieTache) => Promise<void> | void;
  onAnnuler?: () => void;
  valeursInitiales?: Tache;
  /** Projet présélectionné à la création (ex : ajout depuis la fiche d'un projet). */
  projetIdInitial?: string;
  enCours?: boolean;
  projets?: Projet[];
  tachesParentes?: Tache[];
}

export function FormulaireTache({
  onValider,
  onAnnuler,
  valeursInitiales,
  projetIdInitial,
  enCours = false,
  projets = [],
  tachesParentes = [],
}: FormulaireTacheProps) {
  const init = valeursInitiales;
  const [titre, setTitre] = useState(init?.titre ?? "");
  const [dureeMinutes, setDureeMinutes] = useState(init?.dureeEstimeeMinutes ?? 30);
  const [importance, setImportance] = useState<NiveauImportance>(
    init?.niveauImportance ?? "moyenne",
  );
  const [energie, setEnergie] = useState<NiveauEnergie>(
    init?.niveauEnergieRequis ?? "moyenne",
  );
  const [plaisir, setPlaisir] = useState<NiveauPlaisir>(init?.niveauPlaisir ?? "moyenne");
  const [echeance, setEcheance] = useState(
    dateEnValeurInput(tsEnDate(init?.dateEcheance)),
  );
  const [description, setDescription] = useState(init?.description ?? "");
  const [tags, setTags] = useState((init?.tags ?? []).join(", "));
  const [projetId, setProjetId] = useState(init?.projetId ?? projetIdInitial ?? "");
  const [parenteId, setParenteId] = useState(init?.tacheParenteId ?? "");
  const [optionsOuvertes, setOptionsOuvertes] = useState(false);
  // Étape 7 — récurrence
  const [frequence, setFrequence] = useState<Frequence>(
    init?.recurrenceRegle?.frequence ?? "aucune",
  );
  const [joursConcernes, setJoursConcernes] = useState<Jour[]>(
    init?.recurrenceRegle?.joursConcernes ?? [],
  );
  const [finRecurrence, setFinRecurrence] = useState(
    dateEnValeurInput(tsEnDate(init?.recurrenceRegle?.dateFin ?? null)),
  );
  // Étape "rappels" — notification navigateur le jour de l'échéance.
  const [rappel, setRappel] = useState(init?.rappel ?? false);

  function basculerJour(jour: Jour) {
    setJoursConcernes((prev) =>
      prev.includes(jour) ? prev.filter((j) => j !== jour) : [...prev, jour],
    );
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!titre.trim()) return;
    const saisie: SaisieTache = {
      titre,
      description: description || undefined,
      dateEcheance: echeance ? new Date(`${echeance}T00:00:00`) : null,
      niveauImportance: importance,
      dureeEstimeeMinutes: dureeMinutes,
      niveauEnergieRequis: energie,
      niveauPlaisir: plaisir,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      projetId: projetId || null,
      tacheParenteId: parenteId || null,
      rappel: echeance ? rappel : false,
      recurrenceRegle:
        frequence === "aucune"
          ? null
          : {
              frequence,
              joursConcernes: frequence === "hebdomadaire" ? joursConcernes : [],
              dateFin: finRecurrence ? new Date(`${finRecurrence}T23:59:59`) : null,
            },
    };
    await onValider(saisie);
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <Champ label="Que voulez-vous faire ?">
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex : préparer le devis client X"
          autoFocus
          spellCheck
          lang="fr"
          className="rounded-lg border border-airzen-neutral/60 px-3 py-2.5 text-airzen-primary outline-none focus:border-airzen-secondary"
        />
      </Champ>

      {projets.length > 0 && (
        <Champ label="Projet">
          <select
            value={projetId ?? ""}
            onChange={(e) => setProjetId(e.target.value)}
            className="w-fit rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
          >
            <option value="">Aucun projet</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Champ>
      )}

      <Champ label="Durée estimée">
        <div className="flex flex-wrap items-center gap-2">
          {DUREES_RAPIDES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDureeMinutes(d)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                dureeMinutes === d
                  ? "bg-airzen-primary font-medium text-white"
                  : "bg-airzen-bg text-airzen-secondary hover:bg-airzen-neutral/30"
              }`}
            >
              {d < 60 ? `${d} min` : d === 60 ? "1 h" : "1 h 30"}
            </button>
          ))}
          <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
            <input
              type="number"
              min={1}
              value={dureeMinutes}
              onChange={(e) => setDureeMinutes(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
            />
            min
          </label>
        </div>
      </Champ>

      <Champ label="Importance">
        <Chips options={OPTIONS_IMPORTANCE} valeur={importance} onChange={setImportance} />
      </Champ>

      <Champ label="Énergie que la tâche demande">
        <Chips options={OPTIONS_ENERGIE} valeur={energie} onChange={setEnergie} />
      </Champ>

      <Champ label="Plaisir que la tâche procure">
        <Chips options={OPTIONS_PLAISIR} valeur={plaisir} onChange={setPlaisir} />
      </Champ>

      <Champ label="Échéance (optionnelle)">
        <input
          type="date"
          value={echeance}
          onChange={(e) => setEcheance(e.target.value)}
          className="w-fit rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
        />
        {echeance && (
          <label className="mt-1.5 flex items-center gap-2 text-sm text-airzen-secondary">
            <input
              type="checkbox"
              checked={rappel}
              onChange={(e) => setRappel(e.target.checked)}
              className="h-4 w-4 accent-airzen-primary"
            />
            🔔 Me rappeler à l&apos;échéance (notification, app ouverte)
          </label>
        )}
      </Champ>

      <button
        type="button"
        onClick={() => setOptionsOuvertes((v) => !v)}
        className="self-start text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
      >
        {optionsOuvertes ? "– Moins d'options" : "+ Plus d'options"}
      </button>

      {optionsOuvertes && (
        <div className="flex flex-col gap-4 border-t border-airzen-neutral/30 pt-4">
          <Champ label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              spellCheck
              lang="fr"
              className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
            />
          </Champ>
          <Champ label="Répétition">
            <Chips options={OPTIONS_FREQUENCE} valeur={frequence} onChange={setFrequence} />
            {frequence === "hebdomadaire" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {JOURS_SEMAINE.map((jour) => (
                  <button
                    key={jour}
                    type="button"
                    onClick={() => basculerJour(jour)}
                    title={jour}
                    className={`h-8 w-8 rounded-full text-xs transition-colors ${
                      joursConcernes.includes(jour)
                        ? "bg-airzen-primary font-medium text-white"
                        : "bg-airzen-bg text-airzen-secondary hover:bg-airzen-neutral/30"
                    }`}
                  >
                    {LIBELLE_JOUR_COURT[jour]}
                  </button>
                ))}
              </div>
            )}
            {frequence !== "aucune" && (
              <label className="mt-2 flex items-center gap-2 text-sm text-airzen-secondary">
                Jusqu&apos;au (optionnel)
                <input
                  type="date"
                  value={finRecurrence}
                  onChange={(e) => setFinRecurrence(e.target.value)}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
            )}
          </Champ>

          <Champ label="Tags (séparés par des virgules)">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="client, admin, contenu"
              className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
            />
          </Champ>
          {tachesParentes.length > 0 && (
            <Champ label="Sous-tâche de…">
              <select
                value={parenteId ?? ""}
                onChange={(e) => setParenteId(e.target.value)}
                className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-airzen-primary outline-none focus:border-airzen-secondary"
              >
                <option value="">Tâche autonome</option>
                {tachesParentes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titre}
                  </option>
                ))}
              </select>
            </Champ>
          )}
        </div>
      )}

      <div className="mt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours || !titre.trim()}
          className="rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : valeursInitiales ? "Enregistrer" : "Ajouter la tâche"}
        </button>
        {onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
