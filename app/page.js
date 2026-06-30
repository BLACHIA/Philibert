// app/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MatrixDisplay = ({ matrix, title, highlight = [], entering = null, negative = [], supply, demand, showTotals = false }) => {
  const numRows = matrix.length;
  const numCols = matrix[0]?.length || 0;
  return (
    <div className="table-wrapper">
      <h4 className="font-semibold text-lg mb-2">{title}</h4>
      <table className="matrix">
        <thead>
          <tr><th>O\D</th>{Array.from({ length: numCols }, (_, j) => <th key={j}>D{j+1}</th>)}{showTotals && <th>Offre</th>}</tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="font-medium">O{i+1}</td>
              {row.map((val, j) => {
                let cls = '';
                if (highlight.some(h => h.row === i && h.col === j)) cls = 'cell-highlight';
                if (entering && entering.row === i && entering.col === j) cls = 'cell-entering';
                if (negative.some(n => n.row === i && n.col === j)) cls = 'cell-negative';
                if (val > 0 && !cls) cls = 'cell-base';
                return <td key={j} className={cls}>{val}</td>;
              })}
              {showTotals && <td className="font-medium bg-gray-100 dark:bg-gray-700">{supply?.[i] ?? ''}</td>}
            </tr>
          ))}
          {showTotals && demand && (
            <tr><td className="font-medium bg-gray-100 dark:bg-gray-700">Demande</td>
              {demand.map((d, j) => <td key={j} className="bg-gray-100 dark:bg-gray-700">{d}</td>)}
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
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [allSteps, setAllSteps] = useState([]);
  const [method, setMethod] = useState('min-cost');

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
      setError(`Offres (${totalSupply}) ≠ Demandes (${totalDemand})`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply, demand, costs, method })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      // Construire les étapes pas-à-pas
      const steps = [];
      data.initialSolution.steps.forEach(s => steps.push({ type: 'minico', ...s }));
      data.optimizationSteps.forEach(s => steps.push({ type: 'stepping', ...s }));
      setAllSteps(steps);
      setStepIndex(0);
      // Graphique
      const pivots = data.optimizationSteps.filter(s => s.type === 'pivot');
      const pts = pivots.map((s, i) => ({ iteration: i+1, cost: s.totalCost }));
      setChartData(pts.length ? [{ iteration: 0, cost: data.initialSolution.totalCost }, ...pts] : [{ iteration: 0, cost: data.initialSolution.totalCost }]);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleCompare = async () => {
    const methods = ['north-west', 'min-cost', 'min-row', 'min-col', 'balas-hammer'];
    const results = [];
    for (const m of methods) {
      const start = performance.now();
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supply, demand, costs, method: m })
      });
      const data = await res.json();
      const end = performance.now();
      results.push({
        method: m,
        initialCost: data.initialSolution.totalCost,
        finalCost: data.finalSolution.totalCost,
        time: (end - start).toFixed(2)
      });
    }
    setComparison(results);
  };

  const loadExample = (ex) => {
    setSupply(ex.supply);
    setDemand(ex.demand);
    setCosts(ex.costs);
    setResult(null);
    setComparison(null);
    setError('');
    setChartData([]);
    setAllSteps([]);
    setStepIndex(0);
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
    '⚡ Cas dégénéré (v3.3)': {
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

  const methodLabels = {
    'north-west': 'Coin Nord-Ouest',
    'min-cost': 'MINICO',
    'min-row': 'MINILI',
    'min-col': 'MINITAB',
    'balas-hammer': 'Balas Hammer'
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🚚 Transport Optimizer
          </motion.h1>
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-full bg-white/30 backdrop-blur hover:bg-white/50 transition">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {Object.entries(examples).map(([name, data]) => (
            <button key={name} onClick={() => loadExample(data)} className="btn-outline">{name}</button>
          ))}
        </div>

        <div className="glass-card mb-8">
          <h2 className="text-2xl font-bold mb-4">📊 Données</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Offres</label>
              <input type="text" value={supply.join(', ')} onChange={(e) => setSupply(e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n>=0))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Demandes</label>
              <input type="text" value={demand.join(', ')} onChange={(e) => setDemand(e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n>=0))} className="input-field" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Matrice des coûts</label>
            <div className="overflow-x-auto">
              <table className="matrix">
                <tbody>
                  {costs.map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium pr-2">O{i+1}</td>
                      {row.map((val, j) => (
                        <td key={j} className="p-1">
                          <input type="number" value={val} onChange={(e) => {
                            const newCosts = costs.map((r, ri) => ri === i ? r.map((c, cj) => cj === j ? Number(e.target.value) || 0 : c) : r);
                            setCosts(newCosts);
                          }} className="w-14 p-1 text-center border rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-400 dark:bg-gray-700" step="any" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Méthode de base</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input-field">
              {Object.entries(methodLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-xl">⚠️ {error}</div>}
          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={handleSolve} disabled={loading} className="btn-primary">{loading ? '⏳...' : '🚀 Résoudre'}</button>
            <button onClick={handleCompare} disabled={loading} className="btn-outline">📊 Comparer les méthodes</button>
          </div>
        </div>

        {/* Comparaison */}
        {comparison && (
          <div className="glass-card mb-8">
            <h3 className="text-xl font-bold mb-4">📊 Comparaison des méthodes de base</h3>
            <div className="overflow-x-auto">
              <table className="matrix">
                <thead><tr><th>Méthode</th><th>Coût initial</th><th>Coût final</th><th>Temps (ms)</th></tr></thead>
                <tbody>
                  {comparison.map((item, idx) => (
                    <tr key={idx}>
                      <td>{methodLabels[item.method] || item.method}</td>
                      <td>{item.initialCost}</td>
                      <td>{item.finalCost}</td>
                      <td>{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Résultats détaillés avec mode pas-à-pas */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="glass-card">
            {/* Stats */}
            <div className="stats-grid mb-6">
              <div className="stat-card stat-green"><div className="label">Coût optimal</div><div className="value">{result.finalSolution.totalCost}</div></div>
              <div className="stat-card stat-blue"><div className="label">Coût initial</div><div className="value">{result.initialSolution.totalCost}</div></div>
              <div className="stat-card stat-purple"><div className="label">Origines</div><div className="value">{supply.length}</div></div>
              <div className="stat-card stat-orange"><div className="label">Destinations</div><div className="value">{demand.length}</div></div>
            </div>

            {/* Graphique */}
            {chartData.length > 1 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">📈 Évolution du coût</h3>
                <ResponsiveContainer width="100%" height={200}>
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

            {/* Navigation pas-à-pas */}
            {allSteps.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <button onClick={() => setStepIndex(Math.max(0, stepIndex-1))} disabled={stepIndex===0} className="btn-outline">◀ Préc.</button>
                  <span className="font-semibold">Étape {stepIndex+1} / {allSteps.length}</span>
                  <button onClick={() => setStepIndex(Math.min(allSteps.length-1, stepIndex+1))} disabled={stepIndex===allSteps.length-1} className="btn-outline">Suiv. ▶</button>
                </div>
                <div className="mt-4">
                  {allSteps[stepIndex].type === 'minico' && (
                    <div className="step-card">
                      <div className="step-title">MINICO – Itération {allSteps[stepIndex].iteration}</div>
                      <div>Case O{allSteps[stepIndex].row+1} → D{allSteps[stepIndex].col+1}, coût {allSteps[stepIndex].cost}, qty {allSteps[stepIndex].qty}</div>
                      <div>Coût cumulé : {allSteps[stepIndex].totalCost}</div>
                      <MatrixDisplay matrix={allSteps[stepIndex].allocation} title="Allocation" highlight={[{ row: allSteps[stepIndex].row, col: allSteps[stepIndex].col }]} supply={allSteps[stepIndex].supply} demand={allSteps[stepIndex].demand} showTotals />
                    </div>
                  )}
                  {allSteps[stepIndex].type === 'stepping' && allSteps[stepIndex].type !== 'optimal' && (
                    <div className="step-card">
                      <div className="step-title">Stepping Stone – Pivot {allSteps[stepIndex].iteration}</div>
                      <div>Entrante : O{allSteps[stepIndex].entering.row+1}→D{allSteps[stepIndex].entering.col+1}, delta={allSteps[stepIndex].delta}</div>
                      <div>Quantité transférée : {allSteps[stepIndex].minQty}</div>
                      <div>Coût total : {allSteps[stepIndex].totalCost}</div>
                      <div>Cycle : {allSteps[stepIndex].cycle.map(c => `(O${c.row+1},D${c.col+1})`).join(' → ')}</div>
                      <MatrixDisplay matrix={allSteps[stepIndex].allocation} title="Après pivot" entering={allSteps[stepIndex].entering} negative={allSteps[stepIndex].cycle.filter((_, k) => k%2===1)} highlight={allSteps[stepIndex].cycle} />
                      <div className="text-sm text-gray-500 mt-2">Potentiels : Vx={allSteps[stepIndex].Vx.join(', ')}, Vy={allSteps[stepIndex].Vy.join(', ')}</div>
                    </div>
                  )}
                  {allSteps[stepIndex].type === 'stepping' && allSteps[stepIndex].type === 'optimal' && (
                    <div className="step-card" style={{borderLeftColor:'#10b981'}}>
                      <div className="step-title">✅ Solution optimale atteinte !</div>
                      <MatrixDisplay matrix={allSteps[stepIndex].allocation} title="Allocation optimale" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Solution finale */}
            <div className="mt-8 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl">
              <h3 className="text-2xl font-bold">🏆 Solution finale</h3>
              <MatrixDisplay matrix={result.finalSolution.allocation} title="Allocations optimales" showTotals supply={supply} demand={demand} />
              <p className="text-xl font-bold text-green-600 dark:text-green-400">Coût minimal : {result.finalSolution.totalCost}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}