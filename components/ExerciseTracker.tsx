

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Trash2, Camera, X, CalendarDays, Weight, NotebookText, BarChart4, Repeat, PlusCircle, MinusCircle, History, Save, Check, ChevronDown, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ExerciseLog, ExerciseMedia } from '../types';
import CalendarModal from './CalendarModal';
import ConfirmationModal from './ConfirmationModal';

const getTodaysDateISO = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
};
  
const createInitialLogData = (): Omit<ExerciseLog, 'id' | 'day' | 'sede'> => ({
    exerciseName: '',
    date: getTodaysDateISO(),
    reps: '',
    kilos: '',
    series: '',
    media: [],
    notes: '',
});

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

const formatFullDisplayDate = (dateString: string): string => {
  const date = parseCustomDate(dateString);
  if (date) {
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    const year = date.getFullYear();

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return `${capitalize(weekday)} ${day} ${capitalize(month)} ${year}`;
  }
  return dateString;
};

// Local Lightbox component
interface MediaLightboxProps {
  allMedia: ExerciseMedia[];
  startIndex: number;
  onClose: () => void;
  onDelete?: (indexToDelete: number) => void;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({ allMedia, startIndex, onClose, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : allMedia.length - 1));
    };
    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : allMedia.length - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [allMedia.length, onClose]);
    
    if (!allMedia || allMedia.length === 0) return null;
    const currentMedia = allMedia[currentIndex];
    if (!currentMedia) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] animate-fadeIn" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white hover:text-cyan-400 transition z-20" aria-label="Cerrar vista previa" onClick={onClose}>
                <X className="w-8 h-8" />
            </button>
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(currentIndex);
                    }}
                    className="absolute bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 z-20 transition-transform duration-200 ease-in-out hover:scale-110"
                    aria-label="Eliminar media"
                >
                    <Trash2 className="w-6 h-6" />
                </button>
            )}

            {allMedia.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-3 z-10 transition-all duration-200 ease-in-out hover:scale-110"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            <div className="relative max-w-[90vw] max-h-[90vh] animate-scaleIn flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {currentMedia.type === 'image' ? (
                    <img src={currentMedia.dataUrl} alt="Vista previa de ejercicio" className="max-w-full max-h-full object-contain" />
                ) : (
                    <video src={currentMedia.dataUrl} controls autoPlay className="max-w-full max-h-full object-contain" />
                )}
            </div>
            
            {allMedia.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm rounded-full px-3 py-1 z-10">
                    {currentIndex + 1} / {allMedia.length}
                </div>
            )}
        </div>
    );
};


// Local Modal Component for adding/editing logs
interface ExerciseLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ExerciseLog, 'id' | 'day' | 'sede'>) => void;
    dayName: string;
    initialData?: ExerciseLog | null;
}

