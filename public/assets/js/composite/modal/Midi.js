import midiHtml from './midi.html'
import { Modal } from './Modal'

export class MidiModal extends Modal {
    constructor() {
        super(midiHtml)

        this.element.classList.add('open-midi')
        this.closeTimeout = setTimeout(() => {
            this.element.classList.add('fadeout')
            clearTimeout(this.closeTimeout)
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
