// Creates Stripe Checkout Sessions for the on-page checkout on happyproductions.me.
// The browser never sees the secret key: it asks this worker for a session and
// gets back only the session's client secret, which Stripe.js uses to render the form.

const STRIPE_API = 'https://api.stripe.com/v1/checkout/sessions';

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

// Metadata values come from the page, so keep them short and plain.
function clean(value, max) {
  return String(value || '').replace(/[^\w\-./:?=&% ]/g, '').slice(0, max);
}

export function buildSessionParams(env, input) {
  const p = new URLSearchParams();
  p.set('ui_mode', 'elements');
  p.set('mode', 'subscription');
  p.set('line_items[0][price]', env.PRICE_ID);
  p.set('line_items[0][quantity]', '1');
  p.set('return_url', env.RETURN_URL);
  p.set('billing_address_collection', 'auto');
  // The terms version the buyer agreed to, kept on the session and the subscription.
  p.set('metadata[terms_version]', env.TERMS_VERSION);
  p.set('subscription_data[metadata][terms_version]', env.TERMS_VERSION);
  p.set('subscription_data[metadata][terms_url]', env.TERMS_URL);
  const source = clean(input.source, 60);
  const page = clean(input.page, 400);
  if (source) p.set('metadata[source]', source);
  if (page) p.set('metadata[page]', page);
  return p;
}

async function createSession(request, env, cors) {
  let input = {};
  try {
    input = await request.json();
  } catch (e) {
    input = {};
  }
  const res = await fetch(STRIPE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': env.STRIPE_API_VERSION,
    },
    body: buildSessionParams(env, input),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('stripe_error', res.status, data && data.error && data.error.message);
    return json({ error: 'Could not start checkout' }, 502, cors);
  }
  return json({ clientSecret: data.client_secret }, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (url.pathname === '/health') return json({ ok: true }, 200, {});

    if (url.pathname === '/session') {
      if (!cors) return json({ error: 'Origin not allowed' }, 403, {});
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method === 'POST') return createSession(request, env, cors);
      return json({ error: 'Method not allowed' }, 405, cors);
    }

    return json({ error: 'Not found' }, 404, {});
  },
};
