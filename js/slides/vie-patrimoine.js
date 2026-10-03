import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "La vie d'un patrimoine" (slide 17) — 4 phases (Constitution,
// Optimisation, Utilisation, Transmission).
//
// v1 : un arc rectiligne/en escalier. v2 : les 4 jalons repris en boucle
// sur un cercle (retour de Victor : "je voulais aussi que ça boucle" —
// après la Transmission, c'est la génération suivante qui recommence la
// Constitution). v3 (celle-ci) : deux retours sur la v2 — (a) les traits
// rentraient visiblement à l'intérieur des cercles (le tracé allait
// centre à centre, seul le remplissage semi-transparent du jalon le
// masquait à moitié) : chaque arc s'arrête maintenant net à distance du
// jalon (ARC_GAP), calculée par corde sur le même cercle plutôt
// qu'estimée ; (b) "trop simpliste" : jalons traités en médaillon (double
// liseré + ombre portée douce, même esprit que l'ombre de patrimoine.js)
// plutôt qu'un simple cercle au trait, et un repère gradué tout autour du
// cercle-piste (comme un cadran) pour donner de la matière à ce qui
// n'était qu'un pointillé nu.
//
// v4 : Victor voulait retrouver l'engrenage du centre du PPTX d'origine
// — repris ici, mais redessiné en esquisse dorée (trait fin, creux) au
// lieu du clipart PowerPoint gris plein d'origine, pour rester dans le
// même registre graphique que le reste du gabarit (voir gearPath)
// plutôt que d'importer un pictogramme hors charte.
//
// Jalons posés par angle (pas par x/y en dur) : plus lisible, et
// indispensable pour calculer où un arc doit s'arrêter avant d'atteindre
// le jalon suivant (voir trimmedArcPath).
const CENTER = { x: 450, y: 265 };
const RADIUS = 165;
const BADGE_R = 32;
const BADGE_RING_R = BADGE_R + 7;
// Distance (à vol d'oiseau, sur le même cercle) entre le centre d'un
// jalon et le point où le trait s'arrête — au-delà du liseré extérieur
// (BADGE_RING_R), pour un vrai espace visible, pas un simple contact.
const ARC_GAP = BADGE_RING_R + 9;
// Angle correspondant à cette distance, par la formule de la corde
// (2R·sin(Δθ/2) = corde) — exact sur ce cercle, pas une approximation
// linéaire arc/rayon.
const TRIM_DEG = (2 * Math.asin(ARC_GAP / (2 * RADIUS)) * 180) / Math.PI;

function pointOnCircle(angleDeg, radius = RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER.x + radius * Math.cos(rad), y: CENTER.y + radius * Math.sin(rad) };
}

// Angles au sens des aiguilles d'une montre (0° = est, 90° = sud — repère
// SVG, y vers le bas) : NO -> NE -> SE -> SO, chacun à +90° du précédent,
// ce qui permet à la boucle de se refermer exactement (135° + 90° = 225°
// = l'angle de la Constitution) sans cas particulier.
const STOPS = [
  { id: "constitution", angle: 225, labelDX: -46, labelDY: -18, color: "var(--or)" },
  { id: "optimisation", angle: 315, labelDX: 46, labelDY: -18, color: "var(--bleu)" },
  { id: "utilisation", angle: 45, labelDX: 46, labelDY: 18, color: "var(--vert)" },
  { id: "transmission", angle: 135, labelDX: -46, labelDY: 18, color: "var(--rouge)" },
].map((stop) => {
  const { x, y } = pointOnCircle(stop.angle);
  const labelAnchor = stop.labelDX < 0 ? "end" : "start";
  return { ...stop, x, y, labelX: x + stop.labelDX, labelY: y + stop.labelDY, labelAnchor };
});

// Dernier état : ferme la boucle (Transmission -> Constitution), pas de
// nouveau jalon — voir renderSegment(closing:true).
const CLOSING_STATE_INDEX = STOPS.length;

// Retour au doré de la Constitution une fois la boucle refermée : on
// "revient" visuellement au point de départ, pas une 5e teinte inventée.
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 18%, rgba(111, 139, 167, 0.42), transparent 62%), radial-gradient(45% 55% at 15% 85%, rgba(158, 178, 196, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 82%, rgba(122, 156, 131, 0.42), transparent 62%), radial-gradient(45% 55% at 18% 18%, rgba(158, 186, 166, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 18% 82%, rgba(168, 98, 87, 0.4), transparent 62%), radial-gradient(45% 55% at 82% 18%, rgba(196, 146, 138, 0.26), transparent 65%)",
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
];

// Même logique que benefices.js/conditions.js/patrimoine.js : sur un
// "toggle", l'état précédent est déduit de stateIndex - 1 (navigation
// pas-à-pas) — correct en avançant, imprécis en reculant.
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
    return `<div class="vie-patrimoine__backdrop"${attrs}></div>`;
  }).join("");
}

