import _ from 'lodash';

import type { RawDataType, ColumnType } from '@ava/data/types';

export const randomPick = (n: number, m: number) => {
  if (m < 0 || m > n) throw new Error('m must be between 0 and n');

  const result = [];
  const map = new Map();

  _.times(m, (i) => {
    const randIndex = Math.floor(Math.random() * (n - i));
    const swapIndex = randIndex + i;

    const selected = map.has(randIndex) ? map.get(randIndex) : randIndex + 1;
    const swappedValue = map.has(swapIndex) ? map.get(swapIndex) : swapIndex + 1;

    result.push(selected);

    map.set(randIndex, swappedValue);
  });

  return result;
};

// 皮尔逊相关系数
export const pearsonCorrelation = (x: number[], y: number[]) => {
  const n = x.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let valid = 0;

  _.times(n, (i) => {
    const a = x[i];
    const b = y[i];
    if (typeof a !== 'number' || typeof b !== 'number' || Number.isNaN(a) || Number.isNaN(b)) {
      // do nothing
    } else {
      sumX += a;
      sumY += b;
      sumXY += a * b;
      sumX2 += a * a;
      sumY2 += b * b;
      valid++;
    }
  });

  if (valid < 2) return 0;

  const numerator = sumXY - (sumX * sumY) / valid;
  const denominator = Math.sqrt((sumX2 - (sumX * sumX) / valid) * (sumY2 - (sumY * sumY) / valid));

  if (denominator === 0) return 0;

  return numerator / denominator;
};

// 分类变量 vs 数值变量
export const categoricalToNumericCorrelation = (categories: string[], values: number[]) => {
  const n = categories.length;
  const groups: Record<string, number[]> = {};

  let totalSum = 0;
  let totalSumSq = 0;
  let valid = 0;

  _.times(n, (i) => {
    const cat = String(categories[i]);
    const val = values[i];
    if (typeof val !== 'number' || Number.isNaN(val)) {
      // do nothing
    } else {
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(val);

      totalSum += val;
      totalSumSq += val * val;
      valid++;
    }
  });

  if (valid < 2 || Object.keys(groups).length < 2) return 0;

  const overallMean = totalSum / valid;
  const totalVariance = totalSumSq - (totalSum * totalSum) / valid;

  let betweenSum = 0;

  _.each(groups, (value) => {
    const groupSum = value.reduce((a, b) => a + b, 0);
    const mean = groupSum / value.length;
    const diff = mean - overallMean;
    betweenSum += value.length * diff * diff;
  });

  const etaSquared = totalVariance === 0 ? 0 : betweenSum / totalVariance;
  return Math.sqrt(etaSquared);
};

/**
 * fixme: 这里的算法需要重新设计
 * @param cat1
 * @param cat2
 * @returns
 */
export const categoricalAssociationScore = (cat1: string[], cat2: string[]) => {
  const n = cat1.length;
  let matchCount = 0;
  const jointCounts = {};
  const count1 = {};
  const count2 = {};

  _.times(n, (i) => {
    const c1 = String(cat1[i]);
    const c2 = String(cat2[i]);
    const key = `${c1}|${c2}`;
    jointCounts[key] = (jointCounts[key] || 0) + 1;
    count1[c1] = (count1[c1] || 0) + 1;
    count2[c2] = (count2[c2] || 0) + 1;
    if (c1 === c2) matchCount++;
  });

  const pObserved = matchCount / n;

  let pExpected = 0;

  _.each(count1, (_value, key) => {
    const p1 = count1[key] / n;
    const p2 = (count2[key] || 0) / n;
    pExpected += p1 * p2;
  });

  const maxPossible = 1 - pExpected;
  const improvement = pObserved - pExpected;

  if (maxPossible <= 0) return 0;
  const score = Math.max(0, Math.min(1, improvement / maxPossible));
  const entropyJoint = -Object.values(jointCounts).reduce((s: number, cnt: number) => {
    const p = cnt / n;
    return s + p * Math.log(p);
  }, 0);

  // maxEntropy of the joint distribution
  const maxEntropy = -Math.log(1 / n);

  // more entropy means less association
  return (score + (maxEntropy - entropyJoint) / maxEntropy) / 2;
};

export const calculateCorrelation = (
  col1: { type: ColumnType; data: RawDataType[] },
  col2: { type: ColumnType; data: RawDataType[] }
) => {
  const isNumeric1 = ['integer', 'float'].includes(col1.type);
  const isNumeric2 = ['integer', 'float'].includes(col2.type);

  // Step 2: 根据类型选择方法

  if (isNumeric1 && isNumeric2) {
    return Math.abs(pearsonCorrelation(col1.data as number[], col2.data as number[]));
  }

  if (isNumeric1 && !isNumeric2) {
    return categoricalToNumericCorrelation(col2.data as string[], col1.data as number[]);
  }

  if (!isNumeric1 && isNumeric2) {
    return categoricalToNumericCorrelation(col1.data as string[], col2.data as number[]);
  }
  return categoricalAssociationScore(col1.data as string[], col2.data as string[]);
};

