export class TabClickOutline {
    constructor() {
        window.handleFirstTab = this.handleFirstTab
        window.handleMouseDownOnce = this.handleMouseDownOnce
        window.addEventListener('keydown', window.handleFirstTab)
    }

    handleFirstTab(e) {
        if (e.keyCode === 9) {
            document.body.classList.add('user-is-tabbing')
            window.removeEventListener('keydown', window.handleFirstTab)
            window.addEventListener('mousedown', window.handleMouseDownOnce)
        }
    }

    handleMouseDownOnce() {
        document.body.classList.remove('user-is-tabbing')

        window.removeEventListener('mousedown', window.handleMouseDownOnce)
        window.addEventListener('keydown', window.handleFirstTab)
    }
}
