import { Bento } from './bento.js'
import { ShakeDetector } from './shake.js'
import { SoundEngine } from './sound.js'
import { SettingsStore } from './settings.js'
import { defaultSkin } from './skins/default.js'

function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')
  const settingsBtn = document.getElementById('settings-btn')
  const settingsOverlay = document.getElementById('settings-overlay')
  const settingsClose = document.getElementById('settings-close')
  const settingsForm = document.getElementById('settings-form')

  if (!canvas || !canvas.getContext) {
    if (fallback) fallback.classList.remove('hidden')
    return
  }

  const sound = new SoundEngine()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.start()

  const shake = new ShakeDetector(() => bento.triggerDizzy())

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => bento.resize(), 100)
  })

  // Settings
  const settings = new SettingsStore()

  settingsBtn.addEventListener('click', () => {
    const data = settings.getAll()
    for (const [key, value] of Object.entries(data)) {
      const input = settingsForm.elements[key]
      if (input) input.value = value
    }
    settingsOverlay.classList.remove('hidden')
  })

  settingsClose.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden')
  })

  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.add('hidden')
    }
  })

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(settingsForm)
    for (const [key, value] of formData.entries()) {
      settings.set(key, value)
    }
    settingsOverlay.classList.add('hidden')
  })

  window.__bento = bento
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}