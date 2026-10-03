// Slide de couverture — première image vue par le client, seule slide du
// deck à ne recevoir ni client/date via meta (voir js/deck.js), ni rail
// de chapitre. Entrée en cascade quand opts.animate (arrivée sur la
// présentation, jamais au clic à l'intérieur — cette slide n'a qu'un
// seul état) : logo, puis kicker, puis titre, puis repère client/date,
// chacun décalé d'un cran (voir data-reveal + transition-delay, même
// mécanisme que cadre-relation.js/mon-metier.js).
export function render(slide, opts = {}) {
  const meta = [slide.client, slide.date].filter(Boolean).join(" · ");
  const entering = !!opts.animate;

  const reveal = (delay) => (entering ? ` class="is-entering" data-reveal style="transition-delay:${delay}"` : "");

  return `
    <div class="cover">
      <img class="cover__logo" src="assets/logo-transparent.png" alt="Logo"${reveal("0ms")}>
      ${slide.kicker ? `<p class="cover__kicker"${reveal("140ms")}>${slide.kicker}</p>` : ""}
      <h1 class="cover__title"${reveal("260ms")}>${slide.title}</h1>
      ${meta ? `<p class="cover__meta"${reveal("420ms")}>${meta}</p>` : ""}
    </div>
  `;
}
