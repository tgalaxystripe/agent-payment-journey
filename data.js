/* Journey + aggregate data extracted from the payability A/B harness.
   Source: 85 paired agent-checkout runs, 2026-09-10 → 2026-09-14, 13 merchants.
   Buyer PII, order numbers, spend-request IDs and card digits are redacted. */

const STATS = {
  runs: 85,
  merchants: 13,
  dateRange: "Sep 10–14, 2026",
  models: ["claude-sonnet-5", "claude-fable-5-1"],

  // All runs, per arm
  arms: {
    without: { n: 46, success: 31, successPct: 67.4, firstAttemptPct: 63.0, abandoned: 9, medActiveS: 448, medToolCalls: 104 },
    with:    { n: 34, success: 28, successPct: 82.4, firstAttemptPct: 76.5, abandoned: 0, medActiveS: 382, medToolCalls: 93 },
  },

  // Same task, both arms — the more rigorous read
  paired: { n: 28, withoutOk: 20, withOk: 24, withoutPct: 71.4, withPct: 85.7, fixed: 5, regressed: 1, bothOk: 19, bothFail: 3 },

  failureClasses: [
    { label: "Completed the purchase",        without: 31, with: 28, good: true },
    { label: "Gave up / ran out of time",     without: 9,  with: 0 },
    { label: "Merchant blocked the checkout", without: 4,  with: 2 },
    { label: "Merchant site or test glitch",  without: 1,  with: 3 },
    { label: "Human challenge not completed", without: 1,  with: 1 },
  ],
};

/* Each journey: the same purchase task run twice — once with no merchant advice
   in the prompt, once with it. `kind` drives the visual treatment of each step. */
