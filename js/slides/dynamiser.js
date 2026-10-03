import { escapeHtml } from "../editable.js";
import { renderChapRail } from "./_chapitre.js";

// Gabarit "Comment dynamiser son patrimoine ?" (slide 18) — Victor,
// note de scope : le but est de faire toucher du doigt à l'investisseur
// les 3 leviers (les 3 moyens concrets) qu'il peut actionner pour se
// constituer du patrimoine (immobilier + placement, déjà établis sur
// "Le patrimoine") : Financement, Liquidités, Économie d'impôts — pas
// "Immobilier"/"Placements" (ce sont des véhicules déjà couverts avant,
// pas des leviers).
//
// D'où l'interrupteur (switch) plutôt qu'une carte ou une liste : le mot
// "levier" est pris au pied de la lettre — un levier, ça s'actionne, pas
// juste "un élément de plus qui apparaît". Chaque switch bascule d'éteint
// (terne) à allumé (couleur pleine, curseur qui glisse) au clic.
//
// v2 (retour de Victor) : interrupteurs empilés verticalement (plus en
// ligne), et surtout — chaque interrupteur allumé fait grossir un arbre
// qui pousse à côté. Point important : l'arbre ne doit PAS lire un ordre
// préférentiel entre les 3 leviers (contrairement à une courbe qui
// grossirait segment par segment, où le 2e partirait forcément d'où le
// 1er s'est arrêté). Solution : la pousse de l'arbre dépend uniquement
// du NOMBRE d'interrupteurs allumés, jamais de LEQUEL — même incrément
// de hauteur/feuillage à chaque clic, en doré neutre (pas la couleur du
// levier qui vient de s'allumer), pour qu'on ne puisse jamais dire "ce
// bout d'arbre appartient à ce levier". Tronc dessiné par segments (même
// technique de tracé progressif — stroke-dashoffset — que les arcs de
// "La vie d'un patrimoine").
//
// v2.1 (retour de Victor : "ça ressemble pas du tout à un arbre", 3
// grappes de petits cercles espacés empilées sur le tronc lisaient comme
// des perles sur un bâton) — le feuillage n'est plus 3 grappes séparées
// qui s'empilent, mais UN SEUL bouquet (5 cercles larges, très
// chevauchants, donc lus comme une masse continue plutôt que des bulles
// distinctes) qui grandit et monte en une seule pièce.
//
// v2.1.1 (retour de Victor, toujours "désastreux" / "ressemble à rien" —
// avec 3 photos de référence : un vrai tronc qui se ramifie en plusieurs
// branches, chacune finissant sur une touffe de feuillage, pas un bâton
// surmonté d'un pompon) — refonte complète de la géométrie : un
// squelette fixe (tronc -> 3 branches primaires -> 6 branches
// secondaires, chacune terminée par une petite touffe de feuilles), et
// c'est la FRACTION DESSINÉE de CHAQUE trait (stroke-dashoffset, 0 à 1)
// qui avance ensemble à chaque clic — pas un empilement de formes
// différentes par palier. Chaque branche a sa propre fenêtre de
// croissance sur une timeline 0→1 commune (le tronc pousse d'abord, les
// primaires ensuite, les secondaires enfin, les feuilles apparaissent en
// dernier) : à un palier donné, TOUTES les branches sont à la même
// "heure" de cette timeline, donc poussent de façon synchronisée au lieu
// d'apparaître une par une — exactement le "petit à petit, synchronisé"
// demandé par Victor.
//
// v2.2 (retour de Victor) : trois blocs côte à côte dans l'ordre du
// récit — Ta situation (gauche) -> les 3 interrupteurs (milieu) ->
// l'arbre (droite) — plutôt que "Ta situation" regroupée avec les
// interrupteurs dans un même panneau à gauche du jardin.
// v2.3 (retour de Victor : rouge/rose "ne renvoient pas une image assez
// positive" pour Liquidités/Économie d'impôts) — Liquidités reprend
// --vert (le plus franchement positif : croissance, épargne qui
// grandit ; partagé avec le sens "Immobilier" ailleurs dans le deck,
// risque faible puisque chaque slide est vue isolément en RDV).
//
// v2.4 (retour de Victor) — Économie d'impôts passe du turquoise à
// --rose-pale (même teinte que --rose, beaucoup plus claire).
const LEVIER_COLORS = {
  financement: "var(--bleu)",
  liquidites: "var(--vert)",
  impots: "var(--rose-pale)",
};

