import { escapeHtml } from "../editable.js";
import { renderChapRail, iconSvg } from "./_chapitre.js";

// Gabarit "Mon métier" (slide 3) — 4 missions, révélation progressive en 5
// états (slide.states = [{},{},{},{},{}]) : états 0-3, une mission à la
// fois occupe un cadre central (mon-metier__reel) ; état 4, le cadre
// s'efface et les 4 symboles tournent en continu autour d'un cercle
// (mon-metier__orbit — animation CSS ininterrompue, pas pilotée par
// clic), la conclusion fixe en son centre.
//
// mon-metier__stage (voir render()) : cadre et orbite sont centrés dans
// l'espace restant SOUS le header, indépendamment de la hauteur de ce
// dernier (flex:1 + align/justify:center — voir chapitre.css), plutôt
// que dans le même groupe que le header (margin:auto 0) — sinon le
// centre visuel de l'orbite se décale selon que l'intro tient sur une ou
// deux lignes, ce qui lisait comme "pas centré" (retour de Victor).
//
// Fond : une tinte propre à la mission au premier plan (mon-metier__
// backdrop, une par mission, radial/dégradé + flou — pas de photo, voir
// data/deck.json mission.icon) occupe toute la scène et change avec la
// mission montrée ; jamais de fond fixe pendant qu'on parcourt les 4.
// À l'état résolu (4, l'orbite), les 4 fonds réapparaissent ensemble à
// faible opacité plutôt que de s'éteindre (voir RESOLVED_BLEND_OPACITY) —
// un mélange discret des 4 teintes pour la slide de synthèse, pas un fond
// blanc.
//
// Cadre central : les missions ne se juxtaposent plus en ligne (largeurs
// qui varient), elles se succèdent UNE A LA FOIS dans un même cadre fixe
// (bordure fine + repères de coin, écho miniature du repère de coin du
// deck lui-même — voir .slide__stage::before/after dans chapitre.css) :
// au clic, la mission qui quitte le cadre part par le haut, celle qui
// arrive entre par le bas — toujours dans le même sens, comme un rouleau
// de machine à sous qui tourne, jamais une bascule aller-retour.
//
// Deux régimes d'animation distincts (voir opts.slideChanged, posé par
// presenter.js/audience.js — même principe que cadre-relation.js) :
//   - ARRIVÉE sur la slide (animate && slideChanged) : header puis le
//     cadre (ou l'orbite, à l'état 4) entrent en fondu — pas de
//     défilement à ce moment-là, la slide s'affiche déjà à sa pose
//     d'arrivée.
//   - CLIC sur la scène, même slide (animate && !slideChanged) : soit le
//     défilement dans le cadre (missions 0 à 3 entre elles), soit le
//     passage cadre -> orbite en franchissant l'état 4 (et retour, en
//     arrière) — jamais les deux en même temps.

// Teintes de fond par mission (mission.icon -> dégradé), pas des photos :
// on reprend les couleurs déjà du thème (--or/--bleu/--vert, voir
// theme.css) plutôt que d'inventer une palette de plus, pour rester dans
// le même registre chromatique que le reste du deck.
const BACKDROPS = {
  capital:
    "radial-gradient(55% 60% at 20% 18%, rgba(185, 151, 97, 0.55), transparent 62%), radial-gradient(45% 50% at 85% 82%, rgba(199, 174, 137, 0.35), transparent 65%)",
  sablier:
    "radial-gradient(60% 55% at 82% 15%, rgba(185, 151, 97, 0.45), transparent 60%), radial-gradient(55% 60% at 15% 85%, rgba(199, 174, 137, 0.3), transparent 65%)",
  bouclier:
    "radial-gradient(60% 60% at 78% 22%, rgba(111, 139, 167, 0.45), transparent 60%), radial-gradient(50% 55% at 18% 85%, rgba(158, 178, 196, 0.3), transparent 65%)",
  "economie-impot":
    "radial-gradient(55% 60% at 22% 78%, rgba(122, 156, 131, 0.45), transparent 60%), radial-gradient(45% 50% at 82% 18%, rgba(122, 156, 131, 0.28), transparent 65%)",
};

// À l'état résolu (4, l'orbite), les 4 fonds ne s'éteignent pas — ils
// restent tous visibles ensemble, mais très atténués (0.4 au lieu de 1) :
// un fond blanc à ce moment-là était "dommage" pour la slide qui fait
// justement la synthèse des 4 missions (retour de Victor) ; un mélange
// discret des 4 teintes déjà utilisées dit "synthèse" plus juste qu'une
// nouvelle couleur ou un fond neutre.
const RESOLVED_BLEND_OPACITY = "0.4";

