/**
 * Voice commands. Each command lists phrases that are matched as whole words
 * (so "hi" doesn't fire on "this"). Handlers use Bento's public API and return
 * true if they handled the text.
 */
const COMMANDS = [
  {
    patterns: ['show me the letter', 'show letter', 'say letter', 'letter'],
    handler(text, bento, audio, match) {
      // Look for a single letter/digit *after* the trigger phrase.
      const rest = text.slice(match.index + match[0].length)
      const found = rest.match(/\b([a-z0-9])\b/)
      if (!found) return false
      const letter = found[1].toUpperCase()
      bento.showLetter(letter)
      audio?.play(letter.toLowerCase())
      return true
    }
  },
  {
    patterns: ['do a flip', 'flip'],
    handler: (text, bento) => { bento.triggerEvent('spin'); return true }
  },
  {
    patterns: ['make me dizzy', 'spin around', 'dizzy'],
    handler: (text, bento) => { bento.triggerDizzy(); return true }
  },
  {
    patterns: ['sneeze', 'achoo'],
    handler: (text, bento) => { bento.triggerEvent('sneeze'); return true }
  },
  {
    patterns: ['glitch', 'broken', 'error'],
    handler: (text, bento) => { bento.triggerEvent('glitch'); return true }
  },
  {
    patterns: ['go to sleep', 'sleep', 'nap', 'tired'],
    handler: (text, bento) => { bento.sleep(5); return true }
  },
  {
    patterns: ['hello', 'hi', 'hey', 'bento'],
    handler: (text, bento) => { bento.makeHappy(); return true }
  }
]

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const COMPILED = COMMANDS.map(cmd => ({
  ...cmd,
  regexes: cmd.patterns.map(p => new RegExp(`\\b${escapeRegExp(p)}\\b`))
}))

export function routeCommand(text, bento, audio) {
  const lower = text.toLowerCase()
  for (const cmd of COMPILED) {
    for (const re of cmd.regexes) {
      const match = lower.match(re)
      if (match) return cmd.handler(lower, bento, audio, match)
    }
  }
  return false
}
