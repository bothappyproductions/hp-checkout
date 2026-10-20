# On-page checkout for the $995 Monthly Partnership

Replaces the redirect to the Stripe-hosted page with a checkout that opens inside the pricing card on happyproductions.me. Buyers can pay with Link (email, then a code texted to their phone), Apple Pay, Google Pay or a card. After paying, Stripe sends them to `https://onboarding.happyproductions.video/?session_id=…`.

Preview: https://claude.ai/artifact/SX35ZAMhuWuhhvx3G1yUWU

## What's here

| Path | What it is |
| --- | --- |
| `terms/monthly-partnership-terms.md` | Month-to-month terms, adapted from the yearly Video Production Agreement |
| `webflow/src/hp-checkout.js` | The site script. Finds the two "Start for $995/month" buttons on the home page and turns their card into the checkout |
| `worker/` | A Cloudflare Worker that creates the Stripe Checkout Session (the secret key has to live on a server, not in Webflow) |
| `build.mjs` | Bakes the terms into the script, writes `webflow/dist/` and the preview |

## How it works

1. Buyer clicks **Start for $995/month** (`.ps-btn` or `.pr-btn-main`).
2. The card swaps to a two-column checkout: what they agree to on the left, payment on the right, terms footer under the button, full terms in a sheet over the card.
3. The script asks the worker for a Checkout Session (`ui_mode: elements`, `mode: subscription`, price `price_1ULoUTFpcExHS5eF92eI81Pu`) and mounts Stripe's Express Checkout, Contact Details and Payment Elements.
4. Stripe confirms the subscription and redirects to onboarding. The session and subscription carry `terms_version` metadata as a record of which terms the buyer accepted.
5. If Stripe.js or the worker fails to load, the button falls back to the old payment link, so a sale is never lost.

## Going live (in order)

1. **Deploy the worker.** `cd worker && npx wrangler deploy`, then `npx wrangler secret put STRIPE_SECRET_KEY`. A restricted key with write access to Checkout Sessions is enough.
2. **Test first.** Point `PRICE_ID` at a test-mode price and use a `sk_test_` / `pk_test_` pair; pay with card `4242 4242 4242 4242`.
3. **Stripe settings.** In Settings → Payment methods, make sure Link, Apple Pay and Google Pay are on, and register `happyproductions.me` and `www.happyproductions.me` under Payment method domains (Express Checkout needs it).
4. **Fill in the two placeholders** at the top of `webflow/src/hp-checkout.js`: `apiBase` (the worker URL) and `publishableKey` (`pk_live_…`). Run `node build.mjs`.
5. **Publish the terms page** at `/monthly-terms` on Webflow from `webflow/dist/monthly-terms.html` (the checkout also shows them inline).
6. **Add the script in Webflow.** Upload `webflow/dist/hp-checkout.js` as an asset, register it as a hosted script with the hash in `hp-checkout.sri.txt`, and add it to the Home page footer.
7. **Publish the site** and run one real $995 payment end to end, then refund it.
