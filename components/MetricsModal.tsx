



import React, { useState, useEffect } from 'react';
import type { CardioMetrics, CardioSession } from '../types';
import { X, Zap, Gauge, TrendingUp, Flame, CalendarDays, NotebookText, PlusCircle, MinusCircle, Clock } from 'lucide-react';
import CalendarModal from './CalendarModal';

const TimePickerModal: React.FC<{ initialValue: string; onSave: (value: string) => void; onClose: () => void; }> = ({ initialValue, onSave, onClose }) => {
    const [minutes, setMinutes] = useState(parseInt(initialValue, 10) || 0);
    const quickMinutes = [15, 20, 30, 45, 60, 90];

    const adjustTime = (amount: number) => {
        setMinutes(prev => Math.max(0, prev + amount));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-xs m-4 animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Tiempo (minutos)</h3>
                
                <div className="flex items-center justify-center gap-4 my-6">
                    <button onClick={() => adjustTime(-5)} className="w-12 h-12 bg-gray-700 rounded-full text-2xl font-bold transition-transform hover:scale-110">-</button>
                    <span className="text-5xl font-bold w-28 text-center text-white tabular-nums">{minutes}</span>
                    <button onClick={() => adjustTime(5)} className="w-12 h-12 bg-gray-700 rounded-full text-2xl font-bold transition-transform hover:scale-110">+</button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {quickMinutes.map(min => (
                        <button key={min} onClick={() => setMinutes(min)} className="bg-gray-700/50 hover:bg-gray-700 text-white font-semibold py-2 rounded-md transition">{min}</button>
                    ))}
                </div>

                <div className="flex justify-end gap-4">
                     <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition">Cancelar</button>
                    <button onClick={() => onSave(minutes.toString())} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition">Guardar</button>
                </div>
            </div>
        </div>
    );
};


const getTodaysDateISO = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
};

const initialCardioData: Omit<CardioSession, 'id' | 'sede' | 'day'> = {
    date: getTodaysDateISO(),
    title: '',
    metrics: { speed: '', distance: '', distanceUnit: 'KM', incline: '', calories: '', time: '' },
    notes: '',
};

interface CardioInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CardioSession, 'id' | 'sede'>) => void;
  initialData?: Partial<CardioSession> | null;
}

const formatDateForButton = (isoDate: string) => {
    if (!isoDate) return "Seleccionar fecha";
    const dateObj = new Date(isoDate);
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    return dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[,.]/g, '');
};

