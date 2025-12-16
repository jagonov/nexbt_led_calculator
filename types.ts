export interface CalculationResult {
  pitch: number;
  resolutionWidth: number;
  resolutionHeight: number;
  resolutionClass: string;
  totalPixels: number;
  lanPorts: number;
  controller: string;
  peakPowerWatts: number;
  avgPowerWatts: number;
  amps220v: number;
  circuits220v: number;
  mainBreakerSize: number;
  areaSqM: number;
  cabinetsWidth: number;
  cabinetsHeight: number;
  totalCabinets: number;
}