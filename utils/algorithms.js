// utils/algorithms.js

// Méthodes de solution de base
const METHODS = {
  NORTH_WEST: 'north-west',
  MIN_COST: 'min-cost',     // MINICO
  MIN_ROW: 'min-row',       // MINILI
  MIN_COL: 'min-col',       // MINITAB
  BALAS_HAMMER: 'balas-hammer'
};

/**
 * Résout le problème de transport avec la méthode spécifiée pour la solution de base,
 * puis optimise par Stepping Stone.
 */
export function solveTransport(supply, demand, costs, method = METHODS.MIN_COST) {
  const numRows = supply.length;
  const numCols = demand.length;
  let sup = [...supply];
  let dem = [...demand];
  let allocation = Array.from({ length: numRows }, () => Array(numCols).fill(0));
  let totalCost = 0;
  const minicoSteps = [];

  // ---------- Solution de base selon la méthode ----------
  if (method === METHODS.NORTH_WEST) {
    // Coin Nord-Ouest
    let i = 0, j = 0;
    while (i < numRows && j < numCols) {
      const qty = Math.min(sup[i], dem[j]);
      allocation[i][j] = qty;
      sup[i] -= qty;
      dem[j] -= qty;
      totalCost += qty * costs[i][j];
      minicoSteps.push({
        iteration: minicoSteps.length + 1,
        row: i, col: j,
        qty,
        cost: costs[i][j],
        totalCost,
        allocation: allocation.map(row => [...row]),
        supply: [...sup],
        demand: [...dem],
        remainingRows: [],
        remainingCols: []
      });
      if (sup[i] === 0) i++;
      if (dem[j] === 0) j++;
    }
  } else if (method === METHODS.MIN_ROW) {
    // MINILI : minimum par ligne
    let remainingRows = [...Array(numRows).keys()];
    let remainingCols = [...Array(numCols).keys()];
    while (remainingRows.length > 0 && remainingCols.length > 0) {
      // Pour chaque ligne restante, trouver le coût minimum dans les colonnes restantes
      let minCost = Infinity;
      let minI = -1, minJ = -1;
      for (const i of remainingRows) {
        for (const j of remainingCols) {
          if (costs[i][j] < minCost) {
            minCost = costs[i][j];
            minI = i;
            minJ = j;
          }
        }
      }
      const qty = Math.min(sup[minI], dem[minJ]);
      allocation[minI][minJ] = qty;
      sup[minI] -= qty;
      dem[minJ] -= qty;
      totalCost += qty * costs[minI][minJ];
      minicoSteps.push({
        iteration: minicoSteps.length + 1,
        row: minI, col: minJ,
        qty,
        cost: costs[minI][minJ],
        totalCost,
        allocation: allocation.map(row => [...row]),
        supply: [...sup],
        demand: [...dem],
        remainingRows: [...remainingRows],
        remainingCols: [...remainingCols]
      });
      if (sup[minI] === 0) remainingRows = remainingRows.filter(r => r !== minI);
      if (dem[minJ] === 0) remainingCols = remainingCols.filter(c => c !== minJ);
    }
  } else if (method === METHODS.MIN_COL) {
    // MINITAB : minimum par colonne
    let remainingRows = [...Array(numRows).keys()];
    let remainingCols = [...Array(numCols).keys()];
    while (remainingRows.length > 0 && remainingCols.length > 0) {
      let minCost = Infinity;
      let minI = -1, minJ = -1;
      for (const j of remainingCols) {
        for (const i of remainingRows) {
          if (costs[i][j] < minCost) {
            minCost = costs[i][j];
            minI = i;
            minJ = j;
          }
        }
      }
      const qty = Math.min(sup[minI], dem[minJ]);
      allocation[minI][minJ] = qty;
      sup[minI] -= qty;
      dem[minJ] -= qty;
      totalCost += qty * costs[minI][minJ];
      minicoSteps.push({
        iteration: minicoSteps.length + 1,
        row: minI, col: minJ,
        qty,
        cost: costs[minI][minJ],
        totalCost,
        allocation: allocation.map(row => [...row]),
        supply: [...sup],
        demand: [...dem],
        remainingRows: [...remainingRows],
        remainingCols: [...remainingCols]
      });
      if (sup[minI] === 0) remainingRows = remainingRows.filter(r => r !== minI);
      if (dem[minJ] === 0) remainingCols = remainingCols.filter(c => c !== minJ);
    }
  } else if (method === METHODS.BALAS_HAMMER) {
    // Différence maximale (Balas Hammer)
    let remainingRows = [...Array(numRows).keys()];
    let remainingCols = [...Array(numCols).keys()];
    while (remainingRows.length > 0 && remainingCols.length > 0) {
      // Calculer les différences pour chaque ligne
      let maxDiff = -Infinity;
      let chosenRow = -1;
      let chosenCol = -1;
      for (const i of remainingRows) {
        // Trouver les deux plus petits coûts dans les colonnes restantes
        let min1 = Infinity, min2 = Infinity;
        for (const j of remainingCols) {
          if (costs[i][j] < min1) {
            min2 = min1;
            min1 = costs[i][j];
          } else if (costs[i][j] < min2) {
            min2 = costs[i][j];
          }
        }
        const diff = min2 - min1;
        if (diff > maxDiff) {
          maxDiff = diff;
          chosenRow = i;
          // Trouver la colonne du coût minimum pour cette ligne
          let minCost = Infinity;
          for (const j of remainingCols) {
            if (costs[i][j] < minCost) {
              minCost = costs[i][j];
              chosenCol = j;
            }
          }
        }
      }
      if (chosenRow === -1) break; // sécurité
      const qty = Math.min(sup[chosenRow], dem[chosenCol]);
      allocation[chosenRow][chosenCol] = qty;
      sup[chosenRow] -= qty;
      dem[chosenCol] -= qty;
      totalCost += qty * costs[chosenRow][chosenCol];
      minicoSteps.push({
        iteration: minicoSteps.length + 1,
        row: chosenRow, col: chosenCol,
        qty,
        cost: costs[chosenRow][chosenCol],
        totalCost,
        allocation: allocation.map(row => [...row]),
        supply: [...sup],
        demand: [...dem],
        remainingRows: [...remainingRows],
        remainingCols: [...remainingCols]
      });
      if (sup[chosenRow] === 0) remainingRows = remainingRows.filter(r => r !== chosenRow);
      if (dem[chosenCol] === 0) remainingCols = remainingCols.filter(c => c !== chosenCol);
    }
  } else {
    // Par défaut : MINICO (coût minimum global)
    let remainingRows = [...Array(numRows).keys()];
    let remainingCols = [...Array(numCols).keys()];
    while (remainingRows.length > 0 && remainingCols.length > 0) {
      let minCost = Infinity;
      let minI = -1, minJ = -1;
      for (const i of remainingRows) {
        for (const j of remainingCols) {
          if (costs[i][j] < minCost) {
            minCost = costs[i][j];
            minI = i;
            minJ = j;
          }
        }
      }
      const qty = Math.min(sup[minI], dem[minJ]);
      allocation[minI][minJ] = qty;
      sup[minI] -= qty;
      dem[minJ] -= qty;
      totalCost += qty * costs[minI][minJ];
      minicoSteps.push({
        iteration: minicoSteps.length + 1,
        row: minI, col: minJ,
        qty,
        cost: costs[minI][minJ],
        totalCost,
        allocation: allocation.map(row => [...row]),
        supply: [...sup],
        demand: [...dem],
        remainingRows: [...remainingRows],
        remainingCols: [...remainingCols]
      });
      if (sup[minI] === 0) remainingRows = remainingRows.filter(r => r !== minI);
      if (dem[minJ] === 0) remainingCols = remainingCols.filter(c => c !== minJ);
    }
  }

  // ---------- Stepping Stone (commun à toutes les méthodes) ----------
  let basicVars = [];
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (allocation[i][j] > 0) basicVars.push({ row: i, col: j });
    }
  }

  // Gérer la dégénérescence : ajouter des ε si nécessaire
  while (basicVars.length < numRows + numCols - 1) {
    let found = false;
    for (let i = 0; i < numRows && !found; i++) {
      for (let j = 0; j < numCols && !found; j++) {
        if (allocation[i][j] === 0 && !basicVars.some(b => b.row === i && b.col === j)) {
          allocation[i][j] = 0; // epsilon
          basicVars.push({ row: i, col: j });
          found = true;
        }
      }
    }
    if (!found) break;
  }

  const steppingSteps = [];
  let iterationSS = 0;
  let optimal = false;

  while (!optimal && iterationSS < 100) {
    iterationSS++;
    // Calculer les potentiels Vx et Vy
    const Vx = Array(numRows).fill(null);
    const Vy = Array(numCols).fill(null);
    Vx[0] = 0;
    let changed = true;
    let iterationsPot = 0;
    while (changed && iterationsPot < 100) {
      changed = false;
      iterationsPot++;
      for (const { row, col } of basicVars) {
        if (Vx[row] !== null && Vy[col] === null) {
          Vy[col] = costs[row][col] - Vx[row];
          changed = true;
        } else if (Vy[col] !== null && Vx[row] === null) {
          Vx[row] = costs[row][col] - Vy[col];
          changed = true;
        }
      }
      for (let i = 0; i < numRows; i++) if (Vx[i] === null) Vx[i] = 0;
      for (let j = 0; j < numCols; j++) if (Vy[j] === null) Vy[j] = 0;
    }

    // Calculer les deltas pour les cases non de base
    const nonBasic = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (!basicVars.some(b => b.row === i && b.col === j)) {
          const delta = costs[i][j] - Vx[i] - Vy[j];
          const cycle = findCycle(allocation, i, j, basicVars);
          nonBasic.push({ row: i, col: j, delta, cycle });
        }
      }
    }

    const negativeDeltas = nonBasic.filter(nb => nb.delta < 0);
    if (negativeDeltas.length === 0) {
      optimal = true;
      steppingSteps.push({
        iteration: iterationSS,
        type: 'optimal',
        allocation: allocation.map(row => [...row]),
        totalCost,
        Vx,
        Vy,
        deltas: nonBasic,
      });
      break;
    }

    // Choisir le plus négatif avec cycle valide
    let minDelta = Infinity;
    let bestCell = null;
    for (const nb of negativeDeltas) {
      if (nb.delta < minDelta && nb.cycle && nb.cycle.length > 0) {
        minDelta = nb.delta;
        bestCell = nb;
      }
    }
    if (!bestCell) {
      optimal = true;
      steppingSteps.push({
        iteration: iterationSS,
        type: 'optimal',
        allocation: allocation.map(row => [...row]),
        totalCost,
        Vx,
        Vy,
        deltas: nonBasic,
      });
      break;
    }

    const { row, col, cycle, delta } = bestCell;
    // Déterminer la quantité minimale sur les cases négatives (indices impairs)
    let minQty = Infinity;
    for (let k = 1; k < cycle.length; k += 2) {
      const { row: r, col: c } = cycle[k];
      if (allocation[r][c] < minQty) minQty = allocation[r][c];
    }

    // Appliquer le pivot
    for (let k = 0; k < cycle.length; k++) {
      const { row: r, col: c } = cycle[k];
      if (k === 0) {
        allocation[r][c] = minQty;
      } else if (k % 2 === 0) {
        allocation[r][c] += minQty;
      } else {
        allocation[r][c] -= minQty;
      }
    }
    totalCost += minQty * delta;

    // Mettre à jour les variables de base
    basicVars = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (allocation[i][j] > 0) basicVars.push({ row: i, col: j });
      }
    }
    while (basicVars.length < numRows + numCols - 1) {
      let found = false;
      for (let i = 0; i < numRows && !found; i++) {
        for (let j = 0; j < numCols && !found; j++) {
          if (allocation[i][j] === 0 && !basicVars.some(b => b.row === i && b.col === j)) {
            basicVars.push({ row: i, col: j });
            found = true;
          }
        }
      }
      if (!found) break;
    }

    steppingSteps.push({
      iteration: iterationSS,
      type: 'pivot',
      entering: { row, col },
      delta,
      cycle,
      minQty,
      totalCost,
      allocation: allocation.map(row => [...row]),
      Vx,
      Vy,
      deltas: nonBasic,
      basicVars: basicVars.map(b => ({ ...b })),
    });
  }

  return {
    initialSolution: {
      totalCost: minicoSteps.length > 0 ? minicoSteps[minicoSteps.length - 1].totalCost : 0,
      allocation: minicoSteps.length > 0 ? minicoSteps[minicoSteps.length - 1].allocation : allocation,
      steps: minicoSteps,
    },
    optimizationSteps: steppingSteps,
    finalSolution: {
      totalCost,
      allocation: allocation.map(row => [...row]),
    },
  };
}

