import * as cover from "./slides/cover.js";
import * as sectionTitle from "./slides/section-title.js";
import * as cadreRelation from "./slides/cadre-relation.js";
import * as monMetier from "./slides/mon-metier.js";
import * as reseauProdemial from "./slides/reseau-prodemial.js";
import * as partenaires from "./slides/partenaires.js";
import * as benefices from "./slides/benefices.js";
import * as conditions from "./slides/conditions.js";
import * as patrimoine from "./slides/patrimoine.js";
import * as viePatrimoine from "./slides/vie-patrimoine.js";
import * as dynamiser from "./slides/dynamiser.js";
import * as criteres from "./slides/criteres.js";
import * as conclusion from "./slides/conclusion.js";
import { playReveal } from "./reveal.js";

// Registre partagé par index.html (aperçu solo), presenter.html et
// audience.html. Chaque renderer expose `render(slide, opts)` -> HTML, et
// optionnellement `setup(container, slide, pristine, onChange)` pour les
// slides "calculator" (montants/scénarios modifiables en RDV). Les slides
// purement explicatives n'ont pas de `setup`.
//
// Prez-R1 : gabarits repris tels quels de Prez-R2 (cover, section-title)
// + nouveaux gabarits ajoutés ici au fur et à mesure du contenu.
export const renderers = {
  cover: { render: cover.render },
  "section-title": { render: sectionTitle.render },
  "cadre-relation": { render: cadreRelation.render },
  "mon-metier": { render: monMetier.render },
  "reseau-prodemial": { render: reseauProdemial.render },
  partenaires: { render: partenaires.render },
  benefices: { render: benefices.render },
  conditions: { render: conditions.render },
  patrimoine: { render: patrimoine.render },
  "vie-patrimoine": { render: viePatrimoine.render },
  dynamiser: { render: dynamiser.render },
  criteres: { render: criteres.render },
  conclusion: { render: conclusion.render },
};

// client/date/chapitres ne sont plus répétés sur chaque slide de
// data/deck.json (source de désynchronisation si on en oubliait un en
// mettant à jour le client ou la date) : définis une seule fois dans
// meta, injectés ici sur chaque slide au chargement — renderChapRail
// (voir js/slides/_chapitre.js, appelé par la plupart des gabarits) les
// lit ensuite comme avant, sur slide.client/slide.chapitres, sans rien
// changer côté gabarits. chapitreActif reste propre à chaque slide (1,
// 2 ou 3), lui ne vient pas de meta. "cover" seule n'en reçoit pas :
// elle ne les a jamais eus (ni renderChapRail ni son propre
// cover__meta ne les consomment pour elle avant ce refactor) — lui en
// injecter ferait apparaître une ligne "client · date" qui n'existait
// pas.
export async function loadDeck() {
  // Prez-R1 : présentation unique et fixe (pas de système multi-client
  // comme Prez-R2) — data/deck.json est la seule source.
  const res = await fetch("data/deck.json");
  const deck = await res.json();
  const { client, date, chapitres } = deck.meta || {};
  deck.slides.forEach((slide) => {
    if (slide.type === "cover") return;
    slide.client = client;
    slide.date = date;
    slide.chapitres = chapitres;
  });
  return deck;
}

// ---------- Révélation progressive (états internes d'une slide) ----------
// slide.states (optionnel) : liste ordonnée d'états à dérouler avant de
// passer à la slide suivante — voir GABARITS "Fiscalité des rachats"
// (6 états) et "Impact fiscal" (2 états). Chaque renderer qui déclare des
// états lit opts.stateIndex pour savoir lequel afficher ; sans états, la
// slide n'a qu'une position implicite (0). Fonctions pures, partagées par
// app.js / presenter.js / audience.js — pas de logique dupliquée.

export function stateCount(slide) {
  return Array.isArray(slide.states) && slide.states.length > 0 ? slide.states.length : 1;
}

export function clampStateIndex(slide, stateIndex) {
  return Math.min(Math.max(stateIndex, 0), stateCount(slide) - 1);
}

// Avance d'un cran : état suivant de la slide courante si elle n'est pas
// à son dernier état, sinon première slide visible suivante (état 0).
// Retourne null si on est déjà sur le tout dernier état de la dernière
// slide visible.
export function stepForward(slides, hidden, pos) {
  const slide = slides[pos.slideIndex];
  if (pos.stateIndex < stateCount(slide) - 1) {
    return { slideIndex: pos.slideIndex, stateIndex: pos.stateIndex + 1 };
  }
  for (let i = pos.slideIndex + 1; i < slides.length; i++) {
    if (!hidden.has(slides[i].id)) return { slideIndex: i, stateIndex: 0 };
  }
  return null;
}

// Recule d'un cran : état précédent de la slide courante, sinon dernière
// slide visible précédente (à son dernier état, pour reprendre le fil
// dans le même sens que l'avancée). Retourne null en tout début de deck.
export function stepBackward(slides, hidden, pos) {
  if (pos.stateIndex > 0) {
    return { slideIndex: pos.slideIndex, stateIndex: pos.stateIndex - 1 };
  }
  for (let i = pos.slideIndex - 1; i >= 0; i--) {
    if (!hidden.has(slides[i].id)) return { slideIndex: i, stateIndex: stateCount(slides[i]) - 1 };
  }
  return null;
}

// Scène 16:9 d'une slide (voir css/slides.css : .slide__stage est un
// container query, tout le contenu s'y met à l'échelle en cqw).
export function renderStageHtml(slideData, opts = {}) {
  const renderer = renderers[slideData.type];
  if (!renderer) return "";
  return `<div class="slide__stage slide--${slideData.type}"><div class="slide__content">${renderer.render(
    slideData,
    opts
  )}</div></div>`;
}

// Rend la scène courante dans `container` et joue les animations de
// révélation des éléments neufs (voir js/reveal.js) — point d'entrée
// unique utilisé par app.js/presenter.js/audience.js pour la slide
// "vivante", plutôt que de réassigner innerHTML + appeler playReveal
// séparément à trois endroits. Ne pas utiliser pour les miniatures/
// aperçus figés (renderPreviewHtml) : eux ne jouent pas ces animations.
export function mountStage(container, slideData, opts = {}) {
  container.innerHTML = renderStageHtml(slideData, opts);
  playReveal(container);
}

// Aperçu réduit (miniatures de navigation) : cadre de taille fixe
// (.stage-preview, voir presenter.css), dans lequel .slide__stage est
// rendu à sa largeur de référence normale (1280px) puis réduit en bloc
// par transform:scale — pas de rendu natif à ~128px, où les planchers de
// lisibilité (font-size:max(Npx, Mcqw)) feraient déborder le texte.
export function renderPreviewHtml(slideData, opts = {}) {
  const stage = renderStageHtml(slideData, { readonly: true, ...opts });
  return `<div class="stage-preview">${stage}</div>`;
}
