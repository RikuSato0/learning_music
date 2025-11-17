import aboutHtml from './about.html'
import { Modal } from './Modal'

export class AboutModal extends Modal {
    constructor() {
        super(aboutHtml)

        this.element.classList.add('open-about')
    }

    closeModal() {
        this.close()
    }
}
