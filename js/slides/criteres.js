import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Les critères à valider" (slide 19, PPTX) — triangle en
// esquisse dorée (même registre que l'engrenage de vie-patrimoine.js ou
// la maison de patrimoine.js) : Sécurité à la base, Rentabilité et
// Disponibilité sur les deux pans, Équilibre au centre — leur résultante,
// pas un 4e critère au même rang (lecture fidèle au schéma source, d'où
// sa place au centre et non sur un 4e sommet).
//
// v2 (retour de Victor) : plus de révélation progressive des 3 côtés au
// clic — tout s'affiche d'un coup à l'arrivée sur la slide (un seul état,
// comme partenaires.js), plus simple. Ajout d'une photo (assets/
// galet.png — galets empilés, repère du PPTX d'origine conservé même si
// l'esquisse ne reprend pas son visuel brut) à l'intérieur du triangle,
// même technique de clipPath que le toit de patrimoine.js. Équilibre
// garde son encart opaque (fond papier) : pas besoin d'un voile sur la
// photo, son texte n'est jamais directement dessus.
const APEX = { x: 300, y: 50 };
const BOTTOM_LEFT = { x: 90, y: 460 };
const BOTTOM_RIGHT = { x: 510, y: 460 };
const CENTROID = {
  x: (APEX.x + BOTTOM_LEFT.x + BOTTOM_RIGHT.x) / 3,
  y: (APEX.y + BOTTOM_LEFT.y + BOTTOM_RIGHT.y) / 3,
};
const LABEL_OFFSET = 34;
const TRIANGLE_IMAGE = "assets/galet.png";
const TRIANGLE_CLIP_ID = "criteres-triangle-clip";
const TRIANGLE_POINTS = `${APEX.x},${APEX.y} ${BOTTOM_LEFT.x},${BOTTOM_LEFT.y} ${BOTTOM_RIGHT.x},${BOTTOM_RIGHT.y}`;

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Position du libellé : au milieu de l'arête, poussé vers l'extérieur du
// triangle (à l'opposé du centroïde) — généralise à n'importe quelle
// arête, pas de décalage en dur par côté.
function labelPosition(a, b) {
  const m = midpoint(a, b);
  const dx = m.x - CENTROID.x;
  const dy = m.y - CENTROID.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: m.x + (dx / len) * LABEL_OFFSET, y: m.y + (dy / len) * LABEL_OFFSET };
}

