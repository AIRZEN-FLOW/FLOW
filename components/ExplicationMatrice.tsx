"use client";

// Explication de la matrice d'Eisenhower — repliée par défaut pour rester "zen",
// dépliable via un simple lien. Sert à la fois de légende des couleurs et
// d'aide pour comprendre comment l'app PROPOSE une priorité (que l'utilisatrice
// peut ajuster dans chaque tâche).
import { useState } from "react";
import { QUADRANTS } from "@/lib/eisenhower";
import type { Quadrant } from "@/lib/types";

// Ordre d'affichage en grille 2×2 : ligne du haut = important, colonne de
// gauche = urgent (disposition classique de la matrice).
const GRILLE: Quadrant[] = ["q1", "q2", "q3", "q4"];

const DETAIL: Record<Quadrant, { quoi: string; conseil: string }> = {
  q1: {
    quoi: "Urgent et important",
    conseil: "Les vraies priorités du moment : à faire en premier.",
  },
  q2: {
    quoi: "Important, pas urgent",
    conseil:
      "Le travail de fond, celui qu'on sacrifie le plus souvent. Réservez-lui du temps avant qu'il ne devienne urgent.",
  },
  q3: {
    quoi: "Urgent, pas important",
    conseil: "Ça presse, mais ça compte peu pour vos objectifs : déléguez, simplifiez ou faites vite.",
  },
  q4: {
    quoi: "Ni urgent ni important",
    conseil: "À reporter, ou à laisser tomber sans culpabilité.",
  },
};

export function ExplicationMatrice({
  seuilJours = 3,
  libelle = "ⓘ Comment l'app priorise-t-elle mes tâches ?",
}: {
  seuilJours?: number;
  libelle?: string;
}) {
  const [ouverte, setOuverte] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOuverte((v) => !v)}
        className="text-left text-sm font-medium text-airzen-secondary hover:text-airzen-primary"
      >
        {ouverte ? "– Masquer l'explication" : libelle}
      </button>

      {ouverte && (
        <div className="mt-2 flex flex-col gap-4 rounded-2xl bg-white p-4 text-sm text-airzen-primary shadow-sm">
          <p className="font-light">
            L&apos;app s&apos;appuie sur la <strong className="font-semibold">matrice d&apos;Eisenhower</strong>.
            Elle trie chaque tâche avec deux questions simples :
          </p>
          <ul className="flex flex-col gap-1.5 font-light">
            <li>
              <strong className="font-semibold">Est-ce important ?</strong> Cette tâche vous rapproche-t-elle
              de vos objectifs, de ce qui compte vraiment pour vous ?
            </li>
            <li>
              <strong className="font-semibold">Est-ce urgent ?</strong> Doit-elle être faite très bientôt,
              sinon il y aura une conséquence ?
            </li>
          </ul>

          <div className="grid grid-cols-2 gap-2">
            {GRILLE.map((q) => (
              <div
                key={q}
                className="flex flex-col gap-1 rounded-xl p-3"
                style={{ backgroundColor: `${QUADRANTS[q].couleur}26` }}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: QUADRANTS[q].couleur }}
                  />
                  {QUADRANTS[q].court} · {QUADRANTS[q].label}
                </span>
                <span className="text-xs font-medium text-airzen-secondary">{DETAIL[q].quoi}</span>
                <span className="text-xs font-light">{DETAIL[q].conseil}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 border-t border-airzen-neutral/30 pt-3 font-light">
            <p className="font-semibold">Comment l&apos;app vous propose une priorité</p>
            <p>
              <strong className="font-medium">Importance</strong> : c&apos;est vous qui la choisissez. Seule
              l&apos;importance « Haute » compte comme importante dans la matrice.
            </p>
            <p>
              <strong className="font-medium">Urgence</strong> : l&apos;app la propose d&apos;après
              l&apos;échéance. Une tâche devient urgente quand son échéance tombe dans {seuilJours} jour
              {seuilJours > 1 ? "s" : ""} ou moins (réglable dans Paramètres). Sans échéance, elle
              n&apos;est jamais urgente d&apos;office.
            </p>
            <p>
              <strong className="font-medium">Vous gardez la main</strong> : dans chaque tâche, vous pouvez
              indiquer « Urgent pour moi » ou « Peut attendre ». L&apos;app suit alors votre ressenti.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
