// utils/algorithms.js

export function solveTransport(supply, demand, costs) {
  let sup = [...supply];
  let dem = [...demand];
  const numRows = sup.length;
  const numCols = dem.length;
  let allocation = Array.from({ length: numRows }, () => Array(numCols).fill(0));
  let remainingRows = [...Array(numRows).keys()];
  let remainingCols = [...Array(numCols).keys()];
  let totalCost = 0;
  const steps = [];

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
    steps.push({
      type: 'allocation',
      row: minI,
      col: minJ,
      qty,
      cost: costs[minI][minJ],
      totalCost,
      allocation: allocation.map(row => [...row]),
      supply: [...sup],
      demand: [...dem],
    });
    if (sup[minI] === 0) remainingRows = remainingRows.filter(r => r !== minI);
    if (dem[minJ] === 0) remainingCols = remainingCols.filter(c => c !== minJ);
  }

  let basicVars = [];
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (allocation[i][j] > 0) basicVars.push({ row: i, col: j });
    }
  }

  const steppingSteps = [];
  let optimal = false;
  let iteration = 0;

  while (!optimal) {
    iteration++;
    const nonBasic = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (allocation[i][j] === 0) {
          const cycle = findCycle(allocation, i, j, basicVars);
          if (cycle) {
            let marginalCost = 0;
            let sign = 1;
            for (let k = 0; k < cycle.length; k++) {
              const { row, col } = cycle[k];
              marginalCost += sign * costs[row][col];
              sign *= -1;
            }
            nonBasic.push({ row: i, col: j, marginalCost, cycle });
          }
        }
      }
    }
    let minMarginal = 0;
    let bestCell = null;
    for (const nb of nonBasic) {
      if (nb.marginalCost < minMarginal) {
        minMarginal = nb.marginalCost;
        bestCell = nb;
      }
    }
    if (minMarginal >= 0) {
      optimal = true;
      steppingSteps.push({ type: 'optimal', allocation: allocation.map(row => [...row]), totalCost });
      break;
    }
    const { row, col, cycle, marginalCost } = bestCell;
    let minQty = Infinity;
    for (let k = 1; k < cycle.length; k += 2) {
      const { row: r, col: c } = cycle[k];
      if (allocation[r][c] < minQty) minQty = allocation[r][c];
    }
    for (let k = 0; k < cycle.length; k++) {
      const { row: r, col: c } = cycle[k];
      if (k === 0) allocation[r][c] = minQty;
      else if (k % 2 === 0) allocation[r][c] += minQty;
      else allocation[r][c] -= minQty;
    }
    totalCost += minQty * marginalCost;
    basicVars = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (allocation[i][j] > 0) basicVars.push({ row: i, col: j });
      }
    }
    steppingSteps.push({
      type: 'pivot',
      iteration,
      entering: { row, col },
      cycle,
      minQty,
      marginalCost,
      allocation: allocation.map(row => [...row]),
      totalCost,
    });
  }

  return {
    initialSolution: {
      allocation: allocation,
      totalCost: totalCost,
      steps: steps,
    },
    optimizationSteps: steppingSteps,
    finalSolution: {
      allocation: allocation,
      totalCost: totalCost,
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