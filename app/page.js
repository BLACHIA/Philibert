'use client';
import { useState } from 'react';

export default function Home() {
  const [supply, setSupply] = useState([18, 32, 14, 9]);
  const [demand, setDemand] = useState([9, 11, 28, 6, 14, 5]);
  const [costs, setCosts] = useState([
    [24, 22, 61, 49, 83, 35],
    [23, 39, 78, 28, 65, 42],
    [67, 56, 92, 24, 53, 54],
    [71, 43, 91, 67, 40, 49],
  ]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(null);

  const handleSolve = async () => {
    setLoading(true);
    setResult(null);
    setActiveStep(null);
    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply, demand, costs }),
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
        // Ouvrir automatiquement la première étape d'optimisation si existante
        if (data.optimizationSteps && data.optimizationSteps.length > 0) {
          setActiveStep(0);
        }
      } else {
        alert('Erreur : ' + data.error);
      }
    } catch (error) {
      alert('Erreur lors de la résolution');
    }
    setLoading(false);
  };

  const renderMatrix = (matrix, title, highlight = null) => {
    // highlight: { row, col, color } pour surligner une cellule
    return (
      <div className="matrix-wrapper">
        <h4>{title}</h4>
        <table className="matrix">
          <thead>
            <tr>
              <th></th>
              {matrix[0].map((_, j) => (
                <th key={j}>D{j+1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th>O{i+1}</th>
                {row.map((val, j) => {
                  let className = 'cell';
                  if (highlight && highlight.row === i && highlight.col === j) {
                    className += ' highlight-' + highlight.color;
                  }
                  if (val > 0) className += ' allocated';
                  return (
                    <td key={j} className={className}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🚚 Problème de Transport</h1>
        <p className="subtitle">Méthode MINICO + Stepping Stone</p>
      </header>

      <div className="input-section">
        <div className="input-group">
          <label>Offres (par ligne) :</label>
          <input
            type="text"
            value={supply.join(', ')}
            onChange={(e) => setSupply(e.target.value.split(',').map(Number))}
            placeholder="ex: 18, 32, 14, 9"
          />
        </div>
        <div className="input-group">
          <label>Demandes (par colonne) :</label>
          <input
            type="text"
            value={demand.join(', ')}
            onChange={(e) => setDemand(e.target.value.split(',').map(Number))}
            placeholder="ex: 9, 11, 28, 6, 14, 5"
          />
        </div>
        <div className="input-group full-width">
          <label>Matrice des coûts :</label>
          <textarea
            rows={Math.max(supply.length, 3)}
            value={costs.map(row => row.join(', ')).join('\n')}
            onChange={(e) => {
              const rows = e.target.value.split('\n').filter(r => r.trim());
              const newCosts = rows.map(row => row.split(',').map(Number));
              if (newCosts.every(row => row.length === newCosts[0]?.length)) {
                setCosts(newCosts);
              }
            }}
            placeholder="24, 22, 61, ..."
          />
        </div>
        <button className="btn-primary" onClick={handleSolve} disabled={loading}>
          {loading ? '⏳ Calcul en cours...' : '🔍 Résoudre'}
        </button>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Optimisation en cours...</p>
        </div>
      )}

      {result && (
        <div className="results">
          <div className="result-summary">
            <div className="summary-card">
              <span className="summary-label">Solution initiale (MINICO)</span>
              <span className="summary-value">{result.initialSolution.totalCost}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Solution optimale</span>
              <span className="summary-value">{result.finalSolution.totalCost}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Gain</span>
              <span className="summary-value">
                {result.initialSolution.totalCost - result.finalSolution.totalCost}
              </span>
            </div>
          </div>

          <div className="solution-section">
            <h2>📊 Solution de base (MINICO)</h2>
            {renderMatrix(result.initialSolution.allocation, 'Allocations initiales')}
          </div>

          {result.optimizationSteps.length > 0 && (
            <div className="optimization-section">
              <h2>🔄 Étapes d'optimisation (Stepping Stone)</h2>
              <div className="steps-timeline">
                {result.optimizationSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`step-item ${activeStep === idx ? 'active' : ''}`}
                    onClick={() => setActiveStep(idx)}
                  >
                    <div className="step-header">
                      <span className="step-number">Étape {idx+1}</span>
                      <span className="step-badge">
                        {step.type === 'optimal' ? '✅ Optimum' : '🔄 Pivot'}
                      </span>
                    </div>
                    {activeStep === idx && (
                      <div className="step-details">
                        {step.type === 'pivot' && (
                          <>
                            <p>
                              <strong>Cellule entrante :</strong> O{step.entering.row+1} → D{step.entering.col+1}
                            </p>
                            <p>
                              <strong>Coût marginal :</strong> {step.marginalCost}
                            </p>
                            <p>
                              <strong>Quantité transférée :</strong> {step.minQty}
                            </p>
                            <p>
                              <strong>Nouveau coût total :</strong> {step.totalCost}
                            </p>
                            <p>
                              <strong>Cycle :</strong> {step.cycle.map(c => `(${c.row+1},${c.col+1})`).join(' → ')}
                            </p>
                            {renderMatrix(step.allocation, 'Allocation après pivot', null)}
                          </>
                        )}
                        {step.type === 'optimal' && (
                          <div className="optimal-message">
                            🎉 Solution optimale atteinte ! Aucun coût marginal négatif.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="solution-section final">
            <h2>🏆 Solution finale optimale</h2>
            <p className="total-cost">Coût total : <strong>{result.finalSolution.totalCost}</strong></p>
            {renderMatrix(result.finalSolution.allocation, 'Allocations optimales')}
          </div>
        </div>
      )}
    </div>
  );
}