// Angle de rotation du libellé, dans le sens de lecture normal (jamais la
// tête en bas) : calculé depuis le point le plus bas de l'arête vers le
// plus haut, puis ramené dans [-90°, 90°].
function labelAngle(a, b) {
  const [lo, hi] = a.y >= b.y ? [a, b] : [b, a];
  let deg = (Math.atan2(hi.y - lo.y, hi.x - lo.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  return deg;
}

const CRITERES = [
  { id: "securite", from: BOTTOM_LEFT, to: BOTTOM_RIGHT },
  { id: "rentabilite", from: BOTTOM_LEFT, to: APEX },
  { id: "disponibilite", from: APEX, to: BOTTOM_RIGHT },
].map((c) => ({
  ...c,
  labelPos: labelPosition(c.from, c.to),
  angle: labelAngle(c.from, c.to),
}));

// Un seul dégradé statique (plus de cycle par état, cette slide n'en a
// plus qu'un) — reprend la teinte rouge/rose de l'ex-état final.
const BACKDROP =
  "radial-gradient(55% 60% at 18% 82%, rgba(168, 98, 87, 0.4), transparent 62%), radial-gradient(45% 55% at 82% 18%, rgba(196, 146, 138, 0.26), transparent 65%)";

function renderEdge(critere) {
  return `
    <g class="criteres__phase">
      <line class="criteres__edge" x1="${critere.from.x}" y1="${critere.from.y}" x2="${critere.to.x}" y2="${critere.to.y}" />
      <text class="criteres__label" x="${critere.labelPos.x}" y="${critere.labelPos.y}" text-anchor="middle" dominant-baseline="central" transform="rotate(${critere.angle.toFixed(2)} ${critere.labelPos.x} ${critere.labelPos.y})">${escapeHtml(critere.texte)}</text>
    </g>
  `;
}

// Halo lumineux (dégradé radial, pas un encart à bord net) — retour de
// Victor : "pas une zone de texte claire... quelque chose qui éclaircit
// l'arrière-plan". L'ellipse est nettement plus grande que le texte
// (voir EQUILIBRE_GLOW_RX/RY) pour que le dégradé ait la place de
// s'estomper progressivement jusqu'à transparent, plutôt qu'un bord
// visible comme un rect l'aurait eu.
const EQUILIBRE_GLOW_ID = "criteres-equilibre-glow";
const EQUILIBRE_GLOW_RX = 135;
const EQUILIBRE_GLOW_RY = 58;

function renderEquilibre(texte) {
  return `
    <g class="criteres__equilibre">
      <ellipse class="criteres__equilibre-glow" cx="${CENTROID.x}" cy="${CENTROID.y}" rx="${EQUILIBRE_GLOW_RX}" ry="${EQUILIBRE_GLOW_RY}" fill="url(#${EQUILIBRE_GLOW_ID})" />
      <text class="criteres__equilibre-texte" x="${CENTROID.x}" y="${CENTROID.y}" text-anchor="middle" dominant-baseline="central">${escapeHtml(texte)}</text>
    </g>
  `;
}

export function render(slide, opts = {}) {
  const criteres = slide.criteres || [];
  const equilibre = slide.equilibre || "";
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;

  const headerCls = "criteres__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const svgCls = "criteres__triangle" + (entering ? " is-entering" : "");
  const svgAttrs = entering ? ` data-reveal style="transition-delay:140ms"` : "";

  const edgesHtml = CRITERES.map((c) => {
    const data = criteres.find((item) => item.id === c.id);
    return renderEdge({ ...c, texte: data ? data.texte : "" });
  }).join("");

  const equilibreHtml = renderEquilibre(equilibre);

  return `
    <div class="criteres">
      <div class="criteres__backdrops"><div class="criteres__backdrop" style="background:${BACKDROP}"></div></div>
      ${renderChapRail(slide)}
      <div class="criteres__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="criteres__rule"></span>
          <h1 class="chap-title criteres__title">${escapeHtml(slide.titre)}</h1>
        </div>
        <div class="criteres__stage">
          <!-- viewBox recadré : le contenu plein (triangle + libellés,
               mesuré via getBBox) occupe y≈50..506 sur les 0..520
               d'origine — recadré serré, marges haut/bas équilibrées. -->
          <svg class="${svgCls}"${svgAttrs} viewBox="90 35 420 486" aria-hidden="true">
            <defs>
              <clipPath id="${TRIANGLE_CLIP_ID}"><polygon points="${TRIANGLE_POINTS}" /></clipPath>
              <radialGradient id="${EQUILIBRE_GLOW_ID}">
                <stop offset="0%" stop-color="var(--papier)" stop-opacity="0.95" />
                <stop offset="55%" stop-color="var(--papier)" stop-opacity="0.7" />
                <stop offset="100%" stop-color="var(--papier)" stop-opacity="0" />
              </radialGradient>
            </defs>
            <image class="criteres__triangle-photo" x="${BOTTOM_LEFT.x}" y="${APEX.y}" width="${BOTTOM_RIGHT.x - BOTTOM_LEFT.x}" height="${BOTTOM_LEFT.y - APEX.y}" href="${TRIANGLE_IMAGE}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${TRIANGLE_CLIP_ID})" />
            ${edgesHtml}
            ${equilibreHtml}
          </svg>
        </div>
      </div>
    </div>
  `;
}
