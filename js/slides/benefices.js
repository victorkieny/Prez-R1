import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Quels bénéfices ?" (slide 8, PPTX) — 4 bénéfices, une liste
// numérotée (01-04, même registre que le rail de chapitres/les jalons de
// cadre-relation — un vocabulaire déjà établi dans ce deck, pas une
// nouvelle forme) plutôt qu'une rangée de cartes ou un cercle : ce
// gabarit en a déjà deux (reseau-prodemial, mon-metier), une liste verticale
// simple apporte de la variété sans réinventer un motif de plus pour un
// contenu qui n'en a pas besoin.
//
// Pas de photo (le PPTX en a une, pleine hauteur, à droite) : le reste
// du deck n'utilise jamais de photographie (déjà écarté sur "Solutions
// d'investissement"), rester cohérent plutôt que de réintroduire un
// registre visuel différent pour une seule slide.
//
// 4 états, un bénéfice de plus à chaque clic (même logique cumulative
// que reseau-prodemial — jamais de retour en arrière animé, un clic
// arrière fait juste disparaître net). Contrairement à reseau-prodemial,
// la liste est ancrée en haut de la scène (padding-top fixe, PAS
// justify-content:center) : chaque nouvel item s'ajoute donc SOUS les
// précédents sans jamais les faire bouger — pas besoin de réserver de
// place à l'avance, le problème de saut (voir reseau-prodemial.js) ne
// peut pas se produire par construction ici.
//
// Fond qui change de teinte à chaque bénéfice (retour de Victor :
// "ajoute des changements de couleur en fond à chaque état comme
// d'hab") — même mécanisme que cadre-relation.js/mon-metier.js/
// reseau-prodemial.js : un dégradé par état, en fondu croisé au clic.
// Une teinte du thème par bénéfice (or/bleu/vert/rouge), pas une palette
// inventée.
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 18%, rgba(111, 139, 167, 0.42), transparent 62%), radial-gradient(45% 55% at 15% 85%, rgba(158, 178, 196, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 82%, rgba(168, 98, 87, 0.4), transparent 62%), radial-gradient(45% 55% at 18% 18%, rgba(196, 146, 138, 0.26), transparent 65%)",
  "radial-gradient(55% 60% at 18% 82%, rgba(122, 156, 131, 0.42), transparent 62%), radial-gradient(45% 55% at 85% 18%, rgba(158, 186, 166, 0.28), transparent 65%)",
];

// Même logique que reseau-prodemial.js : sur un "toggle", l'état
// précédent est déduit de stateIndex - 1 (navigation pas-à-pas) —
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
    return `<div class="benefices__backdrop"${attrs}></div>`;
  }).join("");
}

export function render(slide, opts = {}) {
  const items = slide.items || [];
  const lastIndex = Math.max(items.length - 1, 0);
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), lastIndex);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const headerCls = "benefices__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const rows = items
    .map((item, i) => {
      if (i > stateIndex) return "";
      // Révélation : seul l'item qui vient d'apparaître sur CETTE
      // transition précise (toggle) joue le fondu en mouvement ; une
      // arrivée directe sur la slide à un état avancé (entering) se
      // contente du fondu générique posé sur l'en-tête plus haut, comme
      // le reste du deck — pas de cascade rejouée à chaque fois.
      const revealingThis = mode === "toggle" && i === stateIndex;
      const cls = "benefices__item" + (revealingThis ? " is-entering" : "");
      const attrs = revealingThis ? " data-reveal" : "";
      const num = String(i + 1).padStart(2, "0");
      return `
        <div class="${cls}"${attrs}>
          <span class="benefices__item-num">${num}</span>
          <div class="benefices__item-body">
            <p class="benefices__item-texte">${escapeHtml(item.texte)}</p>
            ${item.detail ? `<p class="benefices__item-detail">${escapeHtml(item.detail)}</p>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="benefices">
      <div class="benefices__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="benefices__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="benefices__rule"></span>
          <h1 class="chap-title benefices__title">${escapeHtml(slide.titre)}</h1>
        </div>
        <div class="benefices__stage">
          <div class="benefices__list">${rows}</div>
        </div>
      </div>
    </div>
  `;
}
