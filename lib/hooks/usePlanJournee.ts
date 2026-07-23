"use client";

// Proposition de séquençage de la journée — logique partagée entre l'écran
// Planning (affichage détaillé, bloc par bloc) et l'écran Aujourd'hui (juste
// la ligne de synthèse). Fonctionne avec ou sans Google Agenda connecté : sans
// agenda, `occupations` est vide et toute la fenêtre restante est traitée
// comme libre — l'app n'a pas besoin de l'agenda pour être utile.
import { useMemo } from "react";
import type { Occupation } from "@/lib/hooks/useOccupations";
import { deduireEnergieMoment } from "@/lib/energie";
import { calculerSuggestions } from "@/lib/matching";
import { tsEnDate } from "@/lib/format";
import type { NiveauEnergie, ProfilEnergie, Tache } from "@/lib/types";

export interface BlocPlan {
  debut: Date;
  fin: Date;
  type: "occupe" | "tache" | "libre";
  tache?: Tache;
  energieCompatible?: boolean;
  /** Libellé du bloc "occupe", ex. "Pause déjeuner" au lieu de "Occupé (agenda)". */
  label?: string;
}

/** Réglages de journée type utilisés pour borner et occuper la fenêtre de planification. */
export interface OptionsJournee {
  finJournee?: string;
  heureDebutTravail?: string;
  pauseDejeunerActive?: boolean;
  heureDebutDejeuner?: string;
  heureFinDejeuner?: string;
}

export interface PlanJournee {
  blocs: BlocPlan[];
  minutesDisponibles: number;
  minutesPlanifiees: number;
  tachesProposees: number;
}

function aujourdhuiA(heures: number, minutes: number): Date {
  const d = new Date();
  d.setHours(heures, minutes, 0, 0);
  return d;
}

interface OccupationEtiquetee extends Occupation {
  label?: string;
}

/** Fusionne les occupations qui se chevauchent, bornées à la fenêtre de travail. */
function fusionnerOccupations(
  occupations: OccupationEtiquetee[],
  debut: Date,
  fin: Date,
): OccupationEtiquetee[] {
  const bornees = occupations
    .map((o) => ({
      debut: new Date(Math.max(o.debut.getTime(), debut.getTime())),
      fin: new Date(Math.min(o.fin.getTime(), fin.getTime())),
      label: o.label,
    }))
    .filter((o) => o.fin.getTime() > o.debut.getTime())
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  const fusion: OccupationEtiquetee[] = [];
  for (const o of bornees) {
    const dernier = fusion[fusion.length - 1];
    if (dernier && o.debut.getTime() <= dernier.fin.getTime()) {
      if (o.fin.getTime() > dernier.fin.getTime()) dernier.fin = o.fin;
    } else {
      fusion.push({ ...o });
    }
  }
  return fusion;
}

const PLAN_VIDE: PlanJournee = {
  blocs: [],
  minutesDisponibles: 0,
  minutesPlanifiees: 0,
  tachesProposees: 0,
};