// Une teinte par état, chacune utilisée une seule fois sur cette slide :
// or (départ, neutre) -> bleu/vert/rose pâle (les 3 leviers, dans
// l'ordre où ils s'allument, mêmes teintes que LEVIER_COLORS) -> or de
// nouveau (résultat — on "boucle" sur le doré neutre du départ, même
// idée que l'état de clôture de vie-patrimoine.js, plutôt qu'inventer
// une 6e teinte).
const BACKDROPS = [
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 18%, rgba(111, 139, 167, 0.42), transparent 62%), radial-gradient(45% 55% at 15% 85%, rgba(158, 178, 196, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 82% 82%, rgba(122, 156, 131, 0.42), transparent 62%), radial-gradient(45% 55% at 18% 18%, rgba(158, 186, 166, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 18% 82%, rgba(189, 137, 156, 0.42), transparent 62%), radial-gradient(45% 55% at 82% 18%, rgba(207, 170, 183, 0.28), transparent 65%)",
  "radial-gradient(55% 60% at 18% 15%, rgba(185, 151, 97, 0.45), transparent 62%), radial-gradient(45% 55% at 85% 85%, rgba(199, 174, 137, 0.28), transparent 65%)",
];

// Même logique que benefices.js/conditions.js/patrimoine.js/
// vie-patrimoine.js : sur un "toggle", l'état précédent est déduit de
// stateIndex - 1 (navigation pas-à-pas) — correct en avançant, imprécis
// en reculant.
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
    return `<div class="dynamiser__backdrop"${attrs}></div>`;
  }).join("");
}

function renderArrow(visible, entering) {
  const showing = visible && entering;
  const attrs = showing
    ? ` data-reveal style="opacity:0" data-reveal-opacity="1"`
    : ` style="opacity:${visible ? 1 : 0}"`;
  return `
    <svg class="dynamiser__arrow"${attrs} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12H19M19 12L13 6M19 12L13 18" />
    </svg>
  `;
}

// on : ce levier fait partie des états déjà atteints (allumé).
// revealing : c'est CE clic qui l'allume — bascule animée (fondu +
// curseur qui glisse). entering : arrivée directe sur la slide à un
// état avancé — même bascule animée, rejouée pour chaque levier déjà
// acquis (comme les piliers de patrimoine.js). Sinon : état statique,
// pas d'animation (déjà réglé par un clic précédent, ou pas encore
// atteint).
function renderSwitch(levier, on, revealing, entering) {
  const color = LEVIER_COLORS[levier.id] || "var(--or)";
  const animate = on && (revealing || entering);
  const wrapAttrs = animate
    ? ` data-reveal style="--lever-color:${color};opacity:0.4" data-reveal-opacity="1"`
    : ` style="--lever-color:${color};opacity:${on ? 1 : 0.4}"`;
  const knobAttrs = animate
    ? ` data-reveal style="transform:translateX(0)" data-reveal-transform="translateX(var(--knob-travel))"`
    : ` style="transform:translateX(${on ? "var(--knob-travel)" : "0"})"`;
  // Libellé flouté tant que le levier n'est pas activé (retour de Victor)
  // : le client face à Victor ne doit pas pouvoir lire à l'avance les 3
  // leviers à venir — seul le flou se dissipe au moment précis où le
  // curseur se dégrise, jamais avant.
  const labelAttrs = animate
    ? ` data-reveal style="filter:blur(0.4cqw)" data-reveal-filter="blur(0)"`
    : ` style="filter:blur(${on ? "0" : "0.4cqw"})"`;

  return `
    <div class="dynamiser__switch"${wrapAttrs}>
      <div class="dynamiser__switch-track">
        <div class="dynamiser__switch-knob"${knobAttrs}></div>
      </div>
      <span class="dynamiser__switch-label"${labelAttrs}>${escapeHtml(levier.texte)}</span>
    </div>
  `;
}

