/* Happy Productions on-page checkout for the $995/month Monthly Partnership.
 *
 * Clicking a "Start for $995/month" button turns the pricing card it sits in into a
 * checkout, in place. Payment runs through Stripe Elements (Link, Apple Pay, Google Pay,
 * card) on a Checkout Session created by the hp-checkout worker. After payment Stripe
 * sends the buyer to the onboarding page. If anything fails to load, the button falls
 * back to the old Stripe-hosted page so no sale is lost.
 */
(function () {
  var CFG = Object.assign({
    apiBase: 'https://hp-checkout.REPLACE-ME.workers.dev',
    publishableKey: 'pk_live_REPLACE_ME',
    stripeJs: 'https://js.stripe.com/dahlia/stripe.js',
    fallbackUrl: 'https://buy.stripe.com/fZuaEX6Qyamp1k1eJq8AE26',
    triggerSelector: 'a[href*="buy.stripe.com/fZuaEX6Qyamp1k1eJq8AE26"], [data-hp-checkout]',
    cardSelector: '.ps-card, .pr-card-main',
    termsUrl: 'https://www.happyproductions.me/monthly-terms',
    portalUrl: 'https://billing.stripe.com/p/login/4gM9ATdeW0LPaUB58Q8AE01',
    demo: false,
  }, window.HP_CHECKOUT || {});

  var TERMS_HTML = /*__TERMS_HTML__*/'';

  var AGREE = [
    ['$995 today, then every month', 'Billed on the same date each month until you cancel.'],
    ['Cancel anytime, yourself', 'No contract and no call needed. Cancel in your billing dashboard; you keep the month you paid for.'],
    ['1 virtual production + unlimited edits', 'One remote session a month, directed live by our producer, and as many edits as you need (up to 10 minutes of footage each).'],
    ['You own the footage', 'Every raw file and finished video is yours.'],
    ['Editing plan only', 'No in-person shoots or Are You Happy posts. No refunds on a month that has started; unused sessions don’t roll over.'],
  ];

  var CSS = [
    '.hpco-open{display:block!important;position:relative}',
    '.hpco-open>*:not(.hpco):not(.hpco-sheet){display:none!important}',
    '.hpco{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));font-family:Poppins,sans-serif;color:#fff;text-align:left}',
    '.hpco *{box-sizing:border-box}',
    '.hpco-sum{padding:40px 36px;background:#1f1f1f;display:flex;flex-direction:column}',
    '.hpco-pay{padding:40px 36px;background:#2a2a2a;border-left:1px solid #3a3a3a}',
    '.hpco-back{align-self:flex-start;background:none;border:0;padding:0;color:#cbc4fe;font:500 14px/1.4 Poppins,sans-serif;cursor:pointer}',
    '.hpco-back:hover{color:#fff}',
    '.hpco-badge{margin-top:18px;align-self:flex-start;background:#cbc4fe;color:#1f1f1f;border-radius:50px;padding:6px 14px;font:600 13px/16px Poppins,sans-serif}',
    '.hpco-name{margin-top:16px;font:800 26px/30px Cabinetgrotesk,Poppins,sans-serif}',
    '.hpco-price{margin-top:8px;display:flex;align-items:flex-end;gap:8px}',
    '.hpco-price b{color:#ffe757;font:800 64px/60px Cabinetgrotesk,Poppins,sans-serif}',
    '.hpco-price span{font:500 18px/22px Poppins,sans-serif;padding-bottom:6px}',
    '.hpco-label{margin-top:28px;color:#cbc4fe;font:600 12px/16px Poppins,sans-serif;letter-spacing:1px;text-transform:uppercase}',
    '.hpco-list{margin:14px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:14px}',
    '.hpco-list li{display:flex;gap:12px;align-items:flex-start}',
    '.hpco-tick{flex:none;width:22px;height:22px;border-radius:50px;background:#ffe757;color:#1f1f1f;display:flex;align-items:center;justify-content:center;font:700 12px/12px Poppins,sans-serif;margin-top:1px}',
    '.hpco-list strong{display:block;font:600 15px/21px Poppins,sans-serif}',
    '.hpco-list small{display:block;color:#bdbdbd;font:400 13px/19px Poppins,sans-serif;margin-top:2px}',
    '.hpco-h{margin:0 0 14px;font:800 22px/26px Cabinetgrotesk,Poppins,sans-serif}',
    '.hpco-or{display:flex;align-items:center;gap:12px;margin:18px 0;color:#bdbdbd;font:500 13px/16px Poppins,sans-serif}',
    '.hpco-or:before,.hpco-or:after{content:"";flex:1;height:1px;background:#3a3a3a}',
    '.hpco-field{margin-bottom:14px}',
    '.hpco-btn{display:block;width:100%;margin-top:22px;padding:18px 24px;border:2px solid #1f1f1f;border-radius:50px;background:#ffe757;color:#1f1f1f;font:800 19px/22px Cabinetgrotesk,Poppins,sans-serif;cursor:pointer;box-shadow:6px 6px 0 #cbc4fe;transition:transform .15s}',
    '.hpco-btn:hover{transform:translate(-1px,-1px)}',
    '.hpco-btn[disabled]{opacity:.65;cursor:wait;transform:none}',
    '.hpco-err{display:none;margin-top:14px;padding:12px 14px;border-radius:12px;background:#fdd0f7;color:#1f1f1f;font:500 14px/20px Poppins,sans-serif}',
    '.hpco-terms{margin-top:18px;padding-top:16px;border-top:1px solid #3a3a3a;color:#bdbdbd;font:400 12.5px/19px Poppins,sans-serif}',
    '.hpco-terms a,.hpco-terms button{color:#cbc4fe;text-decoration:underline;background:none;border:0;padding:0;font:inherit;cursor:pointer}',
    '.hpco-secure{margin-top:10px;text-align:center;color:#8f8f8f;font:400 12px/16px Poppins,sans-serif}',
    '.hpco-loading{min-height:44px;border-radius:12px;background:linear-gradient(90deg,#333 0,#3d3d3d 50%,#333 100%);background-size:200% 100%;animation:hpco-sh 1.2s infinite}',
    '@keyframes hpco-sh{to{background-position:-200% 0}}',
    '.hpco-sheet{position:absolute;inset:0;z-index:5;background:#1f1f1f;display:none;flex-direction:column}',
    '.hpco-sheet.on{display:flex}',
    '.hpco-sheet-top{display:flex;justify-content:space-between;align-items:center;padding:18px 28px;border-bottom:1px solid #3a3a3a;font:800 18px/22px Cabinetgrotesk,Poppins,sans-serif}',
    '.hpco-sheet-top button{background:#ffe757;color:#1f1f1f;border:0;border-radius:50px;padding:8px 16px;font:700 14px/16px Poppins,sans-serif;cursor:pointer}',
    '.hpco-sheet-body{overflow:auto;text-align:left;padding:8px 28px 28px;color:#e6e6e6;font:400 14px/22px Poppins,sans-serif}',
    '.hpco-sheet-body h1{display:none}',
    '.hpco-sheet-body h2{text-align:left;margin:22px 0 6px;color:#fff;font:800 17px/22px Cabinetgrotesk,Poppins,sans-serif}',
    '.hpco-sheet-body ul{padding-left:20px}',
    '.hpco-sheet-body strong{color:#fff}',
    /* demo-only stand-ins for the Stripe fields */
    '.hpco-fake{height:46px;border:1px solid #444;border-radius:12px;background:#30313d;color:#9a9aa5;display:flex;align-items:center;padding:0 14px;font:400 15px/1 Poppins,sans-serif;margin-bottom:12px}',
    '.hpco-fake-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.hpco-fake-lbl{color:#cfcfd6;font:400 13px/18px Poppins,sans-serif;margin-bottom:6px}',
    '.hpco-link{height:46px;border-radius:12px;background:#00d66f;color:#1f1f1f;display:flex;align-items:center;justify-content:center;gap:8px;font:700 16px/1 Poppins,sans-serif;cursor:pointer}',
    '.hpco-apple{margin-top:10px;height:46px;border-radius:12px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font:600 16px/1 -apple-system,Poppins,sans-serif}',
    '@media (max-width:767px){.hpco-sum,.hpco-pay{padding:28px 22px}.hpco-pay{border-left:0;border-top:1px solid #3a3a3a}.hpco-price b{font-size:52px;line-height:50px}}',
  ].join('\n');

  var stripePromise = null;
  function loadStripe() {
    if (stripePromise) return stripePromise;
    stripePromise = new Promise(function (resolve, reject) {
      if (window.Stripe) return resolve(window.Stripe(CFG.publishableKey));
      var s = document.createElement('script');
      s.src = CFG.stripeJs;
      s.onload = function () { window.Stripe ? resolve(window.Stripe(CFG.publishableKey)) : reject(new Error('Stripe.js missing')); };
      s.onerror = function () { reject(new Error('Stripe.js failed to load')); };
      document.head.appendChild(s);
    });
    return stripePromise;
  }

  function fetchClientSecret(source) {
    return fetch(CFG.apiBase + '/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: source, page: location.href.split('#')[0] }),
    }).then(function (r) {
      if (!r.ok) throw new Error('Session request failed');
      return r.json();
    }).then(function (d) {
      if (!d.clientSecret) throw new Error('No client secret');
      return d.clientSecret;
    });
  }

  function track(evt, data) { try { if (typeof fbq === 'function') fbq('track', evt, data || {}); } catch (e) {} }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function summaryHtml() {
    var items = AGREE.map(function (a) {
      return '<li><span class="hpco-tick">✓</span><span><strong>' + a[0] + '</strong><small>' + a[1] + '</small></span></li>';
    }).join('');
    return '<button type="button" class="hpco-back" data-hpco-back>← Back to plan details</button>' +
      '<div class="hpco-badge">Checkout</div>' +
      '<div class="hpco-name">Monthly Partnership</div>' +
      '<div class="hpco-price"><b>$995</b><span>/month</span></div>' +
      '<div class="hpco-label">By paying, you agree to</div>' +
      '<ul class="hpco-list">' + items + '</ul>';
  }

  function payHtml() {
    var demoFields = CFG.demo
      ? '<div class="hpco-link">Pay with <b>link</b></div><div class="hpco-apple">Apple Pay</div>'
      : '<div data-hpco-express><div class="hpco-loading"></div></div>';
    var contact = CFG.demo
      ? '<div class="hpco-fake-lbl">Email</div><div class="hpco-fake">you@yourorg.org</div>'
      : '<div class="hpco-field" data-hpco-contact><div class="hpco-loading"></div></div>';
    var payment = CFG.demo
      ? '<div class="hpco-fake-lbl">Card number</div><div class="hpco-fake">1234 1234 1234 1234</div>' +
        '<div class="hpco-fake-row"><div><div class="hpco-fake-lbl">Expiration</div><div class="hpco-fake">MM / YY</div></div>' +
        '<div><div class="hpco-fake-lbl">CVC</div><div class="hpco-fake">CVC</div></div></div>'
      : '<div class="hpco-field" data-hpco-payment><div class="hpco-loading" style="min-height:150px"></div></div>';
    return '<h3 class="hpco-h">Start your partnership</h3>' +
      demoFields +
      '<div class="hpco-or">or pay with card</div>' +
      contact + payment +
      '<button type="button" class="hpco-btn" data-hpco-pay>Start for $995/month →</button>' +
      '<div class="hpco-err" role="alert" data-hpco-err></div>' +
      '<div class="hpco-terms">By clicking Start, you agree to the <button type="button" data-hpco-terms>Monthly Partnership Terms of Service</button>. ' +
      'You\u2019ll be charged $995 today and on the same date each month until you cancel. Cancel anytime in your <a href="' + CFG.portalUrl + '" target="_blank" rel="noopener">billing dashboard</a>.</div>' +
      '<div class="hpco-secure">🔒 Payments secured by Stripe. We never see your card number.</div>';
  }

  function sheetHtml() {
    var body = TERMS_HTML || ('<p>Read the full terms at <a href="' + CFG.termsUrl + '" target="_blank" rel="noopener">' + CFG.termsUrl + '</a>.</p>');
    return '<div class="hpco-sheet-top"><span>Monthly Partnership Terms</span><button type="button" data-hpco-sheet-close>Done</button></div>' +
      '<div class="hpco-sheet-body">' + body + '</div>';
  }

  function goFallback() { window.location.href = CFG.fallbackUrl; }

  function open(card, source) {
    if (card.querySelector('.hpco')) { card.classList.add('hpco-open'); return; }
    track('InitiateCheckout', { value: 995, currency: 'USD', content_name: 'Monthly Partnership' });

    var root = el('div', 'hpco');
    var sum = el('div', 'hpco-sum', summaryHtml());
    var pay = el('div', 'hpco-pay', payHtml());
    var sheet = el('div', 'hpco-sheet', sheetHtml());
    root.appendChild(sum);
    root.appendChild(pay);
    card.appendChild(root);
    card.appendChild(sheet);
    card.classList.add('hpco-open');
    var top = card.getBoundingClientRect().top + window.pageYOffset - 24;
    if (Math.abs(window.pageYOffset - top) > 80) window.scrollTo({ top: top, behavior: 'smooth' });

    var payBtn = pay.querySelector('[data-hpco-pay]');
    var errBox = pay.querySelector('[data-hpco-err]');
    function showError(msg) { errBox.textContent = msg; errBox.style.display = msg ? 'block' : 'none'; }
    function busy(on) { payBtn.disabled = on; payBtn.textContent = on ? 'Processing…' : 'Start for $995/month →'; }

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-hpco-back]')) { e.preventDefault(); card.classList.remove('hpco-open'); }
      if (e.target.closest('[data-hpco-terms]')) { e.preventDefault(); sheet.classList.add('on'); sheet.querySelector('.hpco-sheet-body').scrollTop = 0; if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: 'smooth' }); }
    });
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-hpco-sheet-close]')) { e.preventDefault(); sheet.classList.remove('on'); }
    });

    if (CFG.demo) {
      payBtn.addEventListener('click', function () {
        busy(true);
        setTimeout(function () { busy(false); showError('Preview only: a real payment would now take the buyer to onboarding.happyproductions.video.'); }, 900);
      });
      return;
    }

    var secret = fetchClientSecret(source);
    Promise.all([loadStripe(), secret]).then(function (res) {
      var stripe = res[0];
      var init = stripe.initCheckoutElementsSdk || stripe.initCheckout;
      var checkout = init.call(stripe, {
        clientSecret: secret,
        elementsOptions: {
          fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap' }],
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#ffe757',
              colorBackground: '#30313d',
              colorText: '#ffffff',
              colorDanger: '#fdd0f7',
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '12px',
            },
          },
        },
      });
      var actionsPromise = checkout.loadActions();

      var expressBox = pay.querySelector('[data-hpco-express]');
      var express = checkout.createExpressCheckoutElement({
        buttonHeight: 46,
        buttonType: { applePay: 'subscribe', googlePay: 'subscribe' },
      });
      express.on('ready', function (ev) {
        var any = ev && ev.availablePaymentMethods && Object.keys(ev.availablePaymentMethods).some(function (k) { return ev.availablePaymentMethods[k]; });
        if (!any) { expressBox.style.display = 'none'; pay.querySelector('.hpco-or').style.display = 'none'; }
      });
      express.on('confirm', function (ev) {
        showError('');
        actionsPromise.then(function (r) {
          return r.actions.confirm({ expressCheckoutConfirmEvent: ev });
        }).then(function (out) {
          if (out && out.type === 'error') showError(out.error.message);
        });
      });
      expressBox.innerHTML = '';
      express.mount(expressBox);

      var contactBox = pay.querySelector('[data-hpco-contact]');
      contactBox.innerHTML = '';
      if (checkout.createContactDetailsElement) {
        checkout.createContactDetailsElement().mount(contactBox);
      } else {
        // Older Stripe.js: collect the email ourselves.
        contactBox.innerHTML = '<input type="email" autocomplete="email" placeholder="Email" data-hpco-email style="width:100%;height:46px;border-radius:12px;border:1px solid #444;background:#30313d;color:#fff;padding:0 14px;font:400 15px Poppins,sans-serif">';
      }

      var paymentBox = pay.querySelector('[data-hpco-payment]');
      paymentBox.innerHTML = '';
      checkout.createPaymentElement({ layout: 'tabs' }).mount(paymentBox);

      payBtn.addEventListener('click', function () {
        showError('');
        busy(true);
        actionsPromise.then(function (r) {
          if (r.type === 'error') throw r.error;
          var emailInput = pay.querySelector('[data-hpco-email]');
          return r.actions.confirm(emailInput ? { email: emailInput.value.trim() } : undefined);
        }).then(function (out) {
          // On success Stripe redirects to onboarding; we only get here on an error.
          if (out && out.type === 'error') { showError(out.error.message); busy(false); }
        }).catch(function (err) {
          showError((err && err.message) || 'Something went wrong. Please try again.');
          busy(false);
        });
      });
    }).catch(function () {
      // Never strand a buyer: fall back to the Stripe-hosted page.
      goFallback();
    });
  }

  function boot() {
    var style = el('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest(CFG.triggerSelector);
      if (!trigger) return;
      var card = trigger.closest(CFG.cardSelector);
      if (!card) return;
      e.preventDefault();
      open(card, (card.className.match(/\b(ps|pr)-card\S*/) || ['card'])[0]);
    });

    // Warm up Stripe.js when the buyer heads for the button.
    if (!CFG.demo) {
      document.addEventListener('pointerover', function (e) {
        if (e.target.closest && e.target.closest(CFG.triggerSelector)) loadStripe().catch(function () {});
      }, { passive: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
