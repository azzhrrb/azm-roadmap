const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "src");
const en = require(DIR + "/en.json").roadmap;
const ar = require(DIR + "/ar.json").roadmap;

// items.ts is a plain data literal apart from its type import and annotation.
const ts = fs.readFileSync(DIR + "/items.ts", "utf8");
const body = ts
  .split("\n")
  .filter((line) => !line.startsWith("import "))
  .join("\n")
  .replace(/export const items\s*:\s*RoadmapItem\[\]\s*=/, "module.exports =");
const mod = { exports: {} };
new Function("module", body)(mod);
const raw = mod.exports;

const HORIZONS = ["now", "next", "later", "parked"];
const THEMES = ["start", "loop", "back", "progress", "coach", "data"];
const SEGMENTS = ["lifestyle", "coached", "coach", "advanced"];
const KINDS = ["feature", "fix", "polish", "content", "infra", "research"];
const PLATFORMS = ["ios", "web", "dashboard", "api", "data"];
const EFFORTS = ["s", "m", "l"];
const EVIDENCE = ["production", "demand", "prd", "device", "policy"];

const pair = (key) => {
  if (en[key] === undefined) throw new Error("missing en copy: " + key);
  if (ar[key] === undefined) throw new Error("missing ar copy: " + key);
  return { en: en[key], ar: ar[key] };
};
// The id is the short value items carry; the locale key is what holds its copy.
const facet = (id, labelKey, blurbKey) =>
  blurbKey
    ? { id, label: pair(labelKey), blurb: pair(blurbKey) }
    : { id, label: pair(labelKey) };

const items = raw.map((it) => {
  const copy = en.items[it.id];
  if (!copy) throw new Error("missing en item copy: " + it.id);
  const out = {
    id: it.id,
    horizon: it.horizon,
    theme: it.theme,
    segments: it.segments,
    kind: it.kind,
    platforms: it.platforms,
    effort: it.effort,
    evidence: it.evidence,
    source: it.source,
    en: { title: copy.title, why: copy.why },
    ar: { title: ar.items[it.id].title, why: ar.items[it.id].why },
  };
  if (it.phase) out.phase = it.phase;
  if (copy.parked) {
    out.parked = true;
    out.en.parked = copy.parked;
    out.ar.parked = ar.items[it.id].parked;
  }
  return out;
});

const sources = {};
for (const key of Object.keys(en)) {
  if (!key.startsWith("source_")) continue;
  sources[key] = { en: en[key], ar: ar[key] };
}

const ui = { en: {}, ar: {} };
for (const key of Object.keys(en)) {
  if (key === "items" || key.startsWith("source_")) continue;
  // `description` was the subtitle under the title; the board no longer renders it.
  if (key === "description") continue;
  if (!ar[key]) continue;
  ui.en[key] = en[key];
  ui.ar[key] = ar[key];
}

// Rule 5 points at the real source of truth: the items file this board is built from.
ui.en.rule_5 =
  "Order is decided in the repo, not on the screen. Edit src/items.ts and rebuild — the first item in a column is the next one to pick up.";
ui.ar.rule_5 =
  "الترتيب يُحدَّد في المستودع لا على الشاشة. عدّل ⁦src/items.ts⁩ ثم أعد البناء — والعنصر الأول في كل عمود هو التالي.";

// The list view became a full table, and the board gained moving plus a few new labels.
delete ui.en.view_list;
delete ui.ar.view_list;
Object.assign(ui.en, {
  view_table: "Table",
  column_kind: "Kind",
  column_phase: "Phase",
  column_source: "Source",
  drag_hint: "Drag a card to move it, or click it to pick a column.",
  reset_order: "Reset order",
  move_to: "Move",
  move_cancel: "Cancel",
  parked_no_reason: "No reason recorded yet.",
});
Object.assign(ui.ar, {
  view_table: "الجدول",
  column_kind: "النوع",
  column_phase: "المرحلة",
  column_source: "المرجع",
  drag_hint: "اسحب البطاقة لنقلها، أو انقر عليها لاختيار العمود.",
  reset_order: "إعادة الترتيب الأصلي",
  move_to: "نقل",
  move_cancel: "إلغاء",
  parked_no_reason: "لا يوجد سبب مسجَّل بعد.",
});

const DATA = {
  horizons: HORIZONS.map((id) => facet(id, "horizon_" + id, "horizon_" + id + "_blurb")),
  facets: {
    themes: THEMES.map((id) => facet(id, "theme_" + id, "theme_" + id + "_blurb")),
    segments: SEGMENTS.map((id) => facet(id, "segment_" + id, "segment_" + id + "_blurb")),
    kinds: KINDS.map((id) => facet(id, "kind_" + id)),
    platforms: PLATFORMS.map((id) => facet(id, "platform_" + id)),
    efforts: EFFORTS.map((id) => facet(id, "effort_" + id, "effort_" + id + "_blurb")),
    evidence: EVIDENCE.map((id) => facet(id, "evidence_" + id, "evidence_" + id + "_blurb")),
  },
  sources,
  ui,
  items,
};

const shell = fs.readFileSync(path.join(__dirname, "shell.html"), "utf8");
const count = shell.split("/*__DATA__*/").length - 1;
if (count !== 1) throw new Error("expected one placeholder, found " + count);
const out = shell.replace("/*__DATA__*/", "var DATA = " + JSON.stringify(DATA) + ";");

const target = process.argv[2] || path.join(__dirname, "index.html");
fs.writeFileSync(target, out);
console.log("wrote " + target + " (" + out.length + " bytes)");
console.log("items " + items.length + " | parked " + items.filter((i) => i.parked).length);
for (const h of HORIZONS) console.log("  " + h + ": " + items.filter((i) => i.horizon === h).length);
