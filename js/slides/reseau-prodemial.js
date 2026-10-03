import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Solutions d'investissement" (slide 5) — indépendance de
// conseil / architecture ouverte, DEUX idées distinctes à ne pas
// mélanger visuellement (v2, retour de Victor) :
//   - Réseau Prodémial : la stratégie patrimoniale se construit à
//     plusieurs (plusieurs confrères, plusieurs cerveaux) — une plaque
//     autonome, un registre à part, pas un simple libellé parmi
//     d'autres.
//   - Stellium (3 pôles : Financement/Immobilier/Placement) : l'entité
//     qui référence et négocie les solutions — "Offre référencée et
//     négociée par :" chapeaute UNIQUEMENT ce bloc-là, jamais le réseau
//     (le premier jet les faisait chapeauter tous les deux à la fois,
//     retour de Victor : "on ne comprend pas trop le rôle de chacun").
// Rangée de 3 cartes (pas de médaillons en cercle reliés par des
// rayons) : le premier jet, façon "constellation"/orbite, répétait trop
// la slide 3 (mon-metier__orbit) — retour de Victor : "sortir de cette
// logique de cercle".
//
// v3 (retour de Victor) — 3 états, révélation progressive plutôt qu'une
// slide figée d'un coup (comme cadre-relation.js/mon-metier.js) :
//   0. titre + sous-titre seuls.
//   1. + le bloc Réseau Prodémial, dont le réseau de neurones SE DESSINE
//      (stroke-dashoffset par trait, même technique que les anneaux de
//      mon-metier__orbit-ring) plutôt que d'apparaître d'un coup.
//   2. + les 3 cartes Stellium.
// Révélation UNIQUEMENT vers l'avant (retour en arrière : le bloc
// disparaît net, sans animation dédiée) — Victor n'a demandé qu'un sens,
// pas la peine d'en construire un deuxième.
//
// Pôles : le PPTX (slide 5) avait Courtage et Invest séparés — retour de
// Victor : "c'est caduc désormais", fusionnés en un seul "Stellium
// Placement" (logo fourni par Victor, rose — voir --rose dans
// theme.css). Toujours retypographiés dans la police du deck plutôt
// qu'importés tels quels (choix de Victor sur le premier jet, inchangé).
const POLES = [
  { id: "financement", color: "var(--bleu)", delay: "260ms" },
  { id: "immobilier", color: "var(--vert)", delay: "340ms" },
  { id: "placement", color: "var(--rose)", delay: "420ms" },
];

// Fond qui change de teinte avec l'état (retour de Victor : "je veux que
// les couleurs changent en arrière-plan, comme on avait fait en slide 2
// et 3") — même mécanisme que TIMELINE_BACKDROPS (cadre-relation.js) /
// BACKDROPS (mon-metier.js) : un dégradé par état, en fondu croisé au
// clic (voir renderBackdrops). États 0 et 1 (titre seul, puis + réseau)
// gardent le doré du premier jet — rien ne doit changer avant l'offre ;
// état 2 (+ cartes Stellium) bascule vers un mélange des 3 teintes des
// pôles (bleu/vert/rose, voir POLES ci-dessus) plutôt qu'une couleur
// inventée — le fond dit "l'offre complète" pile quand elle apparaît.
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(50% 55% at 15% 20%, rgba(111, 139, 167, 0.4), transparent 62%), radial-gradient(50% 55% at 85% 20%, rgba(122, 156, 131, 0.38), transparent 62%), radial-gradient(55% 60% at 50% 88%, rgba(172, 107, 130, 0.4), transparent 65%)",
];

// Même logique que cadre-relation.js/mon-metier.js : sur un "toggle",
// l'état précédent est déduit de stateIndex - 1 (navigation pas-à-pas,
// un cran à la fois) — correct en avançant ; en reculant, l'état 2 -> 1
// ne redémarre pas forcément du bon dégradé de départ, mais les états 0
// et 1 étant identiques ici, ce cas de figure reste discret (aucune
// des deux directions n'a été demandée à animer proprement en arrière).
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
    return `<div class="reseau-prodemial__backdrop"${attrs}></div>`;
  }).join("");
}

