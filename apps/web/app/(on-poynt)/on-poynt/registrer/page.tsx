import { redirect } from "next/navigation";

// Gratis selvbetjent registrering er fjernet — On Poynt krever medlemskap.
// Eventuelle gamle lenker til /registrer sendes til medlemskapssøknaden.
export default function RegistrerPage() {
  redirect("/bli-medlem");
}