const CardioInputModal: React.FC<CardioInputModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState(initialData || initialCardioData);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isNotesVisible, setIsNotesVisible] = useState(false);


  useEffect(() => {
    if (isOpen) {
      const baseData = JSON.parse(JSON.stringify(initialCardioData));
      const data = initialData ? { ...baseData, ...initialData, metrics: {...baseData.metrics, ...initialData.metrics} } : baseData;
      setFormData(data);
      setIsNotesVisible(!!data.notes);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string, value: string } }) => {
    const { name, value } = e.target;
    if (name in (formData.metrics || {})) {
        setFormData(prev => ({ ...prev, metrics: { ...(prev.metrics as CardioMetrics), [name]: value } }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUnitToggle = () => {
    setFormData(prev => {
        const currentUnit = prev.metrics?.distanceUnit || 'KM';
        const newUnit = currentUnit === 'KM' ? 'MTS' : 'KM';
        return {
            ...prev,
            metrics: {
                ...(prev.metrics as CardioMetrics),
                distanceUnit: newUnit,
            }
        };
    });
  };
  
  const handleDateChange = (date: string) => {
    setFormData(prev => ({...prev, date}));
  };
  
  const handleTimeSave = (timeValue: string) => {
    handleInputChange({ target: { name: 'time', value: timeValue } });
    setIsTimePickerOpen(false);
  };

  const handleSaveClick = () => {
    onSave({
        ...formData,
        title: (formData as CardioSession).title?.toUpperCase()
    } as Omit<CardioSession, 'id' | 'sede'>);
  };

  if (!isOpen) return null;

  return (
    <>
    <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        currentDate={formData.date as string}
        onSelectDate={handleDateChange}
    />
    {isTimePickerOpen && (
        <TimePickerModal
            initialValue={formData.metrics?.time || '0'}
            onSave={handleTimeSave}
            onClose={() => setIsTimePickerOpen(false)}
        />
    )}
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-cyan-400">
              {initialData ? 'Editar Sesión' : 'Nueva Sesión'}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 transition text-white text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              >
                <CalendarDays className="w-4 h-4" />
                {formatDateForButton(formData.date as string)}
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition" aria-label="Cerrar">
                  <X className="w-6 h-6" />
              </button>
            </div>
        </div>
        <div className="overflow-y-auto no-scrollbar pr-2">
            <div className="space-y-4">
               <input
                type="text"
                name="title"
                value={(formData as CardioSession).title || ''}
                onChange={handleInputChange}
                placeholder="Nombre del ejercicio"
                className="w-full text-xl font-extrabold text-cyan-400 bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 transition placeholder:text-cyan-400/50 tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-transparent"
              />
              <div>
                <label htmlFor="speed" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Zap className="w-4 h-4 text-cyan-400" />Velocidad</label>
                <input type="number" step="any" inputMode="decimal" id="speed" name="speed" value={formData.metrics?.speed} onChange={handleInputChange} placeholder="KM/H" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/>
              </div>
              <div>
                <label htmlFor="distance" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Gauge className="w-4 h-4 text-cyan-400" />Distancia</label>
                <div className="relative">
                  <input type="number" step="any" inputMode="decimal" id="distance" name="distance" value={formData.metrics?.distance} onChange={handleInputChange} placeholder={formData.metrics?.distanceUnit || 'KM'} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 pr-20 focus:ring-cyan-500 focus:border-cyan-500 transition"/>
                  <button type="button" onClick={handleUnitToggle} className="absolute inset-y-0 right-0 flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white font-bold w-16 rounded-r-md transition-colors">
                      {formData.metrics?.distanceUnit || 'KM'}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="incline" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><TrendingUp className="w-4 h-4 text-cyan-400" />Inclinación</label>
                <input type="number" step="any" inputMode="decimal" id="incline" name="incline" value={formData.metrics?.incline} onChange={handleInputChange} placeholder="%" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/>
              </div>
               <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Clock className="w-4 h-4 text-cyan-400" />Tiempo</label>
                 <button
                    onClick={() => setIsTimePickerOpen(true)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition text-left text-white"
                 >
                    {formData.metrics?.time ? `${formData.metrics.time} min` : <span className="text-gray-400">Seleccionar tiempo</span>}
                </button>
              </div>
              <div>
                <label htmlFor="calories" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1"><Flame className="w-4 h-4 text-cyan-400" />Calorías</label>
                <input type="number" step="any" inputMode="decimal" id="calories" name="calories" value={formData.metrics?.calories} onChange={handleInputChange} placeholder="Kcal" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition"/>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><NotebookText className="w-4 h-4 text-cyan-400" />Notas</label>
                    <button onClick={() => setIsNotesVisible(prev => !prev)} className="p-1 text-cyan-400 hover:text-cyan-300">
                        {isNotesVisible ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    </button>
                </div>
                {isNotesVisible && (
                    <textarea 
                        id="notes" 
                        name="notes" 
                        value={formData.notes || ''} 
                        onChange={handleInputChange} 
                        placeholder="Añadir notas sobre la sesión..." 
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-cyan-500 focus:border-cyan-500 transition h-20 resize-none animate-fadeIn"
                    />
                )}
              </div>
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={handleSaveClick}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition-all duration-300 hover:scale-105"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default CardioInputModal;