import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Des conditions d'exercice très strictes" (slide 9, PPTX) — 5
// conditions, même registre que benefices.js (liste numérotée 01-05,
// écrit dans un fichier séparé plutôt que généralisé en composant
// partagé : les deux slides n'ont en commun que la forme, pas le
// contenu, et ce deck garde un gabarit par slide, voir cadre-relation.js/
// mon-metier.js qui partagent aussi une parenté visuelle sans être
// fusionnés).
//
// Pas de photo (le PPTX en a une, pleine hauteur, à droite) : même
// raison que sur benefices.js/reseau-prodemial.js, le reste du deck n'en
// utilise jamais.
//
// 5 états, une condition de plus à chaque clic (logique cumulative,
// liste ancrée en haut — mêmes remarques qu'benefices.js, y compris sur
// l'absence de saut). Fond qui change de teinte à chaque état (retour de
// Victor sur benefices.js : "comme d'hab") — les 5 teintes du thème
// (or/bleu/vert/rouge/rose), une par condition, plutôt que 4 + une
// répétition.
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 18%, rgba(111, 139, 167, 0.42), transparent 62%), radial-gradient(45% 55% at 15% 85%, rgba(158, 178, 196, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 18% 82%, rgba(122, 156, 131, 0.42), transparent 62%), radial-gradient(45% 55% at 85% 18%, rgba(158, 186, 166, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 82%, rgba(168, 98, 87, 0.4), transparent 62%), radial-gradient(45% 55% at 18% 18%, rgba(196, 146, 138, 0.26), transparent 65%)",
  "radial-gradient(55% 60% at 50% 15%, rgba(172, 107, 130, 0.4), transparent 62%), radial-gradient(45% 55% at 50% 85%, rgba(199, 158, 176, 0.26), transparent 65%)",
];

// Même logique que benefices.js/reseau-prodemial.js : sur un "toggle",
// l'état précédent est déduit de stateIndex - 1 (navigation pas-à-pas) —
// correct en avançant, imprécis en reculant (pas demandé à animer
// proprement dans ce sens-là).
function renderBackdrops(stateIndex, mode) {
  return BACKDROPS.map((gradient, i) => {
    const cur = i === stateIndex ? "1" : "0";
    let attrs;
    if (mode === "toggle") {
      const prevIndex = Math.max(stateIndex - 1, 0);
      const prev = i === prevIndex ? "1" : "0";
      attrs = ` data-reveal style="background:${gradient};opacity:${prev}" data-reveal-opacity="${cur}"`;
    } else {
      attrs = ` style="background:${gradient};opacity:${cur}"`;
    }
    return `<div class="conditions__backdrop"${attrs}></div>`;
  }).join("");
}

export function render(slide, opts = {}) {
  const items = slide.items || [];
  const lastIndex = Math.max(items.length - 1, 0);
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), lastIndex);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const headerCls = "conditions__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const rows = items
    .map((item, i) => {
      if (i > stateIndex) return "";
      const revealingThis = mode === "toggle" && i === stateIndex;
      const cls = "conditions__item" + (revealingThis ? " is-entering" : "");
      const attrs = revealingThis ? " data-reveal" : "";
      const num = String(i + 1).padStart(2, "0");
      return `
        <div class="${cls}"${attrs}>
          <span class="conditions__item-num">${num}</span>
          <div class="conditions__item-body">
            <p class="conditions__item-texte">${escapeHtml(item.texte)}</p>
            ${item.detail ? `<p class="conditions__item-detail">${escapeHtml(item.detail)}</p>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="conditions">
      <div class="conditions__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="conditions__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="conditions__rule"></span>
          <h1 class="chap-title conditions__title">${escapeHtml(slide.titre)}</h1>
        </div>
        <div class="conditions__stage">
          <div class="conditions__list">${rows}</div>
        </div>
      </div>
    </div>
  `;
}
