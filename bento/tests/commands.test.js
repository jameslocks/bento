import { describe, it, expect, vi } from 'vitest'
import { routeCommand } from '../src/commands.js'

function fakeBento() {
  return {
    showLetter: vi.fn(),
    triggerEvent: vi.fn(),
    triggerDizzy: vi.fn(),
    makeHappy: vi.fn(),
    sleep: vi.fn()
  }
}

describe('routeCommand', () => {
  it('shows the spoken letter, not the first letter of the phrase', () => {
    const bento = fakeBento()
    const audio = { play: vi.fn() }
    expect(routeCommand('show me the letter b', bento, audio)).toBe(true)
    expect(bento.showLetter).toHaveBeenCalledWith('B')
    expect(audio.play).toHaveBeenCalledWith('b')
  })

  it('supports digits', () => {
    const bento = fakeBento()
    routeCommand('say letter 7', bento)
    expect(bento.showLetter).toHaveBeenCalledWith('7')
  })

  it('does not match "hi" inside other words', () => {
    const bento = fakeBento()
    expect(routeCommand('this is nothing', bento)).toBe(false)
    expect(bento.makeHappy).not.toHaveBeenCalled()
  })

  it('matches whole-word greetings', () => {
    const bento = fakeBento()
    expect(routeCommand('Hi Bento!', bento)).toBe(true)
    expect(bento.makeHappy).toHaveBeenCalled()
  })

  it('routes events through the public API', () => {
    const bento = fakeBento()
    routeCommand('do a flip', bento)
    routeCommand('achoo', bento)
    expect(bento.triggerEvent).toHaveBeenCalledWith('spin')
    expect(bento.triggerEvent).toHaveBeenCalledWith('sneeze')
  })

  it('returns false for unknown phrases', () => {
    expect(routeCommand('what is the weather', fakeBento())).toBe(false)
  })
})
