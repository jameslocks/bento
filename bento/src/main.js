import { Bento } from './bento.js'
import { ShakeDetector } from './shake.js'
import { SoundEngine } from './sound.js'
import { SettingsStore } from './settings.js'
import { AudioManager } from './audio.js'
import { defaultSkin } from './skins/default.js'
import { SpeechRecognizer } from './speech.js'
import { routeCommand } from './commands.js'
import { TapHoldDetector } from './taphold.js'

const SPEECH_MESSAGES = {
  unsupported: "Voice isn't available in this browser.",
  denied: 'Microphone access was blocked.',
  error: "Bento couldn't hear that. Try again!"
}

function showToast(message) {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.remove('hidden')
  clearTimeout(showToast._timer)
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3500)
}

function populateForm(form, data) {
  for (const [key, value] of Object.entries(data)) {
    const input = form.elements[key]
    if (!input) continue
    if (input.type === 'checkbox') input.checked = !!value
    else input.value = value
  }
}

function init() {
  const canvas = document.getElementById('bento-canvas')
  const fallback = document.getElementById('fallback')
  const settingsBtn = document.getElementById('settings-btn')
  const settingsOverlay = document.getElementById('settings-overlay')
  const settingsClose = document.getElementById('settings-close')
  const settingsForm = document.getElementById('settings-form')

  if (!canvas || !canvas.getContext) {
    fallback?.classList.remove('hidden')
    return
  }

  const settings = new SettingsStore()
  const sound = new SoundEngine()
  const audio = new AudioManager()
  const bento = new Bento(canvas, defaultSkin, sound)
  bento.setAudioManager(audio)
  bento.start()

  const speech = new SpeechRecognizer(
    (text) => {
      if (routeCommand(text, bento, audio)) return
      // Didn't understand: mostly confused, sometimes something random.
      if (Math.random() < 0.6) bento.triggerEvent('confused')
      else bento.triggerRandomEvent()
    },
    (reason) => {
      const message = SPEECH_MESSAGES[reason]
      if (message) {
        showToast(message)
        bento.triggerEvent('confused')
      }
    }
  )

  /** Push stored settings into the live objects. Runs at startup and on save. */
  function applySettings() {
    const endpoint = settings.get('apiEndpoint')
    const key = settings.get('apiKey')
    audio.setApiConfig(endpoint, key)
    speech.setApiConfig(endpoint, key)
    audio.configureVoice({
      model: settings.get('voiceModel'),
      speed: settings.get('voiceSpeed'),
      instructions: settings.get('voiceInstructions')
    })
    bento.setEducationalMode(settings.get('educationalMode'))
    bento.applyBirthday(
      parseInt(settings.get('birthMonth'), 10),
      parseInt(settings.get('birthDay'), 10)
    )
  }
  applySettings()

  const shake = new ShakeDetector(() => bento.triggerDizzy())
  // iOS only allows motion access from a user gesture.
  if (shake.needsPermission) {
    canvas.addEventListener('click', () => shake.enable(), { once: true })
  }

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => bento.resize(), 100)
  })

  // Hold to talk
  new TapHoldDetector(canvas, () => {
    bento.becomeIdle()
    speech.start()
  })

  // Settings overlay
  const closeSettings = () => settingsOverlay.classList.add('hidden')
  settingsBtn.addEventListener('click', () => {
    populateForm(settingsForm, settings.getAll())
    settingsOverlay.classList.remove('hidden')
  })
  settingsClose.addEventListener('click', closeSettings)
  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) closeSettings()
  })
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(settingsForm)
    for (const [key, value] of formData.entries()) settings.set(key, value)
    // Unchecked checkboxes are absent from FormData
    settings.set('educationalMode', formData.has('educationalMode'))
    applySettings()
    closeSettings()
  })

  // The debug panel is dev-only unless opted in with ?debug
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    import('./debug.js').then(({ initDebugPanel }) => initDebugPanel(bento))
    window.__bento = bento
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
