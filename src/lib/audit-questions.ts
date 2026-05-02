/**
 * Digital Maturity Audit — Question bank
 * 4 profiles × 4 themes × 3 questions = 48 total questions
 * Each answer: A=4pts, B=3pts, C=2pts, D=1pt
 */

export type AuditType = "tpe" | "pme" | "startup" | "ge";
export type AnswerKey = "A" | "B" | "C" | "D";

export interface AuditAnswer {
  key: AnswerKey;
  label: string;
  points: number;
}

export interface AuditQuestion {
  id: string;
  question: string;
  subtitle?: string;
  answers: AuditAnswer[];
  weight: number;
}

export interface AuditCategory {
  key: string;
  label: string;
  emoji: string;
  color: string;
  encouragement: string;
  questions: AuditQuestion[];
}

export interface AuditProfile {
  type: AuditType;
  label: string;
  emoji: string;
  subtitle: string;
  categories: AuditCategory[];
}

const ANSWERS_STANDARD = (a: string, b: string, c: string, d: string): AuditAnswer[] => [
  { key: "A", label: a, points: 4 },
  { key: "B", label: b, points: 3 },
  { key: "C", label: c, points: 2 },
  { key: "D", label: d, points: 1 },
];

// ─── TPE / ARTISAN ──────────────────────────────────────────────────
const TPE: AuditProfile = {
  type: "tpe",
  label: "TPE / Artisan",
  emoji: "🏪",
  subtitle: "1 à 10 collaborateurs",
  categories: [
    {
      key: "gestion_temps",
      label: "Gestion du Temps",
      emoji: "📅",
      color: "from-blue-500 to-cyan-400",
      encouragement: "Bien joué ! Voyons comment vous gérez votre temps au quotidien.",
      questions: [
        {
          id: "tpe_q1_1",
          question: "Comment gérez-vous vos rendez-vous clients ?",
          subtitle: "Dites-nous comment vous organisez votre planning",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Réservation en ligne automatisée (Calendly, etc.)",
            "Agenda numérique partagé (Google Calendar…)",
            "Agenda papier + téléphone",
            "Pas de système organisé"
          ),
        },
        {
          id: "tpe_q1_2",
          question: "Vos clients reçoivent-ils des rappels automatiques ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "SMS + Email automatiques avant chaque RDV",
            "Email automatique uniquement",
            "Rappel manuel par téléphone",
            "Aucun rappel systématique"
          ),
        },
        {
          id: "tpe_q1_3",
          question: "Comment planifiez-vous vos interventions ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Optimisation automatique des tournées/planning",
            "Planning numérique avec géolocalisation",
            "Planning manuel optimisé",
            "Au jour le jour sans planification"
          ),
        },
      ],
    },
    {
      key: "facturation",
      label: "Facturation & Finances",
      emoji: "💰",
      color: "from-emerald-500 to-green-400",
      encouragement: "Passons aux finances — un levier souvent sous-estimé !",
      questions: [
        {
          id: "tpe_q2_1",
          question: "Comment créez-vous vos devis ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Génération automatique depuis un CRM avec templates",
            "Templates personnalisés (Word/Excel)",
            "Modèle standard adapté manuellement",
            "Création manuelle à chaque fois"
          ),
        },
        {
          id: "tpe_q2_2",
          question: "Le suivi de vos paiements est-il automatisé ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Relances automatiques + tableau de bord impayés",
            "Notifications automatiques des échéances",
            "Suivi manuel régulier",
            "Vérification occasionnelle"
          ),
        },
        {
          id: "tpe_q2_3",
          question: "Votre comptabilité est-elle intégrée à vos outils ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Synchronisation automatique avec logiciel comptable",
            "Export automatique des données",
            "Saisie manuelle régulière",
            "Tout en papier/Excel basique"
          ),
        },
      ],
    },
    {
      key: "presence_digitale",
      label: "Présence Digitale",
      emoji: "📱",
      color: "from-violet-500 to-purple-400",
      encouragement: "Super ! Regardons maintenant votre visibilité en ligne.",
      questions: [
        {
          id: "tpe_q3_1",
          question: "Votre présence en ligne locale est-elle optimisée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Google Business + site web + avis gérés automatiquement",
            "Google Business à jour + site web basique",
            "Présence sur Google Business uniquement",
            "Aucune présence en ligne"
          ),
        },
        {
          id: "tpe_q3_2",
          question: "Comment gérez-vous vos réseaux sociaux ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Publications programmées + interaction automatisée",
            "Publications régulières planifiées",
            "Publications occasionnelles manuelles",
            "Pas de réseaux sociaux professionnels"
          ),
        },
        {
          id: "tpe_q3_3",
          question: "Collectez-vous les avis clients systématiquement ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Demande automatique + suivi satisfaction",
            "Envoi automatique de demandes d'avis",
            "Demande manuelle occasionnelle",
            "Pas de collecte d'avis"
          ),
        },
      ],
    },
    {
      key: "relation_client",
      label: "Relation Client",
      emoji: "👥",
      color: "from-orange-500 to-amber-400",
      encouragement: "Dernière ligne droite — parlons de vos clients !",
      questions: [
        {
          id: "tpe_q4_1",
          question: "Comment suivez-vous vos clients ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "CRM automatisé avec historique complet",
            "Base de données organisée (Excel avancé)",
            "Fichier client basique",
            "Mémoire + carnet papier"
          ),
        },
        {
          id: "tpe_q4_2",
          question: "Vos clients peuvent-ils vous contacter 24/7 ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Chatbot intelligent + formulaire automatisé",
            "Formulaire de contact avec réponse auto",
            "Email/téléphone avec répondeur",
            "Disponibilité aux heures ouvrées uniquement"
          ),
        },
        {
          id: "tpe_q4_3",
          question: "Faites-vous du marketing automatisé ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Emails personnalisés + campagnes automatiques",
            "Newsletter régulière automatisée",
            "Communications occasionnelles manuelles",
            "Aucune communication marketing"
          ),
        },
      ],
    },
  ],
};

