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

// Add stylesheet for hidden class
const styleEl = document.createElement('style')
styleEl.textContent = '#debug-panel.hidden { display: none !important; }'
document.head.appendChild(styleEl)

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
  const panel = el('div', STYLES.panel)
  panel.id = 'debug-panel'
  panel.classList.add('hidden')

  const stateDisplay = el('div', STYLES.state)

  function updateState() {
    const streak = bento._bonding ? bento._bonding.getStreak() : 0
    const effects = bento._bonding ? bento._bonding.getActiveMilestones().join(',') : '—'
    stateDisplay.textContent =
      `mood: ${bento.mood} | event: ${bento._event || '—'} | acc: ${bento._accessory || '—'} | edu: ${bento._educationalMode ? 'on' : 'off'} | streak: ${streak} [${effects}]`
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

  // Bonding
  panel.appendChild(section('Bonding', row([
    btn('Check', () => { const r = bento._bonding.checkAndUpdate(); updateState(); console.log('Bonding:', r) }),
    btn('Reset', () => { localStorage.removeItem('bento:bonding'); location.reload() }),
    btn('+1', () => {
      const data = JSON.parse(localStorage.getItem('bento:bonding') || '{"lastVisit":null,"streak":0,"notified":[]}')
      data.streak = (data.streak || 0) + 1
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      data.lastVisit = yesterday.toISOString().slice(0, 10)
      localStorage.setItem('bento:bonding', JSON.stringify(data))
      bento._bonding = new (bento._bonding.constructor)()
      updateState()
    })
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
      panel.classList.toggle('hidden')
    }
  })

  document.body.appendChild(panel)

  // Update state periodically
  setInterval(updateState, 500)
}