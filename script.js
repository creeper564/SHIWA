"use strict";

/* =====================================================================
   CONFIG — les réglages du site sont ici
   ===================================================================== */
const CONFIG = {
  // Code d'invitation Discord (lu automatiquement depuis le bouton "Rejoindre").
  // Mets-le ici seulement si tu veux le forcer. L'invitation doit être permanente.
  inviteCode: "",
  refreshMs: 60000, // fréquence de mise à jour du compteur
  fallback: { members: null, online: null }, // ex: { members: 120, online: 14 } si l'API échoue
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem("shiwa:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("shiwa:" + k, JSON.stringify(v)); } catch {} },
};

/* ---------- Menu mobile ---------- */
const menuToggle = $("#menu-toggle");
const navLinks = $("#nav-links");
function closeMenu() {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
  menuToggle.textContent = "☰";
}
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  menuToggle.textContent = isOpen ? "✕" : "☰";
});
$$("a", navLinks).forEach((l) => l.addEventListener("click", closeMenu));

/* ---------- Toast ---------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg, ms = 3200) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

/* ---------- Thème clair / sombre / auto ---------- */
const mq = matchMedia("(prefers-color-scheme: dark)");
function applyTheme(choice) {
  const dark = choice === "dark" || (choice === "auto" && mq.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#141120" : "#d9f6f0";
  $$("[data-theme-choice]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === choice)));
}
let themeChoice = store.get("theme", "auto");
applyTheme(themeChoice);
$$("[data-theme-choice]").forEach((b) =>
  b.addEventListener("click", () => { themeChoice = b.dataset.themeChoice; store.set("theme", themeChoice); applyTheme(themeChoice); })
);
mq.addEventListener("change", () => themeChoice === "auto" && applyTheme("auto"));

/* ---------- Engrenage / panneau de réglages ---------- */
const gear = $("#gear-btn");
const panel = $("#settings");
function setPanel(open) {
  panel.hidden = !open;
  gear.setAttribute("aria-expanded", String(open));
  gear.setAttribute("aria-label", open ? "Fermer les réglages" : "Ouvrir les réglages");
}
gear.addEventListener("click", () => setPanel(panel.hidden));
document.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && (setPanel(false), gear.focus()));
document.addEventListener("click", (e) => { if (!panel.hidden && !panel.contains(e.target) && !gear.contains(e.target)) setPanel(false); });

/* ---------- Pétales de sakura ---------- */
const canvas = $("#petals");
const ctx = canvas.getContext("2d");
let W = 0, H = 0, petals = [];
let petalsOn = store.get("petals", true) && !reduceMotion;
const AMBIENT = 16;

function sizeCanvas() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
function makePetal(extra = false) {
  return {
    x: Math.random() * W, y: extra ? -20 - Math.random() * H * 0.6 : Math.random() * H,
    s: 5 + Math.random() * 7, vy: 0.5 + Math.random() * 0.9, vx: -0.3 + Math.random() * 0.6,
    r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04, p: Math.random() * 6.28, extra,
  };
}
function burst(n = 120) { for (let i = 0; i < n; i++) petals.push(makePetal(true)); }
function tick() {
  ctx.clearRect(0, 0, W, H);
  const dark = document.documentElement.dataset.theme === "dark";
  ctx.fillStyle = dark ? "rgba(243,179,210,.5)" : "rgba(237,159,196,.6)";
  const ambient = petals.filter((p) => !p.extra).length;
  if (petalsOn && ambient < AMBIENT) petals.push(makePetal());
  petals = petals.filter((p) => (p.extra || petalsOn) && p.y < H + 30);
  for (const p of petals) {
    p.p += 0.02; p.x += p.vx + Math.sin(p.p) * 0.5; p.y += p.vy; p.r += p.vr;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.28); ctx.fill();
    ctx.restore();
  }
  requestAnimationFrame(tick);
}
sizeCanvas();
addEventListener("resize", sizeCanvas);
const petalsSwitch = $("#petals-switch");
petalsSwitch.setAttribute("aria-checked", String(petalsOn));
petalsSwitch.addEventListener("click", () => {
  petalsOn = petalsSwitch.getAttribute("aria-checked") !== "true";
  petalsSwitch.setAttribute("aria-checked", String(petalsOn));
  store.set("petals", petalsOn);
});
requestAnimationFrame(tick);

/* ---------- Apparition au scroll + barre de progression ---------- */
const revealSel = ".section-heading, .interest-card, .role-card, .channel-item, .faq-item, .community-banner, .join-section, .live-card";
$$(revealSel).forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--d", (i % 4) * 0.07 + "s"); });
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));
} else $$(".reveal").forEach((el) => el.classList.add("in"));
const bar = $("#progress");
addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

/* ---------- Compteur de membres en direct ----------
   Utilise l'API publique d'invitation Discord (aucun bot ni clé requis). */
