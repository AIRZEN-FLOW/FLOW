"use client";

// Écran de connexion / inscription (Étape 2).
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { LogoAirZen } from "@/components/LogoAirZen";

type Mode = "connexion" | "inscription";

/** Traduit les codes d'erreur Firebase en messages doux et compréhensibles. */
function messageErreur(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Cette adresse e-mail ne semble pas valide.";
    case "auth/missing-password":
      return "Merci d'indiquer un mot de passe.";
    case "auth/weak-password":
      return "Le mot de passe doit faire au moins 6 caractères.";
    case "auth/email-already-in-use":
      return "Un compte existe déjà avec cette adresse. Essayez de vous connecter.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou mot de passe incorrect.";
    case "auth/popup-closed-by-user":
      return "Connexion Google annulée.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}

export default function PageConnexion() {
  const router = useRouter();
  const { user, chargement } = useAuth();
  const [mode, setMode] = useState<Mode>("connexion");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Déjà connectée → on file vers l'écran principal.
  useEffect(() => {
    if (!chargement && user) router.replace("/");
  }, [chargement, user, router]);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const auth = getAuthClient();
    try {
      if (mode === "inscription") {
        const cred = await createUserWithEmailAndPassword(auth, email, motDePasse);
        if (nom.trim()) await updateProfile(cred.user, { displayName: nom.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, motDePasse);
      }
      router.replace("/");
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      setErreur(messageErreur(code));
    } finally {
      setEnCours(false);
    }
  }

  async function connexionGoogle() {
    setErreur(null);
    setEnCours(true);
    try {
      await signInWithPopup(getAuthClient(), new GoogleAuthProvider());
      router.replace("/");
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      setErreur(messageErreur(code));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <LogoAirZen className="mb-5" />
          <h1 className="text-2xl font-bold text-airzen-primary">AIR ZEN Flow</h1>
          <p className="mt-2 text-sm font-light text-airzen-secondary">
            {mode === "connexion"
              ? "Heureuse de vous revoir."
              : "Créons votre espace en douceur."}
          </p>
        </div>

        <form
          onSubmit={soumettre}
          className="flex flex-col gap-4 rounded-2xl bg-white p-7 shadow-sm"
        >
          {mode === "inscription" && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-airzen-primary">Prénom</span>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Rosenn"
                className="rounded-lg border border-airzen-neutral/60 px-3 py-2.5 text-airzen-primary outline-none focus:border-airzen-secondary"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-airzen-primary">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              className="rounded-lg border border-airzen-neutral/60 px-3 py-2.5 text-airzen-primary outline-none focus:border-airzen-secondary"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-airzen-primary">Mot de passe</span>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-airzen-neutral/60 px-3 py-2.5 text-airzen-primary outline-none focus:border-airzen-secondary"
            />
          </label>

          {erreur && (
            <p className="rounded-lg bg-q1/10 px-3 py-2 text-sm text-q1">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="mt-1 rounded-full bg-airzen-accent px-5 py-3 font-semibold text-airzen-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {enCours
              ? "Un instant…"
              : mode === "connexion"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>

          <div className="flex items-center gap-3 py-1 text-xs text-airzen-neutral">
            <span className="h-px flex-1 bg-airzen-neutral/40" />
            ou
            <span className="h-px flex-1 bg-airzen-neutral/40" />
          </div>

          <button
            type="button"
            onClick={connexionGoogle}
            disabled={enCours}
            className="flex items-center justify-center gap-2 rounded-full border border-airzen-neutral/60 px-5 py-2.5 text-sm font-medium text-airzen-primary transition-colors hover:bg-airzen-bg disabled:opacity-50"
          >
            Continuer avec Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-airzen-secondary">
          {mode === "connexion" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "connexion" ? "inscription" : "connexion");
              setErreur(null);
            }}
            className="font-semibold text-airzen-primary underline-offset-2 hover:underline"
          >
            {mode === "connexion" ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </div>
    </main>
  );
}
