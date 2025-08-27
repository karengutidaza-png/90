





import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
// FIX: Removed non-existent 'Run' icon from lucide-react import.
import { Trash2, HeartPulse, History, Footprints, Shield, Hand, Shirt, X, NotebookText, Download, Upload, FileUp, Zap, Gauge, TrendingUp, Flame, Dumbbell, CalendarDays, Weight, Repeat, MapPin, ChevronDown, Calendar, Save, BarChart4, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { CardioSession, ExerciseLog, ExerciseMedia } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import ExportModal from '../components/ExportModal';

// Local Lightbox component to avoid creating new file
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
        setCurrentIndex(prev => (prev < allMedia.length - 1 ? prev - 1 : 0));
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

const dayConfig: { [key: string]: { title: string; icon: React.ElementType } } = {
  'Día 1': { title: 'Pecho y Bíceps', icon: Shirt },
  'Día 2': { title: 'Pierna y Glúteo', icon: Footprints },
  'Día 3': { title: 'Hombro y Espalda', icon: Shield },
  'Día 4': { title: 'Tríceps y Antebrazo', icon: Hand },
  'Cardio': { title: 'Cardio', icon: HeartPulse },
};

const formatMetric = (value: string | undefined, unit: string) => {
    if (!value || value.trim() === '') return '-';
    if (value.toUpperCase().includes(unit.toUpperCase())) return value;
    if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
      return `${value} ${unit}`;
    }
    return value;
};

// --- WEEKLY GROUPING HELPERS ---

