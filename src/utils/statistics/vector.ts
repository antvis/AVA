/** operation of vector or matrix */
export const vectorAdd = (x: number[], y: number[]) => {
  if (x.length !== y.length) return null;
  return x.map((xi, i) => xi + y[i]);
};

export const vectorSubtract = (x: number[], y: number[]) => {
  if (x.length !== y.length) return null;
  return x.map((xi, i) => xi - y[i]);
};

export const vectorInnerProduct = (x: number[], y: number[]) => {
  if (x.length !== y.length) return null;
  let result = 0;
  x.forEach((xi, i) => {
    result += xi * y[i];
  });
  return result;
};

export const matrixTranspose = (x: number[][]) => {
  const result = [];
  for (let j = 0; j < x[0].length; j += 1) {
    result.push(x.map((xi) => xi[j]));
  }
  return result;
};

export const matrixMultiply = (x: number[][], y: number[][]) => {
  if (x[0]?.length !== y.length) return null;
  const result: number[][] = [];
  const yT = matrixTranspose(y);
  x.forEach((xi) => result.push(yT.map((yj) => vectorInnerProduct(xi, yj))));
  return result;
};

export const multiMatrixMultiply = (matrixSet: number[][][]) => {
  let result = matrixSet[0];
  for (let i = 1; i < matrixSet.length; i += 1) {
    result = matrixMultiply(result, matrixSet[i]);
  }
  return result;
};

/**
 * Constructs a diagonal matrix where the values of the main diagonal are the values of the given vector
 */
export const constructDiagonalMatrix = (diagonalVector: number[]) => {
  return diagonalVector.map((diagonalValue, i) => {
    // ith row
    const row = Array(diagonalVector.length).fill(0);
    row[i] = diagonalValue;
    return row;
  });
};

/**
 * Calculate the inverse matrix for second order matrix
 * */
export const inverseSecondOrderMatrix = (matrix: number[][]) => {
  const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  return [
    [matrix[1][1] / determinant, -matrix[0][1] / determinant],
    [-matrix[1][0] / determinant, matrix[0][0] / determinant],
  ];
};