// Hauteur d'une ligne de sous-titre (voir .chap-subtitle dans
// chapitre.css : font-size 1.71875cqw * line-height 1.42) et sa marge
// (voir .mon-metier__intro : margin-top) — utilisées pour l'effondrer
// proprement (height + margin-top -> 0) au franchissement de la
// frontière résolue, voir plus bas. À resynchroniser si l'une des deux
// règles CSS change.
const INTRO_LINE_HEIGHT = "2.440625cqw";
const INTRO_MARGIN_TOP = "1.328125cqw";

function renderBackdrops(missions, stateIndex, mode) {
  const resolved = stateIndex >= 4;
  return missions
    .map((m, i) => {
      const cur = resolved ? RESOLVED_BLEND_OPACITY : i === stateIndex ? "1" : "0";
      let attrs;
      if (mode === "toggle" && stateIndex >= 1) {
        const prevResolved = stateIndex - 1 >= 4;
        const prev = prevResolved ? RESOLVED_BLEND_OPACITY : i === stateIndex - 1 ? "1" : "0";
        attrs = ` data-reveal style="opacity:${prev}" data-reveal-opacity="${cur}"`;
      } else {
        attrs = ` style="opacity:${cur}"`;
      }
      return `<div class="mon-metier__backdrop mon-metier__backdrop--${m.icon}"${attrs}></div>`;
    })
    .join("");
}

// Pas de libellé court (mission.label, "Ton patrimoine"...) : seul le
// texte (mission.texte, "Se constituer ou accroitre leur patrimoine"...)
// est affiché, en gras — retour de Victor : "je ne veux pas que tu
// écrives ton patrimoine... je veux simplement que tu écrives se
// constituer ou accroître leur patrimoine... et tu l'écris en gras,
// comme tu écrivais avant [le libellé]".
function renderReelContent(mission) {
  return `
    <span class="mon-metier__reel-icon">${iconSvg(mission.icon, "var(--or)", 56)}</span>
    <p class="mon-metier__reel-texte">${escapeHtml(mission.texte)}</p>
  `;
}

// Durée unique de l'orbite (arms ET icônes, voir orbit-arm/orbit-icon
// dans chapitre.css) — les deux animations doivent partager exactement la
// même durée pour rester en phase indéfiniment (l'icône annule la
// rotation de son bras en tournant à la même vitesse, en sens inverse).
const ORBIT_DURATION_S = 34;

// Orbite récapitulative (état 4) : les 4 symboles tournent en continu
// autour d'un cercle (voir mon-metier__orbit-arm), la conclusion fixe au
// centre — pas de libellé sur les icônes en orbite (seulement le
// symbole) : à ce stade on ne "lit" plus mission par mission, on regarde
// l'ensemble tourner pendant que le message central reste. Le décalage
// (animation-delay négatif, un quart de tour par icône) répartit les 4
// symboles à 90° les uns des autres SANS valeur d'angle statique — c'est
// le déphasage dans le temps qui tient lieu de position de départ, donc
// il doit rester identique entre le bras et son icône (même délai) pour
// que l'annulation de rotation reste exacte à chaque instant.
// Chaque symbole est serti dans son propre médaillon (badge rond, bordure
// or, fond papier — mon-metier__orbit-badge) plutôt que posé nu sur
// l'anneau : c'est ce sertissage, pas seulement le mouvement, qui doit
// lire comme "incrusté". Le médaillon central (mon-metier__orbit-seal)
// reprend le même traitement à plus grande échelle pour la conclusion,
// de sorte que les 5 pièces (4 symboles + centre) appartiennent
// visiblement à une seule famille d'objets.
function renderOrbit(missions, conclusion) {
  const spokes = missions
    .map((m, i) => {
      const delay = `${-(ORBIT_DURATION_S / missions.length) * i}s`;
      return `<span class="mon-metier__orbit-spoke" style="animation-delay:${delay}"></span>`;
    })
    .join("");

  const icons = missions
    .map((m, i) => {
      const delay = `${-(ORBIT_DURATION_S / missions.length) * i}s`;
      // Logos en noir (var(--encre), pas --or) — retour de Victor : à
      // l'état résolu, le repère n'est plus la couleur dorée du système
      // mais le symbole lui-même, qui doit se détacher plus franchement
      // du médaillon papier.
      return `
        <span class="mon-metier__orbit-arm" style="animation-delay:${delay}">
          <span class="mon-metier__orbit-icon" style="animation-delay:${delay}">
            <span class="mon-metier__orbit-badge">${iconSvg(m.icon, "var(--encre)", 40)}</span>
          </span>
        </span>
      `;
    })
    .join("");

  return `
    <div class="mon-metier__orbit-ring"></div>
    <div class="mon-metier__orbit-ring mon-metier__orbit-ring--inner"></div>
    ${spokes}
    ${icons}
    <div class="mon-metier__orbit-seal">
      <p class="mon-metier__orbit-conclusion">${escapeHtml(conclusion || "")}</p>
    </div>
  `;
}

