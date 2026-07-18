/**
 * HERMES — agent commercial IA de Luma.
 * Analyse un lead (site web + secteur), identifie un angle d'automatisation
 * réel, rédige les variables d'un cold email court et vérifiable.
 * Ne fabrique jamais de détail interne à l'entreprise — s'appuie uniquement
 * sur ce qui est visible publiquement (site web, secteur, catégorie).
 */

export const HERMES_SYSTEM = `Tu es HERMES, l'agent commercial IA de Luma, une agence IA à Montpellier.

Luma crée des systèmes d'automatisation IA sur-mesure pour les PME (artisans du
bâtiment principalement) : centraliser les demandes clients, automatiser les
relances de devis, gérer les RDV, réduire les tâches répétitives.

Ta mission : à partir du contenu d'un site web (ou, à défaut, du secteur/de la
catégorie du lead), identifier UNE observation concrète et vérifiable, puis
rédiger les éléments d'un cold email court, naturel, jamais commercial.

Règles strictes :
- Tu ne dois JAMAIS inventer un process interne, un problème précis ou un
  détail que le site ne montre pas. Une observation doit être déductible de ce
  qui est réellement visible (ex : pas de prise de RDV en ligne, contact
  uniquement par téléphone/mail, pas de formulaire de devis, secteur à forte
  saisonnalité...).
- Si le site n'a pas pu être analysé (vide, hors ligne, contenu trop pauvre),
  base-toi UNIQUEMENT sur le secteur/la catégorie/la ville du lead pour une
  observation générique mais honnête (jamais spécifique à l'entreprise) — et
  baisse le confidence_score en conséquence.
- Ton humain, chaleureux, jamais corporate. Vouvoiement. Zéro jargon IA,
  zéro superlatif, zéro pression commerciale.
- L'email ne vend rien directement : il pose une question ouverte sur leur
  quotidien pour amorcer une conversation.`;

export interface HermesResult {
  subject_line: string;
  opening_line: string;
  verified_observation: string;
  personalized_question: string;
  opportunity_angle: string;
  confidence_score: number;
}

export function hermesAnalyzePrompt(lead: {
  full_name: string | null;
  company: string | null;
  sector: string | null;
  city: string | null;
}, websiteExcerpt: string | null): string {
  const siteBlock = websiteExcerpt
    ? `Extrait du site web (texte visible, tronqué) :\n"""\n${websiteExcerpt}\n"""`
    : "Le site web n'a pas pu être analysé (absent, hors ligne, ou contenu insuffisant). Base-toi uniquement sur le secteur/la catégorie/la ville ci-dessous.";

  return `Lead à analyser :
- Entreprise : ${lead.company ?? lead.full_name ?? "—"}
- Secteur/catégorie : ${lead.sector ?? "artisan"}
- Ville : ${lead.city ?? "—"}

${siteBlock}

Rédige les éléments suivants (JSON) :
- "opportunity_angle" : l'angle d'automatisation identifié (gain de temps,
  gain d'argent, meilleure organisation...), en interne, 1 phrase.
- "verified_observation" : LA phrase-clé du mail — 1 à 2 phrases qui
  décrivent une observation réelle et vérifiable sur leur fonctionnement
  actuel (ex : "les demandes de réservation passent principalement par
  email"). Jamais une affirmation qui ne peut pas être déduite du contexte
  fourni.
- "opening_line" : 1 phrase d'accroche naturelle expliquant comment on est
  tombé sur leur entreprise (ex : "Je suis tombée sur votre établissement en
  regardant les [secteur] autour de [ville].").
- "personalized_question" : la question de fin de mail, ouverte, qui invite
  à répondre sans engagement (proche de : "Je serais curieuse de savoir :
  aujourd'hui, quelle est la tâche la plus répétitive ou chronophage dans
  votre entreprise ?" — reformulée si besoin pour coller au contexte).
- "subject_line" : objet de mail court, spécifique, jamais générique
  ("petite question sur..." plutôt que "Découvrez l'IA pour votre entreprise").
- "confidence_score" : 0-100, à quel point verified_observation est ancrée
  dans des faits réels (site analysé en détail = élevé ; secteur seul = bas,
  sous 40).

Renvoie UNIQUEMENT ce JSON : { "subject_line": string, "opening_line": string, "verified_observation": string, "personalized_question": string, "opportunity_angle": string, "confidence_score": number }`;
}

/** Assemble l'email complet (le même gabarit que celui validé par Robin pour Instantly). */
export function assembleHermesEmail(result: HermesResult, senderFirstName = "Ludivine"): string {
  return `Bonjour {{first_name}},

${result.opening_line}

${result.verified_observation}

Chez Luma, nous créons des systèmes IA adaptés aux PME pour automatiser les tâches répétitives, mieux organiser leurs process et leur faire gagner du temps ou développer leur activité.

${result.personalized_question}

Bien à vous,

${senderFirstName}
Luma`;
}
