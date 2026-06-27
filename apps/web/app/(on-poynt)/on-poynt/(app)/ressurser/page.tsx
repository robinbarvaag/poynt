import { redirect } from "next/navigation";

// Ressurs-lista er slått sammen i Læring-huben. Guide-detaljene bor fortsatt på
// /on-poynt/ressurser/[slug].
export default function ResourcesPage() {
  redirect("/on-poynt/laering?type=guide");
}
