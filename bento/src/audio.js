export class AudioManager {
  constructor() {
    this._cache = new Map()
    this._apiEndpoint = ''
    this._apiKey = ''
    this._audioCtx = null
  }

  _ensureContext() {
    if (!this._audioCtx) {
      try {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      } catch {
        // Audio not available
      }
    }
    if (this._audioCtx && this._audioCtx.state === 'suspended') {
      this._audioCtx.resume().catch(() => {})
    }
  }

  setApiConfig(endpoint, key) {
    this._apiEndpoint = endpoint
    this._apiKey = key
  }

  async preload(keys) {
    for (const key of keys) {
      if (this._cache.has(key)) continue
      try {
        const resp = await fetch(`/audio/${key}.mp3`)
        if (resp.ok) {
          const blob = await resp.blob()
          this._cache.set(key, { type: 'file', blob })
        }
      } catch {
        // File not found — will use AI fallback
      }
    }
  }

  async play(key) {
    // Try cached audio first
    const entry = this._cache.get(key)
    if (entry && entry.type === 'file') {
      this._playBuffer(entry.blob)
      return
    }

    // Try AI fallback
    if (this._apiEndpoint && this._apiKey) {
      await this._playAIVoice(key)
    }
  }

  async _playBuffer(blob) {
    this._ensureContext()
    if (!this._audioCtx) return

    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await this._audioCtx.decodeAudioData(arrayBuffer)
      const source = this._audioCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this._audioCtx.destination)
      source.start()
    } catch {
      // Decode or playback failed — silently ignore
    }
  }

  async _playAIVoice(text) {
    this._ensureContext()
    if (!this._audioCtx) return

    try {
      const resp = await fetch(`${this._apiEndpoint}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._apiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        })
      })

      if (!resp.ok) return

      const blob = await resp.blob()
      this._cache.set(text, { type: 'file', blob })
      await this._playBuffer(blob)
    } catch {
      // AI voice failed — silently ignore
    }
  }

  destroy() {
    this._cache.clear()
    if (this._audioCtx) {
      this._audioCtx.close().catch(() => {})
      this._audioCtx = null
    }
  }
}