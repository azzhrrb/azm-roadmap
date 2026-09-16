const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "index.html");
const OUT = path.join(__dirname, "roadmap");

const html = fs.readFileSync(FILE, "utf8");
const DATA = JSON.parse(html.match(/var DATA = (\{[\s\S]*?\});\n/)[1]);

const label = (dim, id) => {
  const hit = (DATA.facets[dim] || []).find((x) => x.id === id);
  return hit ? hit.label.en : id;
};
const horizon = (id) => DATA.horizons.find((h) => h.id === id).label.en;
const source = (it) => {
  const s = DATA.sources[it.source.key];
  if (!s) return it.source.key;
  return it.source.votes != null ? s.en.replace("{{votes, display}}", it.source.votes) : s.en;
};
// Same column order and same column order logic as the on-page table.
const COLS = [
  "Item",
  "Horizon",
  "Theme",
  "Kind",
  "Segments",
  "Platforms",
  "Effort",
  "Evidence",
  "Phase",
  "Source",
];

const cells = (it) => [
  it.en.title,
  horizon(it.horizon),
  label("themes", it.theme),
  label("kinds", it.kind),
  it.segments.map((s) => label("segments", s)).join(", "),
  it.platforms.map((p) => label("platforms", p)).join(", "),
  label("efforts", it.effort),
  label("evidence", it.evidence),
  it.phase || "",
  source(it),
];

const escape = (v) => String(v).replace(/\|/g, "\\|").replace(/\n/g, " ");

// Markdown table: renders in a Slack canvas, a PR body, or any markdown viewer.
const md = [
  "# Azzambfit roadmap",
  "",
  "What we build next for lifestyle clients, ordered by what a normal person needs to keep going.",
  "",
  "## Rules of this board",
  "",
  ...[1, 2, 3, 4, 5].map((n) => `${n}. ${DATA.ui.en["rule_" + n]}`),
  "",
];
for (const h of DATA.horizons) {
  const rows = DATA.items.filter((it) => it.horizon === h.id);
  md.push(`## ${h.label.en} (${rows.length})`, "", `_${h.blurb.en}_`, "");
  md.push(`| ${COLS.join(" | ")} |`, `| ${COLS.map(() => "---").join(" | ")} |`);
  for (const it of rows) md.push(`| ${cells(it).map(escape).join(" | ")} |`);
  md.push("");
  if (h.id === "parked") {
    md.push("Parked reasons:", "");
    for (const it of rows) md.push(`- **${it.en.title}** — ${it.en.parked}`);
    md.push("");
  }
}
fs.writeFileSync(OUT + ".md", md.join("\n"));

// CSV for anything that wants a real grid.
const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [COLS.map(csvCell).join(",")];
for (const h of DATA.horizons) {
  for (const it of DATA.items.filter((x) => x.horizon === h.id)) {
    csv.push(cells(it).map(csvCell).join(","));
  }
}
fs.writeFileSync(OUT + ".csv", csv.join("\n") + "\n");

console.log("wrote " + OUT + ".md and .csv");
console.log("rows " + DATA.items.length);
