


import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { CardioSession } from '../types';
import CardioInputModal from '../components/MetricsModal'; // Renamed internally, file path is the same
import ConfirmationModal from '../components/ConfirmationModal';
import { HeartPulse, PlusCircle, Pencil, Trash2, Zap, Gauge, TrendingUp, Flame, CalendarDays, NotebookText, MapPin, Save, Check, ChevronDown, Clock } from 'lucide-react';

// Componente local para la tarjeta de sesión de cardio
interface CardioSessionCardProps {
    session: CardioSession;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const CardioSessionCard: React.FC<CardioSessionCardProps> = ({
    session,
    isExpanded,
    onToggleExpand,
    onEdit,
    onDelete,
}) => {
    const { sedeColorStyles, saveCardioToSummary } = useAppContext();
    const getSedeColor = (sedeName: string) => sedeColorStyles.get(sedeName)?.tag || 'bg-gray-500 text-white';

    function parseCustomDate(dateString: string): Date | null {
        if (typeof dateString !== 'string' || !dateString.trim()) return null;
        if (dateString.includes('-')) {
            const date = new Date(dateString + 'T00:00:00');
            if (!isNaN(date.getTime())) return date;
        }
        return null;
    }

    const formatDisplayDate = (dateString: string): string => {
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

    const formatMetric = (value: string | undefined, unit: string) => {
        if (!value || value.trim() === '') return '-';
        if (value.toUpperCase().includes(unit.toUpperCase())) return `${value}`;
        if (!isNaN(parseFloat(value)) && isFinite(Number(value))) return `${value} ${unit}`;
        return value;
    };

    const { speed, distance, incline, calories, time } = session.metrics;
    const hasSpeed = speed && speed.trim() !== '';
    const hasDistance = distance && distance.trim() !== '';
    const hasIncline = incline && incline.trim() !== '';
    const hasCalories = calories && calories.trim() !== '';
    const hasTime = time && time.trim() !== '';
    const hasMetrics = hasSpeed || hasDistance || hasIncline || hasCalories || hasTime;
    const hasNotes = session.notes && session.notes.trim() !== '';
    const hasDetails = hasMetrics || hasNotes;

    return (
        <div className="bg-black/20 rounded-xl border border-white/10 p-4 animate-fadeInUp transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/50">
            <button
                onClick={onToggleExpand}
                className="w-full flex justify-between items-start gap-4 text-left"
                aria-expanded={isExpanded}
            >
                <div className="flex-grow min-w-0">
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-1">
                        <div className="flex items-center gap-1.5 text-xs text-white">
                            <CalendarDays className="w-4 h-4 text-cyan-400" />
                            <span className="font-bold">{formatDisplayDate(session.date)}</span>
                        </div>
                        <span className={`${getSedeColor(session.sede)} text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                            <MapPin className="w-3 h-3"/>{session.sede}
                        </span>
                    </div>
                    <p className="font-bold text-white truncate text-lg">{session.title || 'Sin nombre'}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-0 sm:gap-2">
                     <span className="p-2 text-cyan-400">
                        <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-500/10" aria-label="Eliminar sesión">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </button>
            
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${!isExpanded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                    {hasDetails && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEdit();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            className="mt-4 pt-4 border-t border-gray-700/50 cursor-pointer rounded-lg p-2 -m-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                            aria-label="Editar detalles de la sesión de cardio"
                        >
                            {hasMetrics && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                                    {hasSpeed && <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Velocidad</p><p className="font-semibold text-white">{formatMetric(session.metrics.speed, 'KM/H')}</p></div></div>}
                                    {hasDistance && <div className="flex items-center gap-2"><Gauge className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Distancia</p><p className="font-semibold text-white">{formatMetric(session.metrics.distance, session.metrics.distanceUnit || 'KM')}</p></div></div>}
                                    {hasIncline && <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Inclinación</p><p className="font-semibold text-white">{formatMetric(session.metrics.incline, '%')}</p></div></div>}
                                    {hasTime && <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Tiempo</p><p className="font-semibold text-white">{formatMetric(session.metrics.time, 'min')}</p></div></div>}
                                    {hasCalories && <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-cyan-400 flex-shrink-0"/><div><p className="text-xs text-gray-400">Calorías</p><p className="font-semibold text-white">{session.metrics.calories || '-'}</p></div></div>}
                                </div>
                            )}
                             {hasNotes && (
                                <div className={`flex items-start gap-2 text-gray-300 text-sm italic ${hasMetrics ? 'mt-3 pt-3 border-t border-gray-700/50' : ''}`}>
                                    <NotebookText className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                    <p className="whitespace-pre-wrap">{session.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className={`flex justify-end ${hasDetails ? 'mt-3 pt-3 border-t border-gray-700/50' : 'mt-4'}`}>
                        {session.isSavedToSummary ? (
                            <div className="flex items-center justify-center w-9 h-9 bg-green-600 text-white rounded-full" title="Guardado en resumen">
                                <Check className="w-5 h-5" />
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); saveCardioToSummary(session.id); }}
                                className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1.5 px-3 rounded-lg transition-transform transform hover:scale-105 btn-active text-sm"
                                aria-label="Guardar en resumen"
                            >
                                <Save className="w-4 h-4" />
                                <span>Guardar</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CardioPage: React.FC = () => {
    const { 
        activeSede, 
        dailyCardioSessions, 
        addCardioSession, 
        updateCardioSession, 
        removeDailyCardioSession,
        collapsedDailyCardioSessions,
        toggleDailyCardioExpansion
    } = useAppContext();
    
    const [modalState, setModalState] = useState<{ isOpen: boolean; session: Partial<CardioSession> | null }>({ isOpen: false, session: null });
    const [sessionToDelete, setSessionToDelete] = useState<CardioSession | null>(null);
    
    const sedeCardioSessions = useMemo(() => {
        return dailyCardioSessions
            .filter(s => s.sede === activeSede)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dailyCardioSessions, activeSede]);

    const handleSave = (data: Omit<CardioSession, 'id' | 'sede'>) => {
        if (modalState.session && 'id' in modalState.session) {
            updateCardioSession(modalState.session.id as string, data);
        } else {
            addCardioSession(data as Omit<CardioSession, 'id' | 'sede' | 'day'>);
        }
        setModalState({ isOpen: false, session: null });
    };
    
    const handleOpenAddModal = () => {
        setModalState({ isOpen: true, session: null });
    };
    
    const handleOpenEditModal = (session: CardioSession) => {
        setModalState({ isOpen: true, session: session });
    };
    
    const handleDeleteRequest = (session: CardioSession) => {
        setSessionToDelete(session);
    };
    
    const handleConfirmDelete = () => {
        if (sessionToDelete) {
            removeDailyCardioSession(sessionToDelete.id);
            setSessionToDelete(null);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <CardioInputModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, session: null })}
                onSave={handleSave}
                initialData={modalState.session}
            />
            <ConfirmationModal
                isOpen={!!sessionToDelete}
                onClose={() => setSessionToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Sesión de Cardio"
                message={`¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer.`}
            />

            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center">
                <h1 className="text-2xl font-extrabold text-cyan-400 flex items-center justify-center gap-3 uppercase tracking-wider">
                <HeartPulse className="w-7 h-7" />
                CARDIO
                </h1>
            </div>

            {sedeCardioSessions.length === 0 ? (
                <button
                    onClick={handleOpenAddModal}
                    className="text-center p-8 bg-gray-800/50 rounded-2xl border-2 border-dashed border-white/10 mt-8 animate-fadeIn w-full transition-all duration-300 hover:bg-gray-700/50 hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
                >
                    <HeartPulse className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">No hay sesiones de cardio</h2>
                    <p className="text-gray-400">Haz clic aquí para añadir tu primera sesión.</p>
                </button>
            ) : (
                <div className="space-y-4">
                    {sedeCardioSessions.map(session => (
                        <CardioSessionCard
                            key={session.id}
                            session={session}
                            isExpanded={!collapsedDailyCardioSessions.includes(session.id)}
                            onToggleExpand={() => toggleDailyCardioExpansion(session.id)}
                            onEdit={() => handleOpenEditModal(session)}
                            onDelete={() => handleDeleteRequest(session)}
                        />
                    ))}
                </div>
            )}
            
            <button
                onClick={handleOpenAddModal}
                className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 w-16 h-16 flex items-center justify-center z-20"
                aria-label="Añadir nueva sesión de cardio"
            >
                <PlusCircle className="w-8 h-8" />
            </button>
        </div>
    );
};

export default CardioPage;