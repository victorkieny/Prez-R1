// Anime les éléments qui viennent d'apparaître dans une révélation
// progressive (voir js/deck.js stepForward/stepBackward). Le rendu d'une
// slide remplace tout son HTML à chaque changement d'état (pas de patch
// DOM ciblé) : une transition CSS ne peut donc pas se déclencher toute
// seule (l'élément "avant" n'existe plus, il n'y a rien dont partir). La
// solution : le renderer marque les éléments neufs avec l'attribut
// data-reveal (état de départ posé dans le HTML lui-même, via la classe
// .is-entering — voir chapitre.css), puis playReveal() retire cette
// classe une fois l'élément posé dans le DOM, ce qui déclenche la
// transition CSS vers l'état normal. Le double requestAnimationFrame
// garantit que le navigateur a bien peint l'état de départ avant qu'on
// ne le change (sinon le navigateur peut fusionner les deux états et ne
// jamais jouer la transition).
//
// data-reveal-height (optionnel) : pour un mouvement de valeur plutôt
// qu'un simple fondu (ex. le niveau d'une cuve qui descend) — la valeur
// de départ est posée en style inline, data-reveal-height porte la
// valeur cible ; playReveal() l'applique au même moment qu'elle retire
// .is-entering, sur le même tick.
//
// data-reveal-width / data-reveal-left (optionnels) : même principe que
// data-reveal-height, pour un mouvement horizontal (ex. une colonne qui
// se rétracte, un repère qui glisse le long d'un axe — "Investir en
// financement").
//
// data-reveal-transform (optionnel) : même principe pour un mouvement de
// transform plutôt qu'un fondu générique (ex. une barre qui se remplit
// en largeur, scaleX(0) -> scaleX(1)) — indépendant de .is-entering, qui
// porte son propre transform (scale uniforme) pour le fondu générique.
//
// data-reveal-dashoffset (optionnel) : pour un anneau (cercle au trait)
// qui se déploie dans le sens horaire, façon "wipe" d'horloge — la valeur
// de départ (stroke-dashoffset = circonférence, trait invisible) est
// posée en style inline, data-reveal-dashoffset porte la valeur cible (0,
// trait plein) ; un cercle SVG se trace depuis 3h dans le sens horaire,
// d'où l'effet.
//
// data-reveal-bg (optionnel) : pour un changement de couleur de fond
// plutôt qu'un fondu générique (ex. un gris qui devient vert) — la
// couleur de départ est posée en style inline (background), data-reveal-
// bg porte la couleur cible ; nécessite une transition CSS sur
// background-color côté règle (le fondu générique ne la couvre pas).
//
// data-reveal-opacity (optionnel, Prez-R1) : même principe pour une
// opacité qui bascule entre deux valeurs NON nulles (ex. une case qui
// perd l'emphase sans disparaître complètement — voir
// mon-metier.js/cadre-relation.js) — distinct de .is-entering, qui part
// toujours de 0 (une vraie apparition). L'opacité de départ est posée en
// style inline, data-reveal-opacity porte la cible ; l'opacité EST déjà
// couverte par la transition générique [data-reveal] ci-dessous, pas
// besoin d'une règle CSS séparée comme pour data-reveal-bg.
//
// data-reveal-color / data-reveal-border-color (optionnels, Prez-R1) :
// même principe que data-reveal-bg (couleur de départ en style inline,
// cible dans l'attribut), pour un libellé/contour qui change de couleur
// sans disparaître (ex. un libellé qui passe au doré quand sa case
// devient active) — nécessite une transition CSS sur color/border-color
// côté règle, même remarque que data-reveal-bg.
//
// data-reveal-filter (optionnel, Prez-R1) : même principe pour un flou
// qui apparaît/disparaît (ex. une mission qui n'est plus au premier plan,
// "Mon métier") — nécessite une transition CSS sur filter côté règle,
// même remarque que data-reveal-bg/data-reveal-color.
//
// data-reveal-margin-top (optionnel, Prez-R1) : même principe que
// data-reveal-height, à utiliser ENSEMBLE avec elle pour effondrer un
// élément dans son flux normal (ex. le sous-titre "Mon métier" qui
// disparaît à l'état résolu) plutôt que le sortir en position:absolute —
// un enfant de flex sorti en absolute retombe à la position de départ du
// conteneur flex (spec CSS : sa "position statique" est calculée comme
// s'il était seul), pas là où il se trouvait réellement dans le flux,
// d'où un saut visible vers le haut juste avant le fondu (retour de
// Victor). Animer height + margin-top vers 0 pendant le fondu d'opacité
// laisse l'élément dans le flux (aucun repositionnement de ce genre),
// juste sa propre boîte qui se réduit sur place.
export function playReveal(container) {
  const els = container.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    els.forEach((el) => {
      el.classList.remove("is-entering");
      if (el.dataset.revealHeight) el.style.height = el.dataset.revealHeight;
      if (el.dataset.revealWidth) el.style.width = el.dataset.revealWidth;
      if (el.dataset.revealLeft) el.style.left = el.dataset.revealLeft;
      if (el.dataset.revealTransform) el.style.transform = el.dataset.revealTransform;
      if (el.dataset.revealDashoffset) el.style.strokeDashoffset = el.dataset.revealDashoffset;
      if (el.dataset.revealBg) el.style.background = el.dataset.revealBg;
      if (el.dataset.revealOpacity) el.style.opacity = el.dataset.revealOpacity;
      if (el.dataset.revealColor) el.style.color = el.dataset.revealColor;
      if (el.dataset.revealBorderColor) el.style.borderColor = el.dataset.revealBorderColor;
      if (el.dataset.revealFilter) el.style.filter = el.dataset.revealFilter;
      if (el.dataset.revealMarginTop) el.style.marginTop = el.dataset.revealMarginTop;
    });
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      els.forEach((el) => {
        el.classList.remove("is-entering");
        if (el.dataset.revealHeight) el.style.height = el.dataset.revealHeight;
        if (el.dataset.revealWidth) el.style.width = el.dataset.revealWidth;
        if (el.dataset.revealLeft) el.style.left = el.dataset.revealLeft;
        if (el.dataset.revealTransform) el.style.transform = el.dataset.revealTransform;
        if (el.dataset.revealDashoffset) el.style.strokeDashoffset = el.dataset.revealDashoffset;
        if (el.dataset.revealBg) el.style.background = el.dataset.revealBg;
        if (el.dataset.revealOpacity) el.style.opacity = el.dataset.revealOpacity;
        if (el.dataset.revealColor) el.style.color = el.dataset.revealColor;
        if (el.dataset.revealBorderColor) el.style.borderColor = el.dataset.revealBorderColor;
        if (el.dataset.revealFilter) el.style.filter = el.dataset.revealFilter;
        if (el.dataset.revealMarginTop) el.style.marginTop = el.dataset.revealMarginTop;
      });
    });
  });
}
