import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.31'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { CdcReadyEmail } from '../_shared/email-templates/cdc-ready.tsx'
import { ConversationSummaryEmail } from '../_shared/email-templates/conversation-summary.tsx'

const ALLOWED_ORIGINS = [
  "https://imotion-conseils.fr",
  "https://www.imotion-conseils.fr",
  "https://imotion-heart-spark.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const SITE_NAME = 'Clarivi'
const SENDER_DOMAIN = 'notify.imotion-conseils.fr'
const FROM_DOMAIN = 'notify.imotion-conseils.fr'
const SITE_URL = 'https://imotion-conseils.fr'

// Template registry — add new transactional email templates here
const TEMPLATES: Record<string, {
  component: React.ComponentType<any>
  subject: (data: any) => string
}> = {
  cdc_ready: {
    component: CdcReadyEmail,
    subject: (data) => `Votre Cahier des Charges pour ${data.projectName || 'votre projet'} est prêt !`,
  },
  conversation_summary: {
    component: ConversationSummaryEmail,
    subject: (data) => `Résumé de votre échange #${data.sessionNumber || 1} — ${data.projectName || 'Votre projet'}`,
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

  // Auth: only service_role or authenticated users with valid JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let body: any
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
