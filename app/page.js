// app/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Composant pour afficher une matrice avec mise en surbrillance
const MatrixDisplay = ({ matrix, title, highlight = [], entering = null, negative = [], supply, demand, showTotals = false }) => {
  const numRows = matrix.length;
  const numCols = matrix[0]?.length || 0;
  return (
    <div className="table-wrapper">
      <h4 className="font-semibold text-lg mb-2">{title}</h4>
      <table className="matrix">
        <thead>
          <tr>
            <th>O\D</th>
            {Array.from({ length: numCols }, (_, j) => <th key={j}>D{j+1}</th>)}
            {showTotals && <th>Offre</th>}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="font-medium">O{i+1}</td>
              {row.map((val, j) => {
                let cellClass = '';
                if (highlight.some(h => h.row === i && h.col === j)) cellClass = 'cell-highlight';
                if (entering && entering.row === i && entering.col === j) cellClass = 'cell-entering';
                if (negative.some(n => n.row === i && n.col === j)) cellClass = 'cell-negative';
                if (val > 0 && !cellClass) cellClass = 'cell-base';
                return (
                  <td key={j} className={cellClass}>
                    {val}
                  </td>
                );
              })}
              {showTotals && (
                <td className="font-medium bg-gray-100 dark:bg-gray-700">
                  {supply && supply[i] !== undefined ? supply[i] : ''}
                </td>
              )}
            </tr>
          ))}
          {showTotals && demand && (
            <tr>
              <td className="font-medium bg-gray-100 dark:bg-gray-700">Demande</td>
              {demand.map((d, j) => (
                <td key={j} className="bg-gray-100 dark:bg-gray-700">{d}</td>
              ))}
              <td className="bg-gray-200 dark:bg-gray-600"></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

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
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [chartData, setChartData] = useState([]);

  // Mise à jour dynamique de la matrice
  const updateCostsDimensions = useCallback(() => {
    const newRows = supply.length;
    const newCols = demand.length;
    let newCosts = costs.map(row => [...row]);
    while (newCosts.length < newRows) newCosts.push(Array(newCols).fill(0));
    if (newCosts.length > newRows) newCosts = newCosts.slice(0, newRows);
    newCosts = newCosts.map(row => {
      while (row.length < newCols) row.push(0);
      if (row.length > newCols) row = row.slice(0, newCols);
      return row;
    });
    setCosts(newCosts);
  }, [supply.length, demand.length]);

  useEffect(() => { updateCostsDimensions(); }, [updateCostsDimensions]);

  const handleSolve = async () => {
    const totalSupply = supply.reduce((a,b) => a+b, 0);
    const totalDemand = demand.reduce((a,b) => a+b, 0);
    if (totalSupply !== totalDemand) {
      setError(`Les offres (${totalSupply}) et les demandes (${totalDemand}) ne sont pas équilibrées.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply, demand, costs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      setResult(data);
      const steps = data.optimizationSteps.filter(s => s.type === 'pivot');
      const chartPoints = steps.map((s, i) => ({ iteration: i+1, cost: s.totalCost }));
      if (chartPoints.length > 0) {
        setChartData([{ iteration: 0, cost: data.initialSolution.totalCost }, ...chartPoints]);
      } else {
        setChartData([{ iteration: 0, cost: data.initialSolution.totalCost }]);
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const loadExample = (ex) => {
    setSupply(ex.supply);
    setDemand(ex.demand);
    setCosts(ex.costs);
    setResult(null);
    setError('');
    setChartData([]);
  };

  const examples = {
    '📘 PDF Original': {
      supply: [18, 32, 14, 9],
      demand: [9, 11, 28, 6, 14, 5],
      costs: [
        [24, 22, 61, 49, 83, 35],
        [23, 39, 78, 28, 65, 42],
        [67, 56, 92, 24, 53, 54],
        [71, 43, 91, 67, 40, 49],
      ],
    },
    '⚡ Cas dégénéré (PDF v3.3)': {
      supply: [25, 30, 10, 45],
      demand: [20, 15, 35, 10, 20, 10],
      costs: [
        [45, 60, 45, 30, 45, 50],
        [35, 15, 35, 35, 25, 25],
        [30, 25, 45, 55, 15, 55],
        [30, 40, 55, 10, 10, 50],
      ],
    },
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      <div className="container">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          >
            🚚 Transport Optimizer – MINICO + Stepping Stone
          </motion.h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-full bg-white/30 backdrop-blur hover:bg-white/50 transition"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Exemples */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {Object.entries(examples).map(([name, data]) => (
            <button key={name} onClick={() => loadExample(data)} className="btn-outline">
              {name}
            </button>
          ))}
        </div>

        {/* Saisie */}
        <div className="glass-card mb-8">
          <h2 className="text-2xl font-bold mb-4">📊 Données du problème</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Offres (séparées par des virgules)</label>
              <input
                type="text"
                value={supply.join(', ')}
                onChange={(e) => setSupply(e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n>=0))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Demandes (séparées par des virgules)</label>
              <input
                type="text"
                value={demand.join(', ')}
                onChange={(e) => setDemand(e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n>=0))}
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Matrice des coûts (modifiable)</label>
            <div className="overflow-x-auto">
              <table className="matrix">
                <tbody>
                  {costs.map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium pr-2">O{i+1}</td>
                      {row.map((val, j) => (
                        <td key={j} className="p-1">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const newCosts = costs.map((r, ri) =>
                                ri === i ? r.map((c, cj) => cj === j ? Number(e.target.value) || 0 : c) : r
                              );
                              setCosts(newCosts);
                            }}
                            className="w-14 p-1 text-center border rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-400 dark:bg-gray-700"
                            step="any"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-xl">⚠️ {error}</div>}
          <button onClick={handleSolve} disabled={loading} className="btn-primary w-full mt-6 py-3">
            {loading ? '⏳ Résolution en cours...' : '🚀 Résoudre'}
          </button>
        </div>

        {/* Résultats */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card stat-green"><div className="label">Coût optimal</div><div className="value">{result.finalSolution.totalCost}</div></div>
                <div className="stat-card stat-blue"><div className="label">Coût initial (MINICO)</div><div className="value">{result.initialSolution.totalCost}</div></div>
                <div className="stat-card stat-purple"><div className="label">Origines</div><div className="value">{supply.length}</div></div>
                <div className="stat-card stat-orange"><div className="label">Destinations</div><div className="value">{demand.length}</div></div>
              </div>

              {/* Graphique d'évolution */}
              {chartData.length > 1 && (
                <div className="glass-card mb-8">
                  <h3 className="text-lg font-semibold mb-2">📈 Évolution du coût total</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--table-border)" />
                      <XAxis dataKey="iteration" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* MINICO Steps */}
              <div className="glass-card mb-8">
                <h2 className="text-2xl font-bold mb-4">🔍 MINICO – Solution de base</h2>
                {result.initialSolution.steps.map((step, idx) => (
                  <div key={idx} className="step-card">
                    <div className="step-title">
                      <span>Étape {step.iteration}</span>
                      <span className="text-sm font-normal text-gray-500">Case O{step.row+1} → D{step.col+1}, coût {step.cost}, quantité {step.qty}</span>
                    </div>
                    <div className="step-detail">Coût cumulé : {step.totalCost}</div>
                    <MatrixDisplay
                      matrix={step.allocation}
                      title={`Allocation après itération ${step.iteration}`}
                      highlight={[{ row: step.row, col: step.col }]}
                      supply={step.supply}
                      demand={step.demand}
                      showTotals
                    />
                  </div>
                ))}
                <div className="p-4 bg-green-100 dark:bg-green-800/30 rounded-xl">
                  ✅ Solution de base obtenue – Coût total : {result.initialSolution.totalCost}
                </div>
              </div>

              {/* Stepping Stone Steps */}
              <div className="glass-card mb-8">
                <h2 className="text-2xl font-bold mb-4">🔄 Stepping Stone – Optimisation</h2>
                {result.optimizationSteps.length === 0 ? (
                  <p className="text-green-600 font-semibold">✅ La solution est déjà optimale !</p>
                ) : (
                  result.optimizationSteps.map((step, idx) => (
                    <div key={idx} className="step-card" style={{ borderLeftColor: step.type === 'optimal' ? '#10b981' : '#8b5cf6' }}>
                      <div className="step-title">
                        <span>Itération {step.iteration}</span>
                        {step.type === 'pivot' && <span className="text-sm font-normal text-gray-500">Pivot sur O{step.entering.row+1}→D{step.entering.col+1}</span>}
                      </div>
                      {step.type === 'pivot' ? (
                        <>
                          <div className="step-detail">📉 Coût marginal (delta) : {step.delta}</div>
                          <div className="step-detail">🔄 Quantité transférée : {step.minQty}</div>
                          <div className="step-detail">💰 Nouveau coût total : {step.totalCost}</div>
                          <div className="step-detail">🔁 Cycle : {step.cycle.map(c => `(O${c.row+1},D${c.col+1})`).join(' → ')}</div>
                          <div className="mt-2">
                            <p className="font-medium">📋 Coûts marginaux (delta) de toutes les cases vides :</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {step.deltas && step.deltas.map((d, i) => (
                                <span key={i} className={`px-2 py-1 rounded text-xs ${d.delta < 0 ? 'bg-red-200 dark:bg-red-800' : 'bg-green-200 dark:bg-green-800'}`}>
                                  δ(O{d.row+1},D{d.col+1}) = {d.delta}
                                </span>
                              ))}
                            </div>
                          </div>
                          <MatrixDisplay
                            matrix={step.allocation}
                            title="Allocation après pivot"
                            entering={step.entering}
                            negative={step.cycle.filter((_, k) => k % 2 === 1)}
                            highlight={step.cycle}
                          />
                          <div className="text-sm text-gray-500 mt-2">Potentiels : Vx={step.Vx.join(', ')}, Vy={step.Vy.join(', ')}</div>
                        </>
                      ) : (
                        <>
                          <p className="text-green-600 font-bold">✅ Solution optimale atteinte !</p>
                          <MatrixDisplay matrix={step.allocation} title="Allocation optimale" />
                          <div className="text-sm text-gray-500 mt-2">Potentiels : Vx={step.Vx.join(', ')}, Vy={step.Vy.join(', ')}</div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Solution finale */}
              <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))' }}>
                <h2 className="text-2xl font-bold">🏆 Solution finale optimale</h2>
                <MatrixDisplay
                  matrix={result.finalSolution.allocation}
                  title="Allocations finales"
                  showTotals
                  supply={supply}
                  demand={demand}
                />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">Coût total minimal : {result.finalSolution.totalCost}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}