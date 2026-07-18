import { Bento } from './bento.js'
import { ShakeDetector } from './shake.js'
import { SoundEngine } from './sound.js'
import { SettingsStore } from './settings.js'
import { AudioManager } from './audio.js'
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
  bento._checkBirthday(settings)

  const audio = new AudioManager()
  bento.setAudioManager(audio)

  // Preload common audio files
  audio.preload('abcdefghijklmnopqrstuvwxyz0123456789'.split('').map(c => c.toLowerCase()))

  // Load API config for AI fallback
  const apiEndpoint = settings.get('apiEndpoint')
  const apiKey = settings.get('apiKey')
  if (apiEndpoint && apiKey) {
    audio.setApiConfig(apiEndpoint, apiKey)
  }

  // Apply educational mode on load
  bento.setEducationalMode(!!settings.get('educationalMode'))

  settingsBtn.addEventListener('click', () => {
    const data = settings.getAll()
    for (const [key, value] of Object.entries(data)) {
      const input = settingsForm.elements[key]
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = !!value
        } else {
          input.value = value
        }
      }
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
    // Ensure checkbox state is saved even when unchecked
    if (!formData.has('educationalMode')) {
      settings.set('educationalMode', '')
    }
    bento.setEducationalMode(!!settings.get('educationalMode'))
    settingsOverlay.classList.add('hidden')
  })

  window.__bento = bento
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}