/**
 * K-Means 聚类函数（增强版）
 * 返回聚类标签、中心点、迭代次数和各簇的平均中心距离
 *
 * @param {number[][]} data - 二维数组，每行是一个数值向量
 * @param {number} k - 聚类数量
 * @param {number} maxIterations - 最大迭代次数
 * @param {number} tolerance - 收敛阈值（中心移动距离）
 * @returns {{
 *   labels: number[],
 *   centroids: number[][],
 *   iterations: number,
 *   meanIntraDistances: number[]
 * }}
 */
export const kmeans = (data, k = 5, maxIterations = 100, tolerance = 1e-4) => {
  if (!data || data.length === 0) throw new Error('数据不能为空');
  if (k <= 0 || k > data.length) throw new Error('k 必须大于 0 且不超过数据点数量');

  const n = data.length;
  const dim = data[0].length;

  // 初始化中心点（从数据中随机选择 k 个）
  function initializeCentroids() {
    const indices = new Set<number>();
    while (indices.size < k) {
      indices.add(Math.floor(Math.random() * n));
    }
    return Array.from(indices).map((i) => [...data[i]]);
  }

  // 计算欧氏距离
  function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < dim; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }

  // 计算均值向量
  function computeMean(points) {
    const mean = new Array(dim).fill(0);
    points.forEach((point) => {
      for (let i = 0; i < dim; i++) {
        mean[i] += point[i];
      }
    });
    for (let i = 0; i < dim; i++) {
      mean[i] /= points.length;
    }
    return mean;
  }

  // 初始化
  const centroids = initializeCentroids();

  let iteration = 0;
  let moved = Infinity;

  let labels = new Array(n);

  const pushCluster = (_labels, _clusters) => {
    _.times(n, (i) => {
      _clusters[_labels[i]].push(data[i]);
    });
  };

  const updateCenter = (_clusters) => {
    moved = 0;
    _.times(k, (i) => {
      if (_clusters[i].length === 0) return;
      const newCenter = computeMean(_clusters[i]);
      const moveDist = euclideanDistance(centroids[i], newCenter);
      moved += moveDist;
      centroids[i] = newCenter;
    });
  };

  while (iteration < maxIterations && moved > tolerance) {
    labels = data.map((point) => {
      let minDist = Infinity;
      let label = 0;
      _.times(k, (j) => {
        const dist = euclideanDistance(point, centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          label = j;
        }
      });
      return label;
    });

    const clusters = Array.from({ length: k }, () => []);
    pushCluster(labels, clusters);
    updateCenter(clusters);
    iteration++;
  }

  const meanIntraDistances: number[] = Array(k).fill(0);
  const clusterSizes = Array(k).fill(0);
  const variances = Array(k).fill(0);
  const distanceBuffers = Array.from({ length: k }, () => []); // 存储各簇距离

  _.times(n, (i) => {
    const label = labels[i];
    const dist = euclideanDistance(data[i], centroids[label]);
    meanIntraDistances[label] += dist;
    clusterSizes[label]++;
  });

  // 求平均
  _.times(k, (i) => {
    if (clusterSizes[i] > 0) {
      meanIntraDistances[i] /= clusterSizes[i];
    } else {
      meanIntraDistances[i] = 0;
    }
  });

  _.times(n, (i) => {
    const label = labels[i];
    const dist = euclideanDistance(data[i], centroids[label]);
    meanIntraDistances[label] += dist;
    clusterSizes[label]++;
    distanceBuffers[label].push(dist);
  });

  // 计算平均值和方差
  _.times(k, (i) => {
    if (clusterSizes[i] === 0) {
      meanIntraDistances[i] = 0;
      variances[i] = 0;
      return;
    }

    // 平均距离
    meanIntraDistances[i] /= clusterSizes[i];

    // 方差：Var = E[(X - μ)^2]
    const meanDist = meanIntraDistances[i];
    const variance = distanceBuffers[i].reduce((sum, d) => sum + (d - meanDist) ** 2, 0) / clusterSizes[i];

    variances[i] = variance;
  });

  return {
    labels,
    centroids,
    iterations: iteration,
    meanIntraDistances,
    variances,
  };
};

// 计算点到一组点的平均欧氏距离
const meanDistance = (point, points) => {
  const dim = point.length;
  const sum = points.reduce((acc, p) => {
    let d = 0;
    for (let i = 0; i < dim; i++) d += (point[i] - p[i]) ** 2;
    return acc + Math.sqrt(d);
  }, 0);
  return sum / points.length;
};

// 向量均值（用于 k=1 的中心）
const meanVector = (data) => {
  const sum = new Array(data[0].length).fill(0);
  data.forEach((vec) =>
    vec.forEach((v, i) => {
      sum[i] += v;
    })
  );
  return sum.map((s) => s / data.length);
};

