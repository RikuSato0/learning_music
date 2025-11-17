import newSongHtml from './start_song.html'
import { Modal } from './Modal'
import { SongOptions } from 'data/SongOptions'

export class StartSongModal extends Modal {
    constructor(currentSongOptions) {
        super(newSongHtml)

        this.element.classList.add('start-song')
        this.currentSongOptions = currentSongOptions
        this.currentSettingsToKeep = ['instrument', 'percussion', 'tempo']

        const quant = document.getElementById('settings-modal').querySelectorAll('.quantity')
        const selects = document.getElementById('settings-modal').querySelectorAll('.select-wrap')
        this.options = currentSongOptions.toJSON()

        for (var i = 0; i < quant.length; i++) {
            this.setupQuantity(quant[i])
        }

        for (var j = 0; j < selects.length; j++) {
            this.setupSelect(selects[j])
        }
        this.setUpOctave()

        this.on('submit', () => {
            this.emit('options', this.options)
        })

        this.on('update-options', options => {
            this.options = options
            this.updateQuantity(quant)
        })
    }

    Event(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined }
        var evt = document.createEvent('CustomEvent')
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
        return evt
    }

    updateQuantity(els) {
        for (var i = 0; i < els.length; i++) {
            var input = els[i].querySelector('input')
            var cover = els[i].querySelector('.quantity-cover')
            cover.value = input.value
        }
    }

    setupSelect(el) {
        var dupe = document.createElement('div')
        var select = el.querySelector('select')
        select.style.opacity = 0
        dupe.classList.add('dupe')
        el.appendChild(dupe)
        select.addEventListener('change', () => {
            var optionText = select.querySelector('option[value="' + select.value + '"]').textContent
            dupe.textContent = optionText
            select.parentNode.style.width = (dupe.offsetWidth + 40) + 'px'
        })
        select.dispatchEvent(new Event('change'));
        select.style.opacity = 1
    }

    setupQuantity(el) {
        var container = document.createElement('div')
        var up = document.createElement('div')
        var down = document.createElement('div')
        var upImage = document.createElement('img')
        var downImage = document.createElement('img')
        var label = document.createElement('div')
        var cover = document.createElement('input')
        var input = el.querySelector('input')
        var event = new Event('change')
        var min = input.getAttribute('min')
        var max = input.getAttribute('max')
        var addLabel = input.getAttribute('data-label') ? ' ' + input.getAttribute('data-label') : ''
        var pressTimeout = false

        input.changeMax = function (newMax) {
            max = newMax
            if (input.value > newMax) {
                changeInputTo(newMax)
            }
        }

        var changeInput = function (change) {
            var oldValue = parseInt(input.value, 10)
            var newVal = oldValue
            if ((change > 0 && (oldValue + change) <= max) || (change < 0 && (oldValue + change) >= min)) {
                newVal = oldValue + change
                input.value = newVal
                cover.value = input.value
            }
            input.dispatchEvent(event)
        }

        var changeInputTo = function (changeTo) {
            var oldValue = parseInt(input.value, 10)
            var newValue = parseInt(changeTo, 10)
            if ((newValue <= max) && (newValue >= min)) {
                input.value = newValue
                cover.value = input.value
            } else {
                cover.value = oldValue
            }
            input.dispatchEvent(event)
        }

        var setChangeTimeout = function (change) {
            pressTimeout = setTimeout(() => {
                if (pressTimeout) {
                    changeInput(change)
                    setChangeTimeout(change)
                }
            }, 100)
        }

        container.classList.add('quantity-nav')
        el.appendChild(container)
        cover.classList.add('quantity-cover')
        label.classList.add('quantity-label')
        up.classList.add('quantity-button', 'quantity-up')
        down.classList.add('quantity-button', 'quantity-down')
        container.appendChild(up)
        container.appendChild(down)
        container.appendChild(label)
        container.appendChild(cover)
        upImage.setAttribute('src', 'images/icon-quantity-add.svg')
        downImage.setAttribute('src', 'images/icon-quantity-minus.svg')
        up.appendChild(upImage)
        down.appendChild(downImage)
        // cover.innerHTML = input.value + (input.getAttribute('data-label') ?  ' ' + input.getAttribute('data-label') : '')
        label.innerHTML = addLabel
        cover.value = input.value

        cover.addEventListener('change', () => {
            changeInputTo(cover.value)
        })

        input.addEventListener('change', () => {
            if (cover.value !== input.value) {
                cover.value = input.value
            }
        })

        label.onclick = function () {
            cover.focus()
        }

        cover.addEventListener('focus', () => {
            cover.select()
        })

        cover.onkeypress = function (event) {
            // allow only numbers
            return event.charCode >= 48 && event.charCode <= 57
        }

        up.onclick = function () {
            changeInput(1)
        }

        up.onmousedown = function () {
            pressTimeout = setTimeout(() => {
                setChangeTimeout(1)
            }, 500)
        }

        down.onmousedown = function () {
            pressTimeout = setTimeout(() => {
                setChangeTimeout(-1)
            }, 500)
        }

        down.onmouseup = down.onmouseout = up.onmouseup = up.onmouseout = function () {
            clearTimeout(pressTimeout)
            pressTimeout = false
        }

        down.onclick = function () {
            changeInput(-1)
        }
    }

    setUpOctave() {
        const startOctaveInput = document.getElementById('settings-modal').querySelector('select[name="rootOctave"]')
        const numOctaveInput = document.getElementById('settings-modal').querySelector('input[name="octaves"]')

        startOctaveInput.addEventListener('change', () => {
            let v = parseInt(startOctaveInput.value, 10)
            if (v > 4) {
                numOctaveInput.changeMax(2)
            } else {
                numOctaveInput.changeMax(3)
            }
        })
    }

    get options() {
        const tempOptions = new SongOptions()
        const keys = tempOptions.toJSON() // get a list of keys
        for (let opt in keys) {
            const input = this.element.querySelector(`[name=${opt}]`)
            if (input) {
                //convert it to a number if possible
                if (!isNaN(parseFloat(input.value))) {
                    tempOptions[opt] = parseFloat(input.value)
                } else {
                    tempOptions[opt] = input.value
                }
            }
            if (this.currentSettingsToKeep.indexOf(opt) > -1) {
                tempOptions[opt] = this.currentSongOptions[opt]
            }
        }
        //merge with default options
        return tempOptions.toJSON()
    }

    set options(options) {
        for (let opt in options) {
            const input = this.element.querySelector(`[name=${opt}]`)
            if (input) {
                input.value = options[opt]
            }
        }
    }
}
