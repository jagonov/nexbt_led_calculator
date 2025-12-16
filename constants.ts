export const PIXEL_PITCHES = [
  1.25,
  1.56,
  1.95,
  2.5,
  2.6,
  2.9,
  3.91
];

export const MAX_PIXELS_PER_PORT = 650000;
export const SAFE_CAPACITY_PERCENTAGE = 0.85;
export const SAFE_PIXELS_PER_PORT = MAX_PIXELS_PER_PORT * SAFE_CAPACITY_PERCENTAGE; // 552,500

// Power consumption configuration
// Based on standard 500mm x 1000mm cabinet
export const POWER_SPECS = {
  indoor: {
    peakWattsPerPanel: 250, 
    avgWattsPerPanel: 100,  // ~40% usage
  },
  outdoor: {
    peakWattsPerPanel: 500, // 2x Indoor
    avgWattsPerPanel: 200,  // ~40% usage
  }
};

// Standard Circuit Breaker Sizes (Ampere Trip) - PEC / Industrial Standard
export const STANDARD_BREAKER_SIZES = [
  20, 30, 40, 50, 60, 70, 80, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600, 800, 1000, 1200
];