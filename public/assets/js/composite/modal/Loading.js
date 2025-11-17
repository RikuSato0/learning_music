import { EventEmitter } from 'events'
import loadingHtml from './loading.html'
import 'style/modal.scss'

export class LoadingModal extends EventEmitter {
    constructor() {
        super(loadingHtml)

        this.playedThru = false
        this.emittersToWaitFor = ['grid', 'sampler']
        this.element = document.createElement('div')
        this.element.classList.add('modal')
        this.element.innerHTML = loadingHtml
        this.animationDuration = 2500

        document.body.appendChild(this.element)

        this.element.classList.add('open-loading')
        this.element.classList.add('visible')

        this.playTimeout = setTimeout(() => {
            this.checkStatus()
        }, this.animationDuration)

        if (document.body.classList.contains('embed-only')) {
            document.querySelector('#loading-modal img').style.display = 'none'
            document.querySelector('#loading-modal .circle').style.marginTop = '0'
            this.checkStatus()
        }
    }

    checkStatus() {
        var emitterArrayIsEmpty = this.emitterSourceCheck()
        this.playedThru = true
        if (emitterArrayIsEmpty) {
            this.fadeOutAndClose()
        } else {
            setTimeout(this.checkStatus.bind(this), 250)
        }
    }

    emitterSourceCheck(emitterName) {
        this.emittersToWaitFor = this.emittersToWaitFor.filter(e => e !== emitterName)
        return this.emittersToWaitFor.length < 1
    }

    fadeOutAndClose() {
        this.element.classList.add('fadeout')
        setTimeout(() => {
            this.element.classList.remove('visible')
            this.element.remove()
        }, 300)
    }

    close(emitterSource) {
        var emitterArrayIsEmpty = this.emitterSourceCheck(emitterSource)
        if (this.playedThru && emitterArrayIsEmpty) {
            this.fadeOutAndClose()
        }
    }
}