// ---------- L'arbre ----------
// Retour de Victor sur la v1 (tronc + 3 branches + 6 brindilles) :
// "on est encore loin" d'un arbre réaliste — il veut beaucoup plus de
// ramifications, et qu'actionner UN levier fasse pousser PLUSIEURS
// branches à la fois sur tout l'arbre (pas juste une de plus), pour
// montrer concrètement l'effet "vertueux" du levier.
//
// Squelette généré par récursion (buildTree) plutôt qu'à la main : à
// chaque nœud, 2 branches filles partent de la pointe, plus courtes et
// plus fines que leur parent, jusqu'à MAX_DEPTH niveaux — 2^MAX_DEPTH
// brindilles, 2^(MAX_DEPTH+1)-1 segments au total. Une petite variation
// déterministe de l'angle et de la longueur (jitter, fonction de l'ordre
// de génération — jamais Math.random, pour que l'arbre soit identique à
// chaque rendu) évite la symétrie parfaite d'un fractal trop régulier.
//
// Chaque segment porte une fenêtre [début,fin] sur une timeline de
// pousse 0→1 commune à tout l'arbre, dérivée de sa PROFONDEUR (le tronc
// pousse en premier, les brindilles en dernier). Comme la profondeur
// double le nombre de branches à chaque niveau, un même "pas" sur la
// timeline (= un clic) découvre une bande de profondeur entière d'un
// coup — donc plusieurs branches qui poussent ensemble, de plus en plus
// nombreuses à mesure qu'on avance (exactement l'effet "plein de
// branches poussent d'un coup" demandé).
//
// v2 (retour de Victor) : silhouette trop "éventail plat" — tentative
// avec un recourbement progressif vers la verticale. Toujours trop
// plate/large (le même défaut, même en resserrant l'angle avec la
// profondeur).
//
// v3 (retour de Victor, photo de référence à l'appui) : "trop
// mathématique, trop régulier" — toutes les branches filaient vers le
// haut comme un fractal parfaitement binaire. Changement d'approche :
// chaque branche ne choisit plus son angle par rapport à sa propre
// direction (ça fait diverger ou converger tout le monde pareil, d'où
// l'éventail plat), elle vise un POINT sur un cercle qui représente le
// contour du houppier — et elle "possède" un secteur angulaire de ce
// cercle [a,b] qu'elle partage en deux pour ses deux branches filles
// (chacune vise le milieu de SA moitié de secteur). Ça couvre tout le
// cercle de façon régulière PAR CONSTRUCTION (silhouette ronde garantie,
// pas juste espérée), sans que les branches convergent vers un point ni
// ne filent toutes dans la même direction. Une légère courbe (bézier
// quadratique) et des longueurs/angles qui varient un peu (jitter
// déterministe, jamais Math.random) cassent le côté trop régulier d'un
// fractal géométrique. Petites feuilles (ellipses, pas des cercles —
// Victor n'en veut pas) sur les 3 derniers paliers de profondeur, pas
// juste au tout dernier : le feuillage se densifie progressivement
// plutôt que d'apparaître d'un coup à la fin.
const TREE_CX = 150;
const GROUND_Y = 370;
const TRUNK_TOP = { x: 148, y: 278 };
const CANOPY_CENTER = { x: 150, y: 185 };
const CANOPY_R = 110;
const MAX_DEPTH = 6;
const WIDTH_RATIO = 0.74;
const N_PRIMARY = 5; // nombre de membres principaux partant du tronc
const ARC_START = -205; // en degrés (0° = est, -90° = nord) : tout l'hémisphère
const ARC_END = 25; //  supérieur, et un peu sous l'horizontale de chaque côté

function det(o, seed, mod, sub) {
  return ((o * seed) % mod) - sub;
}

function circlePoint(thetaDeg, r) {
  const th = (thetaDeg * Math.PI) / 180;
  return { x: CANOPY_CENTER.x + r * Math.cos(th), y: CANOPY_CENTER.y + r * Math.sin(th) };
}