function findCycle(allocation, startRow, startCol, basicVars) {
  const numRows = allocation.length;
  const numCols = allocation[0].length;
  const visited = {};
  const path = [];

  function dfs(row, col, prevRow, prevCol, direction) {
    const key = `${row},${col}`;
    if (visited[key]) return false;
    visited[key] = true;
    path.push({ row, col });
    if (row === startRow && col === startCol && path.length > 2) return true;

    let nextNodes = [];
    if (direction === 'row' || direction === null) {
      for (let r = 0; r < numRows; r++) {
        if (r === row) continue;
        if (allocation[r][col] > 0 || (r === startRow && col === startCol)) {
          const keyNext = `${r},${col}`;
          if (!visited[keyNext] || (r === startRow && col === startCol && path.length > 1)) {
            nextNodes.push({ row: r, col, dir: 'col' });
          }
        }
      }
    }
    if (direction === 'col' || direction === null) {
      for (let c = 0; c < numCols; c++) {
        if (c === col) continue;
        if (allocation[row][c] > 0 || (row === startRow && c === startCol)) {
          const keyNext = `${row},${c}`;
          if (!visited[keyNext] || (row === startRow && c === startCol && path.length > 1)) {
            nextNodes.push({ row, col: c, dir: 'row' });
          }
        }
      }
    }
    for (const node of nextNodes) {
      if (dfs(node.row, node.col, row, col, node.dir)) return true;
    }
    path.pop();
    delete visited[key];
    return false;
  }

  const found = dfs(startRow, startCol, -1, -1, null);
  return found ? path : null;
}