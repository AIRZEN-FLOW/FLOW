"use client";

// Étapes 4 & 8 — Réglages : créneaux d'énergie, seuil d'urgence, Google Agenda.
// Présentation en tuiles carrées (icône + label court) : cliquer une tuile
// déplie son panneau juste en dessous, pour un écran plus compact et moins
// verbeux — voir demande "moins de texte, plus d'icônes".
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { libelleNiveau } from "@/lib/energie";
import { messageDiagnostic } from "@/lib/google/diagnostic";
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
        Afficher la citation du jour sur l&apos;écran Maintenant
      </label>
    </PanneauReglage>
  );
}

// Étape 8 — Connexion Google Agenda (lecture seule).
// L'écran ne se contente pas de dire "connecté" : il TESTE la lecture de
// l'agenda et, si elle échoue, explique la cause et quoi faire.
type EtatSynchro =
  | { statut: "test" }
  | { statut: "ok"; nombre: number }
  | { statut: "erreur"; code: string };

function EncartDiagnostic({ code }: { code: string }) {
  const { titre, quoiFaire } = messageDiagnostic(code);
  return (
    <div className="rounded-lg bg-q1/10 px-3 py-2.5 text-sm text-airzen-primary">
      <p className="font-medium">{titre}</p>
      <p className="mt-1 font-light">{quoiFaire}</p>
    </div>
  );
}

