// Song configuration options
export const SongOptions = {
    // Default tempo range
    tempo: {
        min: 40,
        max: 208,
        default: 120
    },
    
    // Available time signatures
    timeSignatures: ['4/4', '3/4'],
    
    // Note durations in ticks
    noteDurations: {
        whole: 384,
        half: 192,
        quarter: 96,
        eighth: 48,
        sixteenth: 24
    },
    
    // Default scale
    scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    
    // Dynamic markings
    dynamics: {
        pp: { name: 'pianissimo', velocity: 0.2 },
        p: { name: 'piano', velocity: 0.4 },
        mp: { name: 'mezzo-piano', velocity: 0.6 },
        mf: { name: 'mezzo-forte', velocity: 0.7 },
        f: { name: 'forte', velocity: 0.8 },
        ff: { name: 'fortissimo', velocity: 1.0 }
    }
}; 