const ExerciseLogModal: React.FC<ExerciseLogModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState(initialData || createInitialLogData());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const data = initialData || createInitialLogData();
            setFormData(data);
            setIsNotesVisible(!!data.notes);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof Omit<ExerciseLog, 'id'|'day'|'sede'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveClick = () => {
        onSave({ ...formData, exerciseName: formData.exerciseName.toUpperCase() });
    };
    
    const removeMedia = (index: number) => {
        handleInputChange('media', formData.media.filter((_, i) => i !== index));
    };
    
    const formatDateForButton = (isoDate: string) => {
        if (!isoDate) return "Seleccionar fecha";
        const dateObj = new Date(isoDate);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        return dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[,.]/g, '');
    };
    
    const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 transition duration-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-cyan-500/70";

    return (
        <>
            <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} currentDate={formData.date} onSelectDate={(date) => handleInputChange('date', date)} />

            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
                <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 animate-scaleIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <div className="w-10 h-10" /> {/* Spacer to balance the right side controls */}
                        <h2 className="text-xl font-bold text-cyan-400 text-center flex-grow">
                            {initialData ? 'Editar Ejercicio' : 'Añadir Ejercicio'}
                        </h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsCalendarOpen(true)} className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 transition text-white text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/70">
                                <CalendarDays className="w-4 h-4"/>
                                {formatDateForButton(formData.date)}
                            </button>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 space-y-4 no-scrollbar">
                        <input
                            type="text"
                            value={formData.exerciseName}
                            onChange={(e) => handleInputChange('exerciseName', e.target.value)}
                            placeholder="NOMBRE DEL EJERCICIO"
                            className="w-full text-xl font-extrabold text-cyan-400 bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 transition placeholder:text-cyan-400/50 tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-transparent"
                        />
                         {formData.media.length > 0 && (
                             <div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.media.map((mediaItem, index) => (
                                        <div key={index} className="relative w-20 h-20 group">
                                            {mediaItem.type === 'image' ? <img src={mediaItem.dataUrl} className="rounded-lg object-cover w-full h-full" alt="" /> : <video src={mediaItem.dataUrl} muted loop playsInline className="rounded-lg object-cover w-full h-full" />}
                                            <button onClick={() => removeMedia(index)} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><BarChart4 className="w-4 h-4 text-cyan-400" />Series</label>
                                <input type="number" inputMode="numeric" value={formData.series} onChange={(e) => handleInputChange('series', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Repeat className="w-4 h-4 text-cyan-400" />Repeticiones</label>
                                <input type="number" inputMode="numeric" value={formData.reps} onChange={(e) => handleInputChange('reps', e.target.value)} className={inputClasses} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-1"><Weight className="w-4 h-4 text-cyan-400" />Kilos</label>
                                <input type="number" step="any" inputMode="decimal" value={formData.kilos} onChange={(e) => handleInputChange('kilos', e.target.value)} className={inputClasses} />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                                    <NotebookText className="w-4 h-4" />Notas
                                </label>
                                <button onClick={() => setIsNotesVisible(prev => !prev)} className="p-1 text-cyan-400 hover:text-cyan-300">
                                    {isNotesVisible ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                </button>
                            </div>
                            {isNotesVisible && (
                                <textarea 
                                  value={formData.notes} 
                                  onChange={(e) => handleInputChange('notes', e.target.value)} 
                                  placeholder="Añadir notas..." 
                                  className={`${inputClasses} h-24 resize-none animate-fadeIn`}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end items-center flex-shrink-0">
                        <div className="flex gap-4">
                            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition">Cancelar</button>
                            <button onClick={handleSaveClick} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


const ExerciseTracker: React.FC<{ dayName: string }> = ({ dayName }) => {
    const { dailyLogs, addDailyLog, updateDailyLog, removeDailyLog, removeDailyLogMedia, saveLogToSummary, workoutDays, toggleExerciseLogExpansion, sedeColorStyles } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);
    const [logToDelete, setLogToDelete] = useState<ExerciseLog | null>(null);
    const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; logId: string; } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logToUpdateMedia, setLogToUpdateMedia] = useState<ExerciseLog | null>(null);
    
    const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

    const dayLogs = useMemo(() => {
        return dailyLogs
            .filter(log => log.day === dayName)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dailyLogs, dayName]);

    const expandedLogsForDay = useMemo(() => workoutDays[dayName]?.expandedLogs || [], [workoutDays, dayName]);

    const handleSave = (data: Omit<ExerciseLog, 'id' | 'day' | 'sede'>) => {
        if (editingLog) {
            updateDailyLog(editingLog.id, data);
        } else {
            const newLogId = crypto.randomUUID();
            const newLog: Omit<ExerciseLog, 'sede'> = {
                ...data,
                id: newLogId,
                day: dayName,
                isSavedToSummary: false,
            };
            addDailyLog(newLog);
            toggleExerciseLogExpansion(dayName, newLogId);
        }
        setIsAddModalOpen(false);
        setEditingLog(null);
    };

    const handleConfirmDelete = () => {
        if (logToDelete) {
            removeDailyLog(logToDelete.id);
            setLogToDelete(null);
        }
    };
    
    const handleDeleteMedia = (logId: string, mediaIndex: number) => {
        removeDailyLogMedia(logId, mediaIndex);
        setLightboxMedia(null);
    };
    
    const handleCameraClick = (log: ExerciseLog) => {
        setLogToUpdateMedia(log);
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && logToUpdateMedia) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const mediaType = file.type.startsWith('image') ? 'image' : 'video';
                const newMedia: ExerciseMedia = { type: mediaType, dataUrl };
                
                const updatedMedia = [...logToUpdateMedia.media, newMedia];
                updateDailyLog(logToUpdateMedia.id, { media: updatedMedia });
                setLogToUpdateMedia(null);
            };
            reader.readAsDataURL(file);
        }
        if(event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-4 pb-24">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*" 
            />
            {lightboxMedia && <MediaLightbox 
                allMedia={lightboxMedia.allMedia}
                startIndex={lightboxMedia.startIndex}
                onClose={() => setLightboxMedia(null)}
                onDelete={(indexToDelete) => handleDeleteMedia(lightboxMedia.logId, indexToDelete)}
            />}
            <ConfirmationModal isOpen={!!logToDelete} onClose={() => setLogToDelete(null)} onConfirm={handleConfirmDelete} title="Eliminar Registro" message={`¿Seguro que quieres eliminar el registro de ${logToDelete?.exerciseName || 'sin nombre'}? Esta acción es permanente.`} />
            <ExerciseLogModal 
                isOpen={isAddModalOpen || !!editingLog} 
                onClose={() => { setIsAddModalOpen(false); setEditingLog(null); }} 
                onSave={handleSave} 
                dayName={dayName}
                initialData={editingLog}
            />

            {dayLogs.length === 0 ? (
                 <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full text-center p-12 bg-gray-800/50 rounded-2xl border-2 border-dashed border-white/10 animate-fadeIn transition-all duration-300 hover:bg-gray-700/50 hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                >
                    <History className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">Sin registros</h2>
                    <p className="text-gray-400 mt-2">Aún no has registrado ningún ejercicio para este día. ¡Haz clic para empezar!</p>
                </button>
            ) : (
                dayLogs.map((log, index) => {
                    const isExpanded = expandedLogsForDay.includes(log.id);
                    const isSaved = log.isSavedToSummary;
                    
                    const hasSeries = log.series && log.series.trim() !== '';
                    const hasReps = log.reps && log.reps.trim() !== '';
                    const hasKilos = log.kilos && log.kilos.trim() !== '';
                    const hasMetrics = hasSeries || hasReps || hasKilos;
                    const hasMedia = log.media && log.media.length > 0;
                    const hasNotes = log.notes && log.notes.trim() !== '';

                    const hasPrimaryContent = hasMetrics || hasMedia;
                    const hasAnyDetails = hasPrimaryContent || hasNotes;

                    return (
                        <div key={log.id} style={{ animationDelay: `${index * 50}ms` }} className="bg-black/20 rounded-xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50 animate-zoomInPop opacity-0">
                            {/* HEADER */}
                            <div className="p-3 sm:p-4 cursor-pointer" onClick={() => toggleExerciseLogExpansion(dayName, log.id)}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-1">
                                            <div className="flex items-center gap-1.5 text-xs text-white">
                                                <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                                                <span>{formatFullDisplayDate(log.date)}</span>
                                            </div>
                                            <span className={`${getSedeColor(log.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                                <MapPin className="w-3 h-3"/>
                                                {log.sede}
                                            </span>
                                        </div>
                                        <p className="font-bold text-white truncate text-lg">{log.exerciseName || 'Sin nombre'}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
                                        <span className="p-1 text-cyan-400" aria-label={isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}>
                                            <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </span>
                                        <button onClick={(e) => { e.stopPropagation(); setLogToDelete(log); }} className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-500/10" aria-label="Eliminar registro">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* COLLAPSIBLE BODY */}
                            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${!isExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                                <div className="overflow-hidden">
                                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                                        {hasAnyDetails && (
                                            <div
                                                className="mt-4 pt-4 border-t border-gray-700/50 cursor-pointer group"
                                                onClick={(e) => { e.stopPropagation(); setEditingLog(log); }}
                                            >
                                                <div className="space-y-3">
                                                    {hasPrimaryContent && (
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="min-w-0 flex-grow flex justify-center items-center">
                                                                <div className="flex justify-center flex-wrap gap-x-4 gap-y-3 text-sm">
                                                                    {hasSeries && (
                                                                        <div className="flex items-center gap-2"><BarChart4 className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Series</p><p className="font-semibold text-white">{log.series}</p></div></div>
                                                                    )}
                                                                    {hasReps && (
                                                                        <div className="flex items-center gap-2"><Repeat className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Reps</p><p className="font-semibold text-white">{log.reps}</p></div></div>
                                                                    )}
                                                                    {hasKilos && (
                                                                        <div className="flex items-center gap-2"><Weight className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Kilos</p><p className="font-semibold text-white">{log.kilos}</p></div></div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {hasMedia && (
                                                                <div className="w-32 sm:w-40 md:w-56 flex-shrink-0 grid grid-cols-2 gap-2">
                                                                    {log.media.map((mediaItem, index) => (
                                                                        <div key={index} className="relative group w-full aspect-square rounded-lg overflow-hidden">
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); setLightboxMedia({ allMedia: log.media, startIndex: index, logId: log.id }); }}
                                                                                className="w-full h-full"
                                                                            >
                                                                                {mediaItem.type === 'image' ? (
                                                                                <img src={mediaItem.dataUrl} alt={`Media ${index + 1}`} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                                                ) : (
                                                                                <video src={mediaItem.dataUrl} muted loop autoPlay playsInline className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteMedia(log.id, index);
                                                                                }}
                                                                                className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 z-10 transition-opacity opacity-0 group-hover:opacity-100"
                                                                                aria-label="Eliminar media"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {hasNotes && (
                                                        <div className={`${hasPrimaryContent ? 'pt-3 border-t border-gray-700/50' : ''}`}>
                                                            <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                                                                <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                                                <p className="whitespace-pre-wrap">{log.notes}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className={`flex justify-end items-center gap-2 ${hasAnyDetails ? 'mt-2 pt-3 border-t border-gray-700/50' : 'mt-4'}`}>
                                            {isSaved ? (
                                                <div className="flex items-center justify-center w-9 h-9 bg-green-600 text-white rounded-full" title="Guardado en resumen">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); saveLogToSummary(log.id); }}
                                                    className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1.5 px-3 rounded-lg transition-transform transform hover:scale-105 btn-active text-sm"
                                                    aria-label="Guardar en resumen"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    <span>Guardar</span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleCameraClick(log); }}
                                                className="p-2 text-gray-400 hover:text-orange-400 transition-colors rounded-full hover:bg-orange-500/10"
                                                aria-label="Añadir media"
                                            >
                                                <Camera className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })
            )}

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 w-16 h-16 flex items-center justify-center z-20"
                aria-label="Añadir nuevo ejercicio"
            >
                <PlusCircle className="w-8 h-8" />
            </button>
        </div>
    );
};

export default ExerciseTracker;