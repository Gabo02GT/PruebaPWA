// Calculadoras de composición corporal
export interface BodyMeasurements {
  weight: number;
  height: number;
  neckCircumference: number;
  waistCircumference: number;
  hipCircumference?: number;
  gender: 'male' | 'female';
  age: number;
}

export interface BodyCompositionResults {
  bmi: number;
  bodyFatPercentage: number;
  leanMass: number;
  idealWeight: number;
  basalMetabolicRate: number;
  bmiCategory: string;
  bodyFatCategory: string;
  recommendations: string[];
}

export class BodyCompositionCalculator {
  
  // Calcular IMC
  static calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  // Categoría del IMC
  static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidad I';
    if (bmi < 40) return 'Obesidad II';
    return 'Obesidad III (mórbida)';
  }

  // Calcular porcentaje de grasa corporal (método US Navy)
  static calculateBodyFatPercentage(measurements: BodyMeasurements): number {
    const { height, neckCircumference, waistCircumference, hipCircumference, gender } = measurements;
    
    if (gender === 'male') {
      // Fórmula para hombres
      const logValue = Math.log10(waistCircumference - neckCircumference);
      const heightLog = Math.log10(height);
      return 495 / (1.0324 - 0.19077 * logValue + 0.15456 * heightLog) - 450;
    } else {
      // Fórmula para mujeres
      if (!hipCircumference) throw new Error('Hip circumference required for females');
      const logValue = Math.log10(waistCircumference + hipCircumference - neckCircumference);
      const heightLog = Math.log10(height);
      return 495 / (1.29579 - 0.35004 * logValue + 0.22100 * heightLog) - 450;
    }
  }

  // Categoría de grasa corporal
  static getBodyFatCategory(bodyFat: number, gender: 'male' | 'female'): string {
    if (gender === 'male') {
      if (bodyFat < 6) return 'Extremadamente bajo';
      if (bodyFat < 14) return 'Atlético';
      if (bodyFat < 18) return 'Buena forma';
      if (bodyFat < 25) return 'Promedio';
      return 'Por encima del promedio';
    } else {
      if (bodyFat < 16) return 'Extremadamente bajo';
      if (bodyFat < 20) return 'Atlético';
      if (bodyFat < 25) return 'Buena forma';
      if (bodyFat < 32) return 'Promedio';
      return 'Por encima del promedio';
    }
  }

  // Calcular masa magra
  static calculateLeanMass(weight: number, bodyFatPercentage: number): number {
    return weight * (1 - bodyFatPercentage / 100);
  }

  // Calcular peso ideal (fórmula Devine)
  static calculateIdealWeight(height: number, gender: 'male' | 'female'): number {
    const heightInInches = height / 2.54;
    if (gender === 'male') {
      return 50 + 2.3 * (heightInInches - 60);
    } else {
      return 45.5 + 2.3 * (heightInInches - 60);
    }
  }

  // Calcular metabolismo basal (fórmula Mifflin-St Jeor)
  static calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
  }

  // Generar recomendaciones
  static generateRecommendations(results: BodyCompositionResults): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en IMC
    if (results.bmi < 18.5) {
      recommendations.push('💡 Considera aumentar tu ingesta calórica con alimentos nutritivos');
      recommendations.push('🏋️ Enfócate en entrenamiento de fuerza para ganar masa muscular');
    } else if (results.bmi > 25) {
      recommendations.push('🥗 Mantén un déficit calórico controlado para perder peso');
      recommendations.push('🏃 Combina cardio con entrenamiento de fuerza');
    } else {
      recommendations.push('✅ Tu peso está en un rango saludable');
      recommendations.push('💪 Mantén un estilo de vida activo y alimentación balanceada');
    }

    // Recomendaciones basadas en grasa corporal
    if (results.bodyFatPercentage > 25) {
      recommendations.push('🔥 Considera reducir el porcentaje de grasa corporal');
      recommendations.push('⏰ Implementa ayuno intermitente si es apropiado para ti');
    }

    // Recomendaciones de hidratación
    const waterIntake = Math.round(results.leanMass * 35);
    recommendations.push(`💧 Bebe al menos ${waterIntake}ml de agua al día`);

    // Recomendaciones calóricas
    const maintenanceCalories = Math.round(results.basalMetabolicRate * 1.4);
    recommendations.push(`🍽️ Calorías de mantenimiento aproximadas: ${maintenanceCalories} kcal`);

    return recommendations;
  }

  // Función principal de cálculo
  static calculateAll(measurements: BodyMeasurements): BodyCompositionResults {
    const bmi = this.calculateBMI(measurements.weight, measurements.height);
    const bodyFatPercentage = this.calculateBodyFatPercentage(measurements);
    const leanMass = this.calculateLeanMass(measurements.weight, bodyFatPercentage);
    const idealWeight = this.calculateIdealWeight(measurements.height, measurements.gender);
    const basalMetabolicRate = this.calculateBMR(measurements.weight, measurements.height, measurements.age, measurements.gender);
    
    const results: BodyCompositionResults = {
      bmi,
      bodyFatPercentage,
      leanMass,
      idealWeight,
      basalMetabolicRate,
      bmiCategory: this.getBMICategory(bmi),
      bodyFatCategory: this.getBodyFatCategory(bodyFatPercentage, measurements.gender),
      recommendations: []
    };

    results.recommendations = this.generateRecommendations(results);

    return results;
  }
}