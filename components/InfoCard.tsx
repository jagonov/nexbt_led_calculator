import React from 'react';
import { CalculationResult } from '../types';
import { formatNumber } from '../utils';
import { Monitor, Cpu, Zap, Network, CheckCircle2 } from 'lucide-react';

interface InfoCardProps {
  data: CalculationResult;
  isSelected?: boolean;
  onClick?: () => void;
}

const getResColor = (res: string) => {
  switch(res) {
    case '8K': return 'bg-rose-100 text-rose-700 border-rose-200';
    case '4K': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'QHD': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'FHD': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'HD': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const InfoCard: React.FC<InfoCardProps> = ({ data, isSelected, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-xl shadow-md overflow-hidden border transition-all duration-300 cursor-pointer group
        ${isSelected 
          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 ring-offset-2' 
          : 'bg-white border-gray-100 hover:shadow-xl hover:border-blue-200'
        }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 text-blue-500 bg-white rounded-full p-0.5 z-10">
          <CheckCircle2 size={20} fill="currentColor" className="text-white bg-blue-500 rounded-full" />
        </div>
      )}

      <div className={`${isSelected ? 'bg-blue-600' : 'bg-slate-900 group-hover:bg-slate-800'} px-6 py-4 flex justify-between items-center transition-colors`}>
        <h3 className="text-white font-bold text-lg">P {data.pitch}</h3>
        <span className={`${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'} text-xs font-medium px-2 py-1 rounded-full transition-colors`}>
          {formatNumber(data.totalPixels)} px
        </span>
      </div>
      
      <div className="p-6 space-y-4">
        
        {/* Resolution */}
        <div className="flex items-start space-x-3">
          <div className={`mt-1 p-1.5 rounded-lg ${isSelected ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-50 text-blue-600'}`}>
            <Monitor size={18} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Final Resolution</p>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-bold text-lg">
                {formatNumber(data.resolutionWidth)} x {formatNumber(data.resolutionHeight)}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getResColor(data.resolutionClass)}`}>
                {data.resolutionClass}
              </span>
            </div>
          </div>
        </div>

        {/* Controller & Ports */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
             <div className={`mt-1 p-1.5 rounded-lg ${isSelected ? 'bg-white text-indigo-600 shadow-sm' : 'bg-indigo-50 text-indigo-600'}`}>
              <Network size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">LAN Ports</p>
              <p className="text-gray-900 font-bold text-lg">{data.lanPorts}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
             <div className={`mt-1 p-1.5 rounded-lg ${isSelected ? 'bg-white text-purple-600 shadow-sm' : 'bg-purple-50 text-purple-600'}`}>
              <Cpu size={18} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Controller</p>
              <p className="text-gray-900 font-semibold text-sm leading-tight">{data.controller}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-2"></div>

        {/* Power */}
        <div className="flex items-start space-x-3">
           <div className={`mt-1 p-1.5 rounded-lg ${isSelected ? 'bg-white text-amber-600 shadow-sm' : 'bg-amber-50 text-amber-600'}`}>
            <Zap size={18} />
          </div>
          <div className="w-full">
            <p className="text-sm text-gray-500 font-medium mb-1">Power Requirement</p>
            <div className="flex justify-between items-end">
               <div>
                  <span className="text-xs text-gray-400 block">Peak Load</span>
                  <span className="text-gray-900 font-bold">{formatNumber(Math.round(data.peakPowerWatts))} W</span>
               </div>
               <div className="text-right">
                  <span className="text-xs text-gray-400 block">Current (220V)</span>
                  <span className="text-gray-700 font-medium text-sm">
                    {data.amps220v.toFixed(1)}A
                  </span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};