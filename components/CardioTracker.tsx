
import React, { useState, useEffect, useRef } from 'react';
import type { CardioMetrics } from '../types';
import { useAppContext } from '../context/AppContext';
import { PlusCircle, MinusCircle, Zap, Gauge, TrendingUp, Flame, CalendarDays, BarChart4, NotebookText, Check, MapPin, Pencil, Plus, Clock } from 'lucide-react';

interface CardioTrackerProps {
  dayName: string;
  isVisible: boolean;
  onOpenMetricsModal: () => void;
}

// --- HELPER FUNCTIONS ---

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

const formatDisplayDate = (dateString: string): string => {
  const date = parseCustomDate(dateString);
  if (date) {
    const formatted = date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return (formatted.charAt(0).toUpperCase() + formatted.slice(1)).replace(/[,.]/g, '');
  }
  return dateString;
};

const formatMetric = (value: string | undefined, unit: string) => {
    if (!value || value.trim() === '') return '-';
    if (value.toUpperCase().includes(unit.toUpperCase())) return value;
    if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
      return `${value} ${unit}`;
    }
    return value;
};


const CardioTracker: React.FC<CardioTrackerProps> = ({ dayName, isVisible, onOpenMetricsModal }) => {
  const { addCardioSession, workoutDays, updateWorkoutDayForm, clearCardioForm, activeSede, sedeColorStyles } = useAppContext();
  const { date, metrics, notes } = workoutDays[dayName].cardio;
  
  const [showNotification, setShowNotification] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const savedStateRef = useRef<string | null>(null);

  const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

  // Reset saved state if form data changes from its saved version
  useEffect(() => {
    const currentState = JSON.stringify({ date, metrics, notes });
    if (savedStateRef.current && savedStateRef.current !== currentState) {
        setIsSaved(false);
        savedStateRef.current = null;
    }
  }, [date, metrics, notes]);


  const resetForm = () => {
    clearCardioForm(dayName);
    setIsSaved(false);
    savedStateRef.current = null;
  };

  const handleSave = () => {
    const sessionDate = date.trim() || 'Sin fecha';
    addCardioSession({ date: sessionDate, metrics, notes });
    
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 1000);

    // Set saved state
    setIsSaved(true);
    savedStateRef.current = JSON.stringify({ date, metrics, notes });

    // Haptic feedback on supported devices
    if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
  };
  
  const handleClear = () => {
    resetForm();
  }

  const hasMetrics = Object.values(metrics).some(value => typeof value === 'string' && value.trim() !== '');
  const actionButtonClass = "flex-grow md:flex-grow-0 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-70 btn-active flex items-center justify-center gap-2";
  

  return (
    <div className={`grid transition-[grid-template-rows,margin-top,opacity] duration-500 ease-in-out ${
      isVisible ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] mt-0 opacity-0'
    }`}>
      <div className="overflow-hidden">
        {showNotification && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white py-3 px-6 rounded-lg shadow-lg z-50 border border-cyan-500 font-semibold animate-notification-pop">
            Guardado
          </div>
        )}
        <div className={`p-4 rounded-xl border border-white/10 ${isSaved ? 'bg-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50' : 'bg-gray-800/70'}`}>
          {isSaved ? (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-cyan-400"/>
                      <p className="font-bold text-white">{formatDisplayDate(date)}</p>
                    </div>
                    {activeSede && <span className={`${getSedeColor(activeSede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}><MapPin className="w-3 h-3"/>{activeSede}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button onClick={() => setIsSaved(false)} className={`${actionButtonClass} bg-gradient-to-br from-gray-600 to-gray-700 focus:ring-gray-500/50 hover:from-gray-500 hover:to-gray-600 text-sm`}>
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={handleClear} className={`${actionButtonClass} bg-gradient-to-br from-cyan-500 to-blue-500 focus:ring-cyan-500/50 hover:shadow-xl shadow-cyan-500/20 text-sm`}>
                    <Plus className="w-4 h-4" /> Nuevo
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                  <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Velocidad</p><p className="font-semibold text-white">{formatMetric(metrics.speed, 'KM/H')}</p></div></div>
                  <div className="flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Distancia</p><p className="font-semibold text-white">{formatMetric(metrics.distance, metrics.distanceUnit || 'KM')}</p></div></div>
                  <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Inclinación</p><p className="font-semibold text-white">{formatMetric(metrics.incline, '%')}</p></div></div>
                  <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Tiempo</p><p className="font-semibold text-white">{formatMetric(metrics.time, 'min')}</p></div></div>
                  <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Calorías</p><p className="font-semibold text-white">{metrics.calories || '-'}</p></div></div>
                </div>
                {notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                      <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                      <p className="whitespace-pre-wrap">{notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-400 flex items-center gap-2 justify-center">
                        <BarChart4 className="w-4 h-4" />
                        Métricas
                    </label>
                     <button
                        onClick={onOpenMetricsModal}
                        className={`w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-md transition flex items-center border border-gray-600 ${!hasMetrics ? 'justify-center' : ''}`}
                    >
                        {hasMetrics ? (
                         <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                            <div className="flex items-center gap-1.5 truncate text-white">
                              <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span className="font-medium text-gray-400">Velocidad:</span>
                              <span className="truncate font-semibold">{metrics.speed || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate text-white">
                              <Gauge className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                               <span className="font-medium text-gray-400">Distancia:</span>
                              <span className="truncate font-semibold">{metrics.distance ? `${metrics.distance} ${metrics.distanceUnit || 'KM'}` : '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate text-white">
                              <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                               <span className="font-medium text-gray-400">Inclinación:</span>
                              <span className="truncate font-semibold">{metrics.incline || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate text-white">
                              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                               <span className="font-medium text-gray-400">Tiempo:</span>
                              <span className="truncate font-semibold">{metrics.time || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate text-white">
                              <Flame className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                               <span className="font-medium text-gray-400">Calorías:</span>
                              <span className="truncate font-semibold">{metrics.calories || '-'}</span>
                            </div>
                         </div>
                        ) : (
                        <span>Editar Métricas y Fecha</span>
                        )}
                    </button>
                </div>

                {notes && (
                  <div className="animate-fadeIn">
                      <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                          <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                          <p className="whitespace-pre-wrap flex-grow">{notes}</p>
                      </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-4 flex-wrap">
                    <button 
                      onClick={handleSave} 
                      disabled={isSaved}
                      className={`${actionButtonClass} ${isSaved ? 'bg-green-600 focus:ring-green-500/50 cursor-default' : 'bg-gradient-to-br from-orange-500 to-amber-500 focus:ring-orange-500/50 hover:shadow-xl shadow-orange-500/20'}`}
                    >
                      {isSaved ? <Check className="w-6 h-6" /> : 'Guardar'}
                    </button>
                    <button onClick={handleClear} className={`${actionButtonClass} bg-gradient-to-br from-gray-600 to-gray-700 focus:ring-gray-500/50 hover:from-gray-500 hover:to-gray-600 hover:shadow-xl`}>
                        Borrar
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardioTracker;