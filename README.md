# AZM product roadmap

Live board: https://azzhrrb.github.io/azm-roadmap/

This is a product discussion surface, not app code. It ships nothing to Azzambfit.

## Editing

Edit the source, rebuild, commit. GitHub Pages redeploys `index.html` within a minute.

```bash
node build.js     # writes index.html from shell.html + src/
node export.js    # writes roadmap.md and roadmap.csv from index.html
```

What to touch:

- `src/items.ts` — every item, its horizon, theme, tags and source. Order inside a
  horizon is the priority: the first item in a column is the next one to pick up.
- `src/en.json` and `src/ar.json` — titles and the "why" line for each item, keyed by
  the same id, plus facet labels and button copy. `build.js` fails on a missing key in
  either language, so the two files cannot drift apart silently.
- `shell.html` — the page itself: layout, styles, board and table rendering, drag and
  drop. It carries one `/*__DATA__*/` placeholder that `build.js` fills in.

Adding an item means adding an entry in `items.ts` and a matching copy block in both
locale files. Facet values are validated against the fixed lists at the top of
`build.js`, so a typo like `theme: "looop"` fails the build rather than rendering a
blank tag.

## How the board works

Horizons are Now, Next, Later and Parked. Themes group the work by the part of the
client journey it serves. Every item carries a segment, kind, platform, effort and an
evidence tag, and the lifestyle lens is on by default: it hides advanced and
heavy-user scope so that scope cannot quietly become the plan.

Cards can be dragged between columns, or clicked to pick a column from the move bar.
That arrangement is saved per browser, not back into the file — it is for thinking out
loud. When an order is right, change `items.ts` and rebuild so everyone sees it.

## Sharing

`roadmap.md` pastes into Slack, a canvas or a doc as a table. `roadmap.csv` opens in
Sheets. Both are generated, so regenerate them instead of editing them by hand.

The repository is public, so the board is readable by anyone with the URL. The page
carries `noindex,nofollow` to stay out of search results, but that is not access
control. Keep anything genuinely confidential out of this repo.