const JOURNEYS = [
  {
    id: "ebay",
    merchant: "eBay",
    item: "Energizer MAX AAA batteries, 8-pack",
    price: "$8.50",
    cap: "$12.00",
    headline: "Both agents hit the same sign-in wall. Only one knew there was a door.",
    without: {
      outcome: "fail",
      verdict: "Abandoned eBay for a different store",
      toolCalls: 26,
      activeS: 109,
      steps: [
        { t: 0,   kind: "step", label: "Start",            detail: "Buy one 8-pack via Buy It Now, pay with the agent wallet, stay under $12.00." },
        { t: 9,   kind: "step", label: "Item page",        detail: "Loaded the listing." },
        { t: 12,  kind: "step", label: "Item chosen",      detail: "Fixed-price listing, qty 1, $8.50 each, free shipping — under the cap." },
        { t: 44,  kind: "wall", label: "Sign-in wall",     detail: "Buy It Now redirects to the eBay sign-in page. No guest checkout offered anywhere on it." },
        { t: 88,  kind: "dead", label: "Declared blocked", detail: "“Completing this purchase would require signing in or creating an account, both of which I'm not permitted to do.”" },
        { t: 103, kind: "dead", label: "Switched merchant", detail: "Searched Google, then headed to Target.com for an equivalent 8-pack at ~$6.49." },
        { t: 109, kind: "end-fail", label: "Run stopped",  detail: "Stopped at the merchant switch. No payment attempted. Scored a failure for eBay." },
      ],
    },
    with: {
      outcome: "success",
      verdict: "Order confirmed — $9.25",
      toolCalls: 76,
      activeS: 286,
      steps: [
        { t: 0,   kind: "step", label: "Start",             detail: "Same task, plus one paragraph of eBay-specific advice in the prompt." },
        { t: 24,  kind: "step", label: "Item page",         detail: "Loaded the listing: $8.50 each, seller ValleyMed." },
        { t: 44,  kind: "wall", label: "Same sign-in wall", detail: "Buy It Now redirects to the sign-in page — exactly as the advice predicted. Pulls the guest-checkout URL out of the page's own gchru parameter." },
        { t: 59,  kind: "win",  label: "Guest checkout",    detail: "Reached guest checkout directly. Total $9.25 ($8.50 + $0.75 tax), under the cap." },
        { t: 90,  kind: "step", label: "Shipping",          detail: "Address confirmed (buyer persona, Brooklyn NY). Prefilled city and ZIP had to be overwritten — the advice warned that typing appends." },
        { t: 128, kind: "step", label: "Payment requested", detail: "Created a wallet spend request for $9.25, pending human approval." },
        { t: 128, kind: "wait", label: "Waiting on human",  detail: "9 min 45 s until the spend request was approved in the wallet app.", waitUntil: 713 },
        { t: 713, kind: "step", label: "Approved",          detail: "Spend request approved. Card issued." },
        { t: 818, kind: "step", label: "Payment submitted", detail: "Confirm and pay, total $9.25, Visa ••••." },
        { t: 837, kind: "end-ok", label: "Order confirmed", detail: "“Order confirmed, thanks!” Order #16-•••••-•••, total $9.25, shipping to Brooklyn NY." },
      ],
    },
    confidence: "high",
    advice: [
      { tag: "Preflight", text: "“Pay with” has no wallet or agent-steering option, so create the card spend request once “Add new card” is selectable; if methods are “not available to guest users”, stop and report." },
      { tag: "Fast path", decisive: true, text: "Guest checkout needs no sign-in: open pay.ebay.com/rgxo?action=create&rypsvc=true&pagename=ryp&item=<id>&rev=20&quantity=<qty>&transactionid=-1&gch=1 with the /itm/ number; if “Review order” does not load, signed-out “Buy It Now” redirects to signin.ebay.com, whose gchru parameter holds that URL." },
      { tag: "Fast path", text: "eBay prefills “Ship to” city, state and ZIP and the card name fields, so typing appends; set them directly, and avoid Escape in “Edit your billing address” fields, which closes the card form." },
      { tag: "Recovery", text: "If “Buy It Now” does nothing, click #binBtn_btn_1 by script; on the Allstate “Additional service” modal keep “No, thanks” and click “Proceed”." },
      { tag: "Success", text: "After “Confirm and pay”, “Just a moment! We're confirming your order” lasts ~10 s, then the success page shows “Order confirmed, thanks!” with an order number beneath a QR modal to close." },
    ],
  },

  {
    id: "westelm",
    merchant: "West Elm",
    item: "Signature Wax pillar candle, ivory 3″",
    price: "$7.00",
    cap: "$25.00",
    headline: "A dirty cart cost the unadvised agent twelve minutes and the whole run.",
    without: {
      outcome: "fail",
      verdict: "Killed at the working-time limit",
      toolCalls: 69,
      activeS: 1212,
      steps: [
        { t: 0,   kind: "step", label: "Start",         detail: "Buy one ivory 3″ pillar candle, qty 1." },
        { t: 19,  kind: "step", label: "Product page",  detail: "Loaded the product page." },
        { t: 723, kind: "wall", label: "Dirty cart",    detail: "After twelve minutes: “Cart unexpectedly contains a pre-existing Dogs Pot Holder ($16) plus our candle; must remove the extra item before checkout.”" },
        { t: 1212, kind: "end-fail", label: "Run killed", detail: "Never reached checkout. Killed after 1,212 s of agent working time against a 900 s limit." },
      ],
    },
    with: {
      outcome: "success",
      verdict: "Order confirmed — $7.63",
      toolCalls: 74,
      activeS: 290,
      steps: [
        { t: 0,   kind: "step", label: "Start",             detail: "Same task, with West Elm advice in the prompt." },
        { t: 12,  kind: "step", label: "Product page",      detail: "Loaded the product page." },
        { t: 31,  kind: "step", label: "Options chosen",    detail: "Selected ivory, 3″×3″." },
        { t: 56,  kind: "win",  label: "Cart cleaned",      detail: "Found the same stray line item and removed it. Cart holds exactly one candle, subtotal $7 — 12 minutes faster than the unadvised run." },
        { t: 67,  kind: "step", label: "Guest checkout",    detail: "Reached the sign-in step and took the guest path." },
        { t: 90,  kind: "step", label: "Shipping",          detail: "Address confirmed, advanced to delivery." },
        { t: 100, kind: "step", label: "Payment page",      detail: "Delivery estimate Sep 16–18." },
        { t: 112, kind: "step", label: "Payment requested", detail: "Created a wallet spend request for $7.63." },
        { t: 112, kind: "wait", label: "Waiting on human",  detail: "18 s until approval.", waitUntil: 130 },
        { t: 130, kind: "step", label: "Approved",          detail: "Spend request approved." },
        { t: 282, kind: "step", label: "Payment submitted", detail: "Place Order, card ••••, total $7.63." },
        { t: 293, kind: "end-ok", label: "Order confirmed", detail: "“Your Order Is All Set!” Order #3625••••••. Declined rewards, texts, card offer and the account prompt. No account created." },
      ],
    },
    confidence: "low",
    advice: [
      { tag: "Fast path", decisive: true, text: "Product pages are /products/<product>/; select every required option (color, size, configuration) explicitly, then confirm quantity and cart price before checkout." },
      { tag: "Fast path", text: "Checkout runs /checkout/app/shipping.html, then delivery.html, then payment.html; enter recipient, address and phone first, then choose the delivery option and note its estimated window." },
      { tag: "Credential", text: "On payment.html, verify subtotal, shipping, tax and total, then enter the card and receipt email; billing need not match shipping, so use the card's own billing details." },
      { tag: "Preflight", text: "The payment page offers optional rewards enrollment and text notifications; leave them off unless the task asks for them." },
      { tag: "Success", text: "/checkout/thanks.html shows “Your Order Is All Set!” with the item, configuration, total and delivery estimate." },
    ],
  },

  {
    id: "quince",
    merchant: "Quince",
    item: "Cashmere comb, natural wood",
    price: "$10.00",
    cap: "$25.00",
    headline: "Same purchase, same approval. One agent burned its entire time budget getting there.",
    without: {
      outcome: "fail",
      verdict: "Killed at the working-time limit",
      toolCalls: 66,
      activeS: 1136,
      steps: [
        { t: 0,   kind: "step", label: "Start",             detail: "Buy one cashmere comb, budget $25." },
        { t: 18,  kind: "step", label: "Product page",      detail: "Loaded the product page." },
        { t: 29,  kind: "step", label: "Added to bag",      detail: "Cashmere comb, natural wood, qty 1, $10.00." },
        { t: 36,  kind: "step", label: "Guest checkout",    detail: "Checkout loaded as guest, total $10.00." },
        { t: 92,  kind: "step", label: "Shipping",          detail: "Address entered, free standard shipping, total $10.89 with tax." },
        { t: 219, kind: "step", label: "Payment method",    detail: "Card selected on the merchant checkout — 127 s after shipping." },
        { t: 233, kind: "step", label: "Payment requested", detail: "Created a wallet spend request for $10.89." },
        { t: 233, kind: "wait", label: "Waiting on human",  detail: "10 min 41 s until approval.", waitUntil: 874 },
        { t: 874, kind: "step", label: "Approved",          detail: "Spend request approved, Visa ••••." },
        { t: 1136, kind: "end-fail", label: "Run killed",   detail: "Held a live approved card and never submitted the order. Killed after 1,136 s of agent working time against a 900 s limit." },
      ],
    },
    with: {
      outcome: "success",
      verdict: "Order confirmed — $10.89",
      toolCalls: 51,
      activeS: 339,
      steps: [
        { t: 0,   kind: "step", label: "Start",             detail: "Same task, with Quince advice in the prompt." },
        { t: 21,  kind: "step", label: "Product page",      detail: "Loaded the product page." },
        { t: 102, kind: "win",  label: "Cart ready",        detail: "One comb, $10.00, free shipping. Dismissed a “$40 off” overlay whose close button was dead, without signing up for anything." },
        { t: 109, kind: "step", label: "Shipping",          detail: "Delivery details autofilled." },
        { t: 120, kind: "step", label: "Payment requested", detail: "Created a wallet spend request for $10.89 — 113 s earlier in the run than the unadvised agent." },
        { t: 120, kind: "wait", label: "Waiting on human",  detail: "11 s until approval.", waitUntil: 131 },
        { t: 131, kind: "step", label: "Approved",          detail: "Spend request approved." },
        { t: 139, kind: "step", label: "Card retrieved",    detail: "Wallet virtual card retrieved, valid 12 h." },
        { t: 268, kind: "step", label: "Payment submitted", detail: "Place your order, total $10.89." },
        { t: 343, kind: "end-ok", label: "Order confirmed", detail: "Order #454•••••8, total $10.89. No account created." },
      ],
    },
    confidence: "medium",
    advice: [
      { tag: "Preflight", decisive: true, text: "Approval should land inside “Your order is reserved for 10:00 minutes” (an 11-minute wait lost a run), so create the spend request as soon as the “PAYMENT” section shows the total with tax." },
      { tag: "Handoff", text: "Ignore the hidden hCaptcha frame, but a visible hCaptcha after “PLACE YOUR ORDER” (once, not cleared in 30 seconds) needs the human at once, with no second click." },
      { tag: "Fast path", text: "Remove the “$40 OFF YOUR ORDER” overlay element if its X fails; typing can misfire in Phone and after the “Is the apartment/suite number missing?” panel, so set values directly and re-check them." },
      { tag: "Fast path", text: "Stripe Payment Element expiry and CVC fields ignore clicks; move focus with Tab from the card number field." },
      { tag: "Recovery", text: "“ACCEPT CHANGES” after “PLACE YOUR ORDER” means no order was placed: accept and click again; else use the sticky bottom button only if no “Your payment is currently being processed” or order number appeared." },
      { tag: "Success", text: "After “Your payment is currently being processed” (~8 s), /checkout/thank-you/ shows “THANK YOU” with an Order #; if the homepage loads instead (seen once), check /checkout/thank-you/ before any retry." },
    ],
  },
];
