/**
 * Templates HTML email pour les règles d'automatisation IMOTION.
 * Respecte la charte graphique : gradient flame coral→amber, Inter, tokens IMOTION.
 * Variables disponibles : {{nom}}, {{email}}, {{entreprise}}, {{projet}}, {{lien}}
 */

const wrap = (content: string) =>
  `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IMOTION Creator Studio</title></head><body style="margin:0;padding:24px 0;background:#F8F6F4;font-family:Inter,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F4;"><tr><td align="center" style="padding:0 12px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,13,11,.06);"><tr><td style="background:linear-gradient(135deg,#F24E2A 0%,#FFA61F 100%);padding:28px 32px;text-align:center;"><p style="color:#fff;font-size:26px;font-weight:700;letter-spacing:-.5px;margin:0;font-family:Inter,Arial,sans-serif;">IMOTION</p><p style="color:rgba(255,255,255,.85);font-size:12px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;margin:4px 0 0;font-family:Inter,Arial,sans-serif;">Creator Studio</p></td></tr><tr><td style="padding:32px 32px 24px;">${content}</td></tr><tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr><tr><td style="padding:20px 32px 28px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0 0 4px;font-family:Inter,Arial,sans-serif;">Email envoyé par <a href="https://www.imotion-conseils.fr" style="color:#D63B1A;text-decoration:underline;">IMOTION Creator Studio</a>.</p><p style="font-size:12px;color:#9ca3af;margin:0;font-family:Inter,Arial,sans-serif;">Une question ? <a href="mailto:contact@imotion-conseils.fr" style="color:#D63B1A;text-decoration:underline;">contact@imotion-conseils.fr</a></p></td></tr></table></td></tr></table></body></html>`;

const h1 = (t: string) =>
  `<h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 16px;line-height:1.3;font-family:Inter,Arial,sans-serif;">${t}</h1>`;

const p = (t: string) =>
  `<p style="font-size:15px;line-height:1.65;color:#4b5563;margin:0 0 14px;font-family:Inter,Arial,sans-serif;">${t}</p>`;

const callout = (t: string) =>
  `<div style="background:#FFF8F6;border:1px solid #FDDDD6;border-radius:8px;padding:16px 20px;margin:16px 0;">${t}</div>`;

const cta = (label: string, href = "{{lien}}") =>
  `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0 8px;"><a href="${href}" style="background:linear-gradient(135deg,#F24E2A,#FFA61F);color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-family:Inter,Arial,sans-serif;box-shadow:0 8px 20px -8px rgba(214,59,26,.5);">${label}</a></td></tr></table>`;

const steps = (items: string[]) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${items.map((item, i) => `<tr><td width="36" valign="top" style="padding:0 12px 12px 0;"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F24E2A,#FFA61F);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;text-align:center;line-height:28px;font-family:Inter,Arial,sans-serif;">${i + 1}</div></td><td valign="top" style="padding-bottom:12px;"><p style="font-size:14px;line-height:1.5;color:#4b5563;margin:4px 0 0;font-family:Inter,Arial,sans-serif;">${item}</p></td></tr>`).join("")}</table>`;

const divider = `<hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0;">`;

const highlight = (t: string) =>
  `<span style="color:#D63B1A;font-weight:600;">${t}</span>`;

// ─── 16 TEMPLATES ────────────────────────────────────────────────────────────

