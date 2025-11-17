import { EventEmitter } from 'events'
import { GA } from 'functions/GA'
import 'style/modal.scss'

export class Modal extends EventEmitter {
    constructor(content) {
        super()
        this.element = document.createElement('div')
        this.element.classList.add('modal')
        this.element.innerHTML = content
        document.body.appendChild(this.element)

        let buttons = this.element.querySelectorAll('.button')
        //add all of the events
        for (let i = 0; i < buttons.length; i++) {
            let button = buttons[i]
            button.addEventListener('click', () => {
                if (button.id === 'cancel') {
                    this.close()
                    this.emit('cancel')
                    this.trackButton(button)

                } else if (button.id === 'submit') {
                    this.close()
                    this.emit('submit')
                    this.emit('cancel')
                    this.trackButton(button)
                } else {
                    this.emit('click', button.id)
                }
            })
        }
        this.open()
    }

    trackButton(button, label = false) {
        GA.track({
            eventCategory: 'modal', eventLabel: (this.element.querySelector('.modal-content') ?
                this.element.querySelector('.modal-content').id.replace('-', '_') :
                'modal')
                + ':' + (label ? label : button.id)
        })
    }

    close() {
        this.element.classList.remove('visible')
        setTimeout(() => this.element.remove(), 500)
    }

    open() {
        setTimeout(() => {
            this.element.classList.add('visible')
        }, 10)
    }
}
