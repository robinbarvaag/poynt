import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";

/**
 * Bevegelses-effekten som knyttes til dra-posisjonen i karusellen.
 * - `none`     — rein sveip, ingen tween.
 * - `parallax` — bildet inne i slide-ramma gli-r saktere enn ramma selv.
 * - `scale`    — nabo-slides krymper litt, den aktive står størst.
 * - `opacity`  — nabo-slides tones ned.
 * - `depth`    — scale + opacity: gir en rolig «dybde»-følelse.
 */
export type CarouselEffect =
  | "none"
  | "parallax"
  | "scale"
  | "opacity"
  | "depth";

type EffectFlags = { parallax: boolean; scale: boolean; opacity: boolean };

const EFFECTS: Record<CarouselEffect, EffectFlags> = {
  none: { parallax: false, scale: false, opacity: false },
  parallax: { parallax: true, scale: false, opacity: false },
  scale: { parallax: false, scale: true, opacity: false },
  opacity: { parallax: false, scale: false, opacity: true },
  depth: { parallax: false, scale: true, opacity: true },
};

// Utslaget for en slide som ligger nøyaktig ÉN posisjon unna den aktive.
// Embla sine egne eksempler ganger med et «tween factor base» og lar utslaget
// vokse fritt; det er laget for én-slide-om-gangen og blir altfor voldsomt på
// en rail med 3-4 synlige. Her normaliserer vi i stedet avstanden til
// snap-enheter og klemmer den til [-1, 1], slik at utslaget er det samme
// uansett hvor mange slides eller snap-punkter karusellen har.
const PARALLAX_SHIFT = 20; // prosent av lagets bredde
const SCALE_DROP = 0.16; // 1 → 0.84
const OPACITY_DROP = 0.55; // 1 → 0.45

/** Data-attributtet på laget som parallax-forskyves (bildet/videoen). */
export const CAROUSEL_LAYER_ATTR = "data-carousel-layer";
/** Data-attributtet på flata som skaleres/tones (hele slide-innholdet). */
export const CAROUSEL_TWEEN_ATTR = "data-carousel-tween";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Regner ut avstanden fra hver slide til sitt snap-punkt (i snap-enheter, der
 * 1 = én posisjon unna) og skriver effekten rett på DOM-nodene. Loop-håndtering
 * er tatt fra Embla sine offisielle tween-eksempler: når en slide er «lånt» til
 * andre enden av løkka må avstanden måles mot den lånte posisjonen.
 */
export function applyCarouselTween(
  emblaApi: EmblaCarouselType,
  effect: CarouselEffect,
  eventName?: EmblaEventType
): void {
  const flags = EFFECTS[effect];
  if (!(flags.parallax || flags.scale || flags.opacity)) return;

  const engine = emblaApi.internalEngine();
  const scrollProgress = emblaApi.scrollProgress();
  const slidesInView = emblaApi.slidesInView();
  const isScrollEvent = eventName === "scroll";
  const snapList = emblaApi.scrollSnapList();
  const slideNodes = emblaApi.slideNodes();

  for (const [snapIndex, scrollSnap] of snapList.entries()) {
    const slidesInSnap = engine.slideRegistry[snapIndex];
    if (!slidesInSnap) continue;

    for (const slideIndex of slidesInSnap) {
      // Under selve draget holder vi oss til det som faktisk er synlig.
      if (isScrollEvent && !slidesInView.includes(slideIndex)) continue;

      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        for (const loopItem of engine.slideLooper.loopPoints) {
          const target = loopItem.target();
          if (slideIndex !== loopItem.index || target === 0) continue;
          const sign = Math.sign(target);
          if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
          if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
        }
      }

      // scrollProgress går 0→1 over HELE karusellen, så vi ganger opp med
      // antall snap-punkt for å få avstanden i «posisjoner unna».
      const distance = clamp(diffToTarget * snapList.length, -1, 1);
      const magnitude = Math.abs(distance);

      const slide = slideNodes[slideIndex];
      if (!slide) continue;

      if (flags.parallax) {
        const layer = slide.querySelector<HTMLElement>(
          `[${CAROUSEL_LAYER_ATTR}]`
        );
        if (layer) {
          layer.style.transform = `translateX(${distance * -PARALLAX_SHIFT}%)`;
        }
      }

      if (flags.scale || flags.opacity) {
        const target =
          slide.querySelector<HTMLElement>(`[${CAROUSEL_TWEEN_ATTR}]`) ?? slide;
        if (flags.scale) {
          target.style.transform = `scale(${1 - SCALE_DROP * magnitude})`;
        }
        if (flags.opacity) {
          target.style.opacity = `${1 - OPACITY_DROP * magnitude}`;
        }
      }
    }
  }
}

/** Nullstiller alt tween-en har skrevet — brukes når effekten skrus av. */
export function resetCarouselTween(emblaApi: EmblaCarouselType): void {
  for (const slide of emblaApi.slideNodes()) {
    const layer = slide.querySelector<HTMLElement>(`[${CAROUSEL_LAYER_ATTR}]`);
    if (layer) layer.style.transform = "";
    const target =
      slide.querySelector<HTMLElement>(`[${CAROUSEL_TWEEN_ATTR}]`) ?? slide;
    target.style.transform = "";
    target.style.opacity = "";
  }
}
