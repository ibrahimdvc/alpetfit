export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  image?: string;
  confidence?: string;
  ingredients?: string[];
  description?: string;
  healthTips?: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  feeling?: string; // 'easy', 'medium', 'hard'
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
  report?: WorkoutReport;
}

export interface WorkoutReport {
  workoutVolumeKg: number;
  muscleGroupsTargeted: string[];
  intensityScore: number;
  overallSummary: string;
  strengthProgressAdvise: string;
  formAndSafetyTips: string;
  nutritionRecoveryAdvice: string;
  motivationQuote: string;
}

export interface DailyGoals {
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  water: number;   // in ml
}

export interface WaterLog {
  id: string;
  timestamp: string;
  amountMl: number;
}

export interface ExercisePreset {
  name: string;
  category: string;
}
