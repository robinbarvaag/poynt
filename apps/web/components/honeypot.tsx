import { HONEYPOT_FIELD } from "@/lib/spam-heuristics";

interface HoneypotProps {
  /** Skiller id-en fra andre skjemaer på samme side. */
  idPrefix: string;
  /** Kun for kontrollerte skjemaer (nyhetsbrevet) — ellers ukontrollert. */
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Honningkrukka: et felt mennesker aldri ser, men som roboter fyller ut fordi
 * de bare leser HTML-en. Verdien sjekkes på serveren (`isHoneypotFilled`), og
 * er den fylt, avvises innsendingen.
 *
 * Delt komponent fordi den vanskelige delen er å holde AUTOFYLL unna: en
 * passordbehandler som fyller feltet gjør et ekte menneske om til en robot i
 * våre øyne. `autoComplete="off"` alene holder ikke — derfor også de fire
 * data-attributtene, som er de offisielle «ikke rør dette»-signalene til
 * 1Password, LastPass, Bitwarden og Dashlane.
 */
export function Honeypot({ idPrefix, value, onChange }: HoneypotProps) {
  const id = `${idPrefix}-${HONEYPOT_FIELD}`;

  return (
    <div
      aria-hidden="true"
      className="absolute left-[-9999px] h-0 overflow-hidden"
    >
      {/* Nøytral label: den skal lokke en robot som leser HTML-en, men ikke
          ligne et felt autofyll kjenner igjen («Nettside», «E-post»). */}
      <label htmlFor={id}>Kontaktmetode</label>
      <input
        id={id}
        name={HONEYPOT_FIELD}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        tabIndex={-1}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
      />
    </div>
  );
}
