import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit générique "Titre de section" (handoff slides assurance vie,
// GABARITS.md #1) — réutilisable pour PER, SCPI, immobilier. Pas de rail
// d'étapes : la séquence du chapitre n'est pas encore annoncée.
//
// Entrée en fondu à l'arrivée sur la slide (opts.animate && opts.
// slideChanged — voir presenter.js) : le bloc titre entier (tiret +
// titre + sous-titre) apparaît d'un bloc, pas de contenu supplémentaire
// à choréographier séparément ici (contrairement à cadre-relation.js/
// mon-metier.js, qui ont plusieurs blocs de contenu propres).

export function render(slide, opts = {}) {
  const entering = !!opts.animate && !!opts.slideChanged;
  const bodyCls = "section-title__body" + (entering ? " is-entering" : "");
  const bodyAttrs = entering ? " data-reveal" : "";
  return `
    <div class="section-title">
      ${renderChapRail(slide)}
      <div class="${bodyCls}"${bodyAttrs}>
        <span class="section-title__rule"></span>
        <h1 class="chap-title section-title__title">${escapeHtml(slide.titre)}</h1>
        <p class="section-title__sub">${escapeHtml(slide.sousTitre)}</p>
      </div>
    </div>
  `;
}
