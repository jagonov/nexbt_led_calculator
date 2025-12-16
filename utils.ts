import { 
  SAFE_PIXELS_PER_PORT, 
  POWER_SPECS,
  STANDARD_BREAKER_SIZES
} from './constants';
import { CalculationResult } from './types';

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const calculateRequirements = (
  widthMm: number, 
  heightMm: number, 
  pitch: number, 
  environment: 'indoor' | 'outdoor'
): CalculationResult => {
  // 1. Cabinets (500mm x 1000mm)
  const CABINET_WIDTH_MM = 500;
  const CABINET_HEIGHT_MM = 1000;
  
  const cabinetsWidth = Math.ceil(widthMm / CABINET_WIDTH_MM);
  const cabinetsHeight = Math.ceil(heightMm / CABINET_HEIGHT_MM);
  const totalCabinets = cabinetsWidth * cabinetsHeight;

  // 2. Resolution & Pixels
  const resolutionWidth = Math.round(widthMm / pitch);
  const resolutionHeight = Math.round(heightMm / pitch);
  const totalPixels = resolutionWidth * resolutionHeight;
  
  // Calculate exact pixels per cabinet to ensure physical constraints
  const pixelsPerCabinetW = Math.round(CABINET_WIDTH_MM / pitch);
  const pixelsPerCabinetH = Math.round(CABINET_HEIGHT_MM / pitch);
  const pixelsPerCabinet = pixelsPerCabinetW * pixelsPerCabinetH;

  // 3. Resolution Class
  const longSide = Math.max(resolutionWidth, resolutionHeight);
  const shortSide = Math.min(resolutionWidth, resolutionHeight);
  let resolutionClass = 'SD';
  if (longSide >= 7680 && shortSide >= 4320) resolutionClass = '8K';
  else if (longSide >= 3840 && shortSide >= 2160) resolutionClass = '4K';
  else if (longSide >= 2560 && shortSide >= 1440) resolutionClass = 'QHD';
  else if (longSide >= 1920 && shortSide >= 1080) resolutionClass = 'FHD';
  else if (longSide >= 1280 && shortSide >= 720) resolutionClass = 'HD';
  
  // 4. LAN Ports (Discrete Logic)
  // Calculate max cabinets one port can handle before overflowing
  const maxCabinetsPerPort = Math.floor(SAFE_PIXELS_PER_PORT / pixelsPerCabinet);
  // Ensure we can at least drive 1 cabinet (even if it exceeds safe limit slightly, otherwise we get infinite ports)
  const effectiveCabinetsPerPort = Math.max(1, maxCabinetsPerPort);
  
  const lanPorts = Math.ceil(totalCabinets / effectiveCabinetsPerPort);

  // 5. Controller Logic
  let controller = "Multiple VX16s";
  if (lanPorts === 1) controller = "TB20";
  else if (lanPorts <= 2) controller = "MCTRL300";
  else if (lanPorts <= 4) controller = "MCTRL600";
  else if (lanPorts <= 16) controller = "VX16s";

  // 6. Power
  const specs = POWER_SPECS[environment];
  const peakPowerWatts = totalCabinets * specs.peakWattsPerPanel;
  const avgPowerWatts = totalCabinets * specs.avgWattsPerPanel;
  const amps220v = peakPowerWatts / 220;

  // 7. Circuits (Discrete Logic)
  // Calculate amps per single cabinet
  const ampsPerCabinet = specs.peakWattsPerPanel / 220;
  const SAFE_LOAD_FACTOR = 0.8;
  const safeAmpsPerCircuit = 20 * SAFE_LOAD_FACTOR; // 16A
  
  // How many cabinets fit on a 16A usable circuit?
  const maxCabinetsPerCircuit = Math.floor(safeAmpsPerCircuit / ampsPerCabinet);
  const effectiveCabinetsPerCircuit = Math.max(1, maxCabinetsPerCircuit);

  const circuits220v = Math.ceil(totalCabinets / effectiveCabinetsPerCircuit);

  // Main Breaker
  const requiredMainAmps = amps220v * 1.25;
  const mainBreakerSize = STANDARD_BREAKER_SIZES.find(size => size >= requiredMainAmps) 
    || STANDARD_BREAKER_SIZES[STANDARD_BREAKER_SIZES.length - 1];

  // 8. Area
  const widthM = widthMm / 1000;
  const heightM = heightMm / 1000;
  const areaSqM = widthM * heightM;

  return {
    pitch,
    resolutionWidth,
    resolutionHeight,
    resolutionClass,
    totalPixels,
    lanPorts,
    controller,
    peakPowerWatts,
    avgPowerWatts,
    amps220v,
    circuits220v,
    mainBreakerSize,
    areaSqM,
    cabinetsWidth,
    cabinetsHeight,
    totalCabinets
  };
};