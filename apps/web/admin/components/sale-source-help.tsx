import {
  SALE_SOURCE_HELP,
  SALE_SOURCE_OPTIONS,
} from "../../lib/boksalg/constants";

/**
 * Forklaring under «Hva slags salg» i Boksalg: ett punkt per valg, i
 * hverdagsspråk. Payloads select kan ikke vise en tekst per valg i selve
 * nedtrekket, så lista står under feltet i stedet. Tekstene bor i
 * lib/boksalg/constants.ts sammen med valgene.
 */
export function SaleSourceHelp() {
  return (
    <div
      className="field-description"
      // Payloads .field-description er flex → innledning og liste havner
      // side om side uten dette.
      style={{ display: "block", marginTop: "0.5rem", lineHeight: 1.45 }}
    >
      <p style={{ margin: "0 0 0.35rem" }}>
        Kanalen ved siden av avgjør hva du sitter igjen med. Typen sier hva
        slags salg det var:
      </p>
      <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
        {SALE_SOURCE_OPTIONS.map((option) => (
          <li key={option.value} style={{ marginBottom: "0.2rem" }}>
            <strong>{option.label}:</strong> {SALE_SOURCE_HELP[option.value]}
          </li>
        ))}
      </ul>
    </div>
  );
}
