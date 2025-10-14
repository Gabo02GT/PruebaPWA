import { useState, useEffect, useMemo } from 'react';
import { dbManager } from '../utils/indexedDB';

type LocalExercise = { name: string; sets: number; reps: number; part?: 'upper' | 'lower'; category?: string };

const UPPER_CATS = ['Pecho', 'Espalda', 'Brazos', 'Hombros'];
const LOWER_CATS = ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Gemelos'];

export default function NewRoutine() {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [savedRoutines, setSavedRoutines] = useState<any[]>([]);

  // Filters for saved routines
  const [filterPart, setFilterPart] = useState<'all' | 'upper' | 'lower'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    const routines = await dbManager.getAllRoutines();
    setSavedRoutines(routines || []);
  };

  const addExercise = () => {
    setExercises(prev => [...prev, { name: '', sets: 3, reps: 10, part: 'upper', category: UPPER_CATS[0] }]);
  };

  const saveRoutine = async () => {
    if (!name) return;
    // Save exercises with part/category info
    await dbManager.addRoutine({ name, createdAt: new Date().toISOString(), exercises });
    setName('');
    setExercises([]);
    await loadRoutines();
  };

  const deleteRoutine = async (id: number) => {
    await dbManager.deleteRoutine(id);
    await loadRoutines();
  };

  const filteredRoutines = useMemo(() => {
    return (savedRoutines || []).filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPart === 'all' && (filterCategory === 'all' || !filterCategory)) return true;
      // check if any exercise matches the filter
      const matches = (r.exercises || []).some((ex: any) => {
        if (filterPart !== 'all' && ex.part !== filterPart) return false;
        if (filterCategory !== 'all' && filterCategory && ex.category !== filterCategory) return false;
        return true;
      });
      return matches;
    });
  }, [savedRoutines, filterPart, filterCategory, search]);

  return (
    <div className="screen new-routine-screen">
      <h2>📋 Rutinas</h2>
      <p>Crea, visualiza y elimina rutinas personalizadas. Etiqueta ejercicios por tren (superior/inferior) y por grupo muscular.</p>

      <div className="form-row">
        <label>Nombre de la rutina</label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="routine-exercises">
        <h4>Ejercicios</h4>
        {exercises.map((ex, i) => (
          <div key={i} className="exercise-item">
            <input placeholder="Ejercicio" value={ex.name} onChange={e => {
              const copy = [...exercises]; copy[i].name = e.target.value; setExercises(copy);
            }} />

            <select value={ex.part} onChange={e => {
              const copy = [...exercises]; copy[i].part = e.target.value as 'upper' | 'lower';
              // default category when changing part
              copy[i].category = copy[i].part === 'upper' ? UPPER_CATS[0] : LOWER_CATS[0];
              setExercises(copy);
            }}>
              <option value="upper">Tren superior</option>
              <option value="lower">Tren inferior</option>
            </select>

            <select value={ex.category} onChange={e => { const copy = [...exercises]; copy[i].category = e.target.value; setExercises(copy); }}>
              {(ex.part === 'lower' ? LOWER_CATS : UPPER_CATS).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input type="number" value={ex.sets} min={1} onChange={e => { const copy = [...exercises]; copy[i].sets = Number(e.target.value); setExercises(copy); }} />
            <input type="number" value={ex.reps} min={1} onChange={e => { const copy = [...exercises]; copy[i].reps = Number(e.target.value); setExercises(copy); }} />
            <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))}>Eliminar</button>
          </div>
        ))}
        <button onClick={addExercise}>Agregar ejercicio</button>
      </div>

      <div className="form-actions">
        <button onClick={saveRoutine}>Guardar Rutina</button>
      </div>

      <div className="saved-routines">
        <h4>Rutinas guardadas</h4>

        <div className="filter-bar" style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem', alignItems: 'center' }}>
          <input placeholder="Buscar por nombre" value={search} onChange={e => setSearch(e.target.value)} />
          <select value={filterPart} onChange={e => { setFilterPart(e.target.value as any); setFilterCategory('all'); }}>
            <option value="all">Todos</option>
            <option value="upper">Tren superior</option>
            <option value="lower">Tren inferior</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {(filterPart === 'all' ? [...UPPER_CATS, ...LOWER_CATS] : (filterPart === 'upper' ? UPPER_CATS : LOWER_CATS)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filteredRoutines.length === 0 && <p>No hay rutinas que coincidan.</p>}
        {filteredRoutines.map(r => (
          <div key={r.id} className="saved-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{r.name}</strong> <small style={{ marginLeft: 8 }}>{new Date(r.createdAt).toLocaleString()}</small>
              </div>
              <div>
                <button onClick={() => deleteRoutine(r.id)}>Eliminar</button>
              </div>
            </div>
            <ul>
              {r.exercises.map((ex: any, idx: number) => (
                <li key={idx} style={{ marginTop: 6 }}>
                  <strong style={{ color: '#FFD700' }}>{ex.name}</strong> — {ex.sets}x{ex.reps}
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', marginRight: 6 }}>{ex.part === 'upper' ? 'Superior' : 'Inferior'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(218,165,32,0.08)' }}>{ex.category}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