function angleTo(p, q) {
  return (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
}

function buildTree() {
  const segments = [];
  const leaves = [];
  let order = 0;

  // a,b : secteur angulaire (degrés) que cette branche doit couvrir sur
  // le cercle du houppier — elle vise le milieu de [a,b], puis le coupe
  // en deux pour ses filles (un léger chevauchement de 8% évite qu'elles
  // ne soient collées pile bord à bord).
  function recurse(x, y, a, b, length, width, depth) {
    order += 1;
    const o = order;
    const mid = (a + b) / 2;
    const target = circlePoint(mid, CANOPY_R);
    const toward = angleTo({ x, y }, target);
    const lenJitter = det(o, 53, 15, 7); // -7..7
    const angJitter = det(o * 3 + 1, 71, 15, 7); // -7..7

    const lengthEff = length * (1 + lenJitter / 55);
    const angleEff = toward + angJitter * 0.5;
    const rad = (angleEff * Math.PI) / 180;
    const toX = x + lengthEff * Math.cos(rad);
    const toY = y + lengthEff * Math.sin(rad);

    // Légère courbe (quadratique) plutôt qu'un trait parfaitement
    // rectiligne — magnitude proportionnelle à la longueur du segment
    // pour ne jamais produire de boucle.
    const curveJitter = det(o * 5 + 2, 37, 9, 4); // -4..4
    const midx = (x + toX) / 2;
    const midy = (y + toY) / 2;
    const bow = curveJitter * (lengthEff / 100) * 5;
    const perp = ((angleEff + 90) * Math.PI) / 180;
    const ctrl = { x: midx + bow * Math.cos(perp), y: midy + bow * Math.sin(perp) };

    const window = [depth / (MAX_DEPTH + 1), (depth + 1) / (MAX_DEPTH + 1)];
    segments.push({ from: { x, y }, ctrl, to: { x: toX, y: toY }, depth, width, window });

    // Petites feuilles sur les 3 derniers paliers (de plus en plus
    // nombreuses le long du segment à mesure qu'on approche la pointe) —
    // apparaissent dans la même fenêtre que leur propre segment.
    if (depth >= MAX_DEPTH - 2) {
      const n = depth >= MAX_DEPTH ? 3 : depth === MAX_DEPTH - 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const t = n > 1 ? 0.5 + (0.5 * i) / (n - 1) : 0.85;
        const px = x + (toX - x) * t;
        const py = y + (toY - y) * t;
        const lj = det(o * 7 + i, 41, 7, 3);
        const lx = px + lj;
        const ly = py + det(o * 11 + i, 31, 7, 3);
        const rot = det(o * 13 + i, 19, 180, 90);
        leaves.push({ x: lx, y: ly, rot, window });
      }
    }

    // Petite ramification latérale à mi-longueur, sur les branches
    // "intérieures" (paliers 1 à 3) — sans elle, la zone entre le tronc
    // et le bord du houppier reste nue (retour de Victor, photo
    // annotée : "il y a des feuilles que au bout des longues branches").
    // Pousse dans la fenêtre du palier SUIVANT (en même temps que la
    // prochaine vague de croissance), pas une fenêtre à part.
    if (depth >= 1 && depth <= 3) {
      const shootWindow = [(depth + 1) / (MAX_DEPTH + 1), (depth + 2) / (MAX_DEPTH + 1)];
      const sign = o % 2 === 0 ? 1 : -1;
      const st = 0.45 + det(o * 17 + 3, 19, 11, 5) / 40; // ~0.3..0.7 le long du segment porteur
      const sx = x + (toX - x) * st;
      const sy = y + (toY - y) * st;
      const shootAngle = angleEff + sign * (55 + det(o * 23 + 7, 13, 13, 6));
      const shootLen = 16 + det(o * 29 + 11, 11, 9, 4);
      const srad = (shootAngle * Math.PI) / 180;
      const sToX = sx + shootLen * Math.cos(srad);
      const sToY = sy + shootLen * Math.sin(srad);
      const shootWidth = Math.max(width * 0.55, 1);
      segments.push({
        from: { x: sx, y: sy },
        ctrl: { x: (sx + sToX) / 2, y: (sy + sToY) / 2 },
        to: { x: sToX, y: sToY },
        depth: depth + 1,
        width: shootWidth,
        window: shootWindow,
      });
      for (let i = 0; i < 2; i++) {
        const t2 = 0.6 + 0.4 * i;
        const lx = sx + (sToX - sx) * t2 + det(o * 31 + i, 17, 5, 2);
        const ly = sy + (sToY - sy) * t2 + det(o * 37 + i, 19, 5, 2);
        const rot = det(o * 41 + i, 23, 180, 90);
        leaves.push({ x: lx, y: ly, rot, window: shootWindow });
      }
    }

    if (depth >= MAX_DEPTH) return;

    const nextWidth = width * WIDTH_RATIO;
    const ratio1 = 0.74 + (lenJitter / 7) * 0.05;
    const ratio2 = 0.74 + (-lenJitter / 7) * 0.05;
    const span = ((b - a) / 2) * 1.08;
    recurse(toX, toY, mid - span, mid, length * ratio1, nextWidth, depth + 1);
    recurse(toX, toY, mid, mid + span, length * ratio2, nextWidth, depth + 1);
  }

  // Le tronc : deux segments (pas une seule tige bien droite) avec un
  // léger coude, une fine courbe et un affinement progressif — retour de
  // Victor : "qu'un bâton rectiligne, pas réaliste". Toujours le palier
  // 0 de la même timeline de pousse (déjà un peu visible à l'état de
  // départ), répartie sur les deux segments l'un après l'autre.
  const trunkMidY = GROUND_Y - (GROUND_Y - TRUNK_TOP.y) * 0.52;
  const trunkMidX = TREE_CX + 5; // léger décalage : pas une droite parfaite
  const trunkWindowA = [0, 0.5 / (MAX_DEPTH + 1)];
  const trunkWindowB = [0.5 / (MAX_DEPTH + 1), 1 / (MAX_DEPTH + 1)];
  segments.push({
    from: { x: TREE_CX, y: GROUND_Y },
    ctrl: { x: TREE_CX - 3, y: (GROUND_Y + trunkMidY) / 2 },
    to: { x: trunkMidX, y: trunkMidY },
    depth: 0,
    width: 5.6,
    window: trunkWindowA,
  });
  segments.push({
    from: { x: trunkMidX, y: trunkMidY },
    ctrl: { x: trunkMidX + 4, y: (trunkMidY + TRUNK_TOP.y) / 2 },
    to: TRUNK_TOP,
    depth: 0,
    width: 4.6,
    window: trunkWindowB,
  });

  for (let i = 0; i < N_PRIMARY; i++) {
    const a = ARC_START + ((ARC_END - ARC_START) * i) / N_PRIMARY;
    const b = ARC_START + ((ARC_END - ARC_START) * (i + 1)) / N_PRIMARY;
    const length0 = 50 + det(i * 7, 17, 13, 6);
    recurse(TRUNK_TOP.x, TRUNK_TOP.y, a, b, length0, 3.3, 1);
  }

  return { segments, leaves };
}

