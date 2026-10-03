import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Quel cadre pour notre relation ?" (slide 2) — une chronologie
// de l'accompagnement (ce RDV / le prochain) sur une ligne de temps,
// plutôt que deux cases reliées par une flèche : un jalon numéroté
// (médaillon, même langage que mon-metier__orbit-badge — la signature du
// deck) posé sur une ligne, actif (plein, or, halo) ou à venir (contour,
// atténué). slide.etapes : [{ label, bullets[] }, { label, bullets[] }]
// — toujours deux étapes, numérotées 01/02 (position dans le tableau,
// pas une donnée de contenu — écho du rail 01/02/03 en haut de la
// scène).
//
// Largeur des jalons FIXE et IDENTIQUE (25cqw, voir chapitre.css),
// jamais pilotée par le contenu ni par l'état actif/inactif (retour de
// Victor : "je ne veux pas que les deux blocs aient leur largeur
// variable"). Taille du marqueur également CONSTANTE entre les deux
// états : la ligne doit rester alignée sur le centre des deux médaillons
// en permanence — un marqueur qui grossit désalignerait son centre par
// rapport au trait à chaque bascule d'état.
//
// Deux régimes d'animation distincts (voir opts.slideChanged, posé par
// presenter.js/audience.js — même principe que mon-metier.js) :
//   - ARRIVÉE sur la slide (animate && slideChanged) : header, puis le
//     trait de la ligne de temps se dessine de gauche à droite (scaleX,
//     transform-origin:left — pas juste un fondu), puis les jalons
//     entrent en fondu, en cascade — chacun déjà à son état final, pas
//     de bascule à ce moment-là.
//   - CLIC sur la scène, même slide (animate && !slideChanged) : bascule
//     d'état (0 ↔ 1) — c'est LÀ que l'emphase (remplissage du médaillon,
//     halo, couleur du libellé, opacité des puces) passe d'un jalon à
//     l'autre. Le trait ne se redessine pas à ce moment — seule
//     l'arrivée sur la slide le fait, une fois pour toutes.
const ACTIVE_MARKER_BG = "var(--or)";
const NEXT_MARKER_BG = "var(--papier)";
const ACTIVE_MARKER_BORDER = "var(--or)";
const NEXT_MARKER_BORDER = "rgba(var(--chap-ink-rgb), 0.35)";
const ACTIVE_NUMBER_COLOR = "var(--papier)";
const NEXT_NUMBER_COLOR = "rgba(var(--chap-ink-rgb), 0.45)";
const ACTIVE_LABEL_COLOR = "var(--or)";
const NEXT_LABEL_COLOR = "rgba(var(--chap-ink-rgb), 0.55)";
const ACTIVE_BODY_OPACITY = "1";
const NEXT_BODY_OPACITY = "0.55";
const ACTIVE_GLOW_OPACITY = "1";
const NEXT_GLOW_OPACITY = "0";

// Fond qui change de teinte avec le jalon actif — même mécanisme que
// mon-metier__backdrop (dégradés radiaux flous, pas des photos, voir ce
// fichier), avec les mêmes couleurs de thème que le reste du deck (voir
// theme.css) plutôt que d'en inventer de nouvelles : or pour "aujourd'hui"
// (rejoint le doré déjà utilisé pour le jalon actif/le halo), bleu pour
// "la prochaine fois" — deux teintes franchement distinctes pour que le
// changement de fond se voie clairement au clic (retour de Victor).
const TIMELINE_BACKDROPS = [
  "radial-gradient(55% 60% at 20% 18%, rgba(185, 151, 97, 0.5), transparent 62%), radial-gradient(45% 50% at 85% 82%, rgba(199, 174, 137, 0.32), transparent 65%)",
  "radial-gradient(55% 60% at 80% 20%, rgba(111, 139, 167, 0.45), transparent 62%), radial-gradient(45% 50% at 18% 82%, rgba(158, 178, 196, 0.3), transparent 65%)",
];

function renderBackdrops(stateIndex, mode) {
  return TIMELINE_BACKDROPS.map((gradient, i) => {
    const cur = i === stateIndex ? "1" : "0";
    let attrs;
    if (mode === "toggle") {
      const prevStateIndex = stateIndex === 0 ? 1 : 0;
      const prev = i === prevStateIndex ? "1" : "0";
      attrs = ` data-reveal style="background:${gradient};opacity:${prev}" data-reveal-opacity="${cur}"`;
    } else {
      attrs = ` style="background:${gradient};opacity:${cur}"`;
    }
    return `<div class="cadre-relation__backdrop"${attrs}></div>`;
  }).join("");
}

