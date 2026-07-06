/**
 * Constantes de marque Luma — utilisées dans les emails sortants (signature, etc.).
 * Édite ces valeurs pour changer la signature partout d'un coup.
 */
export const BRAND = {
  agency: "Luma",
  founder: "Robin Pailhès",
  site: "luma-agence.fr",
  siteUrl: "https://luma-agence.fr",
  /** Optionnel : numéro affiché dans la signature (laisser vide pour masquer). */
  phone: "",
} as const;

/** Bloc signature HTML, cohérent sur tous les emails Luma. */
export function emailSignatureHtml(): string {
  const phoneLine = BRAND.phone ? `<br/>${BRAND.phone}` : "";
  return `<p style="margin-top:20px;color:#1a1a1a;font-size:14px;line-height:1.5">
${BRAND.founder}<br/>
<strong>${BRAND.agency}</strong> — Agence IA${phoneLine}<br/>
<a href="${BRAND.siteUrl}" style="color:#1A3BFF;text-decoration:none">${BRAND.site}</a>
</p>`;
}
