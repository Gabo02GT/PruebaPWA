import { useEffect, useState } from 'react';
import { dbManager } from '../utils/indexedDB';

export default function Exercises() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', muscleGroup: '', equipment: '', description: '' });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const data = await dbManager.getAllExercises();
    setExercises(data || []);
  };

  const add = async () => {
    if (!form.name) return;
    await dbManager.addExercise(form);
    setForm({ name: '', muscleGroup: '', equipment: '', description: '' });
    await loadExercises();
  };

  const deleteExercise = async (id: number) => {
    await dbManager.deleteExercise(id);
    await loadExercises();
  };

  return (
    <div className="screen exercises-screen">
      <h2>💪 Ejercicios</h2>
      <p>Agrega, visualiza y elimina ejercicios personalizados.</p>

      <div className="form-row">
        <input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input placeholder="Grupo muscular" value={form.muscleGroup} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))} />
        <input placeholder="Equipo" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
        <input placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <button onClick={add}>Agregar</button>
      </div>

      <div className="exercise-list">
        {exercises.length === 0 && <p>No hay ejercicios guardados.</p>}
        {exercises.map(ex => (
          <div key={ex.id} className="exercise-item">
            <strong>{ex.name}</strong> <span>({ex.muscleGroup})</span>
            <div><small>Equipo: {ex.equipment}</small></div>
            <div><small>{ex.description}</small></div>
            <button onClick={() => deleteExercise(ex.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
