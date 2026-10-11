"use client";

// Étapes 4 & 8 — Réglages : créneaux d'énergie, seuil d'urgence, Google Agenda.
// Présentation en tuiles carrées (icône + label court) : cliquer une tuile
// déplie son panneau juste en dessous, pour un écran plus compact et moins
// verbeux — voir demande "moins de texte, plus d'icônes".
import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { libelleNiveau } from "@/lib/energie";
import { majProfilEnergie, majUtilisateur } from "@/lib/data/profil";
import { usePreferenceLocale } from "@/lib/hooks/usePreferenceLocale";
import { CLE_CITATION_VISIBLE } from "@/components/EnTeteAccueil";
import { CLE_RAPPEL_PAUSE_ACTIF } from "@/lib/hooks/useRappelPause";
import {
  IconeAujourdhui,
  IconeCalendrier,
  IconeCloche,
  IconeDejeuner,
  IconeEclair,
  IconeHorloge,
  IconeSablier,
} from "@/components/icones";
import type { NiveauEnergie, ProfilEnergie } from "@/lib/types";

const NIVEAUX: NiveauEnergie[] = ["haute", "moyenne", "basse"];

type IdTuile =
  | "creneaux"
  | "dejeuner"
  | "travail"
  | "accueil"
  | "google"
  | "notifications"
  | "seuil";

