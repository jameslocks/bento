const STYLES = {
  panel: `
    position: fixed;
    top: 60px;
    right: 12px;
    width: 200px;
    background: #1a1a2e;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 12px;
    z-index: 200;
    color: #e0e0e0;
    font-family: monospace;
    font-size: 0.8rem;
    max-height: calc(100vh - 80px);
    overflow-y: auto;
  `,
  hidden: `
    display: none;
  `,
  section: `
    margin-bottom: 10px;
  `,
  header: `
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  `,
  row: `
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  `,
  btn: `
    padding: 3px 8px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #2c2c2c;
    color: #ccc;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: monospace;
  `,
  input: `
    padding: 3px 6px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #2c2c2c;
    color: #e0e0e0;
    font-size: 0.75rem;
    font-family: monospace;
    width: 60px;
    outline: none;
  `,
  state: `
    font-size: 0.7rem;
    color: #888;
    margin-top: 4px;
    line-height: 1.4;
  `,
  label: `
    font-size: 0.7rem;
    color: #aaa;
    margin-right: 4px;
  `
}

function el(tag, cssText, children) {
  const e = document.createElement(tag)
  e.style.cssText = cssText
  if (children) {
    if (typeof children === 'string') {
      e.textContent = children
    } else {
      children.forEach(c => { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c) })
    }
  }
  return e
}

function btn(text, onClick) {
  const b = el('button', STYLES.btn, text)
  b.addEventListener('click', onClick)
  return b
}

export function initDebugPanel(bento) {
  const panel = el('div', STYLES.panel + STYLES.hidden)
  panel.id = 'debug-panel'

  const stateDisplay = el('div', STYLES.state)

  function updateState() {
    stateDisplay.textContent =
      `mood: ${bento.mood} | event: ${bento._event || '—'} | acc: ${bento._accessory || '—'} | edu: ${bento._educationalMode ? 'on' : 'off'}`
  }

  function section(title, content) {
    const s = el('div', STYLES.section)
    s.appendChild(el('div', STYLES.header, title))
    s.appendChild(content)
    return s
  }

  function row(children) {
    return el('div', STYLES.row, children)
  }

  function triggerEvent(name, hasSound) {
    return () => {
      bento.mood = 'idle'
      bento._event = name
      bento._eventTime = 0
      if (hasSound && bento.sound && bento.sound[name]) {
        bento.sound[name]()
      }
      if (bento._onEventStart) bento._onEventStart(name)
      updateState()
    }
  }

  function triggerMood(name) {
    return () => {
      if (name === 'happy') {
        bento.mood = 'happy'
        bento._happyTimer = 1.5
        bento._happyCooldown = 1.5
        if (bento.sound) bento.sound.happy()
      } else if (name === 'sleeping') {
        bento.mood = 'sleeping'
        bento._napDuration = 5
      } else if (name === 'surprised') {
        bento.mood = 'surprised'
        bento._surprisedTimer = 0.5
      } else {
        bento.mood = 'idle'
        bento._event = null
        bento._eventTime = 0
      }
      updateState()
    }
  }

  // Events
  panel.appendChild(section('Events', row([
    btn('Sneeze', triggerEvent('sneeze', true)),
    btn('Confused', triggerEvent('confused')),
    btn('Glitch', triggerEvent('glitch', true)),
    btn('Excited', triggerEvent('excited')),
    btn('Dizzy', () => { bento.triggerDizzy(); updateState() }),
    btn('Spin', triggerEvent('spin'))
  ])))

  // Moods
  panel.appendChild(section('Moods', row([
    btn('Happy', triggerMood('happy')),
    btn('Sleep', triggerMood('sleeping')),
    btn('Surprise', triggerMood('surprised')),
    btn('Idle', triggerMood('idle'))
  ])))

  // Accessories
  panel.appendChild(section('Accessories', row([
    btn('Hat', () => { bento._setAccessory('partyhat'); updateState() }),
    btn('Bowtie', () => { bento._setAccessory('bowtie'); updateState() }),
    btn('Sunglasses', () => { bento._setAccessory('sunglasses'); updateState() }),
    btn('Earmuffs', () => { bento._setAccessory('earmuffs'); updateState() }),
    btn('Clear', () => { bento._accessory = null; bento._accessoryTimer = 0; updateState() })
  ])))

  // Letter
  const letterInput = el('input', STYLES.input)
  letterInput.setAttribute('maxlength', '1')
  letterInput.placeholder = 'A'
  panel.appendChild(section('Letter', row([
    el('span', STYLES.label, 'Show:'),
    letterInput,
    btn('Show', () => {
      if (letterInput.value) {
        bento.showLetter(letterInput.value.toUpperCase())
        updateState()
      }
    })
  ])))

  // State
  panel.appendChild(section('State', stateDisplay))
  updateState()

  // Toggle on D key
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return
      panel.style.display = panel.style.display === 'none' ? '' : 'none'
    }
  })

  // Start hidden
  panel.style.display = 'none'
  document.body.appendChild(panel)

  // Update state periodically
  setInterval(updateState, 500)
}