export const tplWelcome = wrap(
  h1("Bienvenue chez IMOTION, {{nom}} !") +
  p("Votre compte <strong>IMOTION Creator Studio</strong> est activé. Nous sommes ravis de vous accompagner dans votre transformation digitale.") +
  p("Notre plateforme vous guide pas à pas, de la découverte de vos besoins jusqu'à la livraison de votre projet digital.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Prochaine étape :</strong> Démarrez votre première conversation avec Marc, votre consultant IA. Il vous posera 7 questions pour comprendre votre projet.</p>`) +
  cta("Accéder à mon espace", "https://app.imotion-conseils.fr/client")
);

export const tplOnboardingReminder = wrap(
  h1("{{nom}}, votre espace vous attend !") +
  p("Vous avez créé votre compte il y a 48h, mais votre onboarding n'est pas encore terminé. Vous êtes à <strong>2 minutes</strong> de démarrer votre projet digital.") +
  steps([
    "Complétez votre profil d'entreprise (2 min)",
    "Lancez la conversation de découverte avec Marc",
    "Recevez votre Cahier des Charges personnalisé sous 24h",
  ]) +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;">${highlight("Offre de bienvenue :")} les 3 premières phases de découverte sont gratuites. Ne laissez pas passer cette opportunité.</p>`) +
  cta("Reprendre mon onboarding", "https://app.imotion-conseils.fr/client")
);

export const tplStatusUpdate = wrap(
  h1("Votre projet a évolué !") +
  p("Bonjour {{nom}},") +
  p("Le statut de votre projet <strong>{{projet}}</strong> vient d'être mis à jour par votre équipe IMOTION.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Nouvelle étape :</strong> Connectez-vous pour découvrir l'avancement et les prochaines actions attendues de votre part.</p>`) +
  p("Votre consultant reste disponible pour répondre à toutes vos questions.") +
  cta("Voir l'avancement de mon projet")
);

export const tplInactivityReminder = wrap(
  h1("{{nom}}, votre projet vous attend !") +
  p("Nous avons remarqué que vous n'avez pas visité votre espace depuis quelques jours. Votre projet <strong>{{projet}}</strong> est en pause.") +
  p("Reprendre maintenant vous permettra de respecter les délais convenus et d'avancer rapidement vers votre livraison.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Besoin d'aide ?</strong> Votre consultant Marc est disponible. Répondez directement à cet email ou cliquez ci-dessous.</p>`) +
  divider +
  cta("Reprendre mon projet")
);

export const tplFirstProject = wrap(
  h1("Votre projet est lancé !") +
  p("Félicitations {{nom}} — le projet <strong>{{projet}}</strong> vient d'être créé dans votre espace IMOTION Creator Studio.") +
  p("Voici les 3 étapes qui vous attendent :") +
  steps([
    "<strong>Découverte</strong> — Marc vous pose 7 questions clés pour comprendre votre besoin",
    "<strong>Cahier des Charges</strong> — Un CDC personnalisé et professionnel est généré automatiquement",
    "<strong>Validation &amp; Démarrage</strong> — Vous validez, signez, et le projet démarre",
  ]) +
  cta("Démarrer la découverte", "https://app.imotion-conseils.fr/client/projects/{{projet}}")
);

export const tplDiscoveryStarted = wrap(
  h1("La découverte de votre projet a démarré !") +
  p("Bonjour {{nom}},") +
  p("Excellente nouvelle — la phase de découverte de votre projet <strong>{{projet}}</strong> est en cours. Marc, votre consultant IA, analyse vos besoins pour construire un Cahier des Charges sur-mesure.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Ce qui vous attend :</strong> 7 phases d'échanges approfondis → 1 CDC professionnel de 20+ pages, personnalisé à 100% pour votre projet.</p>`) +
  p("Plus vous êtes précis dans vos réponses, plus votre CDC sera riche et actionnable.") +
  cta("Continuer la découverte")
);

export const tplCdcReadyToValidate = wrap(
  h1("Votre Cahier des Charges est prêt !") +
  p("Bonjour {{nom}},") +
  p("Suite à votre découverte, le Cahier des Charges du projet <strong>{{projet}}</strong> a été finalisé. Ce document de référence synthétise l'ensemble de vos besoins, objectifs et spécifications techniques.") +
  steps([
    "<strong>Relisez</strong> le document — vérifiez qu'il correspond à votre vision",
    "<strong>Échangez</strong> avec votre consultant pour ajuster si besoin",
    "<strong>Validez</strong> le CDC pour passer à l'estimation et au démarrage",
  ]) +
  cta("Valider mon Cahier des Charges")
);

export const tplContractSigned = wrap(
  h1("Contrat signé — le projet peut démarrer !") +
  p("Bonjour {{nom}},") +
  p("Votre contrat pour le projet <strong>{{projet}}</strong> est signé. Toute l'équipe IMOTION Creator Studio est mobilisée pour votre succès.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Prochaine étape :</strong> Votre chef de projet vous contactera dans les 24h pour planifier le kick-off. Préparez vos contenus et accès.</p>`) +
  steps([
    "Réunion de kick-off — présentation de l'équipe et du planning",
    "Collecte des éléments — logos, textes, accès CMS/hébergement",
    "Premières maquettes — livrées sous 7 à 10 jours",
  ]) +
  cta("Accéder à mon espace projet")
);

export const tplProjectDelivered = wrap(
  h1("Votre projet est livré !") +
  p("Bonjour {{nom}},") +
  p("C'est une grande étape ! Le projet <strong>{{projet}}</strong> est officiellement livré dans votre espace. L'équipe IMOTION Creator Studio est fière du travail accompli ensemble.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Pour accéder à vos livrables :</strong> Rendez-vous dans votre espace projet. Tous les fichiers, accès et documentations sont disponibles.</p>`) +
  divider +
  p("Nous serions ravis de recevoir votre retour d'expérience — votre avis nous aide à progresser.") +
  cta("Découvrir mon projet livré")
);

export const tplNpsSurvey = wrap(
  h1("Votre avis compte pour nous") +
  p("Bonjour {{nom}},") +
  p("Dans le cadre de notre mission d'excellence, nous souhaitons recueillir votre retour sur votre expérience avec IMOTION Creator Studio pour le projet <strong>{{projet}}</strong>.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">2 minutes suffisent</strong> pour nous aider à améliorer notre service. Votre feedback est lu et traité personnellement par notre équipe.</p>`) +
  p("Sur une échelle de 0 à 10, recommanderiez-vous IMOTION Creator Studio à un collègue ou partenaire ?") +
  cta("Donner mon avis")
);

export const tplBirthday = wrap(
  h1("{{entreprise}} fête son anniversaire !") +
  p("Bonjour {{nom}},") +
  p("Un an déjà que nous collaborons ensemble ! C'est pour nous l'occasion de vous remercier pour votre confiance et de célébrer les réalisations accomplies.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Cadeau anniversaire :</strong> En remerciement de votre fidélité, bénéficiez d'un audit digital offert et d'une remise préférentielle sur votre prochain projet.</p>`) +
  p("Votre succès est notre fierté. Merci de nous faire confiance pour accompagner la croissance de <strong>{{entreprise}}</strong>.") +
  cta("Découvrir nos nouveautés", "https://www.imotion-conseils.fr")
);

export const tplColdPipeline = wrap(
  h1("Avez-vous toujours besoin de nous, {{nom}} ?") +
  p("Cela fait 14 jours que nous n'avons pas eu de nouvelles de votre part. Votre projet <strong>{{projet}}</strong> est mis en veille.") +
  p("Peut-être vos priorités ont-elles changé ? Nous comprenons que les projets digitaux demandent du temps de maturation.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Pas encore prêt ?</strong> Aucun problème — votre projet est sauvegardé. Revenez quand vous le souhaitez. <strong>Prêt à avancer ?</strong> Un simple clic suffit.</p>`) +
  divider +
  p("Notre équipe reste disponible pour adapter notre offre à vos nouvelles contraintes.") +
  cta("Reprendre contact")
);

export const tplProposalExpiring = wrap(
  h1("Votre proposition expire bientôt !") +
  p("Bonjour {{nom}},") +
  p("La proposition commerciale pour le projet <strong>{{projet}}</strong> expire dans <strong>5 jours</strong>. Au-delà, les tarifs et délais devront être recalculés.") +
  callout(`<p style="font-size:14px;color:#4b5563;margin:0;font-family:Inter,Arial,sans-serif;"><strong style="color:#D63B1A;">Ce que comprend votre proposition :</strong> Toutes les fonctionnalités validées dans votre CDC, les délais et l'échéancier de paiement sont garantis jusqu'à la date d'expiration.</p>`) +
  p("Pour bloquer ces conditions et démarrer votre projet, acceptez la proposition depuis votre espace.") +
  cta("Accepter ma proposition")
);

// ─── MAPPING POUR QUICK_TEMPLATES ─────────────────────────────────────────

export const EMAIL_HTML_TEMPLATES = {
  welcome: tplWelcome,
  onboarding_reminder: tplOnboardingReminder,
  status_update: tplStatusUpdate,
  inactivity_reminder: tplInactivityReminder,
  first_project: tplFirstProject,
  discovery_started: tplDiscoveryStarted,
  cdc_ready_to_validate: tplCdcReadyToValidate,
  contract_signed: tplContractSigned,
  project_delivered: tplProjectDelivered,
  nps_survey: tplNpsSurvey,
  birthday: tplBirthday,
  cold_pipeline: tplColdPipeline,
  proposal_expiring: tplProposalExpiring,
};
