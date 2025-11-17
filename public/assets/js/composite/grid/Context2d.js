/*
 * Provides canvas element, context, with retina size support
 */

export class Context2d {
    constructor(container = document.body, id = 'context-2d') {
        this.id = id
        this.container = container
        this.width = 0
        this.height = 0
        this.dpi = 1

        this.createCanvas()
        this.resize(this.width, this.height)
    }

    createCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.id = this.id
        this.context = this.canvas.getContext('2d')
        this.container.appendChild(this.canvas)
    }

    resize(width, height) {
        this.width = width
        this.height = height
        this.dpi = window.devicePixelRatio || 1
        this.canvas.width = width * this.dpi
        this.canvas.height = height * this.dpi
        this.canvas.style.width = width + 'px'
        this.canvas.style.height = height + 'px'
    }
}