// Petit "réseau de neurones" au-dessus de la plaque "Réseau Prodémial"
// (retour de Victor : la plaque dorée seule lisait comme "aseptisée",
// il veut que la slide illustre l'idée de réfléchir à plusieurs cerveaux
// sur un même dossier client) — un semis de nœuds reliés entre eux ET
// tous reliés à un nœud central (le "hub", plus grand, plein) qui
// redescend vers la plaque : plusieurs esprits, une réflexion commune.
// Coordonnées à la main dans un viewBox fixe (220x104), pas générées :
// un cluster asymétrique/organique lit "réflexion collective" bien mieux
// qu'une grille régulière, qui lirait "schéma technique". Décoratif pur
// (aria-hidden) : rien ici n'est un repère de contenu (pas un nœud par
// pôle ou par confrère précis), juste une texture qui porte l'idée.
const NEURAL_NODES = [
  { cx: 34, cy: 28, r: 3 },
  { cx: 72, cy: 10, r: 2.6 },
  { cx: 116, cy: 24, r: 3.6 },
  { cx: 152, cy: 8, r: 2.4 },
  { cx: 188, cy: 30, r: 3.2 },
];
const NEURAL_HUB = { cx: 108, cy: 58, r: 4.6 };
const NEURAL_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 2],
  [2, 4],
];
const NEURAL_CONNECTOR_Y = 104; // bas du viewBox, touche le haut de la plaque juste en dessous

function lineLength(p1, p2) {
  return Math.hypot(p2.cx - p1.cx, p2.cy - p1.cy);
}

// drawing : true uniquement sur la transition qui révèle ce bloc (état
// 0 -> 1) — chaque trait se trace (stroke-dashoffset : longueur pleine
// -> 0, voir data-reveal-dashoffset dans reveal.js), les nœuds/le hub
// s'allument en fondu au fil de l'eau, en cascade (arêtes du maillage
// d'abord, rayons vers le hub ensuite, hub, puis le trait qui descend
// vers la plaque) — jamais un simple fondu d'ensemble, c'est le "se
// dessine petit à petit" demandé par Victor. Hors de cette transition
// précise (bloc déjà visible, ou arrivée directe sur la slide à un état
// avancé) : rendu statique, sans le mécanisme dashoffset.
function renderReseauNetwork(drawing) {
  const edgeLines = NEURAL_EDGES.map(([a, b], i) => {
    const p1 = NEURAL_NODES[a];
    const p2 = NEURAL_NODES[b];
    const len = lineLength(p1, p2);
    if (!drawing) return `<line x1="${p1.cx}" y1="${p1.cy}" x2="${p2.cx}" y2="${p2.cy}" />`;
    const delay = `${i * 35}ms`;
    return `<line x1="${p1.cx}" y1="${p1.cy}" x2="${p2.cx}" y2="${p2.cy}" data-reveal stroke-dasharray="${len}" style="stroke-dashoffset:${len};transition-delay:${delay}" data-reveal-dashoffset="0" />`;
  }).join("");

  const spokeLines = NEURAL_NODES.map((p, i) => {
    const len = lineLength(p, NEURAL_HUB);
    if (!drawing) return `<line x1="${p.cx}" y1="${p.cy}" x2="${NEURAL_HUB.cx}" y2="${NEURAL_HUB.cy}" />`;
    const delay = `${220 + i * 35}ms`;
    return `<line x1="${p.cx}" y1="${p.cy}" x2="${NEURAL_HUB.cx}" y2="${NEURAL_HUB.cy}" data-reveal stroke-dasharray="${len}" style="stroke-dashoffset:${len};transition-delay:${delay}" data-reveal-dashoffset="0" />`;
  }).join("");

  const connectorLen = NEURAL_CONNECTOR_Y - NEURAL_HUB.cy;
  const connectorAttrs = drawing
    ? ` data-reveal stroke-dasharray="${connectorLen}" style="stroke-dashoffset:${connectorLen};transition-delay:480ms" data-reveal-dashoffset="0"`
    : ` stroke-dasharray="${connectorLen}" style="stroke-dashoffset:0"`;
  const connector = `<line x1="${NEURAL_HUB.cx}" y1="${NEURAL_HUB.cy}" x2="${NEURAL_HUB.cx}" y2="${NEURAL_CONNECTOR_Y}"${connectorAttrs} />`;

  const nodes = NEURAL_NODES.map((p, i) => {
    if (!drawing) return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" />`;
    const delay = `${40 + i * 35}ms`;
    return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" class="is-entering" data-reveal style="transform-box:view-box;transform-origin:${p.cx}px ${p.cy}px;transition-delay:${delay}" />`;
  }).join("");

  const hubCls = "reseau-prodemial__network-hub" + (drawing ? " is-entering" : "");
  const hubAttrs = drawing
    ? ` data-reveal style="transform-box:view-box;transform-origin:${NEURAL_HUB.cx}px ${NEURAL_HUB.cy}px;transition-delay:380ms"`
    : "";

  return `
    <svg class="reseau-prodemial__network" viewBox="0 0 220 104" aria-hidden="true">
      <g class="reseau-prodemial__network-edges">
        ${edgeLines}
        ${spokeLines}
        ${connector}
      </g>
      <g class="reseau-prodemial__network-nodes">${nodes}</g>
      <circle class="${hubCls}" cx="${NEURAL_HUB.cx}" cy="${NEURAL_HUB.cy}" r="${NEURAL_HUB.r}"${hubAttrs} />
    </svg>
  `;
}

