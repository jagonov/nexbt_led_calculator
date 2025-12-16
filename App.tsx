import React, { useState, useMemo } from 'react';
import { PIXEL_PITCHES } from './constants';
import { calculateRequirements } from './utils';
import { CalculationResult } from './types';
import { InfoCard } from './components/InfoCard';
import { Visualizer } from './components/Visualizer';
import { Settings2, Calculator, Ruler, Maximize2, MousePointerClick, Sun, Cloud, Zap, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [width, setWidth] = useState<number | ''>(5000);
  const [height, setHeight] = useState<number | ''>(3000);
  const [environment, setEnvironment] = useState<'indoor' | 'outdoor'>('indoor');
  const [selectedPitch, setSelectedPitch] = useState<number | null>(null);

  const results = useMemo(() => {
    const w = Number(width);
    const h = Number(height);
    
    if (!w || !h) return [];

    return PIXEL_PITCHES.map(pitch => calculateRequirements(w, h, pitch, environment));
  }, [width, height, environment]);

  // Find the currently selected result object
  const selectedResult = useMemo(() => {
    return results.find(r => r.pitch === selectedPitch) || null;
  }, [results, selectedPitch]);

  const handleWidthChange = (val: string) => {
    setWidth(val === '' ? '' : Number(val));
  };

  const handleHeightChange = (val: string) => {
    setHeight(val === '' ? '' : Number(val));
  };

  const handleReset = () => {
    setWidth('');
    setHeight('');
    setSelectedPitch(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">nexBT LED Wall Calculator</h1>
              <p className="text-xs text-slate-400">Deployment & Configuration Calculator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <Settings2 className="w-4 h-4" />
            <span>Config V1.2</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            
            {/* Dimensions Input */}
            <div className="w-full xl:w-1/3 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <h2>Screen Dimensions</h2>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-xs flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  title="Clear dimensions"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-slate-500 mb-1">Width (mm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="width"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 border focus:border-blue-500 focus:ring-blue-500 sm:text-lg py-2.5 px-4 transition-colors"
                      placeholder="e.g. 5000"
                    />
                    <span className="absolute right-3 top-3 text-slate-400 text-xs">mm</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-slate-500 mb-1">Height (mm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="height"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 border focus:border-blue-500 focus:ring-blue-500 sm:text-lg py-2.5 px-4 transition-colors"
                      placeholder="e.g. 3000"
                    />
                    <span className="absolute right-3 top-3 text-slate-400 text-xs">mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Toggle */}
             <div className="w-full xl:w-1/4 space-y-4">
               <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2>Environment</h2>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-500 mb-1">Power Profile</label>
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setEnvironment('indoor')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md text-sm font-medium transition-all ${environment === 'indoor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Cloud size={18} /> Indoor
                    </button>
                    <button 
                      onClick={() => setEnvironment('outdoor')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-md text-sm font-medium transition-all ${environment === 'outdoor' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Sun size={18} /> Outdoor
                    </button>
                 </div>
                 <div className="text-xs text-slate-400 px-1 mt-1">
                   {environment === 'indoor' ? 'Calculates @ 500W/m²' : 'Calculates @ 1000W/m²'}
                 </div>
              </div>

             </div>

            {/* Stats */}
            <div className="flex-1 w-full xl:mt-11">
               <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 h-full flex flex-col justify-center">
                 <div className="flex items-start gap-3">
                    <Maximize2 className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="text-blue-900 font-semibold mb-1">Deployment Area</h3>
                      {width && height ? (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-800">
                          <span>Total Area: <strong className="text-blue-950">{((Number(width) * Number(height)) / 1000000).toFixed(2)} m²</strong></span>
                          <span>Aspect Ratio: <strong className="text-blue-950">{(Number(width) / Number(height)).toFixed(2)}</strong></span>
                        </div>
                      ) : (
                        <span className="text-sm text-blue-400">Enter dimensions to calculate area</span>
                      )}
                    </div>
                 </div>
               </div>
            </div>

          </div>
        </section>

        {/* Visualizer Section - Shows when an item is selected */}
        {selectedResult && (
          <section id="visualizer">
            <Visualizer 
              data={selectedResult} 
              widthMm={Number(width)} 
              heightMm={Number(height)}
              environment={environment}
            />
          </section>
        )}

        {/* Results Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">Pixel Pitch Comparison</h2>
              {!selectedResult && (
                <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                  <MousePointerClick className="w-3 h-3 mr-1" /> Select one to visualize
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500">
              Showing {results.length} variations
            </div>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((res) => (
                <InfoCard 
                  key={res.pitch} 
                  data={res} 
                  isSelected={selectedPitch === res.pitch}
                  onClick={() => setSelectedPitch(res.pitch)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-400">Please enter screen dimensions to generate results.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default App;