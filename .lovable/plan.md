## Objectif

Transformer l'onglet **Automatisations** (`/admin/crm`) en véritable centre de pilotage : plus de modèles intelligents, paramétrage fin par règle, et un éditeur d'emails qui rend exactement le même visuel que la page **Templates** (bandeau dégradé flame + logo IMOTION).

---

## 1. Plus d'automatisations intelligentes

Ajouter 8 nouveaux modèles rapides à `QUICK_TEMPLATES` (en plus des 7 existants) :

| Nom | Déclencheur | Action |
|---|---|---|
| Bienvenue + 1er pas | `user_registered` (+ délai 1h) | Email guidé "votre 1er CDC" |
| Discovery démarrée | `phase_completed` (phase=1) | Email de félicitations + récap |
| Discovery complète → CDC | `cdc_generated` | Email client "CDC prêt à signer" |
| Signature contrat | `project_signed` | Email merci + kickoff |
| Livraison projet | `status_changed` (status=delivered) | Email "votre projet est en ligne" + demande d'avis J+7 |
| Demande d'avis automatique | `inactivity_7d` après `delivered` | Email NPS |
| Anniversaire client | `user_registered` (+ délai 365j) | Email cadeau / réduction |
| Pipeline froid | `inactivity_30d` (statut=proposal) | Notif admin + email relance |

Nouveaux déclencheurs (`TRIGGER_EVENTS`) : `project_delivered`, `nps_requested`, `client_anniversary`, `proposal_stale_30d`.

---

## 2. Paramétrage fin par règle

Étendre `automation_rules.trigger_config` et `action_config` avec un éditeur visuel :

**Déclenchement**
- `delay_minutes` (slider 0 → 30 j)
- `send_window` (jour de la semaine, plage horaire 9-18h)
- `frequency_cap` (max N envois / 30 j par destinataire)

**Conditions (toutes optionnelles, combinables ET)**
- Rôle utilisateur (`client` / `consultant`)
- Statut projet (multi-select)
- Phase courante ≥ X
- Tag CRM contient
- Montant proposal min/max

**Cible**
- Destinataire : client du projet / consultant assigné / admin / email custom
- CC / BCC

**Action**
- Aperçu live de l'email à droite du formulaire
- Variables disponibles affichées en chips cliquables (insertion au curseur)
- Bouton "Envoi test à mon email"

---

## 3. Visualiser & modifier les mails (rendu Templates)

Nouvelle section onglet **Emails** dans `AutomationRulesTab` :
- Liste de toutes les règles `send_email` actives
- Pour chacune : carte avec aperçu miniature + bouton "Voir le rendu"
- Modal d'aperçu utilisant `<EmailPreview>` (déjà créé pour Templates) → garantit :
  - Bandeau dégradé flame `GRADIENTS.headerBand` + logo IMOTION
  - Typographie Inter, couleurs Coral/Amber
  - Pied de page "IMOTION Cabinet Conseil"
- Bouton "Modifier" → ouvre le formulaire pré-rempli (subject + body markdown)

Avantage : un seul composant de rendu (`EmailPreview`) partagé entre `/admin/templates/preview` et `/admin/crm` (onglet Automatisations) → cohérence visuelle garantie. Les envois réels passent par `send-transactional-email` qui utilise déjà les templates React Email avec la même charte.

---

## 4. Détails techniques

**Migration SQL**
- Ajouter colonnes JSON sur `automation_rules` : `conditions` (jsonb), `schedule_config` (jsonb), `target_config` (jsonb). Aucun breaking change : valeurs par défaut `{}`.
- Pas de nouvelle table.

**Fichiers touchés**
- `src/components/admin/AutomationRulesTab.tsx` : +8 templates, formulaire enrichi avec onglets (Déclencheur / Conditions / Action / Aperçu), sous-onglet "Emails" pour la galerie d'aperçus.
- `src/components/automation/AutomationEmailPreviewModal.tsx` (nouveau) : wrapper autour de `EmailPreview` pour pré-visualiser un `automation_rules.action_config`.
- `src/lib/automation-variables.ts` (nouveau) : registry des variables `{{nom}}, {{email}}, …` + helper `renderTemplate(body, vars)` partagé client/edge.
- `supabase/functions/_shared/email-templates/automation-generic.tsx` (nouveau) : template React Email générique appliquant la charte (bandeau, logo, footer) qui enrobe le markdown rendu.
- `supabase/functions/send-transactional-email/index.ts` : ajouter le mapping `automation-generic` → ce nouveau template (réutilisé par le worker d'automatisation).
- Worker (`process-email-queue` ou ajout d'un job `run-automation-rule` si besoin) : déjà en place, branchera sur le nouveau template.

**Composants UI**
- `Tabs` shadcn pour la modal de création (Déclencheur • Conditions • Action • Aperçu)
- `Slider` shadcn pour `delay_minutes` et `frequency_cap`
- `Badge` cliquable pour insertion de variables

**Aucune fonctionnalité retirée** : les règles existantes restent compatibles (champs nouveaux optionnels avec defaults).

---

## 5. Ordre d'exécution

1. Migration SQL (3 colonnes JSON sur `automation_rules`)
2. Template React Email `automation-generic` (côté serveur, charte Templates)
3. Composant `EmailPreview` réutilisé côté admin + `AutomationEmailPreviewModal`
4. Refonte UI `AutomationRulesTab` : modèles enrichis, formulaire à onglets, sous-onglet Emails
5. Helper `renderTemplate` + chips variables
6. Branchement worker → template générique
7. Test : créer 1 règle, prévisualiser, envoi test, vérifier rendu identique à `/admin/templates/preview`

Confirmer pour démarrer.
