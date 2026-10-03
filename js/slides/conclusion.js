import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Dynamiser son patrimoine" (slide 20, PPTX — conclusion du
// chapitre "Le patrimoine") — même registre que benefices.js/
// conditions.js (liste numérotée 01-0n, cumulative, fond qui change de
// teinte à chaque état), écrit dans son propre fichier plutôt que
// généralisé en composant partagé : même raison que benefices.js/
// conditions.js, les trois gabarits ne partagent que la forme, pas le
// contenu.
//
// Titre repris tel quel du PPTX ("Dynamiser son patrimoine", identique à
// la zone de titre de la slide 18) — confirmé par Victor malgré l'air de
// copié-collé, pas une erreur à corriger.
//
// Intro ("En conclusion, pour bien réussir ses investissements il est
// nécessaire :") affichée en sous-titre sous le titre (comme mon-
// metier.js), avant la liste des 3 conditions — verbatim PPTX, pas une
// slide à 2 niveaux de lecture (titre seul) comme benefices/conditions.
//
// 3 états, une condition de plus à chaque clic (logique cumulative,
// liste ancrée en haut — mêmes remarques que benefices.js/conditions.js).
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 18%, rgba(111, 139, 167, 0.42), transparent 62%), radial-gradient(45% 55% at 15% 85%, rgba(158, 178, 196, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 82%, rgba(122, 156, 131, 0.42), transparent 62%), radial-gradient(45% 55% at 18% 18%, rgba(158, 186, 166, 0.28), transparent 65%)",
];

// Même logique que benefices.js/conditions.js : sur un "toggle", l'état
// précédent est déduit de stateIndex - 1 (navigation pas-à-pas) —
// correct en avançant, imprécis en reculant.
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
    return `<div class="conclusion__backdrop"${attrs}></div>`;
  }).join("");
}

export function render(slide, opts = {}) {
  const items = slide.items || [];
  const lastIndex = Math.max(items.length - 1, 0);
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), lastIndex);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const headerCls = "conclusion__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const rows = items
    .map((item, i) => {
      if (i > stateIndex) return "";
      // Révélation : seul l'item qui vient d'apparaître sur CETTE
      // transition précise (toggle) joue le fondu en mouvement — même
      // remarque que benefices.js/conditions.js.
      const revealingThis = mode === "toggle" && i === stateIndex;
      const cls = "conclusion__item" + (revealingThis ? " is-entering" : "");
      const attrs = revealingThis ? " data-reveal" : "";
      const num = String(i + 1).padStart(2, "0");
      return `
        <div class="${cls}"${attrs}>
          <span class="conclusion__item-num">${num}</span>
          <div class="conclusion__item-body">
            <p class="conclusion__item-texte">${escapeHtml(item.texte)}</p>
            ${item.detail ? `<p class="conclusion__item-detail">${escapeHtml(item.detail)}</p>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="conclusion">
      <div class="conclusion__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="conclusion__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="conclusion__rule"></span>
          <h1 class="chap-title conclusion__title">${escapeHtml(slide.titre)}</h1>
          ${slide.intro ? `<p class="chap-subtitle conclusion__intro">${escapeHtml(slide.intro)}</p>` : ""}
        </div>
        <div class="conclusion__stage">
          <div class="conclusion__list">${rows}</div>
        </div>
      </div>
    </div>
  `;
}