// ─── PME / INDUSTRIE ────────────────────────────────────────────────
const PME: AuditProfile = {
  type: "pme",
  label: "PME / Industrie",
  emoji: "🏭",
  subtitle: "10 à 250 collaborateurs",
  categories: [
    {
      key: "gestion_doc",
      label: "Gestion Documentaire",
      emoji: "📋",
      color: "from-blue-500 to-indigo-400",
      encouragement: "Commençons par la gestion de vos documents et processus.",
      questions: [
        {
          id: "pme_q1_1",
          question: "Vos documents sont-ils centralisés et accessibles ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Plateforme collaborative avec versions + recherche IA",
            "Drive partagé organisé avec droits d'accès",
            "Serveur interne avec accès limité",
            "Documents locaux sur chaque poste"
          ),
        },
        {
          id: "pme_q1_2",
          question: "Vos processus métier sont-ils automatisés ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Workflows automatiques avec validations",
            "Processus documentés avec outils numériques",
            "Processus documentés sur papier",
            "Processus non formalisés"
          ),
        },
        {
          id: "pme_q1_3",
          question: "Comment gérez-vous les versions et modifications ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Système de versions automatique + historique",
            "Contrôle de versions manuel organisé",
            "Sauvegarde régulière sans versioning",
            "Pas de gestion de versions"
          ),
        },
      ],
    },
    {
      key: "pilotage",
      label: "Pilotage & Performance",
      emoji: "📊",
      color: "from-rose-500 to-pink-400",
      encouragement: "Voyons comment vous pilotez votre activité.",
      questions: [
        {
          id: "pme_q2_1",
          question: "Disposez-vous de tableaux de bord en temps réel ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Dashboards automatisés multi-sources avec alertes",
            "Tableaux de bord manuels mis à jour régulièrement",
            "Rapports périodiques (hebdo/mensuel)",
            "Suivi occasionnel sans formalisme"
          ),
        },
        {
          id: "pme_q2_2",
          question: "Vos KPIs sont-ils automatiquement calculés ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Calcul automatique + analyses prédictives",
            "Calcul automatique des principaux KPIs",
            "Calcul manuel régulier",
            "Pas de KPIs formalisés"
          ),
        },
        {
          id: "pme_q2_3",
          question: "Comment sont générés vos rapports ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Génération automatique + personnalisation IA",
            "Templates automatisés avec données actualisées",
            "Création manuelle avec templates",
            "Rapports créés de zéro à chaque fois"
          ),
        },
      ],
    },
    {
      key: "collaboration",
      label: "Collaboration",
      emoji: "🤝",
      color: "from-teal-500 to-emerald-400",
      encouragement: "Comment vos équipes travaillent-elles ensemble ?",
      questions: [
        {
          id: "pme_q3_1",
          question: "Comment vos équipes collaborent-elles ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Plateforme unifiée (Slack + outils intégrés)",
            "Outils collaboratifs multiples coordonnés",
            "Email + réunions régulières",
            "Communication informelle non structurée"
          ),
        },
        {
          id: "pme_q3_2",
          question: "L'information circule-t-elle efficacement ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Flux automatisés + notifications intelligentes",
            "Canaux de communication organisés",
            "Réunions régulières + emails",
            "Communication au cas par cas"
          ),
        },
        {
          id: "pme_q3_3",
          question: "Vos équipes sont-elles formées aux outils digitaux ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Formation continue + support IA intégré",
            "Formations régulières organisées",
            "Formation initiale uniquement",
            "Apprentissage autonome non structuré"
          ),
        },
      ],
    },
    {
      key: "automatisation",
      label: "Automatisation",
      emoji: "🔧",
      color: "from-amber-500 to-yellow-400",
      encouragement: "Dernière thématique — le potentiel d'automatisation !",
      questions: [
        {
          id: "pme_q4_1",
          question: "Vos tâches répétitives sont-elles automatisées ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Automatisation complète avec IA prédictive",
            "Automatisation des principales tâches",
            "Quelques automatisations basiques",
            "Tout est manuel"
          ),
        },
        {
          id: "pme_q4_2",
          question: "Votre gestion des stocks/ressources est-elle optimisée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Gestion prédictive automatisée + alertes intelligentes",
            "Système automatisé avec seuils d'alerte",
            "Suivi informatisé manuel",
            "Gestion papier/Excel basique"
          ),
        },
        {
          id: "pme_q4_3",
          question: "Comment gérez-vous la maintenance/qualité ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Maintenance prédictive + contrôle qualité IA",
            "Planning de maintenance automatisé",
            "Maintenance préventive planifiée",
            "Maintenance curative uniquement"
          ),
        },
      ],
    },
  ],
};