const TREE = buildTree();
const ALL_BRANCHES = TREE.segments;
const ALL_LEAVES = TREE.leaves;

// GROWTH_START : même au palier 0 (aucun levier allumé), le tronc est
// déjà un peu visible — "un tout petit arbre", pas une page blanche.
// maxStage (nombre de leviers) vient de slide.leviers.length, pas d'une
// constante en dur — la timeline est pleine (g=1) une fois tous les
// leviers allumés, quel que soit leur nombre.
const GROWTH_START = 0.1;
function growthAt(stage, maxStage) {
  const clamped = Math.min(Math.max(stage, 0), maxStage);
  return GROWTH_START + (1 - GROWTH_START) * (clamped / maxStage);
}

// Fraction dessinée (0 = invisible, 1 = entièrement tracé) d'un segment
// dont la fenêtre est [start,end], à l'instant g de la timeline globale.
function segFraction(g, [start, end]) {
  if (g <= start) return 0;
  if (g >= end) return 1;
  return (g - start) / (end - start);
}

// Un seul attribut style (--branch-width + stroke-dashoffset) : deux
// attributs style="" sur un même élément seraient invalides en HTML (le
// second serait ignoré par le parseur), d'où la fusion ici plutôt que
// dans deux chaînes séparées. Chemin = courbe quadratique (M...Q...),
// pas un <line> — voir ctrl, calculé dans buildTree.
function renderBranch(seg, revealing, prevG, curG) {
  const curOffset = 1 - segFraction(curG, seg.window);
  const d = `M ${seg.from.x.toFixed(1)} ${seg.from.y.toFixed(1)} Q ${seg.ctrl.x.toFixed(1)} ${seg.ctrl.y.toFixed(1)} ${seg.to.x.toFixed(1)} ${seg.to.y.toFixed(1)}`;
  let style;
  let reveal;
  if (revealing) {
    const prevOffset = 1 - segFraction(prevG, seg.window);
    style = `--branch-width:${seg.width.toFixed(2)};stroke-dashoffset:${prevOffset}`;
    reveal = ` data-reveal pathLength="1" stroke-dasharray="1" data-reveal-dashoffset="${curOffset}"`;
  } else {
    style = `--branch-width:${seg.width.toFixed(2)};stroke-dashoffset:${curOffset}`;
    reveal = ` pathLength="1" stroke-dasharray="1"`;
  }
  return `<path class="dynamiser__tree-branch" d="${d}" style="${style}"${reveal} />`;
}

