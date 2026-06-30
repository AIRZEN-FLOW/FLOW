"use client";

// Contexte d'authentification global (Étape 2).
// Suit l'état de connexion Firebase, garantit l'existence du profil utilisateur
// au premier login, et met à disposition le profil + les créneaux d'énergie.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/client";
import type { ProfilEnergie, Utilisateur } from "@/lib/types";
import {
  assurerProfilUtilisateur,
  getProfilsEnergie,
  getUtilisateur,
} from "@/lib/data/profil";

interface AuthContexteValeur {
  user: User | null;
  utilisateur: Utilisateur | null;
  profilsEnergie: ProfilEnergie[];
  chargement: boolean;
  rafraichir: () => Promise<void>;
  seDeconnecter: () => Promise<void>;
}

const AuthContexte = createContext<AuthContexteValeur | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [profilsEnergie, setProfilsEnergie] = useState<ProfilEnergie[]>([]);
  const [chargement, setChargement] = useState(true);

  const chargerDonneesProfil = useCallback(async (u: User) => {
    await assurerProfilUtilisateur(u);
    const [util, profils] = await Promise.all([
      getUtilisateur(u.uid),
      getProfilsEnergie(u.uid),
    ]);
    setUtilisateur(util);
    setProfilsEnergie(profils);
  }, []);

  useEffect(() => {
    const desinscrire = onAuthStateChanged(getAuthClient(), async (u) => {
      setUser(u);
      if (u) {
        try {
          await chargerDonneesProfil(u);
        } catch (e) {
          console.error("Erreur de chargement du profil :", e);
        }
      } else {
        setUtilisateur(null);
        setProfilsEnergie([]);
      }
      setChargement(false);
    });
    return desinscrire;
  }, [chargerDonneesProfil]);

  const rafraichir = useCallback(async () => {
    if (user) await chargerDonneesProfil(user);
  }, [user, chargerDonneesProfil]);

  const seDeconnecter = useCallback(async () => {
    await firebaseSignOut(getAuthClient());
  }, []);

  return (
    <AuthContexte.Provider
      value={{ user, utilisateur, profilsEnergie, chargement, rafraichir, seDeconnecter }}
    >
      {children}
    </AuthContexte.Provider>
  );
}

export function useAuth(): AuthContexteValeur {
  const ctx = useContext(AuthContexte);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}
