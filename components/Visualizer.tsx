import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalculationResult } from '../types';
import { formatNumber } from '../utils';
import { Ruler, FileText, Cable, Zap, Box, ZoomIn, ZoomOut, Maximize, LayoutGrid, Eye, CircuitBoard, Expand, Minimize, ArrowRight, Settings, Download } from 'lucide-react';
import { SAFE_PIXELS_PER_PORT, MAX_PIXELS_PER_PORT, POWER_SPECS } from '../constants';

interface VisualizerProps {
  data: CalculationResult;
  widthMm: number;
  heightMm: number;
  environment: 'indoor' | 'outdoor';
}

type ViewMode = 'physical' | 'data' | 'power';

const COLORS = [
  { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-100' },
  { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-100' },
  { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-100' },
  { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-100' },
  { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-100' },
  { bg: 'bg-cyan-500', border: 'border-cyan-400', text: 'text-cyan-100' },
  { bg: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-indigo-100' },
  { bg: 'bg-lime-500', border: 'border-lime-400', text: 'text-lime-100' },
  { bg: 'bg-fuchsia-500', border: 'border-fuchsia-400', text: 'text-fuchsia-100' },
  { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-100' },
  { bg: 'bg-teal-500', border: 'border-teal-400', text: 'text-teal-100' },
  { bg: 'bg-pink-500', border: 'border-pink-400', text: 'text-pink-100' }
];

const PersonSilhouette = ({ height, className }: { height: number, className?: string }) => (
  <svg 
    height={height} 
    viewBox="0 0 24 64" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="7" r="5" />
    <path d="M6 15 C6 12 18 12 18 15 L19 32 L17 32 L17 64 L13 64 L13 40 L11 40 L11 64 L7 64 L7 32 L5 32 Z" />
  </svg>
);

export const Visualizer: React.FC<VisualizerProps> = ({ data, widthMm, heightMm, environment }) => {
  const [zoomMult, setZoomMult] = useState(1.0);
  const [viewMode, setViewMode] = useState<ViewMode>('physical');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const widthM = widthMm / 1000;
  const heightM = heightMm / 1000;

  // Scene Configuration
  const PERSON_HEIGHT_M = 1.65; // 5' 5"
  const PERSON_WIDTH_EST_M = 0.8; 
  const GAP_M = 1.0; 

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Layout Constraints - Dynamic based on view mode
  const CONTAINER_WIDTH = isFullscreen ? window.innerWidth : 500;
  const CONTAINER_HEIGHT = isFullscreen ? window.innerHeight : 320;
  const MAX_PPM = isFullscreen ? 200 : 80;

  // Scale Calculation
  const totalSceneWidthM = PERSON_WIDTH_EST_M + GAP_M + widthM;
  const totalSceneHeightM = Math.max(PERSON_HEIGHT_M, heightM);
  const scaleX = CONTAINER_WIDTH / totalSceneWidthM;
  const scaleY = CONTAINER_HEIGHT / totalSceneHeightM;
  const basePPM = Math.min(scaleX, scaleY, MAX_PPM);
  const ppm = basePPM * zoomMult;

  // Dimensions in Pixels
  const personHeightPx = PERSON_HEIGHT_M * ppm;
  const screenWidthPx = widthM * ppm;
  const screenHeightPx = heightM * ppm;
  const gapPx = GAP_M * ppm;

  // Grouping Logic for Visualization
  const gridData = useMemo(() => {
    const { cabinetsWidth, cabinetsHeight, totalCabinets, lanPorts, circuits220v } = data;
    
    // Balanced Distribution Logic
    // Distribute total cabinets evenly across the required number of groups (ports/circuits)
    // This ensures load is balanced (e.g. 11, 11, 11, 11) instead of sequential fill (14, 14, 14, 2).
    const generateAssignments = (totalItems: number, groupCount: number) => {
        const assignments = new Array(totalItems).fill(0);
        let currentItem = 0;
        const baseSize = Math.floor(totalItems / groupCount);
        const remainder = totalItems % groupCount;
  
        for (let i = 0; i < groupCount; i++) {
          // Distribute remainder one by one to the first groups
          const count = i < remainder ? baseSize + 1 : baseSize;
          for (let j = 0; j < count; j++) {
            if (currentItem < totalItems) {
               assignments[currentItem++] = i;
            }
          }
        }
        return assignments;
    };

    const portAssignments = generateAssignments(totalCabinets, lanPorts);
    const circuitAssignments = generateAssignments(totalCabinets, circuits220v);

    const cells = [];
    
    // Generate Grid Cells with Group IDs
    // We assume a "Vertical Snake" cabling path for realistic index assignment
    for (let y = 0; y < cabinetsHeight; y++) {
      for (let x = 0; x < cabinetsWidth; x++) {
        // Calculate a linear index based on a snake pattern (up/down columns)
        let snakeIndex;
        if (x % 2 === 0) {
          // Even column: Top to Bottom
          snakeIndex = (x * cabinetsHeight) + y;
        } else {
          // Odd column: Bottom to Top
          snakeIndex = (x * cabinetsHeight) + (cabinetsHeight - 1 - y);
        }

        cells.push({
          x,
          y,
          snakeIndex,
          portId: portAssignments[snakeIndex],
          circuitId: circuitAssignments[snakeIndex]
        });
      }
    }
    return { cells };
  }, [data, environment]);

  // Breakdown Data for Side Panel
  const breakdown = useMemo(() => {
    // We need to support dynamically sized arrays based on max ID found
    // Find max IDs to initialize arrays
    let maxPortId = 0;
    let maxCircuitId = 0;
    gridData.cells.forEach(c => {
      if (c.portId > maxPortId) maxPortId = c.portId;
      if (c.circuitId > maxCircuitId) maxCircuitId = c.circuitId;
    });

    const ports = [];
    const circuits = [];
    
    // Initialize Arrays
    for(let i=0; i <= maxPortId; i++) ports.push({id: i, count: 0});
    for(let i=0; i <= maxCircuitId; i++) circuits.push({id: i, count: 0});

    // Count from actual grid cells to be accurate with snake logic
    gridData.cells.forEach(cell => {
      if (ports[cell.portId]) ports[cell.portId].count++;
      if (circuits[cell.circuitId]) circuits[cell.circuitId].count++;
    });

    const pixelsPerCabinet = data.totalPixels / data.totalCabinets;
    const wattsPerCabinet = data.peakPowerWatts / data.totalCabinets;

    const activePorts = ports
        .filter(p => p.count > 0)
        .map(p => ({
          ...p,
          pixels: Math.round(p.count * pixelsPerCabinet),
          percentage: (Math.round(p.count * pixelsPerCabinet) / MAX_PIXELS_PER_PORT) * 100
        }));

    const activeCircuits = circuits
        .filter(c => c.count > 0)
        .map(c => ({
          ...c,
          watts: c.count * wattsPerCabinet,
          amps: (c.count * wattsPerCabinet) / 220
        }));

    // Group Circuits into MCCBs (e.g., 6 circuits per Distro/MCCB)
    const CIRCUITS_PER_MCCB = 6;
    const mccbGroups = [];
    
    for (let i = 0; i < activeCircuits.length; i += CIRCUITS_PER_MCCB) {
      const groupCircuits = activeCircuits.slice(i, i + CIRCUITS_PER_MCCB);
      const totalAmps = groupCircuits.reduce((sum, c) => sum + c.amps, 0);
      
      // Calculate suggested MCCB size
      const standardSizes = [32, 40, 63, 80, 100, 125, 160, 200, 250, 400];
      const required = totalAmps * 1.25;
      const size = standardSizes.find(s => s >= required) || 400;

      mccbGroups.push({
        id: Math.floor(i / CIRCUITS_PER_MCCB) + 1,
        circuits: groupCircuits,
        totalAmps,
        size
      });
    }

    return {
      ports: activePorts,
      circuits: activeCircuits,
      mccbs: mccbGroups
    };
  }, [gridData, data]);

  // BOQ Generator Function
  const handleDownloadBOQ = () => {
    const date = new Date().toLocaleDateString();
    const mccbCount = breakdown.mccbs.length;
    // Get unique MCCB sizes for summary
    const distinctMccbSizes = Array.from(new Set(breakdown.mccbs.map(m => m.size))).join('A, ') + 'A';
    
    const content = `BILL OF QUANTITIES (BOQ) - PRELIMINARY
Project: LED Wall Deployment
Date: ${date}
Generated by: nexBT LED Wall Calculator

--------------------------------------------------
1. SYSTEM SPECIFICATIONS
--------------------------------------------------
- Screen Dimensions  : ${widthMm}mm (W) x ${heightMm}mm (H)
- Pixel Pitch        : P${data.pitch}
- Resolution         : ${formatNumber(data.resolutionWidth)} x ${formatNumber(data.resolutionHeight)}
- Resolution Class   : ${data.resolutionClass}
- Total Area         : ${data.areaSqM.toFixed(2)} m²
- Environment        : ${environment.charAt(0).toUpperCase() + environment.slice(1)}

--------------------------------------------------
2. BILL OF MATERIALS (BOM)
--------------------------------------------------

[A] LED DISPLAY MODULES
   - Item Description : Indoor/Outdoor LED Cabinet (500mm x 1000mm)
   - Quantity         : ${data.totalCabinets} units
   - Grid Topology    : ${data.cabinetsWidth} (W) x ${data.cabinetsHeight} (H)
   - Total Resolution : ${formatNumber(data.totalPixels)} pixels

[B] CONTROL SYSTEM
   - Main Controller  : ${data.controller} (or equivalent)
   - Quantity         : 1 unit
   - Active LAN Ports : ${data.lanPorts} ports used
   - Signal Cabling   : ${data.lanPorts} runs of CAT6 (Main Lines)

[C] POWER DISTRIBUTION
   - Main Breaker     : ${data.mainBreakerSize}A (Main Supply Requirement)
   - Distro Blocks    : ${mccbCount} units (MCCB) @ ${distinctMccbSizes}
   - Branch Circuits  : ${data.circuits220v} units (CO) @ 20A each
   - Est. Peak Load   : ${(data.peakPowerWatts / 1000).toFixed(2)} kW
   - Est. Avg Load    : ${(data.avgPowerWatts / 1000).toFixed(2)} kW
   - Power Cabling    : ${data.circuits220v} runs (AC Loop Cables)

--------------------------------------------------
* Note: This BOQ is an engineering estimate based on
  standard power coefficients and 500x1000mm panels.
  Final cabling lengths and accessories must be verified
  during site survey.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOQ_LED_P${data.pitch}_${widthMm}x${heightMm}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-slate-900 px-8 py-6 flex flex-col md:flex-row justify-between items-center text-white">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Visual Engineering Report
           </h2>
           <p className="text-blue-200 text-sm mt-1">Detailed breakdown for P{data.pitch} configuration</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center gap-4">
          <div className="flex gap-4 text-sm font-medium">
            <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 flex items-center gap-3">
              <span>{formatNumber(data.resolutionWidth)} x {formatNumber(data.resolutionHeight)} px</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold text-blue-100 border border-white/10">{data.resolutionClass}</span>
            </div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm">
              {formatNumber(data.totalPixels)} Pixels
            </div>
          </div>
          
          <button 
            onClick={handleDownloadBOQ}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg transition-colors border border-emerald-400 active:transform active:scale-95"
            title="Download Bill of Quantities"
          >
            <Download size={16} /> Generate BOQ
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Visual Scale Column */}
        <div 
          ref={containerRef}
          className={`relative bg-slate-50 min-h-[450px] overflow-hidden flex flex-col transition-all duration-500 ${isFullscreen ? 'w-full h-full p-10' : ''}`}
        >
          
          {/* Controls Bar */}
          <div className="absolute top-4 left-6 right-6 z-10 flex flex-wrap justify-between items-start gap-4 pointer-events-none">
            
            <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg p-1 flex gap-1">
              <button 
                onClick={() => setViewMode('physical')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'physical' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <LayoutGrid size={14} /> Structure
              </button>
              <button 
                onClick={() => setViewMode('data')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'data' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Cable size={14} /> Data
              </button>
               <button 
                onClick={() => setViewMode('power')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${viewMode === 'power' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Zap size={14} /> Power
              </button>
            </div>

            <div className="pointer-events-auto flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200 p-1">
               <button onClick={() => setZoomMult(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Zoom Out"><ZoomOut size={16} /></button>
               <button onClick={() => setZoomMult(1.0)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Reset Zoom"><Maximize size={16} /></button>
               <button onClick={() => setZoomMult(z => Math.min(3.0, z + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Zoom In"><ZoomIn size={16} /></button>
               <div className="w-px bg-slate-200 mx-1"></div>
               <button onClick={toggleFullscreen} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                 {isFullscreen ? <Minimize size={16} /> : <Expand size={16} />}
               </button>
            </div>
          </div>
          
          {/* Visualization Stage */}
          <div className={`flex-1 flex justify-center items-end pb-16 px-8 overflow-auto ${isFullscreen ? 'pt-40' : 'pt-20'}`}>
             <div className="flex items-end transition-all duration-300 ease-out" style={{ gap: `${gapPx}px` }}>
                
                {/* Person */}
                <div className="flex flex-col items-center shrink-0">
                  <div style={{ height: `${personHeightPx}px` }} className="relative flex items-end justify-center min-w-[40px]">
                    {/* Silhouette Group */}
                    <PersonSilhouette 
                      height={personHeightPx * 0.9} 
                      className="text-slate-300 absolute bottom-0 -left-3 opacity-80" 
                    />
                     <PersonSilhouette 
                      height={personHeightPx * 0.94} 
                      className="text-slate-300 absolute bottom-0 -right-3 opacity-80" 
                    />
                    <PersonSilhouette 
                      height={personHeightPx} 
                      className="text-slate-400 relative z-10" 
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="block text-xs font-bold text-slate-500 whitespace-nowrap">5' 5"</span>
                    <span className="block text-[10px] text-slate-400">(1.65m)</span>
                  </div>
                </div>

                {/* LED Screen Grid */}
                <div className="flex flex-col items-center shrink-0">
                   <div 
                      className="bg-slate-900 shadow-2xl relative transition-all duration-300"
                      style={{ 
                        width: `${Math.max(screenWidthPx, 2)}px`, 
                        height: `${Math.max(screenHeightPx, 2)}px`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${data.cabinetsWidth}, 1fr)`,
                        gridTemplateRows: `repeat(${data.cabinetsHeight}, 1fr)`,
                      }}
                   >
                      {gridData.cells.map((cell, idx) => {
                        let activeColor = null;
                        if (viewMode === 'data') activeColor = COLORS[cell.portId % COLORS.length];
                        if (viewMode === 'power') activeColor = COLORS[cell.circuitId % COLORS.length];

                        // Smart Border Logic
                        let borderClasses = '';
                        let currentId = -1;
                        
                        if (viewMode === 'physical') {
                          borderClasses = 'border-r border-b border-white/10 border-dashed hover:bg-white/5';
                        } else {
                          // Data or Power Mode
                          currentId = viewMode === 'data' ? cell.portId : cell.circuitId;
                          
                          // Helper to get neighbor ID
                          const getNeighborId = (dx: number, dy: number) => {
                            const nx = cell.x + dx;
                            const ny = cell.y + dy;
                            if (nx < 0 || nx >= data.cabinetsWidth || ny < 0 || ny >= data.cabinetsHeight) return -2; // Edge of screen
                            const neighborIndex = ny * data.cabinetsWidth + nx; // Map 2D back to flat index
                            const neighbor = gridData.cells[neighborIndex];
                            return viewMode === 'data' ? neighbor.portId : neighbor.circuitId;
                          };

                          // Boundary Checks
                          const isTopEdge = getNeighborId(0, -1) !== currentId;
                          const isBottomEdge = getNeighborId(0, 1) !== currentId;
                          const isLeftEdge = getNeighborId(-1, 0) !== currentId;
                          const isRightEdge = getNeighborId(1, 0) !== currentId;

                          // Apply Borders: Thick Dashed for Group Boundary, Faint Solid for Internal
                          borderClasses += isTopEdge ? ' border-t-2 border-dashed border-white/80' : ' border-t border-white/5';
                          borderClasses += isBottomEdge ? ' border-b-2 border-dashed border-white/80' : ' border-b border-white/5';
                          borderClasses += isLeftEdge ? ' border-l-2 border-dashed border-white/80' : ' border-l border-white/5';
                          borderClasses += isRightEdge ? ' border-r-2 border-dashed border-white/80' : ' border-r border-white/5';
                        }

                        return (
                          <div 
                            key={idx}
                            className={`
                              relative group flex items-center justify-center transition-all duration-200 overflow-hidden
                              ${borderClasses}
                            `}
                            title={`Cabinet ${cell.snakeIndex + 1} | Port: ${cell.portId + 1} | Circuit: ${cell.circuitId + 1}`}
                          >
                            {/* Color Overlay */}
                            {(viewMode === 'data' || viewMode === 'power') && activeColor && (
                               <>
                                <div className={`absolute inset-0 ${activeColor.bg} opacity-50 group-hover:opacity-60 transition-opacity`} />
                                {/* Label: C1, C2 or P1, P2 */}
                                <span className="relative z-10 text-[10px] font-bold text-white/90 drop-shadow-md select-none">
                                  {viewMode === 'power' ? `C${cell.circuitId + 1}` : `P${cell.portId + 1}`}
                                </span>
                               </>
                            )}
                          </div>
                        );
                      })}
                   </div>
                   
                   <div className="mt-2 text-center w-full">
                      <div className="h-px bg-slate-300 w-full relative top-[-10px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="block text-xs font-bold text-slate-700">{widthMm / 1000}m</span>
                      <span className="block text-[10px] text-slate-400">Width</span>
                   </div>
                </div>

             </div>
          </div>
          
          <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono">
            {viewMode === 'physical' && `Scale: 1m = ${ppm.toFixed(1)}px`}
            {viewMode === 'data' && 'Dashed Line = Port Boundary | Labels = Port ID'}
            {viewMode === 'power' && 'Dashed Line = Circuit Boundary | Labels = Circuit ID'}
          </div>
        </div>

        {/* Data Table Column - Dynamic Content */}
        <div className="p-8 h-full overflow-y-auto max-h-[600px] scrollbar-thin">
           
           {/* HEADER for Side Panel */}
           <h3 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
             {viewMode === 'physical' && (
                <>
                  <FileText className="text-slate-400" size={20} /> Configuration Summary
                </>
             )}
             {viewMode === 'data' && (
                <>
                  <Cable className="text-indigo-500" size={20} /> Port Patching Schedule
                </>
             )}
             {viewMode === 'power' && (
                <>
                   <Zap className="text-amber-500" size={20} /> Power Distribution Schedule
                </>
             )}
           </h3>

           {/* CONTENT: Physical (Summary Table) */}
           {viewMode === 'physical' && (
             <div className="overflow-hidden rounded-xl border border-slate-200 animate-fade-in">
               <table className="min-w-full divide-y divide-slate-200">
                  <tbody className="divide-y divide-slate-200 bg-white">
                     <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">Pixel Pitch</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">P {data.pitch}</td>
                     </tr>
                     <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">Final Resolution</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 flex items-center gap-2">
                          {formatNumber(data.resolutionWidth)} × {formatNumber(data.resolutionHeight)}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {data.resolutionClass}
                          </span>
                        </td>
                     </tr>
                     <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">Total Pixels</td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatNumber(data.totalPixels)} px</td>
                     </tr>
                     <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                          <LayoutGrid size={16} /> Cabinets (W × H)
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {data.cabinetsWidth} × {data.cabinetsHeight} <span className="text-xs font-normal text-slate-500">({data.totalCabinets} Total)</span>
                        </td>
                     </tr>
                     <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                          <Cable size={16} /> LAN Ports Required
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{data.lanPorts} <span className="text-xs font-normal text-slate-500">(@ 85% Load)</span></td>
                     </tr>
                     <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                          <Box size={16} /> Controller Required
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{data.controller}</td>
                     </tr>
                     <tr className="hover:bg-slate-50 bg-amber-50/50">
                        <td className="px-6 py-4 text-sm font-medium text-amber-700 flex items-center gap-2">
                          <Zap size={16} /> Power Outlets (220V)
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-amber-900">
                          {data.circuits220v} <span className="text-xs font-normal opacity-70">(20A circuits)</span>
                        </td>
                     </tr>
                     <tr className="hover:bg-slate-50 bg-red-50/50 border-t border-red-100">
                        <td className="px-6 py-4 text-sm font-medium text-red-700 flex items-center gap-2">
                          <CircuitBoard size={16} /> Main Breaker
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-red-900">
                          {data.mainBreakerSize} AT <span className="text-xs font-normal opacity-70">(Total Load + 25%)</span>
                        </td>
                     </tr>
                  </tbody>
               </table>
             </div>
           )}

           {/* CONTENT: Data (Port List) */}
           {viewMode === 'data' && (
             <div className="space-y-3 animate-fade-in">
                {breakdown.ports.map((port) => (
                  <div key={port.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all">
                    <div className={`w-3 h-3 mt-1.5 rounded-full shrink-0 ${COLORS[port.id % COLORS.length].bg}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">Port {port.id + 1}</span>
                        <span className="text-xs font-mono text-slate-500">{formatNumber(port.pixels)} px</span>
                      </div>
                      
                      <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                         <div 
                           className={`h-full ${COLORS[port.id % COLORS.length].bg}`} 
                           style={{ width: `${Math.min(100, port.percentage)}%` }}
                         ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500">
                         <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                           <Box size={10} /> {port.count} Cabinets
                         </span>
                         <span className={port.percentage > 90 ? "text-red-500 font-bold" : "text-slate-400"}>
                           {port.percentage.toFixed(1)}% Load
                         </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-xs text-indigo-800 border border-indigo-100">
                   <p className="font-semibold mb-1">Topology Note:</p>
                   <p>Ports are distributed in a vertical snake pattern for optimal cabling efficiency. Dashed lines indicate controller port boundaries.</p>
                </div>
             </div>
           )}

           {/* CONTENT: Power (Hierarchical MCCB List) */}
           {viewMode === 'power' && (
             <div className="space-y-6 animate-fade-in">
                
                {/* Main Breaker Info */}
                <div className="p-4 bg-slate-900 rounded-xl text-white shadow-md border border-slate-700">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <CircuitBoard size={14} /> Main Supply
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                       <div className="text-2xl font-bold text-white">{data.mainBreakerSize}A <span className="text-base font-normal text-slate-400">Total</span></div>
                       <div className="text-xs text-slate-400 mt-1">{formatNumber(data.circuits220v)} Circuits Total</div>
                     </div>
                     <div className="text-right">
                       <div className="text-xl font-bold text-amber-400">{data.amps220v.toFixed(1)}A</div>
                       <div className="text-xs text-amber-500/80">Est. Load</div>
                     </div>
                  </div>
                </div>

                {/* MCCB Groups */}
                <div className="space-y-6">
                  {breakdown.mccbs.map((mccb) => (
                    <div key={mccb.id} className="relative pl-6 border-l-2 border-slate-200">
                      {/* MCCB Header */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                      <div className="mb-3 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-lg">MCCB-{mccb.id}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold border border-slate-200">
                              {mccb.size}A
                            </span>
                         </div>
                         <div className="text-xs font-bold text-slate-400">
                           Load: {mccb.totalAmps.toFixed(1)}A
                         </div>
                      </div>

                      {/* Child Circuits (CO) */}
                      <div className="grid gap-2">
                        {mccb.circuits.map((circuit) => (
                          <div key={circuit.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all group">
                            <div className={`w-2 h-8 rounded-full shrink-0 ${COLORS[circuit.id % COLORS.length].bg}`}></div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm text-slate-700">
                                  CO-{circuit.id + 1} <span className="text-xs font-normal text-slate-500">({circuit.amps.toFixed(1)}A)</span>
                                </span>
                                <span className="text-xs font-mono text-slate-600 font-semibold">{formatNumber(Math.round(circuit.watts))}W</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {circuit.count} Cabinets
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-100">
                   <p className="font-semibold mb-1">Hierarchy Note:</p>
                   <p><strong>Main</strong> &gt; <strong>MCCB</strong> (Distro Block) &gt; <strong>CO</strong> (Circuit Outlet / MCB). <br/>Grouping assumes 6-way distribution channels per MCCB.</p>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};