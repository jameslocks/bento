import { Bento } from './bento.js'
import { SoundEngine } from './sound.js'
import { defaultSkin } from './skins/default.js'
import { getSkin } from './skins/index.js'

function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  window.__bento = bento
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}