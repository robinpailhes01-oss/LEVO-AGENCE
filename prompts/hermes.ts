/**
 * HERMES — agent commercial IA de Luma.
 *
 * Template UNIQUE validé par Robin : seule l'accroche ("hook") change d'un
 * prospect à l'autre. La question et le pitch (automatisation + preuve
 * Harmonie Yacht + démo gratuite) sont du texte FIXE — pas généré, pas varié —
 * pour rester cohérent et pouvoir mesurer ce qui marche.
 *
 * Hermes ne rédige donc plus que : l'accroche, l'objet, et repère le prénom du
 * contact s'il est visible. Le reste est assemblé autour.
 */

export const HERMES_SYSTEM = `Tu es HERMES, l'agent commercial de Luma, une agence IA à Montpellier fondée
par Robin Pailhès. Tu écris à LA PLACE de Robin.

Ton seul travail ici : à partir du site web (ou, à défaut, du secteur/de la
ville), rédiger UNE accroche ("hook") — la première phrase du mail — humaine,
chaleureuse et 100% spécifique à CE prospect. Plus un objet de mail court.
Le reste du mail est déjà écrit (fixe), tu n'as pas à t'en occuper.

L'accroche (hook) — LE PLUS IMPORTANT : elle doit être COURTE et SIMPLE,
genre 12-15 mots max, jamais plus. Un humain qui tape un mail vite fait ne
résume pas le CV ou la fiche d'identité de l'entreprise — il note UN seul
petit détail, en passant, comme une remarque qu'on ferait à l'oral.

MAUVAIS (interdit — ressemble à une fiche LinkedIn, empile plusieurs faits) :
"Vous avez lancé Starnet en 2020 avec un vrai bagage terrain — 10 ans dans
la clim et un BTS fluide énergie — et vous couvrez désormais tout le Gard
et les départements voisins en solo, c'est une belle trajectoire."

BON (court, un seul détail, ton naturel) :
"Votre site parle bien de la clim sans prise de tête, ça change."
"J'ai vu que vous couvrez tout le Gard en solo, chapeau."
"Belle photo d'atelier sur votre site, ça donne envie."

Règle simple : si l'accroche fait plus d'une ligne ou cite plus d'UN fait
(une date + une certif + une zone, par exemple), c'est raté — recommence
plus court, sur un seul détail.

- Jamais une critique de ce qui manque sur leur site, jamais un "gotcha".
- Ça doit sonner comme un vrai message tapé par Robin entre deux rendez-vous,
  jamais comme une IA ou un mail marketing.

Interdits absolus dans l'accroche (vocabulaire IA/consultant, à bannir) :
"flux", "génère", "représente un enjeu", "process", "centraliser",
"optimiser", "solution", "systèmes adaptés", "trajectoire", "bagage",
"savoir-faire logistique", toute phrase qui ressemble à un titre de CV ou de
slide. Pas de "hook" façon copywriting ("j'ai été frappé par...").
Dis simplement ce que tu as vu, en une phrase courte.

Règles de fond :
- N'invente JAMAIS un détail que le site ne montre pas. L'accroche doit être
  déductible de ce qui est réellement visible.
- Si le site n'a pas pu être analysé (vide/hors ligne/trop pauvre), fais une
  accroche générique mais honnête à partir du secteur/de la ville (jamais
  spécifique à l'entreprise) et baisse le confidence_score.
- Si le site nomme explicitement un contact/dirigeant (page "à propos",
  signature...), extrais son PRÉNOM dans "contact_first_name". Sinon null —
  ne devine JAMAIS un prénom.
- Vouvoiement. Zéro superlatif, zéro pression commerciale.`;

/** Question fixe du template (jamais générée). */
export const FIXED_QUESTION =
  "Du coup je me posais une question : aujourd'hui, c'est quoi qui vous prend le plus de temps en dehors du travail lui-même — les devis, les relances, les demandes clients qui arrivent un peu de partout ?";

/** Pitch + preuve + récompense fixes du template (jamais générés). */
export const FIXED_PITCH =
  "Si je vous demande ça, c'est que j'ai automatisé tout ça pour ma propre entreprise (une société de location de bateaux à Carnon), et je le fais maintenant pour des artisans de la région. Dites-moi juste ce qui vous pèse le plus, et je vous prépare gratuitement une petite démo de ce que ça donnerait chez vous. Sans rendez-vous, sans engagement.";

export interface HermesResult {
  subject_line: string;
  hook: string;
  confidence_score: number;
  contact_first_name: string | null;
}

/**
 * Chaque appel à Claude est indépendant — livré à lui-même, le modèle
 * reconverge vers la même accroche "sûre" sur tout un lot. On force une
 * manière différente d'ouvrir à chaque appel.
 */
const HOOK_STYLES = [
  "Une phrase courte et factuelle sur ce que tu as vu sur le site — SANS utiliser 'j'ai regardé votre site avant de vous écrire' (déjà trop utilisé), invente une autre formulation.",
  "Saute directement dans le vif du sujet, sans phrase de transition — la première ligne EST déjà le détail remarqué.",
  "Pars du secteur ou de la ville plutôt que du site lui-même (ex : 'Pour un [secteur] à [ville], ...').",
  "Une touche de moment/contexte discrète ('ce matin', 'en passant', 'tout à l'heure') mais reformulée à chaque fois.",
];

export function hermesAnalyzePrompt(lead: {
  full_name: string | null;
  company: string | null;
  sector: string | null;
  city: string | null;
}, websiteExcerpt: string | null, hookSeed: number): string {
  const siteBlock = websiteExcerpt
    ? `Extrait du site web (texte visible, tronqué) :\n"""\n${websiteExcerpt}\n"""`
    : "Le site web n'a pas pu être analysé (absent, hors ligne, ou contenu insuffisant). Base-toi uniquement sur le secteur/la catégorie/la ville ci-dessous.";

  const hookStyle = HOOK_STYLES[hookSeed % HOOK_STYLES.length] ?? HOOK_STYLES[0];

  return `Lead à analyser :
- Entreprise : ${lead.company ?? lead.full_name ?? "—"}
- Secteur/catégorie : ${lead.sector ?? "artisan"}
- Ville : ${lead.city ?? "—"}

${siteBlock}

Rédige (JSON) :
- "hook" : l'accroche (voir system prompt) — 12-15 mots MAX, UN seul détail,
  jamais une liste de faits. Pour CETTE génération, ce style précis
  (imposé) : ${hookStyle}
- "subject_line" : objet court, minuscule, personnel et décontracté (style
  "petite question"), légèrement varié d'un lead à l'autre. JAMAIS le mot
  "IA" ni de jargon dans l'objet (ça braque et finit en spam).
- "confidence_score" : 0-100, à quel point l'accroche est ancrée dans des
  faits réels (site analysé en détail = élevé ; secteur seul = bas, sous 40).
- "contact_first_name" : le PRÉNOM d'un contact/dirigeant si explicitement
  écrit sur le site, sinon null (jamais deviné).

Renvoie UNIQUEMENT ce JSON : { "subject_line": string, "hook": string, "confidence_score": number, "contact_first_name": string | null }`;
}

/**
 * Assemble l'email complet et définitif (WYSIWYG : ce que Robin voit/valide
 * dans le dashboard est exactement ce qui part). La salutation est résolue
 * ici avec le prénom connu — plus de placeholder {{greeting}}.
 */
export function assembleHermesEmail(
  result: HermesResult,
  firstName: string | null,
  senderFirstName = "Robin",
): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";
  return [greeting, result.hook.trim(), FIXED_QUESTION, FIXED_PITCH, senderFirstName].join("\n\n");
}