function SectionGoogleAgenda() {
  const { user, utilisateur, rafraichir } = useAuth();
  const searchParams = useSearchParams();
  const retour = searchParams.get("google"); // "ok" | "erreur" | null
  const raison = searchParams.get("raison"); // cause de l'échec, si "erreur"
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const connecte = utilisateur?.googleCalendarConnecte ?? false;
  const [synchro, setSynchro] = useState<EtatSynchro | null>(
    connecte ? { statut: "test" } : null,
  );
  // Adresse à déclarer dans Google Cloud (cet écran ne s'affiche que dans le
  // navigateur, une fois connectée ; le test protège le rendu côté serveur).
  const adresseRedirection =
    typeof window === "undefined" ? "" : `${window.location.origin}/api/google/callback`;

  // Lit réellement les créneaux occupés d'aujourd'hui pour vérifier que la
  // synchronisation fonctionne (même appel que les écrans Maintenant / Planning).
  const lireSynchro = useCallback(async (): Promise<EtatSynchro> => {
    if (!user) return { statut: "erreur", code: "inconnue" };
    try {
      const debut = new Date();
      debut.setHours(0, 0, 0, 0);
      const fin = new Date();
      fin.setHours(23, 59, 59, 0);
      const jeton = await user.getIdToken();
      const reponse = await fetch(
        `/api/google/occupations?debut=${encodeURIComponent(debut.toISOString())}&fin=${encodeURIComponent(fin.toISOString())}`,
        { headers: { Authorization: `Bearer ${jeton}` } },
      );
      const donnees = await reponse.json().catch(() => null);
      if (reponse.ok && donnees) return { statut: "ok", nombre: donnees.occupations.length };
      return { statut: "erreur", code: donnees?.code ?? "inconnue" };
    } catch {
      return { statut: "erreur", code: "inconnue" };
    }
  }, [user]);

  // Test automatique à l'ouverture de la tuile, si l'agenda est connecté.
  useEffect(() => {
    if (!connecte) return;
    let actif = true;
    lireSynchro().then((etat) => {
      if (actif) setSynchro(etat);
    });
    return () => {
      actif = false;
    };
  }, [connecte, lireSynchro]);

  async function tester() {
    setSynchro({ statut: "test" });
    setSynchro(await lireSynchro());
  }

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
      setSynchro(null);
      await rafraichir();
    } finally {
      setEnCours(false);
    }
  }

  const classeBouton =
    "self-start rounded-full border border-airzen-neutral/60 px-4 py-2 text-sm font-medium text-airzen-primary transition-colors hover:bg-airzen-bg disabled:opacity-50";

  return (
    <PanneauReglage titre="Google Agenda">
      <p className="text-sm font-light text-airzen-secondary">
        En lecture seule : l&apos;app consulte vos créneaux occupés pour calculer votre
        temps réellement disponible. Elle ne crée, ne modifie et ne supprime jamais
        d&apos;événement.
      </p>

      {retour === "erreur" && !connecte && <EncartDiagnostic code={raison ?? "inconnue"} />}
      {erreur && <p className="rounded-lg bg-q1/10 px-3 py-2 text-sm text-q1">{erreur}</p>}

      {connecte ? (
        <>
          {synchro?.statut === "test" && (
            <p className="text-sm font-light text-airzen-secondary">
              Vérification de la synchronisation…
            </p>
          )}
          {synchro?.statut === "ok" && (
            <p className="rounded-lg bg-airzen-bg px-3 py-2 text-sm text-airzen-primary">
              <span className="font-medium">Synchronisation active ✓</span>{" "}
              {synchro.nombre === 0
                ? "Aucun créneau occupé trouvé aujourd'hui dans votre agenda principal."
                : `${synchro.nombre} créneau${synchro.nombre > 1 ? "x" : ""} occupé${synchro.nombre > 1 ? "s" : ""} trouvé${synchro.nombre > 1 ? "s" : ""} aujourd'hui.`}
            </p>
          )}
          {synchro?.statut === "erreur" && <EncartDiagnostic code={synchro.code} />}

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            {synchro?.statut === "erreur" ? (
              <button type="button" onClick={connecter} disabled={enCours} className={classeBouton}>
                {enCours ? "Redirection…" : "Reconnecter Google Agenda"}
              </button>
            ) : (
              <span className="text-sm font-medium text-airzen-primary">Connecté ✓</span>
            )}
            <button
              type="button"
              onClick={tester}
              disabled={synchro?.statut === "test"}
              className="text-sm font-medium text-airzen-secondary hover:text-airzen-primary disabled:opacity-50"
            >
              Tester à nouveau
            </button>
            <button
              type="button"
              onClick={deconnecter}
              disabled={enCours}
              className="text-sm text-airzen-neutral hover:text-q1 disabled:opacity-50"
            >
              Déconnecter
            </button>
          </div>
        </>
      ) : (
        <button type="button" onClick={connecter} disabled={enCours} className={`mt-1 ${classeBouton}`}>
          {enCours ? "Redirection…" : "Connecter Google Agenda"}
        </button>
      )}

      <details className="mt-1 text-sm text-airzen-secondary">
        <summary className="cursor-pointer font-medium hover:text-airzen-primary">
          Aide : les réglages à vérifier dans Google Cloud
        </summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 font-light">
          <li>
            <span className="font-medium">API activée</span> : « API et services » →
            « Bibliothèque » → « Google Calendar API » doit être sur « Activée ».
          </li>
          <li>
            <span className="font-medium">Adresse de redirection</span> : dans votre client
            OAuth, la liste « URI de redirection autorisés » doit contenir exactement :
            <code className="mt-1 block break-all rounded bg-airzen-bg px-2 py-1 text-xs text-airzen-primary">
              {adresseRedirection}
            </code>
          </li>
          <li>
            <span className="font-medium">Application « En production »</span> : dans
            « Écran de consentement OAuth » (ou « Audience »). En mode « Test », seules les
            adresses ajoutées comme utilisatrices de test peuvent se connecter, et
            l&apos;autorisation expire au bout de 7 jours.
          </li>
          <li>
            <span className="font-medium">Agenda principal</span> : l&apos;app ne lit que
            l&apos;agenda principal du compte Google connecté, pas les agendas secondaires
            ou partagés.
          </li>
        </ol>
      </details>
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
  // Au retour de Google (?google=ok|erreur) ou depuis un lien "Voir pourquoi"
  // (?ouvrir=google), la tuile Google Agenda s'ouvre toute seule : sinon le
  // résultat de la connexion resterait caché dans une tuile fermée.
  const searchParams = useSearchParams();
  const [tuileOuverte, setTuileOuverte] = useState<IdTuile | null>(
    searchParams.get("google") || searchParams.get("ouvrir") === "google" ? "google" : null,
  );

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
            Passé l&apos;heure de fin, l&apos;écran Maintenant vous le signale
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
