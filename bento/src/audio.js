import { getAudioContext } from './audio-context.js'
import { DEFAULTS } from './settings.js'

const DEFAULT_VOICE_MODEL = DEFAULTS.voiceModel
const BASE = import.meta.env.BASE_URL

export class AudioManager {
  constructor() {
    this._buffers = new Map() // key -> decoded AudioBuffer
    this._missing = new Set() // keys with no bundled mp3
    this._tts = new Map() // request signature -> decoded TTS AudioBuffer
    this._apiEndpoint = ''
    this._apiKey = ''
    this._voice = { model: DEFAULT_VOICE_MODEL, speed: 1.0, instructions: '' }
  }

  setApiConfig(endpoint, key) {
    this._apiEndpoint = endpoint || ''
    this._apiKey = key || ''
  }

  configureVoice({ model, speed, instructions } = {}) {
    this._voice = {
      model: model || DEFAULT_VOICE_MODEL,
      speed: parseFloat(speed) || 1.0,
      instructions: instructions || ''
    }
  }

  /** Play a bundled letter mp3 if one exists, otherwise fall back to TTS. */
  async play(key) {
    let buffer = this._buffers.get(key)
    if (!buffer && !this._missing.has(key)) {
      buffer = await this._loadFile(key)
    }
    if (buffer) {
      this._playBuffer(buffer)
      return
    }
    await this.speak(key)
  }

  async speak(text, { model, speed, instructions } = {}) {
    if (!this._apiEndpoint || !this._apiKey) return
    const v = this._voice
    const body = {
      model: model || v.model,
      input: text,
      voice: 'alloy',
      response_format: 'mp3',
      speed: Math.max(0.5, Math.min(2.0, speed || v.speed))
    }
    const instr = instructions || v.instructions
    if (instr) {
      body.provider = { options: { openai: { instructions: instr } } }
    }

    const signature = JSON.stringify(body)
    const cached = this._tts.get(signature)
    if (cached) {
      this._playBuffer(cached)
      return
    }

    try {
      const resp = await fetch(`${this._apiEndpoint}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this._apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      if (!resp.ok) return
      const buffer = await this._decode(await resp.arrayBuffer())
      if (buffer) {
        this._tts.set(signature, buffer)
        this._playBuffer(buffer)
      }
    } catch {
      // Network or decode failure: stay silent
    }
  }

  async _loadFile(key) {
    try {
      const resp = await fetch(`${BASE}audio/${key}.mp3`)
      const type = resp.headers.get('content-type') || ''
      // Dev servers may answer unknown paths with index.html and a 200.
      if (resp.ok && !type.includes('text/html')) {
        const buffer = await this._decode(await resp.arrayBuffer())
        if (buffer) {
          this._buffers.set(key, buffer)
          return buffer
        }
      }
    } catch {
      // Offline or blocked
    }
    this._missing.add(key)
    return null
  }

  async _decode(arrayBuffer) {
    const ctx = getAudioContext()
    if (!ctx) return null
    try {
      return await ctx.decodeAudioData(arrayBuffer)
    } catch {
      return null
    }
  }

  _playBuffer(buffer) {
    const ctx = getAudioContext()
    if (!ctx) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start()
  }

  destroy() {
    this._buffers.clear()
    this._missing.clear()
    this._tts.clear()
  }
}
