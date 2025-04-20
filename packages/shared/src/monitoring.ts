/**
 * Utilities for system monitoring and performance tracking
 */
import { memoryCache } from './cache';
import * as os from 'os';
import * as process from 'process';

// Define performance metrics types
export interface SystemMetrics {
  timestamp: number;
  cpuUsage: {
    user: number;
    system: number;
  };
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers?: number;
  };
  systemInfo: {
    totalMemory: number;
    freeMemory: number;
    cpuCount: number;
    loadAvg: number[];
    uptime: number;
  };
}

export interface OperationMetrics {
  operationId: string;
  operationType: string;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: string;
  details?: Record<string, any>;
}

// Keep a circular buffer of the last 100 system metrics
const MAX_METRICS_HISTORY = 100;
let metricsHistory: SystemMetrics[] = [];

// Store the latest metrics in the cache for quick access
const METRICS_CACHE_KEY = 'system_metrics_latest';
const METRICS_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Collect system metrics
 * @returns The collected system metrics
 */
export function collectSystemMetrics(): SystemMetrics {
  const timestamp = Date.now();
  const cpuUsage = process.cpuUsage();
  const memoryUsage = process.memoryUsage();
  
  const systemInfo = {
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpuCount: os.cpus().length,
    loadAvg: os.loadavg(),
    uptime: os.uptime()
  };
  
  const metrics: SystemMetrics = {
    timestamp,
    cpuUsage,
    memoryUsage,
    systemInfo
  };
  
  // Add to history and drop oldest if over limit
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_METRICS_HISTORY) {
    metricsHistory.shift();
  }
  
  // Cache the latest metrics
  memoryCache.set(METRICS_CACHE_KEY, metrics, { ttl: METRICS_CACHE_TTL });
  
  return metrics;
}

/**
 * Get the latest system metrics
 * @param forceCollect Whether to force a new collection
 * @returns The latest system metrics
 */
export function getLatestMetrics(forceCollect: boolean = false): SystemMetrics {
  if (forceCollect) {
    return collectSystemMetrics();
  }
  
  const cachedMetrics = memoryCache.get<SystemMetrics>(METRICS_CACHE_KEY);
  if (cachedMetrics) {
    return cachedMetrics;
  }
  
  return collectSystemMetrics();
}

/**
 * Get the historical system metrics
 * @returns Array of historical system metrics
 */
export function getMetricsHistory(): SystemMetrics[] {
  return [...metricsHistory];
}

/**
 * Clear metrics history
 */
export function clearMetricsHistory(): void {
  metricsHistory = [];
  memoryCache.delete(METRICS_CACHE_KEY);
}

/**
 * Log an operation's performance metrics
 * @param metrics The operation metrics to log
 */
export function logOperationMetrics(metrics: OperationMetrics): void {
  console.log(`[OPERATION METRICS] ${metrics.operationType} (${metrics.operationId}) - ${metrics.duration}ms - ${metrics.success ? 'SUCCESS' : 'FAILED'}`);
  
  if (!metrics.success && metrics.error) {
    console.error(`[OPERATION ERROR] ${metrics.operationType} (${metrics.operationId}) - ${metrics.error}`);
  }
  
  if (metrics.details) {
    console.log(`[OPERATION DETAILS] ${JSON.stringify(metrics.details)}`);
  }
}

/**
 * Measure and log the performance of a function
 * @param operationType The type of operation being measured
 * @param operationId The ID of the operation
 * @param fn The function to measure
 * @param details Additional details to log
 * @returns The result of the function
 */
export async function measureOperation<T>(
  operationType: string,
  operationId: string,
  fn: () => Promise<T>,
  details?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logOperationMetrics({
      operationId,
      operationType,
      timestamp: startTime,
      duration,
      success: true,
      details
    });
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logOperationMetrics({
      operationId,
      operationType,
      timestamp: startTime,
      duration,
      success: false,
      error: error.message || String(error),
      details
    });
    
    throw error;
  }
}

/**
 * Start collecting system metrics at regular intervals
 * @param intervalMs Interval in milliseconds
 * @returns Function to stop collecting metrics
 */
export function startMetricsCollection(intervalMs: number = 5000): () => void {
  const intervalId = setInterval(() => {
    collectSystemMetrics();
  }, intervalMs);
  
  return () => {
    clearInterval(intervalId);
  };
} 
 