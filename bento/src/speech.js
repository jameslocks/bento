export class SpeechRecognizer {
  constructor(onResult, onEnd) {
    this._onResult = onResult
    this._onEnd = onEnd
    this._recognition = null
    this._apiEndpoint = ''
    this._apiKey = ''
    this._isListening = false
    this._silenceTimer = null
    this._hasResult = false
  }

  setApiConfig(endpoint, key) {
    this._apiEndpoint = endpoint
    this._apiKey = key
  }

  start() {
    if (this._isListening) return
    this._isListening = true
    this._hasResult = false

    // Try Web Speech API first
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      this._recognition = new SpeechRecognition()
      this._recognition.lang = 'en-US'
      this._recognition.interimResults = false
      this._recognition.maxAlternatives = 1
      this._recognition.continuous = false

      this._recognition.onresult = (event) => {
        this._hasResult = true
        const text = event.results[0][0].transcript.trim().toLowerCase()
        this._onResult(text)
        this._stopSilenceTimer()
        this._silenceTimer = setTimeout(() => this.stop(), 3000)
      }

      this._recognition.onerror = () => {
        this._stopSilenceTimer()
        this._isListening = false
        if (!this._hasResult) {
          this._onEnd('error')
        }
      }

      this._recognition.onend = () => {
        this._isListening = false
        if (!this._hasResult) {
          this._onEnd('timeout')
        }
      }

      this._recognition.start()

      // Auto-stop after 8 seconds if no speech detected
      this._silenceTimer = setTimeout(() => {
        if (!this._hasResult) {
          this.stop()
          this._onEnd('timeout')
        }
      }, 8000)
    } else if (this._apiEndpoint && this._apiKey) {
      // Web Speech not available — AI fallback is handled externally
      this._onEnd('unsupported')
    } else {
      this._onEnd('unsupported')
    }
  }

  stop() {
    this._stopSilenceTimer()
    if (this._recognition) {
      try {
        this._recognition.stop()
      } catch {
        // Already stopped
      }
      this._recognition = null
    }
    this._isListening = false
  }

  _stopSilenceTimer() {
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer)
      this._silenceTimer = null
    }
  }

  destroy() {
    this.stop()
    this._onResult = null
    this._onEnd = null
  }
}