const statEls = { members: $('[data-stat="members"]'), online: $('[data-stat="online"]') };
const statusEl = $("#live-status");
const fmt = new Intl.NumberFormat("fr-FR");
function countUp(el, to) {
  const from = Number(el.dataset.value) || 0;
  el.dataset.value = to;
  if (reduceMotion || from === to) { el.textContent = fmt.format(to); return; }
  const t0 = performance.now(), dur = 1100;
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt.format(Math.round(from + (to - from) * e));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
function inviteCode() {
  if (CONFIG.inviteCode) return CONFIG.inviteCode;
  const href = $("#discord-link")?.getAttribute("href") || "";
  return href.split("/").filter(Boolean).pop() || "";
}
async function refreshStats() {
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${inviteCode()}?with_counts=true`);
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    countUp(statEls.members, d.approximate_member_count);
    countUp(statEls.online, d.approximate_presence_count);
    statusEl.textContent = "Mis à jour à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    const f = CONFIG.fallback;
    if (f.members != null) { countUp(statEls.members, f.members); countUp(statEls.online, f.online ?? 0); }
    statusEl.textContent = "Compteur indisponible : vérifie que l'invitation est permanente.";
  }
}
refreshStats();
setInterval(() => !document.hidden && refreshStats(), CONFIG.refreshMs);

/* =====================================================================
   SYSTÈME D'EASTER EGGS
   Pour en ajouter un : copie un bloc dans EGGS et change l'id, le nom,
   le déclencheur et la fonction run(). C'est tout.

   Déclencheurs disponibles :
     { type: "konami" }                          ↑↑↓↓←→←→BA
     { type: "keyword", word: "sakura" }         taper un mot n'importe où
     { type: "click", selector: ".x", count: 5 } cliquer N fois sur un élément
     { type: "hash", value: "secret" }           ouvrir la page avec #secret
   run(api) reçoit : { toast, burst, theme(choice), el(selector) }
   ===================================================================== */
const EGGS = [
  {
    id: "konami", name: "Code Konami",
    trigger: { type: "konami" },
    run: (api) => { api.burst(220); api.toast("🌸 Tempête de sakura !"); },
  },
  {
    id: "shiwa", name: "Le mot magique",
    trigger: { type: "keyword", word: "shiwa" },
    run: (api) => { api.burst(80); api.toast("✿ Bienvenue chez Shiwa !"); },
  },
  {
    id: "lune", name: "Nuit sur la montagne",
    trigger: { type: "click", selector: ".art-sun", count: 5 },
    run: (api) => { api.el(".hero-art").classList.toggle("egg-night"); api.toast("🌙 Le soleil s'est endormi…"); },
  },
  {
    id: "fleur", name: "Fleur qui tourne",
    trigger: { type: "click", selector: ".navbar .brand-icon", count: 5 },
    run: (api) => { const f = api.el(".navbar .brand-icon"); f.classList.add("spin"); setTimeout(() => f.classList.remove("spin"), 1300); },
  },
  // ---- Ajoute tes easter eggs ici ----
];

const eggApi = { toast, burst, theme: (c) => { themeChoice = c; store.set("theme", c); applyTheme(c); }, el: (s) => $(s) };
const found = new Set(store.get("eggs", []));
const eggCountEl = $("#egg-count");
const updateEggCount = () => { eggCountEl.textContent = `Secrets découverts : ${found.size} / ${EGGS.length}`; };

function unlock(egg) {
  const first = !found.has(egg.id);
  if (first) { found.add(egg.id); store.set("eggs", [...found]); updateEggCount(); toast(`🥚 Secret trouvé : ${egg.name}`); }
  setTimeout(() => egg.run(eggApi), first ? 900 : 0);
}
function registerEgg(egg) { EGGS.push(egg); wireEgg(egg); updateEggCount(); }

const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let keyBuf = [], typed = "";
function wireEgg(egg) {
  const t = egg.trigger;
  if (t.type === "click") {
    let n = 0, timer;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(t.selector)) return;
      clearTimeout(timer); timer = setTimeout(() => (n = 0), 1500);
      if (++n >= t.count) { n = 0; unlock(egg); }
    });
  }
  if (t.type === "hash") {
    const check = () => location.hash === "#" + t.value && unlock(egg);
    addEventListener("hashchange", check); check();
  }
}
EGGS.forEach(wireEgg);
document.addEventListener("keydown", (e) => {
  if (/input|textarea/i.test(e.target.tagName) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // On ne garde que les flèches et les caractères : Shift, Maj Lock, etc. ne cassent plus la séquence
  if (k.length !== 1 && !k.startsWith("Arrow")) return;
  keyBuf = [...keyBuf, k].slice(-KONAMI.length);
  if (keyBuf.join() === KONAMI.join()) EGGS.filter((x) => x.trigger.type === "konami").forEach(unlock);
  if (k.length === 1) {
    typed = (typed + k).slice(-24);
    EGGS.filter((x) => x.trigger.type === "keyword" && typed.endsWith(x.trigger.word.toLowerCase())).forEach((x) => { typed = ""; unlock(x); });
  }
});
updateEggCount();

// Accessible depuis la console du navigateur : Shiwa.registerEgg({...})
window.Shiwa = { registerEgg, toast, burst, eggs: EGGS };