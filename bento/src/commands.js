const COMMANDS = [
  {
    patterns: ['show me the letter', 'show letter', 'letter', 'say letter'],
    handler(text, bento, audio) {
      // Extract letter from text
      const match = text.match(/[a-z0-9]/)
      if (match) {
        const letter = match[0].toUpperCase()
        bento.showLetter(letter)
        if (audio) audio.play(letter.toLowerCase())
      }
      return true
    }
  },
  {
    patterns: ['do a flip', 'flip'],
    handler(text, bento, audio) {
      bento._event = 'spin'
      bento._eventTime = 0
      return true
    }
  },
  {
    patterns: ['dizzy', 'spin around', 'make me dizzy'],
    handler(text, bento, audio) {
      bento.triggerDizzy()
      return true
    }
  },
  {
    patterns: ['sneeze', 'achoo'],
    handler(text, bento, audio) {
      bento._event = 'sneeze'
      bento._eventTime = 0
      if (bento.sound) bento.sound.sneeze()
      return true
    }
  },
  {
    patterns: ['glitch', 'broken', 'error'],
    handler(text, bento, audio) {
      bento._event = 'glitch'
      bento._eventTime = 0
      if (bento.sound) bento.sound.glitch()
      return true
    }
  },
  {
    patterns: ['sleep', 'nap', 'go to sleep', 'tired'],
    handler(text, bento, audio) {
      bento.mood = 'sleeping'
      bento._napDuration = 5
      return true
    }
  },
  {
    patterns: ['hello', 'hi', 'hey', 'bento'],
    handler(text, bento, audio) {
      bento.mood = 'happy'
      bento._happyTimer = 1.5
      bento._happyCooldown = 1.5
      if (bento.sound) bento.sound.happy()
      return true
    }
  }
]

export function routeCommand(text, bento, audio) {
  for (const cmd of COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (text.includes(pattern)) {
        return cmd.handler(text, bento, audio)
      }
    }
  }
  return false
}