// Repère gradué autour du cercle-piste, comme un cadran — matière
// purement décorative (pas liée aux états), pour ne pas laisser le
// pointillé nu porter seul le "plus travaillé" demandé par Victor.
function renderDial() {
  const ticks = [];
  for (let deg = 0; deg < 360; deg += 15) {
    const inner = pointOnCircle(deg, RADIUS - 9);
    const outer = pointOnCircle(deg, RADIUS - 2);
    ticks.push(`<line x1="${inner.x.toFixed(1)}" y1="${inner.y.toFixed(1)}" x2="${outer.x.toFixed(1)}" y2="${outer.y.toFixed(1)}" />`);
  }
  return `<g class="vie-patrimoine__dial">${ticks.join("")}</g>`;
}

// Engrenage central (demande de Victor : retrouver le repère du PPTX
// d'origine) — dents rectangulaires alternées avec des creux, plus un
// disque central évidé, comme un vrai pignon, mais en simple contour
// (pas de clipart importé). Décoratif, pas lié aux états, comme la
// piste et le cadran.
const GEAR_TEETH = 10;
const GEAR_OUTER_R = 95;
const GEAR_INNER_R = 76;
const GEAR_HOLE_R = 34;

function gearPath(teeth, outerR, innerR) {
  const angleStep = 360 / teeth;
  const toothAngle = angleStep * 0.5;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const aStart = i * angleStep;
    const aToothEnd = aStart + toothAngle;
    const aValleyEnd = aStart + angleStep;
    pts.push(pointOnCircle(aStart, outerR));
    pts.push(pointOnCircle(aToothEnd, outerR));
    pts.push(pointOnCircle(aToothEnd, innerR));
    pts.push(pointOnCircle(aValleyEnd, innerR));
  }
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
}

function renderGear() {
  return `
    <g class="vie-patrimoine__gear">
      <path d="${gearPath(GEAR_TEETH, GEAR_OUTER_R, GEAR_INNER_R)}" />
      <circle cx="${CENTER.x}" cy="${CENTER.y}" r="${GEAR_HOLE_R}" />
    </g>
  `;
}