// ─── START-UP / TECH ────────────────────────────────────────────────
const STARTUP: AuditProfile = {
  type: "startup",
  label: "Start-up / Tech",
  emoji: "🚀",
  subtitle: "Équipes agiles",
  categories: [
    {
      key: "productivite_dev",
      label: "Productivité Dev",
      emoji: "⚡",
      color: "from-cyan-500 to-blue-400",
      encouragement: "Regardons ensemble votre stack technique !",
      questions: [
        {
          id: "su_q1_1",
          question: "Vos développeurs utilisent-ils des assistants IA ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Copilots IA intégrés + review automatique",
            "Assistants IA pour génération de code",
            "Quelques outils IA ponctuels",
            "Développement 100% manuel"
          ),
        },
        {
          id: "su_q1_2",
          question: "Votre CI/CD est-il automatisé ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Pipeline complet avec tests IA + déploiement auto",
            "CI/CD automatisé avec tests automatiques",
            "Déploiement semi-automatisé",
            "Déploiement manuel"
          ),
        },
        {
          id: "su_q1_3",
          question: "Comment gérez-vous votre documentation technique ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Documentation auto-générée + maintenue par IA",
            "Documentation automatiquement mise à jour",
            "Documentation manuelle régulièrement mise à jour",
            "Documentation lacunaire ou absente"
          ),
        },
      ],
    },
    {
      key: "product_management",
      label: "Product Management",
      emoji: "🎯",
      color: "from-purple-500 to-violet-400",
      encouragement: "Comment pilotez-vous votre produit ?",
      questions: [
        {
          id: "su_q2_1",
          question: "Comment priorisez-vous votre roadmap produit ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Priorisation data-driven avec IA prédictive",
            "Outils de scoring automatisés (RICE, etc.)",
            "Priorisation basée sur feedback structuré",
            "Priorisation intuitive non formalisée"
          ),
        },
        {
          id: "su_q2_2",
          question: "Vos décisions produit sont-elles data-driven ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Analytics prédictives + A/B tests automatisés",
            "Tableaux de bord temps réel + tests utilisateurs",
            "Analytics basiques + feedback utilisateurs",
            "Décisions basées sur intuition/expérience"
          ),
        },
        {
          id: "su_q2_3",
          question: "Comment validez-vous vos hypothèses produit ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Tests automatisés + validation IA des insights",
            "A/B testing systématique + metrics tracking",
            "Tests utilisateurs réguliers",
            "Validation basée sur feedback interne"
          ),
        },
      ],
    },
    {
      key: "growth",
      label: "Growth & Marketing",
      emoji: "📈",
      color: "from-green-500 to-emerald-400",
      encouragement: "Comment accélérez-vous votre croissance ?",
      questions: [
        {
          id: "su_q3_1",
          question: "Votre acquisition est-elle automatisée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Funnels automatisés + optimisation IA",
            "Campagnes automatisées multi-canaux",
            "Quelques automatisations marketing",
            "Marketing entièrement manuel"
          ),
        },
        {
          id: "su_q3_2",
          question: "Comment mesurez-vous votre performance marketing ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Attribution modeling IA + prédiction LTV",
            "Tracking multi-touch avec dashboards",
            "Analytics basiques avec quelques KPIs",
            "Suivi minimal ou inexistant"
          ),
        },
        {
          id: "su_q3_3",
          question: "Votre contenu est-il optimisé par IA ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Génération + optimisation automatique de contenu",
            "Assistance IA pour création de contenu",
            "Outils IA ponctuels pour le contenu",
            "Création de contenu 100% manuelle"
          ),
        },
      ],
    },
    {
      key: "operations",
      label: "Opérations & Scaling",
      emoji: "🔧",
      color: "from-orange-500 to-red-400",
      encouragement: "Dernière ligne droite — êtes-vous prêt à scaler ?",
      questions: [
        {
          id: "su_q4_1",
          question: "Vos opérations sont-elles préparées au scaling ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Infrastructure auto-scalable + monitoring IA",
            "Processus automatisés scalables",
            "Processus documentés répétables",
            "Opérations ad hoc non scalables"
          ),
        },
        {
          id: "su_q4_2",
          question: "Comment gérez-vous le support client ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Support IA + escalade automatique intelligente",
            "Chatbot avancé + ticketing automatisé",
            "Support semi-automatisé avec templates",
            "Support 100% manuel"
          ),
        },
        {
          id: "su_q4_3",
          question: "Vos métriques business sont-elles en temps réel ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Real-time analytics + alertes prédictives",
            "Dashboards temps réel avec alertes",
            "Reporting quotidien automatisé",
            "Reporting manuel périodique"
          ),
        },
      ],
    },
  ],
};

