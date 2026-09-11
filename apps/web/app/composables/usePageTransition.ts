export function usePageTransition() {
  const { $anime } = useNuxtApp()

  function shouldReduceMotion(): boolean {
    if (!import.meta.client) return true
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }

  function fadeInUp(el: Element) {
    if (!import.meta.client || !$anime || shouldReduceMotion()) return
    $anime.animate(el, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 250,
      ease: 'outQuad',
    })
  }

  function fadeIn(el: Element) {
    if (!import.meta.client || !$anime || shouldReduceMotion()) return
    $anime.animate(el, {
      opacity: [0, 1],
      duration: 250,
      ease: 'outQuad',
    })
  }

  function staggerFadeIn(els: Element[] | HTMLCollection) {
    if (!import.meta.client || !$anime || shouldReduceMotion()) return
    $anime.animate(els, {
      opacity: [0, 1],
      translateY: [15, 0],
      delay: $anime.stagger(50),
      duration: 250,
      ease: 'outQuad',
    })
  }

  function slideInLeft(el: Element) {
    if (!import.meta.client || !$anime || shouldReduceMotion()) return
    $anime.animate(el, {
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 350,
      ease: 'outQuad',
    })
  }

  return { fadeInUp, fadeIn, staggerFadeIn, slideInLeft }
}
