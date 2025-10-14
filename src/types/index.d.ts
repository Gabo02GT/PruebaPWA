// Global types for the PWA
export interface BodyComposition {
  id?: number;
  date: string;
  weight: number;
  height: number;
  neckCircumference: number;
  waistCircumference: number;
  hipCircumference?: number;
  gender: 'male' | 'female';
  age: number;
  bmi: number;
  bodyFatPercentage: number;
  leanMass: number;
  recommendations: string[];
  synced: boolean;
}

export interface Exercise {
  id?: number;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  description?: string;
}

export interface Routine {
  id?: number;
  name: string;
  createdAt: string;
  exercises: Array<{ exerciseId?: number; name: string; sets: number; reps: number }>; 
}

export interface Meal {
  id?: number;
  date: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  notes?: string;
}