// ─── GRANDE ENTREPRISE ──────────────────────────────────────────────
const GE: AuditProfile = {
  type: "ge",
  label: "Grande Entreprise",
  emoji: "🏛️",
  subtitle: "+250 collaborateurs",
  categories: [
    {
      key: "gouvernance",
      label: "Gouvernance & Sécurité",
      emoji: "🔒",
      color: "from-slate-600 to-gray-500",
      encouragement: "Commençons par la gouvernance — un sujet stratégique.",
      questions: [
        {
          id: "ge_q1_1",
          question: "Votre gouvernance IA est-elle structurée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Comité IA + politique complète + audit régulier",
            "Politique IA formalisée avec contrôles",
            "Règles basiques d'usage IA",
            "Aucune gouvernance IA"
          ),
        },
        {
          id: "ge_q1_2",
          question: "La conformité réglementaire est-elle automatisée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Compliance automatisée + monitoring continu",
            "Outils de conformité avec alertes",
            "Vérifications manuelles régulières",
            "Conformité ad hoc non systématique"
          ),
        },
        {
          id: "ge_q1_3",
          question: "Vos données sont-elles sécurisées et gouvernées ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Data governance automatisée + classification IA",
            "Politique de données avec outils de contrôle",
            "Règles de sécurité basiques appliquées",
            "Sécurité minimale sans gouvernance"
          ),
        },
      ],
    },
    {
      key: "integration",
      label: "Intégration Systèmes",
      emoji: "🔄",
      color: "from-indigo-500 to-blue-400",
      encouragement: "Voyons comment vos systèmes communiquent entre eux.",
      questions: [
        {
          id: "ge_q2_1",
          question: "Vos systèmes legacy sont-ils modernisés ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Modernisation progressive avec APIs + microservices",
            "Intégration via APIs avec systèmes existants",
            "Quelques connexions entre systèmes",
            "Systèmes en silos sans intégration"
          ),
        },
        {
          id: "ge_q2_2",
          question: "L'interopérabilité entre outils est-elle assurée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Architecture API-first + orchestration intelligente",
            "Intégrations standardisées entre outils majeurs",
            "Intégrations ponctuelles selon besoins",
            "Outils non connectés"
          ),
        },
        {
          id: "ge_q2_3",
          question: "Votre architecture supporte-t-elle l'innovation ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Architecture cloud-native + expérimentation IA",
            "Infrastructure flexible pour nouveaux projets",
            "Possibilité d'ajout de nouveaux outils",
            "Architecture rigide peu évolutive"
          ),
        },
      ],
    },
    {
      key: "bi_analytics",
      label: "BI & Analytics",
      emoji: "📊",
      color: "from-fuchsia-500 to-pink-400",
      encouragement: "Comment exploitez-vous vos données ?",
      questions: [
        {
          id: "ge_q3_1",
          question: "Vos analyses sont-elles automatisées et prédictives ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "BI augmentée avec ML prédictif automatisé",
            "Dashboards automatisés avec analyses avancées",
            "Reporting automatisé avec quelques prédictions",
            "Rapports manuels descriptifs uniquement"
          ),
        },
        {
          id: "ge_q3_2",
          question: "Les métiers sont-ils autonomes sur la data ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Self-service BI + assistance IA pour analyses",
            "Outils self-service avec formation utilisateurs",
            "Accès guidé aux données pour les métiers",
            "Dépendance totale à l'IT pour la data"
          ),
        },
        {
          id: "ge_q3_3",
          question: "Exploitez-vous le Big Data et l'IA ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Data lake + ML ops industrialisé",
            "Plateforme Big Data avec modèles ML",
            "Début d'exploitation données massives",
            "Données traditionnelles uniquement"
          ),
        },
      ],
    },
    {
      key: "transformation",
      label: "Transformation Digitale",
      emoji: "🏢",
      color: "from-primary to-secondary",
      encouragement: "Dernière thématique — votre vision de la transformation !",
      questions: [
        {
          id: "ge_q4_1",
          question: "Votre stratégie de transformation est-elle structurée ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Roadmap transformation avec KPIs + accompagnement IA",
            "Plan de transformation formalisé et suivi",
            "Initiatives de digitalisation ponctuelles",
            "Pas de stratégie de transformation définie"
          ),
        },
        {
          id: "ge_q4_2",
          question: "L'accompagnement au changement est-il organisé ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "Change management + formation IA pour tous",
            "Programme de formation et accompagnement",
            "Formation basique aux nouveaux outils",
            "Pas d'accompagnement structuré"
          ),
        },
        {
          id: "ge_q4_3",
          question: "Mesurez-vous l'impact de vos initiatives digitales ?",
          weight: 1,
          answers: ANSWERS_STANDARD(
            "ROI tracking automatisé + optimisation continue",
            "Mesure systématique des impacts avec KPIs",
            "Évaluation périodique des projets",
            "Pas de mesure d'impact structurée"
          ),
        },
      ],
    },
  ],
};

