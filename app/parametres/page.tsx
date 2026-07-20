"use client";

// Étapes 4 & 8 — Réglages : créneaux d'énergie, seuil d'urgence, Google Agenda.
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { libelleNiveau } from "@/lib/energie";
import { majProfilEnergie, majUtilisateur } from "@/lib/data/profil";
import type { NiveauEnergie, ProfilEnergie } from "@/lib/types";

const NIVEAUX: NiveauEnergie[] = ["haute", "moyenne", "basse"];

// Étape 8 — Connexion Google Agenda (lecture seule).
function SectionGoogleAgenda() {
  const { user, utilisateur, rafraichir } = useAuth();
  const searchParams = useSearchParams();
  const retour = searchParams.get("google"); // "ok" | "erreur" | null
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const connecte = utilisateur?.googleCalendarConnecte ?? false;

  async function connecter() {
    if (!user) return;
    setEnCours(true);
    setErreur(null);
    try {
      const jeton = await user.getIdToken();
      const reponse = await fetch("/api/google/connexion", {
        headers: { Authorization: `Bearer ${jeton}` },
      });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees?.erreur ?? "Connexion impossible pour le moment.");
        setEnCours(false);
        return;
      }
      window.location.href = donnees.url; // départ vers le consentement Google
    } catch {
      setErreur("Connexion impossible pour le moment.");
      setEnCours(false);
    }
  }

  async function deconnecter() {
    if (!user) return;
    setEnCours(true);
    try {
      const jeton = await user.getIdToken();
      await fetch("/api/google/connexion", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jeton}` },
      });
      await rafraichir();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-airzen-primary">Google Agenda</h2>
      <p className="text-sm font-light text-airzen-secondary">
        En lecture seule : l&apos;app consulte vos créneaux occupés pour calculer votre
        temps réellement disponible. Elle ne crée, ne modifie et ne supprime jamais
        d&apos;événement.
      </p>

      {retour === "ok" && (
        <p className="rounded-lg bg-q2/10 px-3 py-2 text-sm text-q2">
          Google Agenda connecté ✓
        </p>
      )}
      {retour === "erreur" && (
        <p className="rounded-lg bg-q1/10 px-3 py-2 text-sm text-q1">
          La connexion n&apos;a pas abouti. Réessayez.
        </p>
      )}
      {erreur && <p className="rounded-lg bg-q1/10 px-3 py-2 text-sm text-q1">{erreur}</p>}

      {connecte ? (
        <div className="mt-1 flex items-center gap-3">
          <span className="text-sm font-medium text-airzen-primary">Connecté ✓</span>
          <button
            type="button"
            onClick={deconnecter}
            disabled={enCours}
            className="text-sm text-airzen-neutral hover:text-q1 disabled:opacity-50"
          >
            Déconnecter
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={connecter}
          disabled={enCours}
          className="mt-1 self-start rounded-full border border-airzen-neutral/60 px-4 py-2 text-sm font-medium text-airzen-primary transition-colors hover:bg-airzen-bg disabled:opacity-50"
        >
          {enCours ? "Redirection…" : "Connecter Google Agenda"}
        </button>
      )}
    </section>
  );
}

// Rappels — permission de notification navigateur (voir lib/hooks/useRappels.ts).
function SectionNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "indisponible">(
    () =>
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "indisponible",
  );
  const [demande, setDemande] = useState(false);

  async function activer() {
    setDemande(true);
    try {
      const resultat = await Notification.requestPermission();
      setPermission(resultat);
    } finally {
      setDemande(false);
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-airzen-primary">Notifications de rappel</h2>
      <p className="text-sm font-light text-airzen-secondary">
        Pour les tâches où vous avez coché « Me rappeler à l&apos;échéance », une
        notification s&apos;affiche le jour où la tâche arrive à échéance —
        uniquement pendant que l&apos;app est ouverte (pas de réveil si elle est
        totalement fermée, c&apos;est une limite du web sans serveur dédié).
      </p>

      {permission === "indisponible" && (
        <p className="text-sm text-airzen-neutral">
          Les notifications ne sont pas prises en charge par ce navigateur.
        </p>
      )}
      {permission === "granted" && (
        <p className="text-sm font-medium text-airzen-primary">Activées ✓</p>
      )}
      {permission === "denied" && (
        <p className="text-sm text-airzen-secondary">
          Bloquées par le navigateur. Pour les réactiver, changez l&apos;autorisation
          « Notifications » de ce site dans les réglages de votre navigateur.
        </p>
      )}
      {permission === "default" && (
        <button
          type="button"
          onClick={activer}
          disabled={demande}
          className="mt-1 self-start rounded-full border border-airzen-neutral/60 px-4 py-2 text-sm font-medium text-airzen-primary transition-colors hover:bg-airzen-bg disabled:opacity-50"
        >
          {demande ? "Un instant…" : "Activer les notifications"}
        </button>
      )}
    </section>
  );
}

function Reglages() {
  const { user, utilisateur, profilsEnergie, rafraichir } = useAuth();
  // Copie locale éditable (initialisée depuis le profil déjà chargé par l'auth).
  const [creneaux, setCreneaux] = useState<ProfilEnergie[]>(() =>
    [...profilsEnergie].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
  );
  const [seuil, setSeuil] = useState(() => utilisateur?.seuilUrgenceJours ?? 3);
  const [finJournee, setFinJournee] = useState(() => utilisateur?.finJournee ?? "19:00");
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageOk, setMessageOk] = useState(false);

  function modifierCreneau(id: string, champs: Partial<ProfilEnergie>) {
    setCreneaux((prev) => prev.map((c) => (c.id === id ? { ...c, ...champs } : c)));
    setMessageOk(false);
  }

  async function enregistrer() {
    if (!user) return;
    setEnregistrement(true);
    setMessageOk(false);
    try {
      await Promise.all(
        creneaux.map((c) =>
          majProfilEnergie(c.id, {
            heureDebut: c.heureDebut,
            heureFin: c.heureFin,
            niveauEnergie: c.niveauEnergie,
          }),
        ),
      );
      await majUtilisateur(user.uid, { seuilUrgenceJours: seuil, finJournee });
      await rafraichir();
      setMessageOk(true);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-airzen-primary">Réglages</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold text-airzen-primary">Mes créneaux d&apos;énergie</h2>
          <p className="mt-1 text-sm font-light text-airzen-secondary">
            L&apos;app déduit votre énergie du moment à partir de ces plages. Ajustez-les à
            votre rythme.
          </p>
        </div>

        {creneaux.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-medium text-airzen-primary">{c.nomCreneau}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
                de
                <input
                  type="time"
                  value={c.heureDebut}
                  onChange={(e) => modifierCreneau(c.id, { heureDebut: e.target.value })}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
                à
                <input
                  type="time"
                  value={c.heureFin}
                  onChange={(e) => modifierCreneau(c.id, { heureFin: e.target.value })}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-airzen-neutral">Énergie :</span>
              {NIVEAUX.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => modifierCreneau(c.id, { niveauEnergie: n })}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    c.niveauEnergie === n
                      ? "bg-airzen-primary font-medium text-white"
                      : "bg-airzen-bg text-airzen-secondary hover:bg-airzen-neutral/30"
                  }`}
                >
                  {libelleNiveau(n)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <SectionGoogleAgenda />

      <SectionNotifications />

      <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-airzen-primary">Seuil d&apos;urgence</h2>
        <p className="text-sm font-light text-airzen-secondary">
          Une tâche est « urgente » si son échéance est dans ce nombre de jours ou moins.
        </p>
        <label className="mt-1 flex items-center gap-2 text-sm text-airzen-secondary">
          <input
            type="number"
            min={1}
            max={30}
            value={seuil}
            onChange={(e) => {
              setSeuil(Math.max(1, Number(e.target.value)));
              setMessageOk(false);
            }}
            className="w-20 rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
          />
          jours
        </label>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-airzen-primary">Fin de journée</h2>
        <p className="text-sm font-light text-airzen-secondary">
          Passé cette heure, l&apos;écran Aujourd&apos;hui vous le signale doucement au
          lieu de continuer à proposer des tâches — libre à vous de les afficher quand
          même si besoin.
        </p>
        <label className="mt-1 flex items-center gap-2 text-sm text-airzen-secondary">
          <input
            type="time"
            value={finJournee}
            onChange={(e) => {
              setFinJournee(e.target.value);
              setMessageOk(false);
            }}
            className="rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
          />
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={enregistrement}
          className="rounded-full bg-airzen-accent px-5 py-2.5 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer"}
        </button>
        {messageOk && <span className="text-sm text-airzen-secondary">Enregistré ✓</span>}
      </div>
    </div>
  );
}

export default function PageParametres() {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense fallback={null}>
          <Reglages />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}
