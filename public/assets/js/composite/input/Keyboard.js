function clearFocus(el) {
    // if (document.activeElement && document.activeElement !== el) document.activeElement.blur()
}

export class KeyboardInput {
    constructor(inputManager) {
        this.selector = inputManager.selector

        window.addEventListener('keydown', e => {
            // Prevent space bar from clicking any of the buttons
            if (e.keyCode === 32) {
                e.preventDefault()
            }
        })

        window.addEventListener('keydown', e => {
            if (this.allowKeypress(e.target)) {
                // Right Arrow
                if (e.keyCode === 39) {
                    clearFocus(this.el)
                    this.selector.moveRight()

                    // Left Arrow
                } else if (e.keyCode === 37) {
                    clearFocus(this.el)
                    this.selector.moveLeft()

                    // Up Arrow
                } else if (e.keyCode === 38) {
                    clearFocus(this.el)
                    this.selector.moveUp()

                    // Down Arrow
                } else if (e.keyCode === 40) {
                    clearFocus(this.el)
                    this.selector.moveDown()

                    // Enter Key or period
                } else if (e.keyCode === 13 || e.keyCode === 190) {
                    this.selector.toggle()

                    // Delete Key
                } else if (e.keyCode === 8 || e.keyCode === 188) {
                    this.selector.delete({ isDeleteKey: true })

                    // Escape Key
                } else if (e.keyCode === 27) {
                    this.selector.hide()
                }
            }
        })
    }

    allowKeypress(target) {
        if (target.id === 'grid-container') {
            return true
        } else if (target.tagName === 'BODY') {
            return true
        } else if (target.id === 'midi-button' || target.id === 'mic-button') {
            return true
        } else if (document.querySelector('body').classList.contains('user-is-tabbing')) {
            return false
        }
        return false
    }
}
