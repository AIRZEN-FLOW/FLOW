"use client";

// Formulaire minimal pour un événement personnel du calendrier (titre, date,
// heure début/fin ou journée entière, description optionnelle) — volontairement
// court, sans "plus d'options" repliées comme FormulaireTache : un événement de
// calendrier a moins de champs qu'une tâche.
import { useState } from "react";
import { dateEnValeurInput } from "@/lib/format";
import { IconeCorbeille } from "@/components/icones";
import type { EvenementCalendrier, SaisieEvenement } from "@/lib/types";

interface FormulaireEvenementProps {
  onValider: (saisie: SaisieEvenement) => Promise<void> | void;
  onAnnuler: () => void;
  onSupprimer?: () => void;
  valeursInitiales?: EvenementCalendrier;
  dateInitiale?: Date;
  enCours?: boolean;
}

function heureEnValeurInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function FormulaireEvenement({
  onValider,
  onAnnuler,
  onSupprimer,
  valeursInitiales,
  dateInitiale,
  enCours = false,
}: FormulaireEvenementProps) {
  const base = dateInitiale ?? new Date();
  const [titre, setTitre] = useState(valeursInitiales?.titre ?? "");
  const [description, setDescription] = useState(valeursInitiales?.description ?? "");
  const [journeeEntiere, setJourneeEntiere] = useState(
    valeursInitiales?.journeeEntiere ?? false,
  );
  const [date, setDate] = useState(
    dateEnValeurInput(valeursInitiales ? valeursInitiales.dateDebut.toDate() : base),
  );
  const [heureDebut, setHeureDebut] = useState(
    valeursInitiales ? heureEnValeurInput(valeursInitiales.dateDebut.toDate()) : "09:00",
  );
  const [heureFin, setHeureFin] = useState(
    valeursInitiales ? heureEnValeurInput(valeursInitiales.dateFin.toDate()) : "10:00",
  );
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    if (!titre.trim()) {
      setErreur("Un titre est nécessaire.");
      return;
    }
    const [annee, mois, jour] = date.split("-").map(Number);
    let dateDebut: Date;
    let dateFin: Date;
    if (journeeEntiere) {
      dateDebut = new Date(annee, mois - 1, jour, 0, 0);
      dateFin = new Date(annee, mois - 1, jour, 23, 59);
    } else {
      const [hd, md] = heureDebut.split(":").map(Number);
      const [hf, mf] = heureFin.split(":").map(Number);
      dateDebut = new Date(annee, mois - 1, jour, hd, md);
      dateFin = new Date(annee, mois - 1, jour, hf, mf);
      if (dateFin.getTime() <= dateDebut.getTime()) {
        setErreur("L'heure de fin doit être après l'heure de début.");
        return;
      }
    }
    setErreur(null);
    await onValider({ titre, description, dateDebut, dateFin, journeeEntiere });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <input
        type="text"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Titre de l'événement"
        autoFocus
        className="rounded-lg border border-airzen-neutral/60 px-3 py-2 text-sm font-medium text-airzen-primary outline-none focus:border-airzen-secondary"
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-sm text-airzen-primary outline-none focus:border-airzen-secondary"
        />
        {!journeeEntiere && (
          <>
            <input
              type="time"
              value={heureDebut}
              onChange={(e) => setHeureDebut(e.target.value)}
              className="rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-sm text-airzen-primary outline-none focus:border-airzen-secondary"
            />
            <span className="text-sm text-airzen-neutral">à</span>
            <input
              type="time"
              value={heureFin}
              onChange={(e) => setHeureFin(e.target.value)}
              className="rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-sm text-airzen-primary outline-none focus:border-airzen-secondary"
            />
          </>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-airzen-secondary">
        <input
          type="checkbox"
          checked={journeeEntiere}
          onChange={(e) => setJourneeEntiere(e.target.checked)}
          className="h-4 w-4 accent-airzen-primary"
        />
        Toute la journée
      </label>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Détails (optionnel)"
        rows={2}
        className="resize-none rounded-lg border border-airzen-neutral/60 px-3 py-2 text-sm text-airzen-primary outline-none focus:border-airzen-secondary"
      />

      {erreur && <p className="text-sm text-q1">{erreur}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={valider}
          disabled={enCours}
          className="rounded-full bg-airzen-accent px-4 py-2 text-sm font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : valeursInitiales ? "Enregistrer" : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          className="text-sm text-airzen-secondary hover:text-airzen-primary"
        >
          Annuler
        </button>
        {onSupprimer && (
          <button
            type="button"
            onClick={onSupprimer}
            aria-label="Supprimer l'événement"
            title="Supprimer"
            className="ml-auto rounded-full p-1.5 text-airzen-neutral transition-colors hover:bg-q1/10 hover:text-q1"
          >
            <IconeCorbeille />
          </button>
        )}
      </div>
    </div>
  );
}
