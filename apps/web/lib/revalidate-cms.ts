import { revalidateTag } from "next/cache";

/**
 * Felles hooks som tømmer «cms»-cachen (alle offentlige sider tagges med
 * cacheTag("cms")) så innholdsendringer i admin slår gjennom umiddelbart.
 * try/catch: seed-scripts kjører Payload utenfor Next-kontekst, der
 * revalidateTag kaster — da lar vi cachen utløpe av seg selv.
 */
function revalidateCms(): void {
  try {
    revalidateTag("cms", "max");
    // Rot-layouten (header/footer/nettsted-innstillinger) cacher under egen
    // «globals»-tag. Vi tømmer den sammen med «cms» — å skille dem sparer
    // lite, og en glemt tag betyr at nav/logo-endringer aldri slår gjennom.
    revalidateTag("globals", "max");
  } catch {
    // Utenfor Next-kontekst (f.eks. seed-script) — cachen utløper selv.
  }
}

export const revalidateCmsAfterChange = () => {
  revalidateCms();
};

export const revalidateCmsAfterDelete = () => {
  revalidateCms();
};
