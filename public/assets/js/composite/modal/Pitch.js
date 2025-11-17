import pitchHtml from './pitch.html'
import { Modal } from './Modal'

export class PitchModal extends Modal {
    constructor() {
        super(pitchHtml)
        this.element.classList.add('open-pitch')

        this.closeTimeout = setTimeout(() => {
            this.element.classList.add('fadeout')
            this.closeInnerTimeout = setTimeout(() => {
                this.close()
            }, 300)
        }, 3500)
    }

    closeModal() {
        clearTimeout(this.closeTimeout)
        clearTimeout(this.closeInnerTimeout)
        this.close()
    }
}
