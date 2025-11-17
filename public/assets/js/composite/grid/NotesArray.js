export class NotesArray {
    constructor(cols = 0, rows = 0) {
        this.reset(cols, rows)
    }

    set(x, y, value) {
        // Do not include values that are outside of the array
        if (x < 0 || this.cols <= x) return
        if (y < 0 || this.rows <= y) return

        let index = this.getIndexFromCoords(x, y)
        // We add + 1, to set 0 aside as a 'undefined' value
        if (value === undefined) this.data[index] = 0
        else this.data[index] = value + 1

    }

    get(x, y) {
        let index = this.getIndexFromCoords(x, y)
        if (this.data[index]) return this.data[index] - 1
        else return undefined
    }

    flipY(y) {
        return this.rows - y - 1
    }

    getIndexFromCoords(x, y) {
        /*
        Pitch / index mapping system assumes 0,0 at the bottom left of the grid.

        We're mapping this grid:

        0,rows-1  1,rows-1  ...  cols-1,rows-1
        ...
        0,1       1,1       ...  cols-1,1
        0,0       1,0       ...  cols-1,0

        To flat indexes row by row starting at the top left and moving right:

        0               1               ...  cols-1
        ...
        (rows-1)*cols  (rows-1)*cols+1  ...  (cols*rows)-1
        */
        y = this.flipY(y)
        return y * this.cols + x
    }

    reset(cols, rows) {
        this.cols = cols
        this.rows = rows
        this.data = new Uint8Array(cols * rows)
    }
}
