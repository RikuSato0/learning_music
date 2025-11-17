import shareHtml from './share.html'
import { Modal } from './Modal'
import { GA } from 'functions/GA'
import { SITE_URL_PATH } from '../data/Config'
import 'style/modal-share.scss'

export class ShareModal extends Modal {
    constructor(data) {
        super(shareHtml)

        this.showShareEmbed = false
        this.element.classList.add('open-share')
        this.expandable = document.getElementById('share-modal')
        this.setUpButtons()
        this.toggleShareState(true)
        this.shortUrl = ''

        if (document.getElementById('bottom').classList.contains('expand')) {
            this.element.classList.add('bottom-expanded')
        }

        if (window.saveDataFromCloud && data.immediate) {
            this.populateData(window.saveDataFromCloud)
        }

    }

    exportStart() {
        document.getElementById('download-wav').style.pointerEvents = 'none'
        document.getElementById('download-wav').innerText = 'Loading…'
    }

    exportEnd() {
        document.getElementById('download-wav').style.pointerEvents = 'auto'
        document.getElementById('download-wav').innerText = 'Download Wav'
    }

    setTryCopy(btnId, selectorStr) {
        document.getElementById(btnId).addEventListener('click', (e) => {
            this.selectAndCopy(this.expandable.querySelector(selectorStr))
            GA.track({ eventCategory: 'share', eventLabel: 'copy:' + selectorStr.replace('.', '').replace('-', '_') })
        })
    }

    selectAndCopy(el) {
        // Copy textarea, pre, div, etc.
        if (document.body.createTextRange) {
            // IE
            var textRange = document.body.createTextRange()
            textRange.moveToElementText(el)
            textRange.select()
            textRange.execCommand('Copy')
        }
        else if (window.getSelection && document.createRange) {
            // non-IE
            var editable = el.contentEditable // Record contentEditable status of element
            var readOnly = el.readOnly // Record readOnly status of element
            el.contentEditable = true // iOS will only select text on non-form elements if contentEditable = true;
            el.readOnly = false // iOS will not select in a read only form element
            var range = document.createRange()
            range.selectNodeContents(el)
            var sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range) // Does not work for Firefox if a textarea or input
            if (el.nodeName == 'TEXTAREA' || el.nodeName == 'INPUT')
                el.select() // Firefox will only select a form element with select()
            if (el.setSelectionRange && navigator.userAgent.match(/ipad|ipod|iphone/i))
                el.setSelectionRange(0, 999999) // iOS only selects 'form' elements with SelectionRange
            el.contentEditable = editable // Restore previous contentEditable status
            el.readOnly = readOnly // Restore previous readOnly status
            if (document.queryCommandSupported('copy')) {
                var successful = document.execCommand('copy')
                if (successful) console.log(el, 'Copied to clipboard.')
                else console.log(el, 'Press CTRL+C to copy')
            }
            else {
                if (!navigator.userAgent.match(/ipad|ipod|iphone|android|silk/i))
                    console.log(el, 'Press CTRL+C to copy')
            }
        }
    }

    setUpButtons() {
        this.expandable.querySelectorAll('.switch-state').forEach(button => {
            button.addEventListener('click', () => {
                this.toggleShareState()
            })
        })
        this.setTryCopy('copy-link', '.short-url')
        this.setTryCopy('copy-iframe', '.iframe-code')
        document.getElementById('share-facebook').addEventListener('click', () => {
            const text = 'Check out this song I created with Song Maker%20%23songmaker%20%23chromemusiclab'
            const fbURL = `https://www.facebook.com/sharer.php?u=${this.shortUrl}&quote=${text}`
            this.popup(fbURL, 570, 520)

            GA.track({ eventCategory: 'share', eventLabel: 'facebook' })
        })

        document.getElementById('share-twitter').addEventListener('click', () => {
            const text = 'Check out this song I created with Song Maker → ' + this.shortUrl + '%20%23songmaker%20%23chromemusiclab'
            const twitURL = `https://twitter.com/intent/tweet?text=${text}`
            this.popup(twitURL, 253, 600)

            GA.track({ eventCategory: 'share', eventLabel: 'twitter' })
        })

        document.getElementById('download-midi').addEventListener('click', () => {
            //window.open('https://storage.googleapis.com/song-maker-midifiles-prod/'+ this.currentId +'.mid')
            this.emit('request-midi')
            GA.track({ eventCategory: 'share', eventLabel: 'download_midi' })
        })

        document.getElementById('download-wav').addEventListener('click', () => {
            this.emit('request-wav', this.currentId)
            GA.track({ eventCategory: 'share', eventLabel: 'download_wav' })
        })

        if (/Edge\/\d./i.test(navigator.userAgent)) {
            document.getElementById('download-wav').style.display = 'none'
        }
    }

    toggleShareState(showFirst = false) {
        const embedStateStr = 'show-embed'
        if (this.expandable.classList.contains(embedStateStr) || showFirst == true) {
            this.expandable.classList.remove(embedStateStr)
        } else {
            this.expandable.classList.add(embedStateStr)
        }
    }

    populateData(result) {
        var sUrl = this.expandable.querySelector('.short-url')
        var embedArea = this.expandable.querySelector('.iframe-code')
        var embedCode = '<iframe width="560" height="315" src="' + window.location.origin + `${SITE_URL_PATH}/embed/` + result.id + '" frameborder="0" allowfullscreen></iframe>'
        this.currentId = result.id
        this.element.classList.add('data-loaded')
        this.element.querySelector('.saved-circle').classList.add('done')
        this.shortUrl = result.url
        sUrl.value = result.url
        sUrl.removeAttribute('disabled')
        embedArea.value = embedCode
    }

    populateSaveData(data) {
        data.then(result => {
            window.saveDataFromCloud = result
            this.populateData(result)
        })
    }

    popup(url, height, width) {
        const wLeft = window.screenLeft ? window.screenLeft : window.screenX
        const wTop = window.screenTop ? window.screenTop : window.screenY
        const left = wLeft + (window.innerWidth / 2) - (width / 2)
        const top = wTop + (window.innerHeight / 2) - (height / 2)

        window.open(url, '_blank', 'location=yes,height=' + height + ',width=' + width + ',top=' + top + ',left=' + left + ',scrollbars=yes,status=no').focus()
    }
}