// ─── EXPORTS ────────────────────────────────────────────────────────
export const AUDIT_PROFILES: Record<AuditType, AuditProfile> = {
  tpe: TPE,
  pme: PME,
  startup: STARTUP,
  ge: GE,
};

/** Map company_size from onboarding to audit type */
export function detectAuditType(companySize?: string, industry?: string): AuditType {
  const techIndustries = ["SaaS / Tech"];
  if (industry && techIndustries.includes(industry)) return "startup";
  if (!companySize) return "tpe";
  if (companySize === "1 personne" || companySize === "2-10") return "tpe";
  if (companySize === "11-50" || companySize === "51-200") return "pme";
  if (companySize === "200+") return "ge";
  return "tpe";
}

/** Compute maturity level from percentage */
export function getMaturityLevel(pct: number): "critique" | "ameliorer" | "satisfaisant" {
  if (pct <= 45) return "critique";
  if (pct <= 75) return "ameliorer";
  return "satisfaisant";
}

export const MATURITY_LABELS = {
  critique: { label: "En développement", emoji: "🌱", color: "text-secondary", bg: "bg-secondary/5 border-orange-200", description: "Vous avez un fort potentiel d'amélioration — c'est une excellente nouvelle, car les gains seront rapides !" },
  ameliorer: { label: "En progression", emoji: "📈", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", description: "Vous avez déjà de bonnes bases ! Quelques optimisations ciblées peuvent faire une vraie différence." },
  satisfaisant: { label: "Avancé", emoji: "🌟", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", description: "Bravo, vous êtes en avance ! Explorons ensemble les innovations de pointe pour rester compétitif." },
};

/** Encouraging messages shown between categories */
export const TRANSITION_MESSAGES = [
  "Excellent ! On avance bien ensemble. 💪",
  "Parfait ! Vous êtes très clair dans vos réponses. 🎯",
  "Super ! Plus que 2 thématiques, on y est presque ! ✨",
  "Dernière ligne droite ! Vous allez découvrir votre profil. 🚀",
];

/** Per-answer micro feedback */
export const ANSWER_FEEDBACK: Record<AnswerKey, string[]> = {
  A: ["Impressionnant !", "Vous êtes en avance !", "Top niveau !", "Excellent choix !"],
  B: ["Très bien !", "Bonne base !", "Solide !", "Bien joué !"],
  C: ["Intéressant !", "C'est un bon point de départ !", "Ça se travaille facilement !", "On peut optimiser ça ensemble !"],
  D: ["Merci pour l'honnêteté !", "C'est justement là qu'on peut vous aider !", "Pas de souci, c'est le cas de beaucoup d'entreprises !", "Gros potentiel d'amélioration ici !"],
};
