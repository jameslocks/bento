import { Bento } from './bento.js'
import { SoundEngine } from './sound.js'
import { defaultSkin } from './skins/default.js'
import { getSkin } from './skins/index.js'

function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')
  const skinButtons = document.querySelectorAll('.skin-btn')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => bento.resize(), 100)
  })

  skinButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      skinButtons.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const skin = getSkin(btn.dataset.skin)
      bento.setSkin(skin)
      sound.boop()
    })
  })

  window.__bento = bento
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}