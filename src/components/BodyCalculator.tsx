import { useState, useEffect } from 'react';
import { dbManager } from '../utils/indexedDB';
import type { BodyComposition } from '../types';
import { BodyCompositionCalculator } from '../utils/bodyCalculations';
import type { BodyMeasurements } from '../utils/bodyCalculations';
import '../types/pwa.d.ts';
import './BodyCalculator.css';

interface Props {
  onClose: () => void;
}

export default function BodyCalculator({ onClose }: Props) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    weight: 0,
    height: 0,
    neckCircumference: 0,
    waistCircumference: 0,
    hipCircumference: 0,
    gender: 'male',
    age: 0
  });
  
  const [results, setResults] = useState<{
    bmi: number;
    bodyFatPercentage: number;
    leanMass: number;
    idealWeight: number;
    basalMetabolicRate: number;
    bmiCategory: string;
    bodyFatCategory: string;
    recommendations: string[];
  } | null>(null);
  const [savedMeasurements, setSavedMeasurements] = useState<BodyComposition[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    loadHistory();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const history = await dbManager.getAllBodyCompositions();
      setSavedMeasurements(history.reverse()); 
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleInputChange = (field: keyof BodyMeasurements, value: string | number) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (field === 'gender' ? value : parseFloat(value) || 0) : value
    }));
  };

  const validateForm = (): boolean => {
    if (measurements.weight <= 0 || measurements.height <= 0 || measurements.age <= 0) {
      window.dispatchEvent(new CustomEvent('in-app-notification', {
        detail: {
          title: 'Campos incompletos',
          body: 'Por favor completa todos los campos básicos.'
        }
      }));
      return false;
    }
    if (measurements.neckCircumference <= 0 || measurements.waistCircumference <= 0) {
      window.dispatchEvent(new CustomEvent('in-app-notification', {
        detail: {
          title: 'Campos incompletos',
          body: 'Por favor completa las circunferencias.'
        }
      }));
      return false;
    }
    if (measurements.gender === 'female' && (measurements.hipCircumference || 0) <= 0) {
      window.dispatchEvent(new CustomEvent('in-app-notification', {
        detail: {
          title: 'Campo requerido',
          body: 'La circunferencia de cadera es requerida para mujeres.'
        }
      }));
      return false;
    }
    return true;
  };

  const calculateAndSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    window.dispatchEvent(new CustomEvent('in-app-notification', {
      detail: {
        title: 'Calculando...',
        body: 'Procesando tu medición. Por favor espera.'
      }
    }));

    try {
      const calculatedResults = BodyCompositionCalculator.calculateAll(measurements);
      setResults(calculatedResults);

      const dataToSave: Omit<BodyComposition, 'id'> = {
        date: new Date().toISOString(),
        weight: measurements.weight,
        height: measurements.height,
        neckCircumference: measurements.neckCircumference,
        waistCircumference: measurements.waistCircumference,
        hipCircumference: measurements.hipCircumference,
        gender: measurements.gender,
        age: measurements.age,
        bmi: calculatedResults.bmi,
        bodyFatPercentage: calculatedResults.bodyFatPercentage,
        leanMass: calculatedResults.leanMass,
        recommendations: calculatedResults.recommendations,
        synced: false 
      };

      await dbManager.addBodyComposition(dataToSave);
      
      await loadHistory();

      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-body-measurements');
          console.log('Background Sync registrado para sincronización');
        } catch (error) {
          console.error('Error registrando Background Sync:', error);
        }
      }

      window.dispatchEvent(new CustomEvent('in-app-notification', {
        detail: {
          title: '📊 Medición guardada',
          body: `IMC: ${calculatedResults.bmi.toFixed(1)} | Grasa: ${calculatedResults.bodyFatPercentage.toFixed(1)}%`
        }
      }));

    } catch (error) {
      console.error('Error calculando y guardando:', error);
      window.dispatchEvent(new CustomEvent('in-app-notification', {
        detail: {
          title: 'Error al guardar',
          body: 'Ocurrió un error al guardar los datos. Inténtalo de nuevo.'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="body-calculator">
      <div className="calculator-header">
        <h2>📊 Calculadora de Composición Corporal</h2>
        <div className="header-controls">
          <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
          <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
            📈 Historial ({savedMeasurements.length})
          </button>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
      </div>

      {!isOnline && (
        <div className="offline-notice">
          📡 Modo offline activo. Los datos se sincronizarán cuando regrese la conexión.
        </div>
      )}

      <div className="calculator-content">
        {showHistory ? (
          <div className="history-section">
            <h3>📈 Historial de Mediciones</h3>
            {savedMeasurements.length === 0 ? (
              <p className="no-data">No hay mediciones guardadas</p>
            ) : (
              <div className="history-list">
                {savedMeasurements.map((measurement) => (
                  <div key={measurement.id} className="history-item">
                    <div className="history-date">{formatDate(measurement.date)}</div>
                    <div className="history-stats">
                      <span>IMC: {measurement.bmi.toFixed(1)}</span>
                      <span>Grasa: {measurement.bodyFatPercentage.toFixed(1)}%</span>
                      <span>Peso: {measurement.weight}kg</span>
                      <span className={`sync-status ${measurement.synced ? 'synced' : 'pending'}`}>
                        {measurement.synced ? '✅ Sincronizado' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <form className="calculator-form">
              <div className="form-section">
                <h3>👤 Datos Básicos</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      value={measurements.weight || ''}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="ej: 70"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      value={measurements.height || ''}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      placeholder="ej: 175"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Edad</label>
                    <input
                      type="number"
                      value={measurements.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="ej: 25"
                    />
                  </div>
                  <div className="form-group">
                    <label>Género</label>
                    <select
                      value={measurements.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>📏 Circunferencias (cm)</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cuello</label>
                    <input
                      type="number"
                      value={measurements.neckCircumference || ''}
                      onChange={(e) => handleInputChange('neckCircumference', e.target.value)}
                      placeholder="ej: 38"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cintura</label>
                    <input
                      type="number"
                      value={measurements.waistCircumference || ''}
                      onChange={(e) => handleInputChange('waistCircumference', e.target.value)}
                      placeholder="ej: 85"
                      step="0.1"
                    />
                  </div>
                </div>
                {measurements.gender === 'female' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cadera (requerido para mujeres)</label>
                      <input
                        type="number"
                        value={measurements.hipCircumference || ''}
                        onChange={(e) => handleInputChange('hipCircumference', e.target.value)}
                        placeholder="ej: 95"
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="button" 
                onClick={calculateAndSave}
                className="calculate-btn"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Calculando...' : '🔢 Calcular y Guardar'}
              </button>
            </form>

            {results && (
              <div className="results-section">
                <h3>📊 Resultados</h3>
                <div className="results-grid">
                  <div className="result-card">
                    <div className="result-label">IMC</div>
                    <div className="result-value">{results.bmi.toFixed(1)}</div>
                    <div className="result-category">{results.bmiCategory}</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Grasa Corporal</div>
                    <div className="result-value">{results.bodyFatPercentage.toFixed(1)}%</div>
                    <div className="result-category">{results.bodyFatCategory}</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Masa Magra</div>
                    <div className="result-value">{results.leanMass.toFixed(1)} kg</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Metabolismo Basal</div>
                    <div className="result-value">{Math.round(results.basalMetabolicRate)} kcal</div>
                  </div>
                </div>

                <div className="recommendations">
                  <h4>💡 Recomendaciones</h4>
                  <ul>
                    {results.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}