// Petite feuille (ellipse allongée, pas un cercle) tournée selon son
// propre angle déterministe — apparaît (fondu d'opacité) dans la même
// fenêtre que la branche qui la porte, voir buildTree.
function renderLeaf(leaf, revealing, prevG, curG) {
  const curOp = segFraction(curG, leaf.window);
  const attrs = revealing
    ? ` data-reveal style="opacity:${segFraction(prevG, leaf.window)}" data-reveal-opacity="${curOp}"`
    : ` style="opacity:${curOp}"`;
  const x = leaf.x.toFixed(1);
  const y = leaf.y.toFixed(1);
  return `<ellipse class="dynamiser__tree-leaf" cx="${x}" cy="${y}" rx="3.6" ry="1.7" transform="rotate(${leaf.rot.toFixed(0)} ${x} ${y})"${attrs} />`;
}

// grownStages (0..3) : nombre de leviers allumés, jamais lié à l'identité
// du dernier actionné (voir note de tête) — c'est la seule entrée qui
// pilote toute la pousse. growthRevealing : vrai uniquement sur le clic
// qui avance la timeline (pas sur le clic final, qui ne fait que révéler
// le résultat une fois l'arbre à son palier maximum).
function renderTree(grownStages, maxStage, growthRevealing, entering) {
  const curG = growthAt(grownStages, maxStage);
  const prevG = growthAt(grownStages - 1, maxStage);

  const branchesHtml = ALL_BRANCHES.map((seg) => renderBranch(seg, growthRevealing, prevG, curG)).join("");
  const leavesHtml = ALL_LEAVES.map((leaf) => renderLeaf(leaf, growthRevealing, prevG, curG)).join("");

  const wrapCls = "dynamiser__tree-growth" + (entering ? " is-entering" : "");
  const wrapAttrs = entering ? " data-reveal" : "";

  // viewBox recadré : le houppier plein (toutes branches, mesuré via
  // getBBox) occupe y≈107..381 sur les 0..400 d'origine — gardait 106px
  // de vide au-dessus contre 19px en dessous, ce qui faisait paraître
  // l'arbre "trop bas" une fois centré dans la rangée (retour de
  // Victor). "0 88 300 302" recadre serré sur ce contenu, marges haut/
  // bas équilibrées.
  return `
    <svg class="dynamiser__tree" viewBox="0 88 300 302" aria-hidden="true">
      <ellipse class="dynamiser__tree-shadow" cx="${TREE_CX}" cy="${GROUND_Y + 5}" rx="125" ry="6" />
      <line class="dynamiser__tree-ground" x1="${TREE_CX - 135}" y1="${GROUND_Y}" x2="${TREE_CX + 135}" y2="${GROUND_Y}" />
      <g class="${wrapCls}"${wrapAttrs}>
        ${branchesHtml}
        ${leavesHtml}
      </g>
    </svg>
  `;
}

