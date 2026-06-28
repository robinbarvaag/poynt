/**
 * Monterer «Finn gratis bilde (Pexels/Giphy)»-knappen rett under et upload-felt.
 * Spre inn i feltets `admin.components`:
 *
 *   admin: { components: { afterInput: stockPickerAfterInput } }
 *
 * Knappen importerer valgt bilde til Media og auto-velger det inn i feltet.
 * Komponent: admin/components/media/stock-field-button.tsx
 */
export const stockPickerAfterInput = [
  "/admin/components/media/stock-field-button#StockFieldButton",
];
