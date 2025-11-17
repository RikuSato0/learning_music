# Music Learning Platform

An interactive, game-based music learning platform designed to help students of all ages learn music through fun and engaging activities.

## Features

### 🎵 Composite/Songmaker
Create and compose music with an intuitive interface. Build melodies using various instruments including piano, marimba, strings, synth, woodwind, and more.

### 🎚️ Dynamics
Learn about musical dynamics (volume levels) through interactive exercises. Understand the differences between piano (p), mezzo-piano (mp), mezzo-forte (mf), forte (f), and more.

### 🥁 Metronome
Practice with a built-in metronome featuring different tempo markings (largo, adagio, andante, allegro, presto, vivace) and visual feedback.

### 🎹 Interactive Learning
- Game-based learning approach
- Visual and audio feedback
- Multiple instrument support
- MIDI input support
- Microphone input for rhythm practice

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd learning_music
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port specified in your server configuration).

## Project Structure

```
learning_music/
├── assets/              # Source assets and JavaScript files
├── public/              # Public assets (CSS, JS, images, audio)
│   ├── assets/
│   │   ├── css/        # Stylesheets
│   │   ├── js/         # JavaScript modules
│   │   ├── music/      # Audio files
│   │   └── image/      # Images and icons
│   └── audio/          # Sound effects
├── help/               # Help documentation
├── index.html          # Landing page
├── composite.html      # Music composition tool
├── dynamics.html       # Dynamics learning tool
├── metronome.html      # Metronome tool
├── songmaker.html      # Song maker interface
├── server.js           # Express server
└── package.json        # Dependencies and scripts
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Audio**: Tone.js
- **Music Notation**: VexFlow
- **Styling**: SCSS/CSS

## Available Scripts

- `npm start` - Start the development server with nodemon
- `npm run build` - Build the project (placeholder)
- `npm test` - Run tests (placeholder)

## Features in Detail

### Music Composition
- Grid-based composition interface
- Multiple instrument selection
- Tempo control
- Pattern creation and editing
- Export/import functionality

### Dynamics Learning
- Interactive exercises
- Visual feedback
- Audio examples
- Help documentation

### Metronome
- Adjustable tempo
- Visual tempo indicators
- Multiple time signatures
- Pattern visualization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

Music Learning Platform Development Team

