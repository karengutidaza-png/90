
export interface CardioMetrics {
  speed: string;
  distance: string;
  distanceUnit?: 'KM' | 'MTS';
  incline: string;
  calories: string;
  time: string;
}

export interface CardioSession {
  id: string;
  day: string;
  date: string;
  title?: string;
  metrics: CardioMetrics;
  notes?: string;
  sede: string;
  isSavedToSummary?: boolean;
  savedState?: Partial<Omit<CardioSession, 'id' | 'sede' | 'day'>>;
}

export interface ExerciseLog {
  id:string;
  exerciseName: string;
  date: string;
  reps: string;
  kilos: string;
  series: string;
  incline?: string;
  day: string;
  media: ExerciseMedia[];
  notes?: string;
  sede: string;
  isSavedToSummary?: boolean;
  savedState?: Partial<Omit<ExerciseLog, 'id' | 'sede' | 'day'>>;
}

export interface ExerciseMedia {
  type: 'image' | 'video';
  dataUrl: string;
}

export interface FavoriteExercise {
  id: string;
  name: string;
  dayTitle: string;
  media: ExerciseMedia[];
  notes?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  name: string;
}

export interface ExerciseFormData {
  id: string;
  exerciseName: string;
  date: string;
  reps: string;
  kilos: string;
  series: string;
  media: ExerciseMedia[];
  notes: string;
}

export interface CardioFormData {
  date: string;
  title?: string;
  metrics: CardioMetrics;
  notes: string;
}

export interface WorkoutDayState {
  cardio: CardioFormData;
  isCardioFormVisible: boolean;
  expandedLogs: string[];
}

export interface MuscleGroupLinks {
  [muscle: string]: LinkItem[];
}

export interface WorkoutDayLinks {
  [dayName:string]: MuscleGroupLinks;
}


export interface SedeData {
  favoriteExercises: FavoriteExercise[];
  workoutDays: { [key: string]: WorkoutDayState };
  muscleGroupLinks: WorkoutDayLinks;
  stretchingLinks: LinkItem[];
  postureLinks: LinkItem[];
}