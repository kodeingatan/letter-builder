export function usePageTransition() {
  const { $anime } = useNuxtApp()

  function fadeInUp(el: Element) {
    if (!import.meta.client || !$anime) return
    $anime.animate(el, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      ease: 'outExpo',
    })
  }

  function fadeIn(el: Element) {
    if (!import.meta.client || !$anime) return
    $anime.animate(el, {
      opacity: [0, 1],
      duration: 400,
      ease: 'outCubic',
    })
  }

  function staggerFadeIn(els: Element[] | HTMLCollection) {
    if (!import.meta.client || !$anime) return
    $anime.animate(els, {
      opacity: [0, 1],
      translateY: [15, 0],
      delay: $anime.stagger(80),
      duration: 400,
      ease: 'outCubic',
    })
  }

  function slideInLeft(el: Element) {
    if (!import.meta.client || !$anime) return
    $anime.animate(el, {
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 500,
      ease: 'outExpo',
    })
  }

  return { fadeInUp, fadeIn, staggerFadeIn, slideInLeft }
}
