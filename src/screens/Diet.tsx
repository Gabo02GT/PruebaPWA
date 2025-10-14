import { useEffect, useState } from 'react';
import { dbManager } from '../utils/indexedDB';

export default function Diet() {
  const [meals, setMeals] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    const data = await dbManager.getAllMeals();
    setMeals(data || []);
  };

  const add = async () => {
    if (!form.name) return;
    await dbManager.addMeal({
      date: new Date().toISOString(),
      name: form.name,
      calories: Number(form.calories) || undefined,
      protein: Number(form.protein) || undefined,
      carbs: Number(form.carbs) || undefined,
      fats: Number(form.fats) || undefined,
      notes: form.notes
    });
    setForm({ name: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });
    await loadMeals();
  };

  const deleteMeal = async (id: number) => {
    await dbManager.deleteMeal(id);
    await loadMeals();
  };

  return (
    <div className="screen diet-screen">
      <h2>🍎 Dieta</h2>
      <p>Agrega, visualiza y elimina comidas con macros y notas.</p>

      <div className="form-row">
        <input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input placeholder="Calorías" type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
        <input placeholder="Proteína (g)" type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
        <input placeholder="Carbs (g)" type="number" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
        <input placeholder="Grasas (g)" type="number" value={form.fats} onChange={e => setForm(f => ({ ...f, fats: e.target.value }))} />
        <input placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={add}>Agregar</button>
      </div>

      <div className="meal-list">
        {meals.length === 0 && <p>No hay comidas guardadas.</p>}
        {meals.map(m => (
          <div key={m.id} className="meal-item">
            <strong>{m.name}</strong> <small>{new Date(m.date).toLocaleString()}</small>
            <div>Calorías: {m.calories ?? '-'}, Proteína: {m.protein ?? '-'}g, Carbs: {m.carbs ?? '-'}g, Grasas: {m.fats ?? '-'}g</div>
            <div>{m.notes}</div>
            <button onClick={() => deleteMeal(m.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