// Arc de cercle entre deux jalons (même CENTER/RADIUS que la piste) qui
// s'arrête à ARC_GAP de chacun (TRIM_DEG de part et d'autre) plutôt que
// centre à centre — sans ça, la fin du trait se voit à travers le
// remplissage semi-transparent du médaillon (retour de Victor : "les
// traits rentrent à l'intérieur des cercles").
function trimmedArcPath(fromAngle, toAngle) {
  const start = pointOnCircle(fromAngle + TRIM_DEG);
  const end = pointOnCircle(toAngle - TRIM_DEG);
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// Flèche en bout de chaque arc (retour de Victor : "des flèches au bout
// des lignes courbes" plutôt que des courbes nues). Un triangle plein
// dessiné à la main, pas un marker-end SVG : un marker reste posé à sa
// position dès le premier instant du tracé, indépendamment de l'anim
// stroke-dashoffset qui "dessine" la ligne progressivement — il
// flotterait donc déjà en bout de trait avant même que la ligne ait fini
// d'arriver. Le triangle est un élément à part, dont le fondu est retardé
// (voir .vie-patrimoine__arrowhead[data-reveal] dans chapitre.css) pour
// n'apparaître qu'une fois le trait réellement arrivé — même principe que
// .vie-patrimoine__content.
//
// orient="auto" n'existe que sur un <marker> : ici on calcule nous-mêmes
// l'angle de la tangente au cercle au point d'arrivée — dérivée de
// pointOnCircle(θ) = (cosθ, sinθ) par rapport à θ, soit (-sinθ, cosθ),
// dans le sens de parcours croissant (NO->NE->SE->SO, voir STOPS).
function tangentAngleDeg(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = -Math.sin(rad);
  const dy = Math.cos(rad);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function renderArrowhead(atAngle, revealing) {
  const tip = pointOnCircle(atAngle);
  const rotation = tangentAngleDeg(atAngle);
  const attrs = revealing
    ? ` data-reveal style="opacity:0" data-reveal-opacity="1"`
    : ` style="opacity:1"`;
  return `<path class="vie-patrimoine__arrowhead" d="M -2 -4.5 L 9 0 L -2 4.5 Z" transform="translate(${tip.x.toFixed(2)} ${tip.y.toFixed(2)}) rotate(${rotation.toFixed(2)})"${attrs} />`;
}

// visible : le segment/jalon fait partie des états déjà atteints.
// revealing : c'est LA transition qui le révèle (toggle) — trace l'arc
// entrant (pathLength=1, normalisé plutôt qu'une longueur d'arc calculée
// à la main) puis fait apparaître le jalon + son libellé une fois le
// trait arrivé. closing : le segment Transmission -> Constitution — pas
// de nouveau jalon ici, juste le tracé (le halo sur la Constitution est
// géré séparément dans render(), sur le médaillon déjà en place).
function renderSegment(fromStop, toStop, index, visible, revealing, entering, closing) {
  if (!visible) return "";
  const color = closing ? "var(--or)" : toStop.color;
  const wrapCls = "vie-patrimoine__phase" + (entering ? " is-entering" : "");
  const wrapAttrs = entering ? ` data-reveal style="--phase-color:${color}"` : ` style="--phase-color:${color}"`;

  const segmentCls = "vie-patrimoine__segment" + (closing ? " vie-patrimoine__segment--closing" : "");
  const segmentAttrs = revealing
    ? ` data-reveal pathLength="1" stroke-dasharray="1" style="stroke-dashoffset:1" data-reveal-dashoffset="0"`
    : ` pathLength="1" stroke-dasharray="1" style="stroke-dashoffset:0"`;
  const segmentHtml = `<path class="${segmentCls}" d="${trimmedArcPath(fromStop.angle, toStop.angle)}"${segmentAttrs} />`;
  const arrowheadHtml = renderArrowhead(toStop.angle - TRIM_DEG, revealing);

  if (closing) {
    return `<g class="${wrapCls}"${wrapAttrs}>${segmentHtml}${arrowheadHtml}</g>`;
  }

  const contentCls = "vie-patrimoine__content" + (revealing ? " is-entering" : "");
  const contentAttrs = revealing ? " data-reveal" : "";

  return `
    <g class="${wrapCls}"${wrapAttrs}>
      ${segmentHtml}
      ${arrowheadHtml}
      <g class="${contentCls}"${contentAttrs}>
        ${renderBadge(toStop, index, false)}
      </g>
    </g>
  `;
}

// Médaillon : liseré extérieur discret + cercle principal (fond papier,
// contour teinté) + numéro serif — plus "travaillé" qu'un simple cercle
// au trait (retour de Victor), sans basculer dans la surcharge (pas de
// texture/motif dans le disque, juste un second cercle plus fin).
function renderBadge(stop, index, pulsing) {
  const pulseCls = pulsing ? " vie-patrimoine__badge--pulse" : "";
  return `
    <circle class="vie-patrimoine__badge-ring" cx="${stop.x}" cy="${stop.y}" r="${BADGE_RING_R}" />
    <circle class="vie-patrimoine__badge${pulseCls}" cx="${stop.x}" cy="${stop.y}" r="${BADGE_R}" />
    <text class="vie-patrimoine__badge-num" x="${stop.x}" y="${stop.y}" text-anchor="middle" dominant-baseline="central">${index + 1}</text>
    <text class="vie-patrimoine__label" x="${stop.labelX}" y="${stop.labelY}" text-anchor="${stop.labelAnchor}">${escapeHtml(stop.texte)}</text>
  `;
}

export function render(slide, opts = {}) {
  const phases = slide.phases || [];
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), CLOSING_STATE_INDEX);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const headerCls = "vie-patrimoine__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const loopVisible = stateIndex >= CLOSING_STATE_INDEX;
  const loopRevealing = mode === "toggle" && stateIndex === CLOSING_STATE_INDEX;

  // Jalon 0 (Constitution) : toujours visible dès l'arrivée sur la
  // slide, pas de segment entrant — seul cas qui échappe à la boucle
  // ci-dessous, comme benefices.js/conditions.js/patrimoine.js. Rejoue
  // son halo (pulsing) quand la boucle se referme sur lui.
  const stop0 = { ...STOPS[0], texte: (phases.find((p) => p.id === STOPS[0].id) || {}).texte };
  const stop0WrapCls = "vie-patrimoine__phase" + (entering ? " is-entering" : "");
  const stop0WrapAttrs = entering
    ? ` data-reveal style="--phase-color:${STOPS[0].color}"`
    : ` style="--phase-color:${STOPS[0].color}"`;
  const stop0Html = stop0.texte
    ? `<g class="${stop0WrapCls}"${stop0WrapAttrs}><g>${renderBadge(stop0, 0, loopRevealing)}</g></g>`
    : "";

  const segmentsHtml = STOPS.map((stop, i) => {
    if (i === 0) return "";
    const visible = i <= stateIndex;
    const revealing = mode === "toggle" && i === stateIndex;
    const data = phases.find((p) => p.id === stop.id);
    const toStop = { ...stop, texte: data ? data.texte : "" };
    return renderSegment(STOPS[i - 1], toStop, i, visible, revealing, entering, false);
  }).join("");

  const closingHtml = renderSegment(STOPS[STOPS.length - 1], STOPS[0], 0, loopVisible, loopRevealing, entering, true);

  return `
    <div class="vie-patrimoine">
      <div class="vie-patrimoine__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="vie-patrimoine__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="vie-patrimoine__rule"></span>
          <h1 class="chap-title vie-patrimoine__title">${escapeHtml(slide.titre)}</h1>
        </div>
        <div class="vie-patrimoine__stage">
          <svg class="vie-patrimoine__arc" viewBox="0 0 900 530" aria-hidden="true">
            <circle class="vie-patrimoine__track" cx="${CENTER.x}" cy="${CENTER.y}" r="${RADIUS}" />
            ${renderDial()}
            ${renderGear()}
            ${stop0Html}
            ${segmentsHtml}
            ${closingHtml}
          </svg>
        </div>
      </div>
    </div>
  `;
}
