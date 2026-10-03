import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Le patrimoine" (slide 11) — première slide du chapitre 2. Son
// vrai rôle : casser le rythme après la partie "présentation de moi" et
// faire un peu de pédagogie patrimoniale avec le client (retour de
// Victor, note de scope) : la maison est un support de discussion en
// RDV, pas une simple illustration — le toit (Patrimoine professionnel
// et privé) apparaît seul, Victor pose la question à son client, PUIS
// chaque pilier (Immobilier, Placements) apparaît au clic au fil de
// l'échange. Victor : "cette image fonctionne très bien en rdv", donc on
// garde la métaphore telle quelle — seule l'exécution visuelle change
// (retour de Victor : "trop simple, pas assez travaillée" — le PPTX
// d'origine est un triangle et deux rectangles pleins basiques).
//
// v2 : maison en esquisse d'architecte — trait fin doré, creuse (pas
// remplie), plutôt que des aplats PowerPoint (option choisie par Victor
// parmi 2 propositions). Chaque pilier SE CONSTRUIT (stroke-dashoffset,
// même technique que le réseau de neurones de reseau-prodemial.js) à son
// apparition, au lieu de simplement apparaître en fondu — l'idée d'un
// patrimoine qui "se bâtit" plutôt que d'un schéma qui clignote.
//
// Couleurs des piliers reprises de reseau-prodemial.js (vert pour
// Immobilier, rose pour Placements — mêmes teintes que les pôles
// Stellium homonymes) plutôt qu'inventées : un même sujet garde la même
// couleur d'une slide à l'autre dans tout le deck.
//
// v3 (retour de Victor : la slide "reste trop simple, pas assez
// travaillée" même en v2) — on enrichit l'exécution SANS changer la
// métaphore ni le mécanisme (option "maison premium" choisie face à
// "changer de symbole" type arbre, à garder sous le coude si ça ne
// suffit toujours pas) : un sol + une ombre portée donnent une assise à
// la maison, et un halo doré ponctue la fin de la construction de chaque
// pilier.
//
// v3.1 (retour de Victor sur la v3 : la cote d'architecte lisait comme
// "un rectangle qui dépasse dessous", l'ombre était trop marquée/pas
// jolie) — cote supprimée (elle n'apportait rien une fois le libellé
// déplacé dans le pilier, voir plus bas), ombre resserrée et adoucie.
// Libellé déplacé À L'INTÉRIEUR du pilier (plus en dessous), avec un
// pictogramme au-dessus — clé pour Immobilier (déjà utilisée dans ce
// deck pour une thématique immobilière, voir ICONS.cle), pile de pièces
// pour Placements (déjà utilisée pour un capital, voir ICONS.capital) :
// pictos repris de la bibliothèque partagée (_chapitre.js) plutôt
// qu'inventés, même vocabulaire graphique que le reste du deck.
//
// v4 (retour de Victor) : maison agrandie dans l'ensemble — PAS en
// zoomant uniformément sur les photos (un crop "cover" ne révèle pas
// plus de l'image quand on agrandit juste le cadre à proportions
// identiques, c'est un fait géométrique du recadrage : le ratio
// largeur/hauteur de la forme est ce qui détermine la part rognée, pas
// sa taille absolue) — proportions des formes rapprochées de celles des
// photos (toutes paysage, ~1.33 à 1.48:1) plutôt qu'un simple zoom.
//
// v4.1 (retour de Victor sur la v4 : "la maison déborde sur le titre")
// — toit raccourci pour rester sous le titre, élargi pour compenser ;
// piliers rallongés pour rester plus hauts que le toit en proportion
// (retour de Victor : "le toit un peu moins haut que les piliers", "les
// piliers trop bas par rapport au toit").
//
// v4.2 (retour de Victor, photo de référence à l'appui : "la maison est
// trop aplatie, il y a un espace vide entre les deux piliers") — toit
// remonté (130, au lieu de 110 en v4.1) pour se rapprocher du silhouette
// de la référence (toit presque aussi haut que les piliers, PAS un
// triangle plat), tout en restant un peu moins haut que les piliers
// (140, inchangé) comme demandé juste avant ; piliers collés (plus
// d'espace de 20 entre eux — ils se touchent pile sous le sommet, comme
// sur la référence).
const HOUSE = {
  apex: { x: 200, y: 0 },
  eaveL: { x: 10, y: 130 },
  eaveR: { x: 390, y: 130 },
};
const GROUND_Y = 270;
const GROUND = { x1: 0, x2: 400 };
// image (retour de Victor) : photo de fond À L'INTÉRIEUR du pilier —
// Immobilier (assets/immo.jpg) et Placements (assets/placements.jpg).
// Le rect du pilier garde son fond papier translucide existant
// (.patrimoine__pillar rect, rgba(papier,0.55)) PAR-DESSUS la photo
// plutôt qu'un calque dédié : il joue déjà ce rôle de voile pâle pour
// les piliers sans image, pas besoin d'un second mécanisme.
//
// Largeur (retour de Victor) : les deux piliers ensemble aussi larges
// que le toit — bord à bord avec les avant-toits (HOUSE.eaveL/eaveR,
// 10..390) ET collés l'un à l'autre (v4.2, plus d'espace entre eux,
// voir note ci-dessus) — 190 de large chacun, pile la moitié de
// l'ouverture disponible : (390-10)/2 = 190.
//
// Plus d'icône (clé/pile de pièces) au-dessus du libellé (retour de
// Victor : "je n'en ai plus besoin") — voir renderPillar, qui ne pose
// plus que le libellé, centré dans le pilier.
// imageZoom (retour de Victor, "zoom un peu plus l'image du
// placement") : facteur appliqué à l'image SEULE (voir renderPillar) —
// elle est dessinée plus grande que le pilier puis recadrée dessus via
// un clipPath dédié, plutôt que d'agrandir le pilier lui-même.
const PILLARS = [
  { id: "immobilier", x: 10, y: 130, w: 190, h: 140, color: "var(--vert)", image: "assets/immo.jpg" },
  { id: "placements", x: 200, y: 130, w: 190, h: 140, color: "var(--rose)", image: "assets/placements.jpg", imageZoom: 1.3 },
];

