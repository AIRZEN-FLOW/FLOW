"use client";

// Rappels par notification navigateur (pop-up native du système).
// ⚠️ Limite honnête : ceci fonctionne uniquement quand l'app est ouverte dans
// un onglet (ou l'app installée est lancée) — pas de notification "réveil" si
// l'app est totalement fermée (cela demanderait une infrastructure de
// notifications push serveur, hors périmètre de cette étape).
// On vérifie toutes les 60 secondes si une tâche avec "rappel" activé arrive
// à échéance (le jour même), et on ne notifie qu'une seule fois par jour et
// par tâche (mémorisé dans localStorage).
import { useEffect } from "react";
import type { Tache } from "@/lib/types";
import { tsEnDate } from "@/lib/format";

const CLE_NOTIFIEES = "airzen-rappels-notifies";

function cleJour(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dejaNotifiee(tacheId: string, jour: string): boolean {
  try {
    const brut = window.localStorage.getItem(CLE_NOTIFIEES);
    const liste: string[] = brut ? JSON.parse(brut) : [];
    return liste.includes(`${tacheId}-${jour}`);
  } catch {
    return false;
  }
}

function marquerNotifiee(tacheId: string, jour: string): void {
  try {
    const brut = window.localStorage.getItem(CLE_NOTIFIEES);
    const liste: string[] = brut ? JSON.parse(brut) : [];
    liste.push(`${tacheId}-${jour}`);
    // On garde une liste raisonnable (les 200 dernières entrées suffisent).
    window.localStorage.setItem(CLE_NOTIFIEES, JSON.stringify(liste.slice(-200)));
  } catch {
    // localStorage indisponible (navigation privée, etc.) : on tente sans
    // persistance — au pire une notification pourra se répéter dans la session.
  }
}

export function useRappels(taches: Tache[]) {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    function verifier() {
      if (Notification.permission !== "granted") return;
      const maintenant = new Date();
      const jour = cleJour(maintenant);

      for (const t of taches) {
        if (!t.rappel || t.statut === "terminee" || t.statut === "annulee") continue;
        const echeance = tsEnDate(t.dateEcheance);
        if (!echeance) continue;
        // "Arrive à échéance" = le jour même (ou en retard), pas avant.
        const debutJourEcheance = new Date(
          echeance.getFullYear(),
          echeance.getMonth(),
          echeance.getDate(),
        );
        if (debutJourEcheance.getTime() > maintenant.getTime()) continue;
        if (dejaNotifiee(t.id, jour)) continue;

        new Notification(`⏰ ${t.titre}`, {
          body: "Cette tâche arrive à échéance aujourd'hui.",
          icon: "/icons/icon-192.png",
          tag: `airzen-${t.id}`,
        });
        marquerNotifiee(t.id, jour);
      }
    }

    verifier(); // vérification immédiate au montage
    const intervalle = window.setInterval(verifier, 60_000);
    return () => window.clearInterval(intervalle);
  }, [taches]);
}