// -------------------------------
// 辅助函数：计算轮廓系数
// -------------------------------
const silhouetteScore = (data, labels) => {
  const n = data.length;
  let totalScore = 0;

  _.times(n, (i) => {
    const label = labels[i];
    const point = data[i];

    // 同一类内的平均距离 a(i)
    const sameCluster = data.filter((_, idx) => labels[idx] === label && idx !== i);
    if (sameCluster.length === 0) return;

    const a = meanDistance(point, sameCluster);

    // 最近其他类的平均距离 b(i)
    const otherClusters = {};
    _.times(n, (j) => {
      if (labels[j] !== label) {
        const l = labels[j];
        if (!otherClusters[l]) otherClusters[l] = [];
        otherClusters[l].push(data[j]);
      }
    });

    let minB = Infinity;
    _.each(otherClusters, (cluster) => {
      const b = meanDistance(point, cluster);
      if (b < minB) minB = b;
    });

    if (minB === Infinity) minB = a;

    // 轮廓系数 s(i) = (b - a) / max(a, b)
    const s = (minB - a) / Math.max(a, minB);
    totalScore += s;
  });

  return totalScore / n;
};

/**
 * 自动选择最优 k 并执行 KMeans 聚类
 * @param {number[][]} data - 输入数据（二维数组）
 * @param {number} maxK - 最大尝试的 k（默认 10）
 * @returns {{ labels: number[], centroids: number[][], optimalK: number }}
 */
export const autoKMeans = (data, maxK = 10) => {
  if (data.length < 2) return { labels: [0], centroids: [data[0]], optimalK: 1 };

  // 上限为 min(maxK, data.length - 1)
  const kRange = Math.min(maxK, data.length - 1);
  let bestScore = -Infinity;
  let bestResult: (ReturnType<typeof kmeans> & { optimalK: number }) | null = null;

  // 尝试 k = 2 到 kRange
  for (let k = 2; k <= kRange; k++) {
    const result = kmeans(data, k); // 使用之前实现的 kmeans 函数
    const score = silhouetteScore(data, result.labels);

    if (score > bestScore) {
      bestScore = score;
      bestResult = { ...result, optimalK: k };
    }
  }

  // 特殊情况：如果所有 k 都不如 k=1
  if (!bestResult || data.length === 2) {
    return {
      labels: data.map(() => 0),
      centroids: [meanVector(data)],
      optimalK: 1,
      meanIntraDistances: [0],
    };
  }

  return bestResult;
};

/**
 * 计算一组向量之间的“整体方差”（向量到均值向量的平均平方距离）
 * 自动补齐长度，null/undefined/empty 视为 0
 *
 * @param {Array<Array<number|null|undefined>>} vectors - 向量数组
 * @returns {number} 向量之间的方差（非负实数）
 */
function vectorSetVariance(vectors: number[][]) {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    return 0;
  }

  // 过滤有效向量并克隆
  const validVectors = vectors.filter((vec) => Array.isArray(vec)).map((vec) => [...vec]);

  if (validVectors.length === 0) return 0;

  // 找最大长度，用于补齐
  const maxLength = Math.max(...validVectors.map((v) => v.length));

  // 补齐所有向量到 maxLength，空值补 0
  const padded = validVectors.map((vec) => {
    const result = new Array(maxLength);
    for (let i = 0; i < maxLength; i++) {
      result[i] = vec[i] === null || vec[i] === undefined ? 0 : Number(vec[i]);
    }
    return result;
  });

  const n = padded.length;

  // Step 1: 计算均值向量 μ
  const meanVector = new Array(maxLength).fill(0);
  _.each(padded, (vec) => {
    _.times(maxLength, (i) => {
      meanVector[i] += vec[i];
    });
  });
  for (let i = 0; i < maxLength; i++) {
    meanVector[i] /= n;
  }

  // Step 2: 计算每个向量到均值向量的欧氏距离平方，再求平均
  let totalSquaredDistance = 0;
  _.each(padded, (vec) => {
    let squaredDist = 0;
    _.times(maxLength, (i) => {
      const diff = vec[i] - meanVector[i];
      squaredDist += diff * diff;
    });
    totalSquaredDistance += squaredDist;
  });

  // 返回平均平方距离 → 即“向量之间的方差”
  return totalSquaredDistance / n;
}

function alignVectors(vectors: number[][]) {
  const maxLength = Math.max(...vectors.map((v) => v.length));
  return vectors.map((vec) => {
    const result = new Array(maxLength).fill(0);
    for (let i = 0; i < vec.length; i++) {
      result[i] = vec[i] === null || vec[i] === undefined ? 0 : vec[i];
    }
    return result;
  });
}

/**
 * 归一化向量集合的方差（推荐：基于平均能量的相对归一化）
 */
export const normalizedVectorVariance = (vectors: number[][]) => {
  if (!vectors || vectors.length === 0) return 0;

  const rawVar = vectorSetVariance(vectors);
  const padded = alignVectors(vectors);

  const meanSqNorm =
    padded.reduce((sum, vec) => {
      const norm = vec.reduce((s, x) => s + x * x, 0);
      return sum + norm;
    }, 0) / padded.length;

  return rawVar / (meanSqNorm + 1e-8); // ∈ [0, ∞)，通常 < 2
};