// Fond qui change de teinte à chaque état (même mécanisme que les
// autres gabarits à états de ce deck) — or pour le toit (patrimoine),
// puis la couleur du pilier qui vient d'apparaître.
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 18% 82%, rgba(122, 156, 131, 0.42), transparent 62%), radial-gradient(45% 55% at 85% 18%, rgba(158, 186, 166, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 82%, rgba(172, 107, 130, 0.4), transparent 62%), radial-gradient(45% 55% at 18% 18%, rgba(199, 158, 176, 0.26), transparent 65%)",
];

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
    return `<div class="patrimoine__backdrop"${attrs}></div>`;
  }).join("");
}

// Toit : présent dès l'état 0, donc jamais de tracé animé ici (voir note
// de tête — le "se construit" est réservé aux piliers, révélés au clic).
// Un simple fondu d'ensemble à l'arrivée sur la slide, comme l'en-tête
// de tous les autres gabarits. Le sol est dans le même groupe : présent
// dès l'état 0, à sa position finale (largeur couvrant les deux piliers
// à venir) — la maison "pose" sur un site déjà relevé, plutôt que sur du
// vide, même avant que les piliers n'apparaissent (registre "plan
// d'architecte" : le site avant l'élévation). L'ombre portée, elle,
// n'est plus commune aux deux piliers (retour de Victor) — une par
// pilier, voir renderPillar, posée seulement une fois CE pilier debout.
// Photo de toit (retour de Victor, suite aux piliers) — même principe
// que PILLARS[].image : une image "cover" découpée à la forme (ici le
// triangle, via clipPath plutôt que x/y/width/height comme pour un
// rect — un triangle n'a pas de viewport rectangulaire propre). Le
// clipPath est défini une seule fois (voir ROOF_CLIP_ID) et réutilisé —
// un triangle, contrairement au rect des piliers, n'a pas de bord qui se
// découpe de lui-même.
//
// v5 (retour de Victor, essai suite au halo de criteres.js) : le voile
// papier sur TOUT le triangle est retiré — à la place, un halo lumineux
// localisé (dégradé radial, même technique qu'Équilibre sur criteres.js)
// juste derrière "Patrimoine"/"Professionnel et privé", qui éclaircit le
// fond sans couvrir toute la photo. GLOW_ID partagé par ce halo ET ceux
// des piliers (voir renderPillar) — même dégradé, pas besoin d'en
// redéfinir un par usage.
const ROOF_IMAGE = "assets/patrimoine.jpg";
const ROOF_CLIP_ID = "patrimoine-roof-clip";
const ROOF_POINTS = `${HOUSE.apex.x},${HOUSE.apex.y} ${HOUSE.eaveL.x},${HOUSE.eaveL.y} ${HOUSE.eaveR.x},${HOUSE.eaveR.y}`;
const GLOW_ID = "patrimoine-text-glow";
const ROOF_GLOW = { cx: HOUSE.apex.x, cy: 92, rx: 115, ry: 42 };

