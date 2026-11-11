// Ancienne adresse de l'écran de suggestions : il est désormais l'accueil ("/").
// On redirige pour que les anciens liens et raccourcis continuent de fonctionner.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/");
}
