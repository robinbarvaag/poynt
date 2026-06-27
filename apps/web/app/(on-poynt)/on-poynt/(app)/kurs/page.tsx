import { redirect } from "next/navigation";

// Kurs-lista er slått sammen i Læring-huben. Detalj-sidene bor fortsatt på
// /on-poynt/kurs/[slug].
export default function KursPage() {
  redirect("/on-poynt/laering?type=kurs");
}
