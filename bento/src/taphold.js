/**
 * Fires `callback` when the element is pressed for `threshold` ms. The click
 * that follows releasing a completed hold is swallowed so it doesn't also
 * register as a tap.
 */
export class TapHoldDetector {
  constructor(element, callback, threshold = 600) {
    this._element = element
    this._callback = callback
    this._threshold = threshold
    this._timer = null
    this._held = false

    this._onPointerDown = this._onPointerDown.bind(this)
    this._onPointerUp = this._onPointerUp.bind(this)
    this._cancel = this._cancel.bind(this)
    this._swallowClick = this._swallowClick.bind(this)

    element.addEventListener('pointerdown', this._onPointerDown)
    element.addEventListener('pointerup', this._onPointerUp)
    element.addEventListener('pointerleave', this._cancel)
    element.addEventListener('pointercancel', this._cancel)
    // Capture phase so we run before other click listeners on the element.
    element.addEventListener('click', this._swallowClick, true)
  }

  _onPointerDown(e) {
    this._held = false
    this._clearTimer()
    this._timer = setTimeout(() => {
      this._timer = null
      this._held = true
      this._callback(e)
    }, this._threshold)
  }

  _onPointerUp() {
    this._clearTimer()
    // The click for this release (if any) arrives right after; forget the hold soon after.
    if (this._held) setTimeout(() => { this._held = false }, 300)
  }

  _cancel() {
    this._clearTimer()
    this._held = false
  }

  _swallowClick(e) {
    if (this._held) {
      this._held = false
      e.stopImmediatePropagation()
      e.preventDefault()
    }
  }

  _clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  destroy() {
    this._element.removeEventListener('pointerdown', this._onPointerDown)
    this._element.removeEventListener('pointerup', this._onPointerUp)
    this._element.removeEventListener('pointerleave', this._cancel)
    this._element.removeEventListener('pointercancel', this._cancel)
    this._element.removeEventListener('click', this._swallowClick, true)
    this._clearTimer()
  }
}