function renderRoof(slide, entering) {
  const cls = "patrimoine__roof" + (entering ? " is-entering" : "");
  const attrs = entering ? " data-reveal" : "";
  const [ligne1, ligne2] = slide.toit || [];
  return `
    <g class="${cls}"${attrs}>
      <line class="patrimoine__ground-line" x1="${GROUND.x1}" y1="${GROUND_Y}" x2="${GROUND.x2}" y2="${GROUND_Y}" />
      <image class="patrimoine__roof-photo" x="${HOUSE.eaveL.x}" y="${HOUSE.apex.y}" width="${HOUSE.eaveR.x - HOUSE.eaveL.x}" height="${HOUSE.eaveL.y - HOUSE.apex.y}" href="${ROOF_IMAGE}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${ROOF_CLIP_ID})" />
      <line x1="${HOUSE.apex.x}" y1="${HOUSE.apex.y}" x2="${HOUSE.eaveL.x}" y2="${HOUSE.eaveL.y}" />
      <line x1="${HOUSE.apex.x}" y1="${HOUSE.apex.y}" x2="${HOUSE.eaveR.x}" y2="${HOUSE.eaveR.y}" />
      <line x1="${HOUSE.eaveL.x}" y1="${HOUSE.eaveL.y}" x2="${HOUSE.eaveR.x}" y2="${HOUSE.eaveR.y}" />
      ${ligne1 || ligne2 ? `<ellipse class="patrimoine__text-glow" cx="${ROOF_GLOW.cx}" cy="${ROOF_GLOW.cy}" rx="${ROOF_GLOW.rx}" ry="${ROOF_GLOW.ry}" fill="url(#${GLOW_ID})" />` : ""}
      ${ligne1 ? `<text class="patrimoine__roof-texte" x="${HOUSE.apex.x}" y="77" text-anchor="middle">${escapeHtml(ligne1)}</text>` : ""}
      ${ligne2 ? `<text class="patrimoine__roof-sous-texte" x="${HOUSE.apex.x}" y="107" text-anchor="middle">${escapeHtml(ligne2)}</text>` : ""}
    </g>
  `;
}