function TuileReglage({
  actif,
  icone: Icone,
  label,
  resume,
  onClick,
}: {
  actif: boolean;
  icone: (props: { className?: string }) => ReactNode;
  label: string;
  resume?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 text-center shadow-sm transition-colors ${
        actif
          ? "bg-airzen-primary text-white"
          : "bg-white text-airzen-primary hover:bg-airzen-bg"
      }`}
    >
      <Icone className={`h-6 w-6 shrink-0 ${actif ? "text-white" : "text-airzen-secondary"}`} />
      <span className="text-xs font-semibold leading-tight">{label}</span>
      {resume && (
        <span
          className={`text-[10px] leading-tight ${actif ? "text-white/80" : "text-airzen-neutral"}`}
        >
          {resume}
        </span>
      )}
    </button>
  );
}

function PanneauReglage({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-airzen-primary">{titre}</h2>
      {children}
    </section>
  );
}

// Écran Aujourd'hui — afficher ou masquer la ligne salutation/citation/météo.
function SectionAccueil() {
  const [citationVisible, setCitationVisible] = usePreferenceLocale(
    CLE_CITATION_VISIBLE,
    true,
  );

  return (
    <PanneauReglage titre="Accueil">
      <label className="flex items-center gap-2 text-sm text-airzen-secondary">
        <input
          type="checkbox"
          checked={citationVisible}
          onChange={(e) => setCitationVisible(e.target.checked)}
          className="h-4 w-4 accent-airzen-primary"
        />
        Afficher la citation du jour sur l&apos;écran Aujourd&apos;hui
      </label>
    </PanneauReglage>
  );
}

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
    <PanneauReglage titre="Google Agenda">
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
    </PanneauReglage>
  );
}

// Rappels — permission de notification navigateur (voir lib/hooks/useRappels.ts)
// et rappel doux de pause toutes les 1h30 (voir lib/hooks/useRappelPause.ts).
function SectionNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "indisponible">(
    () =>
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "indisponible",
  );
  const [demande, setDemande] = useState(false);
  const [rappelPauseActif, setRappelPauseActif] = usePreferenceLocale(
    CLE_RAPPEL_PAUSE_ACTIF,
    true,
  );

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
    <PanneauReglage titre="Notifications">
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
          className="self-start rounded-full border border-airzen-neutral/60 px-4 py-2 text-sm font-medium text-airzen-primary transition-colors hover:bg-airzen-bg disabled:opacity-50"
        >
          {demande ? "Un instant…" : "Activer les notifications"}
        </button>
      )}

      <div className="mt-1 border-t border-airzen-neutral/20 pt-3">
        <label className="flex items-center gap-2 text-sm text-airzen-secondary">
          <input
            type="checkbox"
            checked={rappelPauseActif}
            onChange={(e) => setRappelPauseActif(e.target.checked)}
            className="h-4 w-4 accent-airzen-primary"
          />
          Me rappeler de faire une pause toutes les 1h30
        </label>
      </div>
    </PanneauReglage>
  );
}

function Reglages() {
  const { user, utilisateur, profilsEnergie, rafraichir } = useAuth();
  const [tuileOuverte, setTuileOuverte] = useState<IdTuile | null>(null);

  // Copie locale éditable (initialisée depuis le profil déjà chargé par l'auth).
  const [creneaux, setCreneaux] = useState<ProfilEnergie[]>(() =>
    [...profilsEnergie].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
  );
  const [seuil, setSeuil] = useState(() => utilisateur?.seuilUrgenceJours ?? 3);
  const [heureDebutTravail, setHeureDebutTravail] = useState(
    () => utilisateur?.heureDebutTravail ?? "08:00",
  );
  const [finJournee, setFinJournee] = useState(() => utilisateur?.finJournee ?? "19:00");
  const [dejeunerActif, setDejeunerActif] = useState(
    () => utilisateur?.pauseDejeunerActive ?? true,
  );
  const [heureDebutDejeuner, setHeureDebutDejeuner] = useState(
    () => utilisateur?.heureDebutDejeuner ?? "12:30",
  );
  const [heureFinDejeuner, setHeureFinDejeuner] = useState(
    () => utilisateur?.heureFinDejeuner ?? "13:00",
  );
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageOk, setMessageOk] = useState(false);

  function modifierCreneau(id: string, champs: Partial<ProfilEnergie>) {
    setCreneaux((prev) => prev.map((c) => (c.id === id ? { ...c, ...champs } : c)));
    setMessageOk(false);
  }

  function basculerTuile(id: IdTuile) {
    setTuileOuverte((prev) => (prev === id ? null : id));
  }

  async function enregistrer() {
    if (!user) return;
    setEnregistrement(true);
    setMessageOk(false);
    try {
      await Promise.all(
        creneaux.map((c) =>
          majProfilEnergie(c.id, {
            nomCreneau: c.nomCreneau,
            heureDebut: c.heureDebut,
            heureFin: c.heureFin,
            niveauEnergie: c.niveauEnergie,
          }),
        ),
      );
      await majUtilisateur(user.uid, {
        seuilUrgenceJours: seuil,
        finJournee,
        heureDebutTravail,
        pauseDejeunerActive: dejeunerActif,
        heureDebutDejeuner,
        heureFinDejeuner,
      });
      await rafraichir();
      setMessageOk(true);
    } finally {
      setEnregistrement(false);
    }
  }

  const tuiles: {
    id: IdTuile;
    label: string;
    icone: (props: { className?: string }) => ReactNode;
    resume?: string;
  }[] = [
    {
      id: "creneaux",
      label: "Créneaux d'énergie",
      icone: IconeEclair,
      resume: `${creneaux.length} créneaux`,
    },
    {
      id: "dejeuner",
      label: "Déjeuner",
      icone: IconeDejeuner,
      resume: dejeunerActif ? `${heureDebutDejeuner}–${heureFinDejeuner}` : "Désactivée",
    },
    {
      id: "travail",
      label: "Temps de travail",
      icone: IconeHorloge,
      resume: `${heureDebutTravail}–${finJournee}`,
    },
    { id: "accueil", label: "Accueil", icone: IconeAujourdhui },
    { id: "google", label: "Google Agenda", icone: IconeCalendrier },
    { id: "notifications", label: "Notifications", icone: IconeCloche },
    { id: "seuil", label: "Seuil d'urgence", icone: IconeSablier, resume: `${seuil} j` },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-airzen-primary">Réglages</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tuiles.map((t) => (
          <TuileReglage
            key={t.id}
            actif={tuileOuverte === t.id}
            icone={t.icone}
            label={t.label}
            resume={t.resume}
            onClick={() => basculerTuile(t.id)}
          />
        ))}
      </div>

      {tuileOuverte === "creneaux" && (
        <PanneauReglage titre="Mes créneaux d'énergie">
          <p className="-mt-1 text-sm font-light text-airzen-secondary">
            L&apos;app déduit votre énergie du moment à partir de ces plages. Ajustez-les à
            votre rythme et renommez-les si besoin.
          </p>
          {creneaux.map((c) => (
            <div key={c.id} className="rounded-xl bg-airzen-bg p-3">
              <input
                type="text"
                value={c.nomCreneau}
                onChange={(e) => modifierCreneau(c.id, { nomCreneau: e.target.value })}
                className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 font-medium text-airzen-primary outline-none focus:border-airzen-secondary focus:bg-white"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
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
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-airzen-neutral">Énergie :</span>
                {NIVEAUX.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => modifierCreneau(c.id, { niveauEnergie: n })}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      c.niveauEnergie === n
                        ? "bg-airzen-primary font-medium text-white"
                        : "bg-white text-airzen-secondary hover:bg-airzen-neutral/30"
                    }`}
                  >
                    {libelleNiveau(n)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </PanneauReglage>
      )}

      {tuileOuverte === "dejeuner" && (
        <PanneauReglage titre="Pause déjeuner">
          <p className="-mt-1 text-sm font-light text-airzen-secondary">
            Ce créneau est mis de côté : aucune tâche n&apos;y est jamais proposée.
          </p>
          <label className="flex items-center gap-2 text-sm text-airzen-secondary">
            <input
              type="checkbox"
              checked={dejeunerActif}
              onChange={(e) => {
                setDejeunerActif(e.target.checked);
                setMessageOk(false);
              }}
              className="h-4 w-4 accent-airzen-primary"
            />
            Réserver une pause déjeuner chaque jour
          </label>
          {dejeunerActif && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
                de
                <input
                  type="time"
                  value={heureDebutDejeuner}
                  onChange={(e) => {
                    setHeureDebutDejeuner(e.target.value);
                    setMessageOk(false);
                  }}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
                à
                <input
                  type="time"
                  value={heureFinDejeuner}
                  onChange={(e) => {
                    setHeureFinDejeuner(e.target.value);
                    setMessageOk(false);
                  }}
                  className="rounded-lg border border-airzen-neutral/60 px-2 py-1 text-airzen-primary outline-none focus:border-airzen-secondary"
                />
              </label>
            </div>
          )}
        </PanneauReglage>
      )}

      {tuileOuverte === "travail" && (
        <PanneauReglage titre="Temps de travail">
          <p className="-mt-1 text-sm font-light text-airzen-secondary">
            Les heures de début et de fin de votre journée type — la proposition de
            planning s&apos;appuie dessus.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
              Début
              <input
                type="time"
                value={heureDebutTravail}
                onChange={(e) => {
                  setHeureDebutTravail(e.target.value);
                  setMessageOk(false);
                }}
                className="rounded-lg border border-airzen-neutral/60 px-2 py-1.5 text-airzen-primary outline-none focus:border-airzen-secondary"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-airzen-secondary">
              Fin
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
          </div>
          <p className="text-xs font-light text-airzen-neutral">
            Passé l&apos;heure de fin, l&apos;écran Aujourd&apos;hui vous le signale
            doucement au lieu de continuer à proposer des tâches.
          </p>
        </PanneauReglage>
      )}

      {tuileOuverte === "accueil" && <SectionAccueil />}
      {tuileOuverte === "google" && <SectionGoogleAgenda />}
      {tuileOuverte === "notifications" && <SectionNotifications />}

      {tuileOuverte === "seuil" && (
        <PanneauReglage titre="Seuil d'urgence">
          <p className="-mt-1 text-sm font-light text-airzen-secondary">
            Une tâche est « urgente » si son échéance est dans ce nombre de jours ou
            moins.
          </p>
          <label className="flex items-center gap-2 text-sm text-airzen-secondary">
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
        </PanneauReglage>
      )}

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