export function render(slide, opts = {}) {
  const leviers = slide.leviers || [];
  const resultat = slide.resultat || [];
  // v4 (retour de Victor) : ordre de révélation inversé — "la promesse
  // d'abord, le mécanisme ensuite" plutôt que l'inverse. État 0 : accroche
  // minimale ("Ta situation" + flèche centrale + le résultat déjà en
  // entier — "voici où tu vas"). État 1 : tout le mécanisme apparaît d'un
  // coup (interrupteurs éteints, flèche situation->interrupteurs, tronc
  // nu, flèche arbre->résultat) — "voici comment". États 2..n+1 : chaque
  // levier s'allume un à un et fait pousser l'arbre (inchangé, juste
  // décalé d'un cran par rapport à avant).
  const lastIndex = leviers.length + 1; // 0 = accroche, 1 = mécanisme nu, 2..n+1 = leviers qui s'allument
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), lastIndex);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";

  const headerCls = "dynamiser__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  const introCls = "dynamiser__intro" + (entering ? " is-entering" : "");
  const introAttrs = entering ? " data-reveal" : "";

  // Mécanisme (interrupteurs + arbre + leurs 2 flèches encadrantes) :
  // invisible à l'état 0, apparaît en bloc à l'état 1 — pas de flèche qui
  // pointerait vers un bloc encore invisible, pas d'interrupteur qui
  // apparaîtrait avant qu'on explique le mécanisme.
  const mechVisible = stateIndex >= 1;
  const mechRevealing = mode === "toggle" && stateIndex === 1;
  const mechAnimate = mechVisible && (mechRevealing || entering);
  const mechAttrs = mechAnimate
    ? ` data-reveal style="opacity:0" data-reveal-opacity="1"`
    : ` style="opacity:${mechVisible ? 1 : 0}"`;

  const switchesHtml = leviers
    .map((levier, i) => {
      const stateForThis = i + 2; // décalé d'un cran : l'état 1 introduit déjà les interrupteurs (éteints)
      const on = stateIndex >= stateForThis;
      const revealing = mode === "toggle" && stateIndex === stateForThis;
      return renderSwitch(levier, on, revealing, entering);
    })
    .join("");

  // Flèche "Ta situation -> interrupteurs" : apparaît avec le mécanisme
  // (état 1), pas avant.
  const arrowInHtml = renderArrow(mechVisible, mechRevealing || entering);

  // Flèche centrale (interrupteurs -> arbre) : seule visible dès l'état 0
  // — repère du teaser ("ta situation mène à ça"), avant même que le
  // mécanisme n'apparaisse.
  const arrowCentralHtml = renderArrow(true, entering);

  // L'arbre pousse d'un palier par levier allumé, quel qu'il soit —
  // grownStages = nombre de leviers actuellement allumés, jamais lié à
  // l'identité du dernier actionné (voir note de tête). Décalé d'un cran
  // par rapport à stateIndex (l'état 1 montre un tronc nu, 0 levier
  // allumé). growthRevealing : vrai uniquement sur les clics qui avancent
  // la pousse (états 2..n+1), pas sur le clic qui ne fait que révéler le
  // mécanisme (état 1, où grownStages reste à 0).
  const grownStages = Math.min(Math.max(stateIndex - 1, 0), leviers.length);
  const growthRevealing = mode === "toggle" && stateIndex >= 2;
  const treeHtml = renderTree(grownStages, leviers.length, growthRevealing, entering);

  // Flèche "arbre -> résultat" : apparaît avec le mécanisme (état 1), en
  // même temps que le tronc nu.
  const arrowToResultHtml = renderArrow(mechVisible, mechRevealing || entering);

  // Résultat : visible dès l'arrivée sur la slide (état 0 compris) — la
  // promesse "+ De capital..." sert d'accroche avant d'expliquer le
  // mécanisme (retour de Victor), donc plus liée aux leviers — seule anim
  // restante : le fondu d'entrée sur la slide.
  const resultItems = resultat.map((ligne) => `<p class="dynamiser__result-item">${escapeHtml(ligne)}</p>`).join("");
  const resultAttrs = entering ? ` data-reveal style="opacity:0" data-reveal-opacity="1"` : ` style="opacity:1"`;

  return `
    <div class="dynamiser">
      <div class="dynamiser__backdrops">${renderBackdrops(stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="dynamiser__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="dynamiser__rule"></span>
          <h1 class="chap-title dynamiser__title">${escapeHtml(slide.titre)}</h1>
        </div>
        <div class="dynamiser__flow">
          <div class="${introCls}"${introAttrs}>
            <span class="dynamiser__situation">${escapeHtml(slide.situation)}</span>
          </div>
          ${arrowInHtml}
          <div class="dynamiser__switches"${mechAttrs}>${switchesHtml}</div>
          ${arrowCentralHtml}
          <div class="dynamiser__garden"${mechAttrs}>
            ${treeHtml}
          </div>
          ${arrowToResultHtml}
          <div class="dynamiser__result"${resultAttrs}>${resultItems}</div>
        </div>
      </div>
    </div>
  `;
}
