import backHtml from './back.html'
import { Modal } from './Modal'
import { GA } from 'functions/GA'

export class BackModal extends Modal {
    constructor() {
        super(backHtml)
        this.modal = document.getElementById('back-modal')

        this.cancelButton = this.modal.querySelector('#back-modal-cancel')
        this.confirmButton = this.modal.querySelector('#back-modal-confirm')

        this.cancelButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.emit('cancel')
            GA.track({ eventCategory: 'modal', eventLabel: 'back_modal:cancel' })
            this.close()
        })
        this.confirmButton.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.emit('confirm')
            GA.track({ eventCategory: 'modal', eventLabel: 'back_modal:confirm' })
            this.close()
        })

        this.modal.parentNode.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            GA.track({ eventCategory: 'modal', eventLabel: 'back_background:cancel' })
            this.emit('cancel')
            this.close()
        })

        this.element.classList.add('open-back')
    }
}