export function render(slide, opts = {}) {
  const stateIndex = Math.min(Math.max(opts.stateIndex ?? 0, 0), 4);
  const animate = !!opts.animate;
  const entering = animate && !!opts.slideChanged;
  const mode = entering ? "enter" : animate ? "toggle" : "static";
  const missions = slide.missions || [];
  const lastIndex = missions.length - 1;
  const resolved = stateIndex > lastIndex;
  const curIndex = Math.min(stateIndex, lastIndex);

  const headerCls = "mon-metier__header" + (entering ? " is-entering" : "");
  const headerAttrs = entering ? " data-reveal" : "";

  // Cadre (défilement des missions) et orbite récapitulative : lequel des
  // deux existe dans le DOM dépend du mode — voir note en tête de
  // fichier. Un seul des deux est jamais présent, SAUF pendant le
  // franchissement de la frontière résolue (3 <-> 4, mode "toggle"), où
  // les deux coexistent le temps du fondu croisé.
  let reelHtml = "";
  let orbitHtml = "";
  // Pas de sous-titre à l'état résolu (l'orbite) : il complète mal
  // "Accompagner durablement" (retour de Victor — la phrase "Trouver et
  // mettre en place des solutions pour aider des personnes à :" ne mène
  // plus nulle part une fois les 4 missions passées, ça sort du cadre des
  // états) et laisse plus de place au cercle qui tourne. Par défaut : pas
  // résolu -> affiché normalement ; résolu, hors franchissement de
  // frontière -> absent du DOM.
  let introHtml = slide.intro && !resolved ? `<p class="chap-subtitle mon-metier__intro">${escapeHtml(slide.intro)}</p>` : "";

  if (mode === "toggle" && stateIndex >= 1) {
    const prevIndex = stateIndex - 1;
    const wasResolved = prevIndex > lastIndex;
    const crossingBoundary = wasResolved !== resolved;

    // Fondu du sous-titre synchronisé avec le franchissement de la
    // frontière résolue (3 <-> 4, voir crossingBoundary plus bas), sur SA
    // PROPRE hauteur (height + margin-top vers 0, voir data-reveal-
    // margin-top dans reveal.js) plutôt qu'en le sortant du flux
    // (position:absolute) : un enfant de flex abspos retombe à la
    // position de départ du conteneur (spec CSS : sa position "statique"
    // est calculée comme s'il était seul), pas à sa position réelle dans
    // le flux — ça faisait sauter le sous-titre vers le haut juste avant
    // le fondu (retour de Victor : "c'est comme si le sous-titre était
    // déplacé vers le haut avant de disparaître"). En l'effondrant sur
    // place, il reste dans le flux tout du long, ce saut ne peut donc pas
    // se produire, dans les deux sens (3 -> 4 ET 4 -> 3).
    if (crossingBoundary && slide.intro) {
      const introOpacityFrom = wasResolved ? "0" : "1";
      const introOpacityTo = resolved ? "0" : "1";
      const introHeightFrom = wasResolved ? "0" : INTRO_LINE_HEIGHT;
      const introHeightTo = resolved ? "0" : INTRO_LINE_HEIGHT;
      const introMarginFrom = wasResolved ? "0" : INTRO_MARGIN_TOP;
      const introMarginTo = resolved ? "0" : INTRO_MARGIN_TOP;
      introHtml = `<p class="chap-subtitle mon-metier__intro" data-reveal style="overflow:hidden;opacity:${introOpacityFrom};height:${introHeightFrom};margin-top:${introMarginFrom}" data-reveal-opacity="${introOpacityTo}" data-reveal-height="${introHeightTo}" data-reveal-margin-top="${introMarginTo}">${escapeHtml(slide.intro)}</p>`;
    }

    if (crossingBoundary) {
      // 3 -> 4 ou 4 -> 3 : pas de défilement (une seule mission dans le
      // cadre, celle des deux côtés de la frontière) — le SORTANT grossit
      // au point que ses bords dépassent la scène (scale, découpé net par
      // overflow:hidden sur .slide__stage, voir slides.css), comme un
      // cadre qu'on traverserait, pendant que l'ENTRANT apparaît en
      // douceur (léger zoom + fondu) — c'est le sortant qui "explique" la
      // transition, l'entrant reste discret (retour de Victor : le cadre
      // grossit et déborde de la slide, laissant apparaître le cercle).
      //
      // Le sortant passe en position:absolute (surimpression centrée,
      // voir mon-metier__stage/position:relative dans chapitre.css) :
      // sinon, tant que les deux coexistent dans le DOM (le temps du
      // fondu, ET encore juste après puisque rien ne déclenche de nouveau
      // rendu une fois l'état 4 atteint), le sortant — même invisible à
      // opacity:0 — reste dans le flux et continue de pousser l'entrant
      // hors du centre (c'est ce qui faisait apparaître l'orbite "trop
      // bas" avant ce correctif).
      //
      // Durée doublée (transition-duration inline, voir plus bas) sur le
      // SEUL sortant : le grossissement doit se voir passer, la durée
      // standard (chap-duration-move, ~420ms) est pensée pour des
      // micro-changements d'état, pas pour un mouvement de cette
      // amplitude.
      const reelIsOutgoing = !wasResolved && resolved;
      const orbitIsOutgoing = wasResolved && !resolved;
      const outgoingScale = "4.2";
      const longDuration = "transition-duration:calc(var(--chap-duration-move) * 2);";

      function outgoingStyle(isOutgoing) {
        if (!isOutgoing) return "";
        return `position:absolute;top:50%;left:50%;${longDuration}transform:translate(-50%,-50%) scale(1);`;
      }
      function outgoingRevealTransform(isOutgoing) {
        return isOutgoing ? ` data-reveal-transform="translate(-50%,-50%) scale(${outgoingScale})"` : "";
      }
      // Entrant : léger zoom d'arrivée (0.82 -> 1), jamais l'inverse du
      // sortant (pas de symétrie scale(4)->1 : l'entrant doit rester
      // discret pendant que le sortant traverse le cadre).
      function incomingStyle(isIncoming) {
        return isIncoming ? "transform:scale(0.82);" : "";
      }
      function incomingRevealTransform(isIncoming) {
        return isIncoming ? ` data-reveal-transform="scale(1)"` : "";
      }

      const reelOpacityFrom = wasResolved ? "0" : "1";
      const reelOpacityTo = resolved ? "0" : "1";
      const orbitOpacityFrom = wasResolved ? "1" : "0";
      const orbitOpacityTo = resolved ? "1" : "0";
      const reelIsIncoming = !reelIsOutgoing;
      const orbitIsIncoming = !orbitIsOutgoing;

      if (reelIsOutgoing) {
        // Cadre -> orbite : "on zoom DANS ce rectangle" (retour de
        // Victor), pas juste un cadre qui grossit en fondu. Deux pièces
        // dissociées plutôt qu'un seul bloc qui grossit avec son contenu :
        //   - mon-metier__reel-frame : la bordure/le fond SEULS, sans
        //     texte — grossit (scale) tout en restant PLEINEMENT opaque
        //     (transition sur `opacity` séparée de celle sur `transform`,
        //     avec un délai qui la fait quasiment coïncider avec la fin
        //     du grossissement) — les bords ne "fondent" jamais en
        //     transparence pendant qu'ils balaient l'écran, ils effacent
        //     l'ancien fond sur leur passage puis disparaissent net une
        //     fois hors-champ, plutôt qu'un dégradé progressif.
        //   - mon-metier__reel-exit-content : l'icône/le libellé/le texte
        //     ("Ta fiscalité"), qui eux ne grossissent JAMAIS (aucun
        //     transform animé) — juste un fondu court, quasi immédiat,
        //     comme si le contenu était retiré avant que le cadre ne se
        //     mette à zoomer, pas emporté avec lui.
        const scaleDuration = "calc(var(--chap-duration-move) * 2)"; // ~840ms
        // Délai/durée calés géométriquement (pas au jugé) sur la distance
        // réelle entre le centre du cadre et le bas du sous-titre — voir
        // le calcul (bissection sur cubic-bezier(0.4,0,0.2,1),
        // var(--chap-ease-move)) mené en DevTools : le bord haut du cadre
        // atteindrait le sous-titre à ~31% de la durée du grossissement
        // (scale ≈ 2,25) ; le fondu commence à 28% et se termine à 50%
        // (scale ≈ 1,76 à la fin du fondu) pour rester nettement en
        // dessous de ce seuil — le cadre est donc déjà invisible avant
        // d'atteindre le bloc titre/sous-titre, jamais après (retour de
        // Victor : "je ne veux pas que ça se superpose avec le bloc
        // titre/sous-titre"). Ce calibrage est spécifique à la géométrie
        // actuelle de cette slide (position du sous-titre, taille du
        // cadre) — à revoir si l'un des deux change sensiblement.
        const frameFadeDuration = "calc(var(--chap-duration-move) * 0.22)"; // ~185ms
        const frameFadeDelay = "calc(var(--chap-duration-move) * 0.28)"; // ~235ms
        const contentFadeDuration = "calc(var(--chap-duration-move) * 0.4)"; // ~170ms, sans délai

        reelHtml = `
          <div class="mon-metier__reel-frame" data-reveal style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);opacity:1;transition:transform ${scaleDuration} var(--chap-ease-move), opacity ${frameFadeDuration} var(--chap-ease-move) ${frameFadeDelay}" data-reveal-transform="translate(-50%,-50%) scale(${outgoingScale})" data-reveal-opacity="0"></div>
          <div class="mon-metier__reel-exit-content" data-reveal style="opacity:1;transition:opacity ${contentFadeDuration} var(--chap-ease-move)" data-reveal-opacity="0">
            ${renderReelContent(missions[lastIndex])}
          </div>
        `;
      } else {
        reelHtml = `
          <div class="mon-metier__reel" data-reveal style="${incomingStyle(reelIsIncoming)}opacity:${reelOpacityFrom}"${incomingRevealTransform(reelIsIncoming)} data-reveal-opacity="${reelOpacityTo}">
            <div class="mon-metier__reel-viewport">
              <div class="mon-metier__reel-item">${renderReelContent(missions[lastIndex])}</div>
            </div>
          </div>
        `;
      }
      orbitHtml = `
        <div class="mon-metier__orbit" data-reveal style="${outgoingStyle(orbitIsOutgoing)}${incomingStyle(orbitIsIncoming)}opacity:${orbitOpacityFrom}"${outgoingRevealTransform(orbitIsOutgoing)}${incomingRevealTransform(orbitIsIncoming)} data-reveal-opacity="${orbitOpacityTo}">
          ${renderOrbit(missions, slide.conclusion)}
        </div>
      `;
    } else if (!resolved) {
      // Défilement normal entre deux missions (toutes deux < 4) : la
      // mission précédente quitte le cadre par le haut, celle en cours
      // entre par le bas — le "rouleau" (voir note en tête de fichier).
      reelHtml = `
        <div class="mon-metier__reel">
          <div class="mon-metier__reel-viewport">
            <div class="mon-metier__reel-item mon-metier__reel-item--leaving" data-reveal style="transform:translateY(0%);opacity:1" data-reveal-transform="translateY(-130%)" data-reveal-opacity="0">
              ${renderReelContent(missions[prevIndex])}
            </div>
            <div class="mon-metier__reel-item mon-metier__reel-item--entering" data-reveal style="transform:translateY(130%);opacity:0" data-reveal-transform="translateY(0%)" data-reveal-opacity="1">
              ${renderReelContent(missions[curIndex])}
            </div>
          </div>
        </div>
      `;
    }
  }

  // Cas restants (mode "enter"/"static", ou "toggle" à l'état 0 — jamais
  // atteint puisque stepForward part toujours de l'état 0 vers l'état 1
  // au minimum) : un seul des deux blocs, sans animation de transition
  // propre (l'entrée en fondu globale de la slide s'en charge, voir
  // entering ci-dessous) — pas de défilement ni de fondu croisé ici.
  if (!reelHtml && !orbitHtml) {
    if (resolved) {
      orbitHtml = `
        <div class="mon-metier__orbit${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          ${renderOrbit(missions, slide.conclusion)}
        </div>
      `;
    } else {
      reelHtml = `
        <div class="mon-metier__reel${entering ? " is-entering" : ""}"${entering ? " data-reveal" : ""}>
          <div class="mon-metier__reel-viewport">
            <div class="mon-metier__reel-item">${renderReelContent(missions[curIndex])}</div>
          </div>
        </div>
      `;
    }
  }

  return `
    <div class="mon-metier">
      <div class="mon-metier__backdrops">${renderBackdrops(missions, stateIndex, mode)}</div>
      ${renderChapRail(slide)}
      <div class="mon-metier__body">
        <div class="${headerCls}"${headerAttrs}>
          <span class="mon-metier__rule"></span>
          <h1 class="chap-title mon-metier__title">${escapeHtml(slide.titre)}</h1>
          ${introHtml}
        </div>
        <div class="mon-metier__stage">
          ${reelHtml}
          ${orbitHtml}
        </div>
      </div>
    </div>
  `;
}
