# An agent's payment journey, with and without advice

A single-page demo comparing what an AI shopping agent does at checkout **with** and
**without** a short merchant-specific playbook in its prompt.

Live: <https://tgalaxystripe.github.io/agent-payment-journey/>

## What it shows

Three real purchase tasks, each executed twice — same model, same browser, same
budget, same permissions. The only difference is one extra paragraph of
merchant-specific checkout advice in the prompt.

| Journey | Without advice | With advice |
|---|---|---|
| eBay — AAA batteries | Hit the sign-in wall, declared itself blocked, left for Target | Recognised the same wall, took the guest-checkout path the advice named, order confirmed |
| West Elm — pillar candle | Took 12 minutes to notice a stray item already in the cart, killed at the time limit | Cleaned the cart in 56 s, order confirmed |
| Quince — cashmere comb | Held a live approved card and never submitted, killed at the time limit | Requested approval 113 s earlier in the run, order confirmed |

Aggregate across all 85 runs, and across the 28 tasks that ran both ways, is in
the "All runs" section, along with the method and its caveats.

## Files

- `index.html` — the whole page: markup, styles, and rendering. No dependencies, no build.
- `data.js` — the journey steps and aggregate numbers, extracted from the run records.

## Running locally

```sh
python3 -m http.server 8899   # then open http://localhost:8899
```

Opening `index.html` directly from the filesystem also works.

## Data handling

Everything on the page comes from real runs against live merchant sites
(Sep 10–14, 2026). Before publishing:

- Buyer name, street address, phone and email are replaced with a generic persona.
- Merchant order numbers and spend-request IDs are masked; card digits are dropped.
- The wallet product's internal name is replaced with "wallet" throughout,
  including inside the quoted playbook text.

Nothing else in the quoted advice or the agents' milestone notes is reworded.
