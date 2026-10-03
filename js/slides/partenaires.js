import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Les partenaires de Stellium" (slide 7, PPTX) — une trentaine
// de logos partenaires, groupés par pôle (Immobilier/Placement/
// Financement). Contrairement aux autres slides, PAS de refonte visuelle
// ici : décision de Victor — le contenu (l'étalage concret de partenaires)
// est secondaire (cette slide n'est pas toujours montrée en RDV), retypographier
// ou repositionner chaque logo un par un ne se justifie ni en effort ni
// en coût. La slide originale est reprise telle quelle en image (export
// PDF de Victor, recadré pour ne garder que la grille de logos — sans le
// bandeau de titre PPTX ni la bannière de conclusion, remplacés ici par
// l'en-tête standard du deck), posée dans un cadre sobre qui reprend le
// habillage du reste du deck (chap-rail, titre, sous-titre) pour ne pas
// jurer avec les slides voisines malgré son contenu "figé".
//
// Slide à un seul état, comme "cover" — rien à découvrir au clic, tout
// apparaît en un seul fondu à l'arrivée sur la slide.
//
// Fond : même dégradé que l'état 3 (dernier) de reseau-prodemial.js
// (slide 4) — retour de Victor : continuité visuelle entre les deux
// slides qui se suivent. Repris tel quel (pas une teinte inventée).
const BACKDROP =
  "radial-gradient(50% 55% at 15% 20%, rgba(111, 139, 167, 0.4), transparent 62%), radial-gradient(50% 55% at 85% 20%, rgba(122, 156, 131, 0.38), transparent 62%), radial-gradient(55% 60% at 50% 88%, rgba(172, 107, 130, 0.4), transparent 65%)";

export function render(slide, opts = {}) {
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;

  const headerCls = "partenaires__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const frameCls = "partenaires__frame" + (entering ? " is-entering" : "");
  const frameAttrs = entering ? ` data-reveal style="transition-delay:140ms"` : "";

  return `
    <div class="partenaires">
      <div class="partenaires__backdrops"><div class="partenaires__backdrop" style="background:${BACKDROP}"></div></div>
      ${renderChapRail(slide)}
      <div class="partenaires__body">
        <div class="${headerCls}"${headerAttrs}>
          <h1 class="chap-title partenaires__title">${escapeHtml(slide.titre)}</h1>
          ${slide.intro ? `<p class="chap-subtitle partenaires__intro">${escapeHtml(slide.intro)}</p>` : ""}
        </div>
        <div class="${frameCls}"${frameAttrs}>
          <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.titre)}">
        </div>
      </div>
    </div>
  `;
}
