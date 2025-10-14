import { useEffect, useState } from 'react';
import { dbManager } from '../utils/indexedDB';

export default function Progress() {
  const [counts, setCounts] = useState({ routines: 0, exercises: 0, meals: 0, compositions: 0 });
  const [lastComposition, setLastComposition] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const [routines, exercises, meals, compositions] = await Promise.all([
        dbManager.getAllRoutines(),
        dbManager.getAllExercises(),
        dbManager.getAllMeals(),
        dbManager.getAllBodyCompositions()
      ]);
      setCounts({
        routines: (routines || []).length,
        exercises: (exercises || []).length,
        meals: (meals || []).length,
        compositions: (compositions || []).length,
      });
      const comps = compositions || [];
      setLastComposition(comps.length ? comps[comps.length - 1] : null);
    })();
  }, []);

  return (
    <div className="screen progress-screen">
      <h2>📈 Progreso</h2>
      <p>Resumen de rutinas, ejercicios, comidas y mediciones corporales.</p>

      <div className="progress-stats">
        <div>Rutinas: {counts.routines}</div>
        <div>Ejercicios: {counts.exercises}</div>
        <div>Comidas: {counts.meals}</div>
        <div>Mediciones: {counts.compositions}</div>
      </div>

      {lastComposition && (
        <div className="last-composition">
          <h4>Última medición corporal</h4>
          <div>Fecha: {new Date(lastComposition.date).toLocaleString()}</div>
          <div>Peso: {lastComposition.weight} kg</div>
          <div>% Grasa: {lastComposition.bodyFatPercentage}%</div>
        </div>
      )}
    </div>
  );
}
