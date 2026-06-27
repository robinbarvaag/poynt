import { redirect } from "next/navigation";

// Artikler-lista er slått sammen i Læring-huben. Detalj-sidene bor fortsatt på
// /on-poynt/artikler/[slug].
export default function ArticlesPage() {
  redirect("/on-poynt/laering?type=artikkel");
}