export function usePlanJournee(
  taches: Tache[],
  profilsEnergie: ProfilEnergie[],
  occupations: Occupation[] | null,
  energieEffective: NiveauEnergie | null,
  options: OptionsJournee | string | undefined,
): PlanJournee {
  // Compat : accepte encore un simple `finJournee` en chaîne (ancien appel).
  const opts: OptionsJournee = typeof options === "string" ? { finJournee: options } : (options ?? {});

  return useMemo(() => {
    // Début de la fenêtre : l'heure de début de journée type réglée dans
    // Paramètres, sinon repli sur le début du tout premier créneau d'énergie
    // (défaut 8h), pour ne pas remplir les heures avant que la journée de
    // travail n'ait commencé si on consulte la page très tôt.
    let heureDebut = opts.heureDebutTravail;
    if (!heureDebut) {
      const heures = profilsEnergie.map((p) => p.heureDebut).sort();
      heureDebut = heures[0] ?? "08:00";
    }
    const [hd, md] = heureDebut.split(":").map(Number);
    const debutFenetre = aujourdhuiA(hd, md);

    // Fin de la fenêtre : la vraie "Fin de journée" réglée dans Paramètres —
    // avec ou sans Google Agenda, la proposition va jusque-là.
    const [hf, mf] = (opts.finJournee ?? "19:00").split(":").map(Number);
    const finFenetre = aujourdhuiA(hf, mf);

    const maintenant = new Date();
    const depart = maintenant.getTime() > debutFenetre.getTime() ? maintenant : debutFenetre;
    if (depart.getTime() >= finFenetre.getTime()) {
      return PLAN_VIDE;
    }

    // La pause déjeuner est traitée comme un bloc occupé au même titre que les
    // créneaux Google Agenda : aucune tâche n'y est jamais proposée.
    const occupationsEtDejeuner: OccupationEtiquetee[] = [...(occupations ?? [])];
    if (opts.pauseDejeunerActive !== false) {
      const [hdd, mdd] = (opts.heureDebutDejeuner ?? "12:30").split(":").map(Number);
      const [hfd, mfd] = (opts.heureFinDejeuner ?? "13:00").split(":").map(Number);
      const debutDejeuner = aujourdhuiA(hdd, mdd);
      const finDejeuner = aujourdhuiA(hfd, mfd);
      if (finDejeuner.getTime() > debutDejeuner.getTime()) {
        occupationsEtDejeuner.push({ debut: debutDejeuner, fin: finDejeuner, label: "Pause déjeuner" });
      }
    }

    const occupes = fusionnerOccupations(occupationsEtDejeuner, depart, finFenetre);

    // Tâches candidates : actives, de premier niveau.
    let restantes = taches
      .filter((t) => t.statut === "a_faire" || t.statut === "en_cours")
      .filter((t) => !t.tacheParenteId)
      .map((t) => ({ ...t, echeanceDate: tsEnDate(t.dateEcheance) }));

    const blocs: BlocPlan[] = [];
    let curseur = new Date(depart);

    const bornesLibres: { debut: Date; fin: Date }[] = [];
    for (const o of occupes) {
      if (o.debut.getTime() > curseur.getTime()) {
        bornesLibres.push({ debut: new Date(curseur), fin: new Date(o.debut) });
      }
      blocs.push({ debut: o.debut, fin: o.fin, type: "occupe", label: o.label });
      curseur = new Date(Math.max(curseur.getTime(), o.fin.getTime()));
    }
    if (curseur.getTime() < finFenetre.getTime()) {
      bornesLibres.push({ debut: new Date(curseur), fin: new Date(finFenetre) });
    }

    // Remplissage glouton de chaque créneau libre selon le matching. Pour le
    // tout premier instant ("maintenant"), l'énergie effective de l'écran
    // Aujourd'hui (déduite, ou ajustée manuellement) est reprise telle quelle ;
    // au-delà, l'énergie déduite des créneaux habituels prend le relais.
    for (const libre of bornesLibres) {
      let t = new Date(libre.debut);
      while (true) {
        const minutesRestantes = Math.floor((libre.fin.getTime() - t.getTime()) / 60000);
        if (minutesRestantes < 15 || restantes.length === 0) break;
        const surLeMoment = t.getTime() <= depart.getTime() + 60000;
        const energie = surLeMoment ? energieEffective : deduireEnergieMoment(profilsEnergie, t);
        const [meilleure] = calculerSuggestions(restantes, energie, minutesRestantes, 1, t);
        if (!meilleure) break;
        const fin = new Date(t.getTime() + meilleure.tache.dureeEstimeeMinutes * 60000);
        blocs.push({
          debut: new Date(t),
          fin,
          type: "tache",
          tache: meilleure.tache,
          energieCompatible: !meilleure.secondPlan,
        });
        restantes = restantes.filter((r) => r.id !== meilleure.tache.id);
        t = fin;
      }
      if (t.getTime() < libre.fin.getTime()) {
        blocs.push({ debut: new Date(t), fin: new Date(libre.fin), type: "libre" });
      }
    }

    blocs.sort((a, b) => a.debut.getTime() - b.debut.getTime());

    const minutesEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60000);
    const tachesProposees = blocs.filter((b) => b.type === "tache").length;
    const minutesPlanifiees = blocs
      .filter((b) => b.type === "tache")
      .reduce((total, b) => total + minutesEntre(b.debut, b.fin), 0);
    const minutesDisponibles = blocs
      .filter((b) => b.type === "tache" || b.type === "libre")
      .reduce((total, b) => total + minutesEntre(b.debut, b.fin), 0);

    return { blocs, minutesDisponibles, minutesPlanifiees, tachesProposees };
  }, [
    profilsEnergie,
    taches,
    occupations,
    energieEffective,
    opts.finJournee,
    opts.heureDebutTravail,
    opts.pauseDejeunerActive,
    opts.heureDebutDejeuner,
    opts.heureFinDejeuner,
  ]);
}