function parseCustomDate(dateString: string): Date | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;

  // Handle new YYYY-MM-DD format reliably as a local date
  if (dateString.includes('-')) {
    // Appending T00:00:00 makes browsers interpret it as local time, not UTC
    const date = new Date(dateString + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Backwards compatibility for old format: "Lun, 26 ago"
  const monthMap: { [key: string]: number } = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };
  const cleanedString = dateString.toLowerCase().replace(/[,.]/g, '');
  const parts = cleanedString.split(' ');
  if (parts.length < 3) return null;
  
  const day = parseInt(parts[1], 10);
  const monthName = parts[2];
  const month = monthMap[monthName];
  
  if (isNaN(day) || month === undefined) return null;

  const today = new Date();
  let year = today.getFullYear();
  const potentialDate = new Date(year, month, day);

  // If the parsed date is far in the future, assume it was from last year
  if (potentialDate > today && (potentialDate.getTime() - today.getTime()) > 30 * 24 * 60 * 60 * 1000) {
    year -= 1;
  }
  
  const finalDate = new Date(year, month, day);
  finalDate.setHours(0, 0, 0, 0); // Explicitly set to midnight
  return finalDate;
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



function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const formatWeekRange = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const startDay = start.getDate();
    const startMonth = start.toLocaleDateString('es-ES', { month: 'long' });
    const endDay = end.getDate();
    const endMonth = end.toLocaleDateString('es-ES', { month: 'long' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
        return `Semana del ${startDay} al ${endDay} de ${startMonth}, ${year}`;
    } else {
        return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}, ${year}`;
    }
};

interface DayData {
    cardio: CardioSession[];
    exercises: ExerciseLog[];
}

interface WeekData {
    startDate: Date;
    days: { [dayName: string]: DayData };
}

interface GroupedByWeek {
    [weekKey: string]: WeekData;
}

type DeletionTarget = {
  type: 'cardio' | 'exercise' | 'media' | 'week' | 'weekCardio' | 'dayExercises';
  id: string;
  mediaIndex?: number;
  name?: string;
  day?: string;
} | null;

// --- SUMMARY COMPONENT ---

const Summary: React.FC = () => {
  const { 
    summaryCardioSessions, removeSummaryCardioSession, summaryLogs, removeSummaryLog, removeSummaryLogMedia,
    exportData, importData, exportSummaryData, removeWeekData, exportWeekData, exportDayData,
    removeWeekCardio, removeDayExercises, exportDataAsText, exportSummaryDataAsText, exportWeekDataAsText, exportDayDataAsText,
    sedeColorStyles
  } = useAppContext();
  const [lightboxMedia, setLightboxMedia] = useState<{ allMedia: ExerciseMedia[]; startIndex: number; logId: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItemForCard, setSelectedItemForCard] = useState<CardioSession | ExerciseLog | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [deletionTarget, setDeletionTarget] = useState<DeletionTarget>(null);
  const [expandedDaySections, setExpandedDaySections] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [expandedCardioSessions, setExpandedCardioSessions] = useState<Set<string>>(new Set());

  const [exportOptions, setExportOptions] = useState<{ 
    onExportJson: () => void; 
    onExportText: () => void; 
    title: string; 
  } | null>(null);

  const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

  const downloadTXT = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCardioSessionAsText = (session: CardioSession): string => {
    const lines = [
      `CARDIO - ${formatDisplayDate(session.date)} [Sede: ${session.sede}]`,
      `  - Velocidad: ${formatMetric(session.metrics.speed, 'KM/H')}`,
      `  - Distancia: ${formatMetric(session.metrics.distance, session.metrics.distanceUnit || 'KM')}`,
      `  - Inclinación: ${formatMetric(session.metrics.incline, '%')}`,
      `  - Calorías: ${session.metrics.calories || '-'} Kcal`,
    ];
    if (session.notes) {
      lines.push(`  - Notas: ${session.notes}`);
    }
    return lines.join('\n');
  };

  const formatExerciseLogAsText = (log: ExerciseLog): string => {
    const lines = [
      `${log.exerciseName.toUpperCase()} - ${formatDisplayDate(log.date)} [Sede: ${log.sede}]`,
      `  - ${log.series || '-'} series x ${log.reps || '-'} reps @ ${log.kilos || '-'} kgs`,
    ];
    if (log.notes) {
      lines.push(`  - Notas: ${log.notes}`);
    }
    return lines.join('\n');
  };
  
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

  const ShareableCardModal: React.FC<{
    item: CardioSession | ExerciseLog | null;
    onClose: () => void;
  }> = ({ item, onClose }) => {
    if (!item) return null;
  
    const isCardio = 'metrics' in item;
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] animate-fadeIn"
        onClick={onClose}
      >
          <div 
            className="relative bg-gradient-to-br from-gray-900 to-black p-8 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 w-full max-w-md m-4 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
  
            <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-cyan-500/20 rounded-full">
                  {isCardio ? <HeartPulse className="w-8 h-8 text-cyan-400" /> : <Dumbbell className="w-8 h-8 text-cyan-400" />}
               </div>
               <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isCardio ? ((item as CardioSession).title || 'Sin nombre') : <span className="uppercase">{(item as ExerciseLog).exerciseName}</span>}
                  </h2>
                  <div className="flex items-center gap-2">
                      <p className="text-gray-400">{formatDisplayDate(item.date)}</p>
                      <span className={`${getSedeColor(item.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}><MapPin className="w-3 h-3"/>{item.sede}</span>
                  </div>
               </div>
            </div>
  
            {isCardio ? (
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* FIX: Replaced non-existent 'Run' icon with 'Zap'. */}
                <div className="flex items-center gap-3"><Zap className="w-7 h-7 text-cyan-400" /><div><p className="text-sm text-gray-400">Velocidad</p><p className="text-xl font-semibold text-white">{formatMetric(item.metrics.speed, 'KM/H')}</p></div></div>
                <div className="flex items-center gap-3"><Gauge className="w-7 h-7 text-cyan-400" /><div><p className="text-sm text-gray-400">Distancia</p><p className="text-xl font-semibold text-white">{formatMetric(item.metrics.distance, item.metrics.distanceUnit || 'KM')}</p></div></div>
                <div className="flex items-center gap-3"><TrendingUp className="w-7 h-7 text-cyan-400" /><div><p className="text-sm text-gray-400">Inclinación</p><p className="text-xl font-semibold text-white">{formatMetric(item.metrics.incline, '%')}</p></div></div>
                <div className="flex items-center gap-3"><Flame className="w-7 h-7 text-cyan-400" /><div><p className="text-sm text-gray-400">Calorías</p><p className="text-xl font-semibold text-white">{item.metrics.calories || '-'}</p></div></div>
              </div>
            ) : (
              <div className="flex justify-around gap-6 mb-6">
                {(item as ExerciseLog).series?.trim() && (
                  <div className="flex items-center gap-3">
                    <BarChart4 className="w-7 h-7 text-cyan-400" />
                    <div>
                      <p className="text-sm text-gray-400">Series</p>
                      <p className="text-xl font-semibold text-white">{(item as ExerciseLog).series}</p>
                    </div>
                  </div>
                )}
                {(item as ExerciseLog).reps?.trim() && (
                  <div className="flex items-center gap-3">
                    <Repeat className="w-7 h-7 text-cyan-400" />
                    <div>
                      <p className="text-sm text-gray-400">Reps</p>
                      <p className="text-xl font-semibold text-white">{(item as ExerciseLog).reps}</p>
                    </div>
                  </div>
                )}
                {(item as ExerciseLog).kilos?.trim() && (
                  <div className="flex items-center gap-3">
                    <Weight className="w-7 h-7 text-cyan-400" />
                    <div>
                      <p className="text-sm text-gray-400">Kilos</p>
                      <p className="text-xl font-semibold text-white">{(item as ExerciseLog).kilos}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {item.notes && (
              <div className="mb-6">
                 <h3 className="font-semibold text-cyan-400 mb-2 flex items-center gap-2"><NotebookText className="w-5 h-5"/>Notas</h3>
                 <p className="text-gray-300 bg-black/30 p-3 rounded-lg border-l-2 border-cyan-500/50 whitespace-pre-wrap italic">{item.notes}</p>
              </div>
            )}
            
            <div className="text-center text-gray-500 font-bold tracking-widest text-sm uppercase mt-8">
              PROGRESIÓN DE CARGA
            </div>
        </div>
      </div>
    );
  };


  const toggleDayExpansion = (dayKey: string) => {
    setExpandedDaySections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dayKey)) {
            newSet.delete(dayKey);
        } else {
            newSet.add(dayKey);
        }
        return newSet;
    });
  };

  const downloadJSON = (data: object, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExerciseExpansion = (logId: string) => {
    setExpandedExercises(prev => {
        const newSet = new Set(prev);
        if (newSet.has(logId)) {
            newSet.delete(logId);
        } else {
            newSet.add(logId);
        }
        return newSet;
    });
  };
  
  const toggleCardioExpansion = (sessionId: string) => {
    setExpandedCardioSessions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(sessionId)) {
            newSet.delete(sessionId);
        } else {
            newSet.add(sessionId);
        }
        return newSet;
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          importData(text);
          alert('¡Datos importados con éxito!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'El archivo de importación no es válido o está corrupto.';
          console.error("Error importing data:", error);
          alert(`Error al importar: ${errorMessage}`);
        }
      };
      reader.readAsText(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const dateToYyyyMmDd = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  const filteredData = useMemo(() => {
    return { filteredLogs: summaryLogs, filteredCardio: summaryCardioSessions };
  }, [summaryLogs, summaryCardioSessions]);

  const groupedDataByWeek = useMemo(() => {
    const allItems = [
      ...filteredData.filteredCardio.map(s => ({ ...s, type: 'cardio' as const })),
      ...filteredData.filteredLogs.map(l => ({ ...l, type: 'exercise' as const }))
    ];

    const grouped: GroupedByWeek = {};

    allItems.forEach(item => {
      const itemDate = parseCustomDate(item.date);
      if (!itemDate) return;

      const monday = getMonday(itemDate);
      const weekKey = dateToYyyyMmDd(monday);

      if (!grouped[weekKey]) {
        grouped[weekKey] = { startDate: monday, days: {} };
      }

      const dayName = item.day;
      if (!grouped[weekKey].days[dayName]) {
        grouped[weekKey].days[dayName] = { cardio: [], exercises: [] };
      }

      if (item.type === 'cardio') {
        grouped[weekKey].days[dayName].cardio.push(item as CardioSession);
      } else {
        grouped[weekKey].days[dayName].exercises.push(item as ExerciseLog);
      }
    });

    for (const weekKey in grouped) {
      for (const dayName in grouped[weekKey].days) {
        const dayData = grouped[weekKey].days[dayName];
        
        const dateSortDesc = (a: CardioSession | ExerciseLog, b: CardioSession | ExerciseLog) => {
            const dateA = parseCustomDate(a.date);
            const dateB = parseCustomDate(b.date);
            if (dateA && dateB) return dateB.getTime() - dateA.getTime();
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
        };

        dayData.cardio.sort(dateSortDesc);
        dayData.exercises.sort(dateSortDesc);
      }

      const sortedDays: { [key: string]: DayData } = {};
      const dayOrder = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Cardio'];
      dayOrder.forEach(dayKey => {
        if (grouped[weekKey].days[dayKey]) {
            sortedDays[dayKey] = grouped[weekKey].days[dayKey];
        }
      });
      grouped[weekKey].days = sortedDays;
    }

    return grouped;
  }, [filteredData]);

  const sortedWeekKeys = useMemo(() => {
    return Object.keys(groupedDataByWeek).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [groupedDataByWeek]);

  const toggleWeekExpansion = (weekKey: string) => {
    setExpandedWeeks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(weekKey)) {
            newSet.delete(weekKey);
        } else {
            newSet.add(weekKey);
        }
        return newSet;
    });
  };


  const handleCloseLightbox = () => {
    setLightboxMedia(null);
  };

  const baseButtonClass = "flex items-center gap-1.5 text-xs font-semibold py-2 px-2 sm:px-3 rounded-lg text-white shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 btn-active";
  
  const handleConfirmDelete = () => {
    if (!deletionTarget) return;
    switch (deletionTarget.type) {
      case 'cardio':
        removeSummaryCardioSession(deletionTarget.id);
        break;
      case 'exercise':
        removeSummaryLog(deletionTarget.id);
        break;
      case 'media':
        if (deletionTarget.mediaIndex !== undefined) {
          removeSummaryLogMedia(deletionTarget.id, deletionTarget.mediaIndex);
          handleCloseLightbox();
        }
        break;
      case 'week':
        removeWeekData(deletionTarget.id);
        break;
      case 'weekCardio':
        removeWeekCardio(deletionTarget.id);
        break;
      case 'dayExercises':
        if (deletionTarget.day) {
          removeDayExercises(deletionTarget.id, deletionTarget.day);
        }
        break;
    }
    setDeletionTarget(null);
  };

  return (
    <div className="space-y-8">
      {lightboxMedia && (
        <MediaLightbox
          allMedia={lightboxMedia.allMedia}
          startIndex={lightboxMedia.startIndex}
          onClose={handleCloseLightbox}
          onDelete={(indexToDelete) => {
            setDeletionTarget({ type: 'media', id: lightboxMedia.logId, mediaIndex: indexToDelete, name: 'este archivo' });
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!deletionTarget}
        onClose={() => setDeletionTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar Registro`}
        message={`¿Estás seguro de que quieres eliminar ${deletionTarget?.name ?? 'este elemento'}? Esta acción es irreversible.`}
      />
      
      <ShareableCardModal
        item={selectedItemForCard}
        onClose={() => setSelectedItemForCard(null)}
      />

      <ExportModal
        isOpen={!!exportOptions}
        onClose={() => setExportOptions(null)}
        title={exportOptions?.title || 'Elige tu formato'}
        onExportJson={() => {
          exportOptions?.onExportJson();
          setExportOptions(null);
        }}
        onExportText={() => {
          exportOptions?.onExportText();
          setExportOptions(null);
        }}
      />
      
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setExportOptions({
              title: 'Exportar Resumen',
              onExportJson: exportSummaryData,
              onExportText: exportSummaryDataAsText
            })}
            className={`${baseButtonClass} bg-gradient-to-r from-indigo-500 to-purple-500 focus:ring-indigo-500`}
            aria-label="Exportar resumen de datos"
          >
            <FileUp className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={handleImportClick}
            className={`${baseButtonClass} bg-gradient-to-r from-green-500 to-green-600 focus:ring-green-500`}
            aria-label="Importar datos desde un archivo"
          >
            <Upload className="w-4 h-4" />
            <span>Importar</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/json"
          />
          <button
            onClick={() => setExportOptions({
              title: 'Exportar Todo',
              onExportJson: exportData,
              onExportText: exportDataAsText
            })}
            className={`${baseButtonClass} bg-gradient-to-r from-cyan-500 to-blue-500 focus:ring-cyan-500`}
            aria-label="Exportar todos los datos"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Todo</span>
          </button>
        </div>
      </div>

      {sortedWeekKeys.length === 0 ? (
         <div className="bg-gradient-to-br from-gray-900 to-gray-800/50 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center animate-zoomInPop">
            <History className="w-16 h-16 mx-auto text-cyan-400 mb-4 animate-pulse-slow" />
            <h2 className="text-3xl font-extrabold mb-4 text-cyan-400 tracking-tight">
              El Viaje Comienza Aquí
            </h2>
            <p className="text-gray-300 max-w-md mx-auto">
              Tu historial está listo para ser escrito. Cada registro es un paso hacia tu mejor versión. ¡Vamos a empezar!
            </p>
        </div>
      ) : (
        sortedWeekKeys.map((weekKey, weekIndex) => {
          const weekData = groupedDataByWeek[weekKey];
          const isWeekExpanded = expandedWeeks.has(weekKey) || weekIndex === 0;
          let cardCounter = 0;

          const allWeekCardio = Object.values(weekData.days)
            .flatMap(dayData => dayData.cardio)
            .sort((a, b) => (parseCustomDate(b.date)?.getTime() || 0) - (parseCustomDate(a.date)?.getTime() || 0));

          return (
            <div key={weekKey} style={{ animationDelay: `${weekIndex * 150}ms` }} className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-zoomInPop opacity-0">
              <button onClick={() => toggleWeekExpansion(weekKey)} className="w-full group grid grid-cols-[1fr_auto_1fr] items-center p-4 sm:p-6 bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
                <div></div> {/* Left spacer */}
                <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-3 text-center px-4 truncate">
                  <Calendar className="w-6 h-6 text-cyan-400 transition-transform duration-300 group-hover:scale-110"/>
                  {formatWeekRange(weekData.startDate)}
                </h2>
                <div className="flex items-center gap-2 justify-self-end">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExportOptions({
                                title: `Exportar ${formatWeekRange(weekData.startDate)}`,
                                onExportJson: () => exportWeekData(weekKey),
                                onExportText: () => exportWeekDataAsText(weekKey)
                            });
                        }}
                        className="p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors"
                        aria-label={`Exportar datos de la semana`}
                    >
                        <Save className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeletionTarget({ type: 'week', id: weekKey, name: `la semana del ${formatWeekRange(weekData.startDate)}` });
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                        aria-label={`Eliminar semana del ${formatWeekRange(weekData.startDate)}`}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </button>
              
              <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isWeekExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="p-4 sm:p-6 space-y-6">
                    {Object.keys(weekData.days).map((dayName) => {
                      if (dayName === 'Cardio') return null; // Handle cardio in its own section
                      const dayInfo = dayConfig[dayName];
                      const { exercises } = weekData.days[dayName];
                      
                      if(!dayInfo || exercises.length === 0) return null;

                      const dayKey = `${weekKey}-${dayName}`;
                      const isDayExpanded = expandedDaySections.has(dayKey);
                      const Icon = dayInfo.icon;

                      return (
                        <div key={dayName}>
                           <div className="space-y-4">
                              <div className="border-b-2 border-cyan-500/50 pb-3 mb-4">
                                <button
                                  onClick={() => toggleDayExpansion(dayKey)}
                                  className="w-full grid grid-cols-[1fr_auto_1fr] items-center group"
                                  aria-expanded={isDayExpanded}
                                >
                                  <div />
                                  <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 tracking-tight transition-colors group-hover:text-cyan-300">
                                    <span className="bg-cyan-900/50 p-2 rounded-full"><Icon className="w-6 sm:w-7 h-6 sm:h-7" /></span>
                                    {dayInfo.title}
                                  </h2>
                                  <div className="justify-self-end flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setExportOptions({
                                              title: `Exportar Ejercicios de ${dayInfo.title}`,
                                              onExportJson: () => exportDayData(weekKey, dayName, 'exercises'),
                                              onExportText: () => exportDayDataAsText(weekKey, dayName, 'exercises')
                                          });
                                      }}
                                      className="p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors"
                                      aria-label={`Exportar datos de ejercicios para ${dayInfo.title}`}
                                    >
                                      <Save className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletionTarget({
                                              type: 'dayExercises',
                                              id: weekKey,
                                              day: dayName,
                                              name: `todos los ejercicios de ${dayInfo.title} de esta semana`
                                          });
                                      }}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                      aria-label={`Eliminar ejercicios de ${dayInfo.title} de esta semana`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </button>
                              </div>
                              <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isDayExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                <div className="overflow-hidden">
                                  <div className="space-y-3">
                                    {exercises.map((log) => {
                                      const isExerciseExpanded = expandedExercises.has(log.id);
                                      return (
                                      <div key={log.id} style={{ animationDelay: `${(++cardCounter * 100)}ms` }} className="bg-black/20 rounded-xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50 animate-zoomInPop opacity-0">
                                        {/* HEADER */}
                                        <div className="p-3 sm:p-4 cursor-pointer" onClick={() => toggleExerciseExpansion(log.id)}>
                                          <div className="flex justify-between items-start gap-4">
                                            <div className="flex-grow min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                  <div className="flex items-center gap-1.5 text-xs text-white min-w-0">
                                                      <CalendarDays className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                                      <span className="font-bold truncate">{formatFullDisplayDate(log.date)}</span>
                                                  </div>
                                                  <span className={`${getSedeColor(log.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0`}>
                                                      <MapPin className="w-3 h-3"/>
                                                      {log.sede}
                                                  </span>
                                              </div>
                                              <p className="font-bold text-white truncate text-lg">{log.exerciseName || 'Sin nombre'}</p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                              <button className="p-1 text-cyan-400 hover:text-cyan-300 transition" aria-label={isExerciseExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}>
                                                <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExerciseExpanded ? 'rotate-180' : ''}`} />
                                              </button>
                                              <button onClick={(e) => {
                                                  e.stopPropagation();
                                                  setExportOptions({
                                                      title: `Exportar ${log.exerciseName}`,
                                                      onExportJson: () => downloadJSON({ summaryLogs: [log] }, `ejercicio-${log.exerciseName.replace(/\s+/g, '-')}-${log.date}.json`),
                                                      onExportText: () => {
                                                          const textContent = formatExerciseLogAsText(log);
                                                          downloadTXT(textContent, `ejercicio-${log.exerciseName.replace(/\s+/g, '-')}-${log.date}.txt`);
                                                      }
                                                  });
                                              }} className="text-gray-400 hover:text-cyan-500 transition" aria-label={`Exportar registro`}>
                                                  <Save className="w-5 h-5" />
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); setDeletionTarget({ type: 'exercise', id: log.id, name: `el registro de ${log.exerciseName}` }); }} className="text-gray-400 hover:text-red-500 transition" aria-label={`Quitar del resumen`}>
                                                <Trash2 className="w-5 h-5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* COLLAPSIBLE BODY */}
                                        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${!isExerciseExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                                          <div className="overflow-hidden">
                                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-700/50 cursor-pointer" onClick={() => setSelectedItemForCard(log)}>
                                              <div className="pt-3 sm:pt-4 flex justify-between items-start gap-4">
                                                <div className="min-w-0 flex-grow flex justify-center items-center">
                                                  <div className="flex justify-center flex-wrap gap-x-4 gap-y-3 text-sm">
                                                    {log.series && log.series.trim() !== '' && (
                                                      <div className="flex items-center gap-2"><BarChart4 className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Series</p><p className="font-semibold text-white">{log.series}</p></div></div>
                                                    )}
                                                    {log.reps && log.reps.trim() !== '' && (
                                                        <div className="flex items-center gap-2"><Repeat className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Reps</p><p className="font-semibold text-white">{log.reps}</p></div></div>
                                                    )}
                                                    {log.kilos && log.kilos.trim() !== '' && (
                                                        <div className="flex items-center gap-2"><Weight className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Kilos</p><p className="font-semibold text-white">{log.kilos}</p></div></div>
                                                    )}
                                                  </div>
                                                </div>
                                                {log.media && log.media.length > 0 && (
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
                                                                setDeletionTarget({ type: 'media', id: log.id, mediaIndex: index, name: 'este archivo' });
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
                                              {log.notes && (
                                                <div className="mt-3 pt-3 border-t border-gray-700">
                                                  <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                                                    <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                                    <p className="whitespace-pre-wrap">{log.notes}</p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )})}
                                  </div>
                                </div>
                              </div>
                            </div>
                        </div>
                      )
                    })}
                    {allWeekCardio.length > 0 && (
                       <div className="space-y-4">
                        <button
                          onClick={() => toggleDayExpansion(`${weekKey}-cardio`)}
                          className="w-full grid grid-cols-[1fr_auto_1fr] items-center group"
                          aria-expanded={expandedDaySections.has(`${weekKey}-cardio`)}
                        >
                          <div />
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 tracking-tight transition-colors group-hover:text-cyan-300">
                            <span className="bg-cyan-900/50 p-2 rounded-full inline-flex"><HeartPulse className="w-6 sm:w-7 h-6 sm:h-7" /></span>
                            Cardio
                          </h3>
                          <div className="justify-self-end flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExportOptions({
                                  title: `Exportar Cardio de la Semana`,
                                  onExportJson: () => exportDayData(weekKey, 'Cardio', 'cardio'),
                                  onExportText: () => exportDayDataAsText(weekKey, 'Cardio', 'cardio')
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-full transition-colors"
                              aria-label={`Exportar datos de cardio para esta semana`}
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletionTarget({ 
                                  type: 'weekCardio', 
                                  id: weekKey, 
                                  name: `todo el cardio de esta semana` 
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                              aria-label={`Eliminar todo el cardio de esta semana`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </button>

                        <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${expandedDaySections.has(`${weekKey}-cardio`) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                          <div className="overflow-hidden">
                            <div className="space-y-3 pt-3">
                              {allWeekCardio.map((session) => {
                                const isCardioExpanded = expandedCardioSessions.has(session.id);
                                const { speed, distance, incline, calories, time } = session.metrics;
                                const hasSpeed = speed && speed.trim() !== '';
                                const hasDistance = distance && distance.trim() !== '';
                                const hasIncline = incline && incline.trim() !== '';
                                const hasCalories = calories && calories.trim() !== '';
                                const hasTime = time && time.trim() !== '';
                                const hasMetrics = hasSpeed || hasDistance || hasIncline || hasCalories || hasTime;
                                return (
                                <div 
                                  key={session.id} 
                                  style={{ animationDelay: `${(++cardCounter * 100)}ms` }} 
                                  className="bg-black/20 rounded-xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50 animate-zoomInPop opacity-0"
                                >
                                  <div className="p-3 sm:p-4 cursor-pointer" onClick={() => toggleCardioExpansion(session.id)}>
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 text-xs text-white min-w-0">
                                                <CalendarDays className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                                <p className="font-bold truncate">{formatFullDisplayDate(session.date)}</p>
                                            </div>
                                            <span className={`${getSedeColor(session.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0`}><MapPin className="w-3 h-3"/>{session.sede}</span>
                                        </div>
                                        <p className="font-bold text-white truncate text-lg">{session.title || 'Sin nombre'}</p>
                                      </div>
                                      <div className="flex-shrink-0 flex items-center gap-2">
                                        <button className="p-1 text-cyan-400 hover:text-cyan-300 transition" aria-label={isCardioExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}>
                                          <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isCardioExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExportOptions({
                                                title: `Exportar Cardio ${formatDisplayDate(session.date)}`,
                                                onExportJson: () => downloadJSON({ cardioSessions: [session] }, `cardio-${session.date}-${session.id.substring(0,4)}.json`),
                                                onExportText: () => {
                                                    const textContent = formatCardioSessionAsText(session);
                                                    downloadTXT(textContent, `cardio-${session.date}-${session.id.substring(0,4)}.txt`);
                                                }
                                            });
                                          }}
                                          className="text-gray-400 hover:text-cyan-500 transition"
                                          aria-label="Exportar sesión"
                                        >
                                          <Save className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletionTarget({ type: 'cardio', id: session.id, name: `la sesión de cardio del ${formatDisplayDate(session.date)}` });
                                          }}
                                          className="text-gray-400 hover:text-red-500 transition"
                                          aria-label="Eliminar sesión"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${!isCardioExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                                    <div className="overflow-hidden">
                                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-700/50 cursor-pointer" onClick={() => setSelectedItemForCard(session)}>
                                        <div className="pt-3 sm:pt-4">
                                            {session.notes && (
                                                <div className="mb-3">
                                                    <div className="flex items-start gap-2 text-gray-300 text-sm italic">
                                                        <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                                        <p className="whitespace-pre-wrap">{session.notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {hasMetrics && (
                                              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm ${session.notes ? 'pt-3 border-t border-gray-700/50' : ''}`}>
                                                {hasSpeed && <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Velocidad</p><p className="font-semibold text-white">{formatMetric(session.metrics.speed, 'KM/H')}</p></div></div>}
                                                {hasDistance && <div className="flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Distancia</p><p className="font-semibold text-white">{formatMetric(session.metrics.distance, session.metrics.distanceUnit || 'KM')}</p></div></div>}
                                                {hasIncline && <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Inclinación</p><p className="font-semibold text-white">{formatMetric(session.metrics.incline, '%')}</p></div></div>}
                                                {hasTime && <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Tiempo</p><p className="font-semibold text-white">{formatMetric(session.metrics.time, 'min')}</p></div></div>}
                                                {hasCalories && <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Calorías</p><p className="font-semibold text-white">{session.metrics.calories || '-'}</p></div></div>}
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )})}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  );
};

export default Summary;