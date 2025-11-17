//maps index to midi note offset
export const MAJOR = [0, 2, 4, 5, 7, 9, 11]
export const PENTATONIC = [0, 2, 4, 7, 9]
export const CHROMATIC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
export const DRUMS = [0, 1]

export function nameToScale(name) {
    switch (name) {
        case 'major': return MAJOR
        case 'pentatonic': return PENTATONIC
        case 'chromatic': return CHROMATIC
        case 'drums': return DRUMS
        default:
            throw new Error(`unrecognized scale ${name}`)
    }
}

//convert a pitch to an index
export function pitchToIndex(pitch, rootNote, scaleName) {
    const scale = nameToScale(scaleName)
    const pitchClass = (pitch - rootNote) % 12
    const octave = Math.floor((pitch - rootNote) / 12)
    //find the index in the scale
    const index = scale.indexOf(pitchClass)
    if (index !== -1) {
        return index + octave * scale.length
    } else {
        throw new Error('pitch not in scale')
    }
}

//takes floating point pitches and returns a floating point index
export function pitchToIndexFloat(pitch, rootNote, scaleName) {
    //scale plus an octave
    const scale = nameToScale(scaleName).slice()
    scale.push(12)
    const pitchClass = (pitch - rootNote) % 12
    const octave = Math.floor((pitch - rootNote) / 12)
    //find the index in the scale
    const upperIndex = scale.findIndex(degree => degree > pitchClass)
    const lowerIndex = upperIndex - 1
    const scaleDegreeNormalized = (pitchClass - scale[lowerIndex]) / (scale[upperIndex] - scale[lowerIndex])
    return lowerIndex + scaleDegreeNormalized + octave * (scale.length - 1)
}

export function indexToPitch(index, rootNote, scaleName) {
    const scale = nameToScale(scaleName)
    const octave = Math.floor(index / scale.length)
    const pitchClass = scale[index % scale.length]
    return pitchClass + octave * 12 + rootNote
}

export function closestPitch(pitch, rootNote, scaleName) {
    const scale = nameToScale(scaleName)
    const pitchClass = (pitch - rootNote) % 12
    const octave = Math.floor((pitch - rootNote) / 12)
    let closest = -1
    let dist = Infinity
    scale.forEach(degree => {
        const scaleNote = degree + rootNote + octave * 12
        if (Math.abs(scaleNote - pitch) < dist) {
            dist = Math.abs(scaleNote - pitch)
            closest = scaleNote
        }
    })
    return closest
}

export function ftom(frequency) {
    return Math.round(ftomFloat(frequency))
}

//convert to floating point midi
export function ftomFloat(frequency) {
    return 69 + 12 * Math.log2(frequency / 440);
}