// reserving : le bloc "offre" existe déjà dans le DOM (état 1, avant
// d'être montré) pour réserver sa place — voir la note sur
// .reseau-prodemial__offre plus bas — mais ses cartes ne doivent pas
// encore se voir ; opacity:0 statique (pas de data-reveal, rien à
// transitionner ici, juste caché en attendant son tour).
function renderPole(pole, slide, revealing, reserving) {
  const data = (slide.poles || []).find((p) => p.id === pole.id);
  if (!data) return "";
  const cls = "reseau-prodemial__pole" + (revealing ? " is-entering" : "");
  let attrs;
  if (revealing) {
    attrs = ` data-reveal style="--pole-color:${pole.color};transition-delay:${pole.delay}"`;
  } else if (reserving) {
    attrs = ` style="--pole-color:${pole.color};opacity:0"`;
  } else {
    attrs = ` style="--pole-color:${pole.color}"`;
  }
  return `
    <div class="${cls}"${attrs}>
      <p class="reseau-prodemial__pole-brand">Stellium</p>
      <p class="reseau-prodemial__pole-specialite">${escapeHtml(data.specialite)}</p>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const lastIndex = 2;
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), lastIndex);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const reseauVisible = stateIndex >= 1;
  const offreVisible = stateIndex >= 2;
  // Transition qui révèle chaque bloc pour la première fois (voir note
  // en tête de fichier) — seul ce cas précis joue l'animation détaillée
  // (traits qui se dessinent / cartes qui apparaissent en cascade) ;
  // l'arrivée directe sur la slide à un état avancé (mode "enter") se
  // contente d'un fondu d'ensemble, comme le reste du deck.
  const revealingReseau = mode === "toggle" && stateIndex === 1;
  const revealingOffre = mode === "toggle" && stateIndex === 2;
  // Le bloc offre existe dans le DOM dès que le réseau apparaît (état 1),
  // avant même d'être montré (voir plus bas) : sa place est ainsi déjà
  // réservée quand il se montre réellement à l'état 2, donc la plaque
  // "Réseau Prodémial" au-dessus ne bouge plus d'un pixel entre les deux
  // — retour de Victor : sans ça, .reseau-prodemial__stage (flex column,
  // justify-content:center) recentrait toute la colonne dès que le bloc
  // offre apparaissait, ce qui faisait sauter la plaque vers le haut.
  const offreReserving = reseauVisible && !offreVisible;

  const headerCls = "reseau-prodemial__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  // Les wrappers eux-mêmes ne portent un fondu que sur une ARRIVÉE
  // DIRECTE sur la slide à un état avancé (entering) — sur la
  // transition qui révèle spécifiquement le bloc (revealingReseau/
  // revealingOffre), ce sont ses ENFANTS qui portent chacun leur propre
  // révélation en cascade (traits du réseau, plaque, libellé, cartes) ;
  // si le wrapper animait EN PLUS, ça ferait un double fondu (le
  // conteneur ET son contenu qui apparaissent chacun de leur côté).
  const reseauWrapCls = "reseau-prodemial__reseau-wrap" + (entering ? " is-entering" : "");
  const reseauWrapAttrs = entering ? ` data-reveal style="transition-delay:120ms"` : "";

  // La plaque elle-même n'apparaît qu'APRÈS que le trait connecteur a
  // fini de se dessiner (connecteur : délai 480ms + durée ~420ms, voir
  // renderReseauNetwork/CSS) — sinon le texte "Réseau Prodémial" serait
  // déjà visible pendant que le réseau au-dessus est encore en train de
  // se tracer, ce qui contredirait l'idée "le réseau converge, PUIS se
  // nomme" (retour de Victor : le réseau doit se dessiner petit à petit
  // avant que le bloc ne s'impose).
  const reseauPlaqueCls = "reseau-prodemial__reseau" + (revealingReseau ? " is-entering" : "");
  const reseauPlaqueAttrs = revealingReseau ? ` data-reveal style="transition-delay:900ms"` : "";

  // is-entering seulement si le bloc offre est VISIBLE et qu'on arrive
  // directement sur la slide à cet état (entering) : à l'état 1
  // (offreReserving), le wrapper existe mais ne doit surtout pas fondre
  // à l'arrivée puisqu'il n'est pas censé se voir — voir opacity:0 posé
  // sur ses enfants (renderPole/offreLabelAttrs) dans ce cas.
  const offreWrapCls = "reseau-prodemial__offre" + (entering && offreVisible ? " is-entering" : "");
  const offreWrapAttrs = entering && offreVisible ? ` data-reveal style="transition-delay:100ms"` : "";
  const poles = POLES.map((p) => renderPole(p, slide, revealingOffre, offreReserving)).join("");

  const offreLabelCls = "reseau-prodemial__offre-label" + (revealingOffre ? " is-entering" : "");
  const offreLabelAttrs = revealingOffre
    ? ` data-reveal style="transition-delay:40ms"`
    : offreReserving
      ? ` style="opacity:0"`
      : "";

  return `
    <div class="reseau-prodemial">
      <div class="reseau-prodemial__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="reseau-prodemial__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="reseau-prodemial__rule"></span>
          <h1 class="chap-title reseau-prodemial__title">${escapeHtml(slide.titre)}</h1>
          ${slide.intro ? `<p class="chap-subtitle reseau-prodemial__intro">${escapeHtml(slide.intro)}</p>` : ""}
        </div>
        <div class="reseau-prodemial__stage">
          ${
            slide.reseau && reseauVisible
              ? `<div class="${reseauWrapCls}"${reseauWrapAttrs}>
                  ${renderReseauNetwork(revealingReseau)}
                  <p class="${reseauPlaqueCls}"${reseauPlaqueAttrs}>${escapeHtml(slide.reseau)}</p>
                </div>`
              : ""
          }
          ${
            reseauVisible
              ? `<div class="${offreWrapCls}"${offreWrapAttrs}>
                  ${slide.offreLabel ? `<p class="${offreLabelCls}"${offreLabelAttrs}>${escapeHtml(slide.offreLabel)}</p>` : ""}
                  <div class="reseau-prodemial__poles">${poles}</div>
                </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}