function renderStop(etape, number, active, mode, delay) {
  const markerBg = active ? ACTIVE_MARKER_BG : NEXT_MARKER_BG;
  const markerBorder = active ? ACTIVE_MARKER_BORDER : NEXT_MARKER_BORDER;
  const numberColor = active ? ACTIVE_NUMBER_COLOR : NEXT_NUMBER_COLOR;
  const labelColor = active ? ACTIVE_LABEL_COLOR : NEXT_LABEL_COLOR;
  const bodyOpacity = active ? ACTIVE_BODY_OPACITY : NEXT_BODY_OPACITY;
  const glowOpacity = active ? ACTIVE_GLOW_OPACITY : NEXT_GLOW_OPACITY;

  let markerAttrs;
  let numberAttrs;
  let labelAttrs;
  let bodyAttrs;
  let glowAttrs;

  if (mode === "toggle") {
    // Avec 2 états seulement, l'état précédent d'un jalon est toujours le
    // complément de l'état courant (peu importe le sens de navigation) —
    // même principe que mon-metier.js paramsAt.
    const prevMarkerBg = active ? NEXT_MARKER_BG : ACTIVE_MARKER_BG;
    const prevMarkerBorder = active ? NEXT_MARKER_BORDER : ACTIVE_MARKER_BORDER;
    const prevNumberColor = active ? NEXT_NUMBER_COLOR : ACTIVE_NUMBER_COLOR;
    const prevLabelColor = active ? NEXT_LABEL_COLOR : ACTIVE_LABEL_COLOR;
    const prevBodyOpacity = active ? NEXT_BODY_OPACITY : ACTIVE_BODY_OPACITY;
    const prevGlowOpacity = active ? NEXT_GLOW_OPACITY : ACTIVE_GLOW_OPACITY;
    markerAttrs = ` data-reveal style="background:${prevMarkerBg};border-color:${prevMarkerBorder}" data-reveal-bg="${markerBg}" data-reveal-border-color="${markerBorder}"`;
    numberAttrs = ` data-reveal style="color:${prevNumberColor}" data-reveal-color="${numberColor}"`;
    labelAttrs = ` data-reveal style="color:${prevLabelColor}" data-reveal-color="${labelColor}"`;
    bodyAttrs = ` data-reveal style="opacity:${prevBodyOpacity}" data-reveal-opacity="${bodyOpacity}"`;
    glowAttrs = ` data-reveal style="opacity:${prevGlowOpacity}" data-reveal-opacity="${glowOpacity}"`;
  } else {
    markerAttrs = ` style="background:${markerBg};border-color:${markerBorder}"`;
    numberAttrs = ` style="color:${numberColor}"`;
    labelAttrs = ` style="color:${labelColor}"`;
    bodyAttrs = ` style="opacity:${bodyOpacity}"`;
    glowAttrs = ` style="opacity:${glowOpacity}"`;
  }

  const bullets = (etape.bullets || [])
    .map((b) => `<li class="cadre-relation__bullet">${escapeHtml(b)}</li>`)
    .join("");

  const cls = "cadre-relation__stop cadre-relation__stop--" + (active ? "now" : "next") + (mode === "enter" ? " is-entering" : "");
  const stopStyle = mode === "enter" ? ` style="transition-delay:${delay}"` : "";
  const stopDataReveal = mode === "enter" ? " data-reveal" : "";

  return `
    <div class="${cls}"${stopDataReveal}${stopStyle}>
      <span class="cadre-relation__stop-marker-wrap">
        <span class="cadre-relation__stop-glow"${glowAttrs}></span>
        <span class="cadre-relation__stop-marker"${markerAttrs}>
          <span class="cadre-relation__stop-number"${numberAttrs}>${String(number).padStart(2, "0")}</span>
        </span>
      </span>
      <div class="cadre-relation__stop-body"${bodyAttrs}>
        <p class="cadre-relation__stop-label"${labelAttrs}>${escapeHtml(etape.label)}</p>
        <ul class="cadre-relation__bullets">${bullets}</ul>
      </div>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 1);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";
  const [premiere, seconde] = slide.etapes || [];

  const headerCls = "cadre-relation__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  // Le trait se dessine de gauche à droite (scaleX 0 -> 1, transform-
  // origin:left) UNE SEULE FOIS, à l'arrivée sur la slide — pas à chaque
  // bascule d'état (mode "toggle"), où il reste simplement à scaleX(1),
  // déjà tracé.
  const trackEntering = mode === "enter";
  const trackAttrs = trackEntering
    ? ` data-reveal style="transform:scaleX(0);transition-delay:120ms" data-reveal-transform="scaleX(1)"`
    : ` style="transform:scaleX(1)"`;

  return `
    <div class="cadre-relation">
      <div class="cadre-relation__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="${headerCls}"${headerAttrs}>
        <span class="cadre-relation__rule"></span>
        <h1 class="chap-title cadre-relation__title">${escapeHtml(slide.titre)}</h1>
      </div>
      <div class="cadre-relation__timeline">
        <div class="cadre-relation__timeline-row">
          ${premiere ? renderStop(premiere, 1, stateIndex === 0, mode, "220ms") : ""}
          <span class="cadre-relation__track" aria-hidden="true"${trackAttrs}></span>
          ${seconde ? renderStop(seconde, 2, stateIndex === 1, mode, "320ms") : ""}
        </div>
      </div>
    </div>
  `;
}
