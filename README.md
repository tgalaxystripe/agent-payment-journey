# An agent's payment journey, with and without advice

Two pages, linked by a nav in the header.

**The journey** — what an AI shopping agent does at checkout **with** and **without** a short
merchant-specific playbook in its prompt.
Live: <https://tgalaxystripe.github.io/agent-payment-journey/>

**The directory** — where that playbook comes from: one lookup on a merchant URL, four capability
slots in the answer, and what each one is for. The journey page is the evidence behind the single
slot that is populated today.
Live: <https://tgalaxystripe.github.io/agent-payment-journey/directory.html>

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

- `index.html` — the journey page: markup, styles, and rendering. No dependencies, no build.
- `data.js` — the journey steps and aggregate numbers, extracted from the run records.
- `directory.html` — the directory page. Also standalone; its token block is a copy of
  `index.html`'s rather than a shared file, so the two need keeping in sync by hand.
- `og.html` → `og.png`, `og-directory.html` → `og-directory.png` — sources and outputs for the two
  social share cards. Re-render by opening the source at a 1200×630 viewport and screenshotting
  `#card`; the PNGs are committed because Twitter and Slack fetch them by absolute URL.

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

The three diagrams in "How advice works" are drawings, not screenshots — no capture of a live
merchant page is published, and every number in them comes from the run timestamps. The figure
comments in `index.html` record which timestamp each mark is placed from.

On the directory page: the four slot names are the real keys in the response contract, but the
request path and internal product acronyms are left out, and no merchant is named in the coverage
numbers. Counts were read from the live advice store on 2026-09-17 — `store.py --coverage` and
`--health` for coverage and origins, the 537 per-merchant records for confidence and stability.
Note that `inspect_api/README.txt` in the harness is stale on both (it still says 475/614 and
"none are high"); the live store is the source used here.
