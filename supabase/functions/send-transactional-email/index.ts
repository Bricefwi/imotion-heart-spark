import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/render@1.0.5'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { CdcReadyEmail } from '../_shared/email-templates/cdc-ready.tsx'
import { ConversationSummaryEmail } from '../_shared/email-templates/conversation-summary.tsx'
import { DiscoveryCompleteEmail } from '../_shared/email-templates/discovery-complete.tsx'
import { ProposalSentEmail } from '../_shared/email-templates/proposal-sent.tsx'
import { ContractSignedEmail } from '../_shared/email-templates/contract-signed.tsx'
import { DevelopmentStartedEmail } from '../_shared/email-templates/development-started.tsx'
import { ProjectDeliveredEmail } from '../_shared/email-templates/project-delivered.tsx'

const ALLOWED_ORIGINS = [
  "https://imotion-conseils.fr",
  "https://www.imotion-conseils.fr",
  "https://app.imotion-conseils.fr",
  "https://app.imotion-conseils.fr",
  "https://marketing.imotion-conseils.fr",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const SITE_NAME = 'IMOTION Conseil'
const SENDER_DOMAIN = 'notify.imotion-conseils.fr'
const FROM_DOMAIN = 'notify.imotion-conseils.fr'
const SITE_URL = 'https://imotion-conseils.fr'

// Template registry — add new transactional email templates here
const TEMPLATES: Record<string, {
  component: React.ComponentType<Record<string, unknown>>
  subject: (data: Record<string, unknown>) => string
}> = {
  cdc_ready: {
    component: CdcReadyEmail,
    subject: (data) => `Votre Cahier des Charges pour ${data.projectName || 'votre projet'} est prêt !`,
  },
  conversation_summary: {
    component: ConversationSummaryEmail,
    subject: (data) => `Résumé de votre échange #${data.sessionNumber || 1} — ${data.projectName || 'Votre projet'}`,
  },
  discovery_complete: {
    component: DiscoveryCompleteEmail,
    subject: (data) => `Phase Discovery terminée — ${data.projectName || 'Votre projet'}`,
  },
  proposal_sent: {
    component: ProposalSentEmail,
    subject: (data) => `Votre devis pour ${data.projectName || 'votre projet'} est disponible`,
  },
  contract_signed: {
    component: ContractSignedEmail,
    subject: (data) => `Contrat signé — ${data.projectName || 'Votre projet'} est lancé !`,
  },
  development_started: {
    component: DevelopmentStartedEmail,
    subject: (data) => `Le développement de ${data.projectName || 'votre projet'} a démarré 🚀`,
  },
  project_delivered: {
    component: ProjectDeliveredEmail,
    subject: (data) => `${data.projectName || 'Votre projet'} a été livré — Félicitations ! 🎉`,
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const apiKey = Deno.env.get('LOVABLE_API_KEY')

  if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Auth: only service_role or authenticated staff (admin/consultant)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Role check: only admins, consultants, or service_role can send emails
  // Parse JWT claims to check role instead of substring matching the service key
  function parseJwtClaims(token: string) {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
  }
  const bearerToken = authHeader.replace('Bearer ', '').trim();
  const jwtClaims = parseJwtClaims(bearerToken);
  const isServiceRole = jwtClaims?.role === 'service_role';
  if (!isServiceRole) {
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await anonClient.auth.getUser()
    const callerId = userData?.user?.id
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
    const userRoles = (roles || []).map((r: Record<string, unknown>) => r.role)
    const hasPermission = userRoles.some((role: unknown) =>
      ['admin', 'super_admin', 'consultant'].includes(role as string)
    )
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Forbidden: insufficient role' }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const { template, to, data } = body

  if (!template || !to) {
    return new Response(JSON.stringify({ error: 'Missing template or to' }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(to)) {
    return new Response(JSON.stringify({ error: "Invalid email format" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const tmpl = TEMPLATES[template]
  if (!tmpl) {
    return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Check suppression list
  const { data: suppressed } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', to)
    .maybeSingle()

  if (suppressed) {
    return new Response(JSON.stringify({ skipped: true, reason: 'suppressed' }), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Render email
  const templateProps = { siteName: SITE_NAME, siteUrl: SITE_URL, ...data }
  const html = await renderAsync(React.createElement(tmpl.component, templateProps))
  const text = await renderAsync(React.createElement(tmpl.component, templateProps), { plainText: true })

  const messageId = crypto.randomUUID()
  const subject = tmpl.subject(data)

  // Log pending
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: template,
    recipient_email: to,
    status: 'pending',
    metadata: { data },
  })

  // Enqueue to transactional queue
  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      run_id: crypto.randomUUID(),
      message_id: messageId,
      to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: template,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue transactional email', { error: enqueueError, template, to })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: template,
      recipient_email: to,
      status: 'failed',
      error_message: 'Failed to enqueue',
    })
    return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  console.log('Transactional email enqueued', { template, to, messageId })

  return new Response(JSON.stringify({ success: true, messageId }), {
    status: 200,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })
})