// visible : le pilier fait partie des états déjà atteints.
// revealing : c'est LA transition qui le révèle (toggle) — seul ce cas
// joue le tracé (rect) + le halo qui ponctue la fin + le fondu décalé du
// picto/libellé ; une arrivée directe sur la slide à un état avancé
// (entering) se contente du fondu d'ensemble générique, comme pour le
// toit (rect déjà tracé, pas de halo — celui-ci ne rejoue pas à une
// arrivée directe).
function renderPillar(pillar, data, visible, revealing, entering) {
  if (!visible || !data) return "";
  const perimeter = 2 * (pillar.w + pillar.h);
  const wrapCls = "patrimoine__pillar" + (entering ? " is-entering" : "");
  const wrapAttrs = entering ? ` data-reveal style="--pillar-color:${pillar.color}"` : ` style="--pillar-color:${pillar.color}"`;

  const rectCls = "patrimoine__pillar-rect" + (revealing ? " patrimoine__pillar-rect--pulse" : "");
  const rectAttrs = revealing
    ? ` data-reveal stroke-dasharray="${perimeter}" style="stroke-dashoffset:${perimeter}" data-reveal-dashoffset="0"`
    : ` stroke-dasharray="${perimeter}" style="stroke-dashoffset:0"`;

  // Libellé seul, centré À L'INTÉRIEUR du pilier — plus de picto
  // au-dessus (retour de Victor : "je n'en ai plus besoin"). Halo
  // lumineux derrière (v5, même essai que le toit ci-dessus) plutôt que
  // le voile pâle sur tout le pilier — voir GLOW_ID.
  const centerX = pillar.x + pillar.w / 2;
  const labelY = pillar.y + pillar.h / 2;
  const glowHtml = `<ellipse class="patrimoine__text-glow" cx="${centerX}" cy="${labelY}" rx="95" ry="36" fill="url(#${GLOW_ID})" />`;

  const contentCls = "patrimoine__pillar-content" + (revealing ? " is-entering" : "");
  const contentAttrs = revealing ? " data-reveal" : "";

  // Photo (si fournie) : SOUS le rect, pas dans son propre calque — le
  // preserveAspectRatio="xMidYMid slice" : recadre en "cover" (remplit
  // le rectangle sans déformer), un <image> SVG se découpe de lui-même à
  // son viewport (x/y/width/height) sans clipPath dédié EN TEMPS NORMAL.
  // Plus de voile papier par-dessus (v5, retour de Victor) : couleurs
  // d'origine, le halo (glowHtml) fait le travail de contraste juste
  // derrière le mot.
  //
  // imageZoom (optionnel, voir PILLARS) : l'image est dessinée plus
  // grande que le pilier (centrée dessus) puis RECADRÉE sur les bords du
  // pilier via un clipPath dédié — sans lui, le zoom déborderait du
  // contour doré plutôt que de rester "dans" le pilier.
  const zoom = pillar.imageZoom || 1;
  const clipId = `patrimoine-pillar-clip-${pillar.id}`;
  const imgW = pillar.w * zoom;
  const imgH = pillar.h * zoom;
  const imgX = pillar.x - (imgW - pillar.w) / 2;
  const imgY = pillar.y - (imgH - pillar.h) / 2;
  const photoHtml = pillar.image
    ? `<image class="patrimoine__pillar-photo" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" href="${pillar.image}" preserveAspectRatio="xMidYMid slice"${zoom !== 1 ? ` clip-path="url(#${clipId})"` : ""} />`
    : "";
  const clipDefHtml =
    pillar.image && zoom !== 1
      ? `<clipPath id="${clipId}"><rect x="${pillar.x}" y="${pillar.y}" width="${pillar.w}" height="${pillar.h}" /></clipPath>`
      : "";

  return `
    <g class="${wrapCls}"${wrapAttrs}>
      <defs>${clipDefHtml}</defs>
      <ellipse class="patrimoine__shadow" cx="${centerX}" cy="${GROUND_Y + 5}" rx="93" ry="6" />
      ${photoHtml}
      <rect class="${rectCls}" x="${pillar.x}" y="${pillar.y}" width="${pillar.w}" height="${pillar.h}"${rectAttrs} />
      <g class="${contentCls}"${contentAttrs}>
        ${glowHtml}
        <text class="patrimoine__pillar-label" x="${centerX}" y="${labelY}" text-anchor="middle" dominant-baseline="central">${escapeHtml(data.texte)}</text>
      </g>
    </g>
  `;
}

export function render(slide, opts = {}) {
  const piliers = slide.piliers || [];
  const lastIndex = piliers.length; // état 0 = toit seul, 1..n = + pilier n
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), lastIndex);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const headerCls = "patrimoine__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const pillarsHtml = PILLARS.map((pillar, i) => {
    const pillarStateIndex = i + 1; // pilier 0 apparaît à l'état 1, pilier 1 à l'état 2
    const visible = stateIndex >= pillarStateIndex;
    const revealing = mode === "toggle" && stateIndex === pillarStateIndex;
    const data = piliers.find((p) => p.id === pillar.id);
    return renderPillar(pillar, data, visible, revealing, entering);
  }).join("");

  return `
    <div class="patrimoine">
      <div class="patrimoine__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="patrimoine__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="patrimoine__rule"></span>
          <h1 class="chap-title patrimoine__title">${escapeHtml(slide.titre)}</h1>
        </div>
        <div class="patrimoine__stage">
          <svg class="patrimoine__house" viewBox="0 -15 400 310" aria-hidden="true">
            <defs>
              <clipPath id="${ROOF_CLIP_ID}"><polygon points="${ROOF_POINTS}" /></clipPath>
              <radialGradient id="${GLOW_ID}">
                <stop offset="0%" stop-color="var(--papier)" stop-opacity="0.95" />
                <stop offset="55%" stop-color="var(--papier)" stop-opacity="0.7" />
                <stop offset="100%" stop-color="var(--papier)" stop-opacity="0" />
              </radialGradient>
            </defs>
            ${renderRoof(slide, entering)}
            ${pillarsHtml}
          </svg>
        </div>
      </div>
    </div>
  `;
}
