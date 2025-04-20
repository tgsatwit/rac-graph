'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Dashboard refresh rate in milliseconds
const REFRESH_RATE = 5000;

// SystemMetrics interface definition (moved from shared package)
interface SystemMetrics {
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

export default function HealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Collect metrics on component mount and at regular intervals
  useEffect(() => {
    if (refreshing) {
      // Initial fetch
      fetchMetrics();
      
      // Start regular collection
      const intervalId = setInterval(fetchMetrics, REFRESH_RATE);
      
      // Cleanup on component unmount
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [refreshing]);

  // Fetch the latest metrics and history from the API
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/metrics');
      
      if (!response.ok) {
        throw new Error(`Error fetching metrics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setMetrics(data.metrics);
      setHistory(data.history);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      setError(error.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get system status based on metrics
  const getSystemStatus = (): { status: 'healthy' | 'warning' | 'critical', message: string } => {
    if (!metrics) return { status: 'warning', message: 'No metrics available' };
    
    const memoryUsedPercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    const systemMemoryUsedPercent = ((metrics.systemInfo.totalMemory - metrics.systemInfo.freeMemory) / metrics.systemInfo.totalMemory) * 100;
    
    if (memoryUsedPercent > 90 || systemMemoryUsedPercent > 95) {
      return { status: 'critical', message: 'High memory usage' };
    }
    
    if (memoryUsedPercent > 70 || systemMemoryUsedPercent > 80) {
      return { status: 'warning', message: 'Elevated memory usage' };
    }
    
    return { status: 'healthy', message: 'All systems operational' };
  };
  
  const systemStatus = getSystemStatus();
  
  // Error display
  if (error && !metrics) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Error Loading Dashboard</h1>
          <p className="text-red-700">{error}</p>
          <Button className="mt-4" onClick={fetchMetrics}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system performance and health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            className={`px-3 py-1 text-sm ${
              systemStatus.status === 'healthy' ? 'bg-green-500 hover:bg-green-600' : 
              systemStatus.status === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 
              'bg-red-500 hover:bg-red-600'
            }`}
          >
            {systemStatus.status.toUpperCase()}: {systemStatus.message}
          </Badge>
          <Button 
            variant={refreshing ? "default" : "outline"} 
            onClick={() => setRefreshing(!refreshing)}
          >
            {refreshing ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory Usage</TabsTrigger>
          <TabsTrigger value="cpu">CPU Usage</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>System Uptime</CardTitle>
                <CardDescription>Duration since last restart</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics ? formatUptime(metrics.systemInfo.uptime) : 'Loading...'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Node.js heap memory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics 
                    ? `${formatBytes(metrics.memoryUsage.heapUsed)} / ${formatBytes(metrics.memoryUsage.heapTotal)}` 
                    : 'Loading...'}
                </div>
                {metrics && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className={`h-2.5 rounded-full ${getMemoryUsageColor(metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal)}`} 
                      style={{ width: `${(metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100}%` }}>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>System Memory</CardTitle>
                <CardDescription>Total system memory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics 
                    ? `${formatBytes(metrics.systemInfo.totalMemory - metrics.systemInfo.freeMemory)} / ${formatBytes(metrics.systemInfo.totalMemory)}` 
                    : 'Loading...'}
                </div>
                {metrics && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className={`h-2.5 rounded-full ${getMemoryUsageColor((metrics.systemInfo.totalMemory - metrics.systemInfo.freeMemory) / metrics.systemInfo.totalMemory)}`} 
                      style={{ width: `${((metrics.systemInfo.totalMemory - metrics.systemInfo.freeMemory) / metrics.systemInfo.totalMemory) * 100}%` }}>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>CPU Load</CardTitle>
                <CardDescription>System load average</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics 
                    ? `${metrics.systemInfo.loadAvg[0].toFixed(2)} / ${metrics.systemInfo.cpuCount}`
                    : 'Loading...'}
                </div>
                {metrics && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className={`h-2.5 rounded-full ${getCpuUsageColor(metrics.systemInfo.loadAvg[0] / metrics.systemInfo.cpuCount)}`} 
                      style={{ width: `${Math.min((metrics.systemInfo.loadAvg[0] / metrics.systemInfo.cpuCount) * 100, 100)}%` }}>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="memory">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Memory Usage</CardTitle>
                <CardDescription>Node.js memory allocation breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">RSS (Resident Set Size)</h3>
                        <p className="text-lg font-medium">{formatBytes(metrics.memoryUsage.rss)}</p>
                        <p className="text-xs text-muted-foreground">Total memory allocated to Node.js process</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Heap Total</h3>
                        <p className="text-lg font-medium">{formatBytes(metrics.memoryUsage.heapTotal)}</p>
                        <p className="text-xs text-muted-foreground">Total size of the allocated heap</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">Heap Used</h3>
                        <p className="text-lg font-medium">{formatBytes(metrics.memoryUsage.heapUsed)}</p>
                        <p className="text-xs text-muted-foreground">Actual memory used in the heap</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground">External</h3>
                        <p className="text-lg font-medium">{formatBytes(metrics.memoryUsage.external)}</p>
                        <p className="text-xs text-muted-foreground">Memory used by C++ objects bound to JavaScript</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Memory Usage Visualization</h3>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div className="flex h-6 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full flex items-center justify-center"
                            style={{ width: `${(metrics.memoryUsage.heapUsed / metrics.memoryUsage.rss) * 100}%` }}
                          >
                            <span className="text-xs text-white px-2">Heap Used</span>
                          </div>
                          <div 
                            className="bg-blue-300 h-full flex items-center justify-center"
                            style={{ width: `${((metrics.memoryUsage.heapTotal - metrics.memoryUsage.heapUsed) / metrics.memoryUsage.rss) * 100}%` }}
                          >
                            <span className="text-xs text-white px-2">Heap Free</span>
                          </div>
                          <div 
                            className="bg-green-500 h-full flex items-center justify-center"
                            style={{ width: `${(metrics.memoryUsage.external / metrics.memoryUsage.rss) * 100}%` }}
                          >
                            <span className="text-xs text-white px-2">External</span>
                          </div>
                          <div 
                            className="bg-gray-500 h-full flex items-center justify-center"
                            style={{ width: `${Math.max(0, ((metrics.memoryUsage.rss - metrics.memoryUsage.heapTotal - metrics.memoryUsage.external) / metrics.memoryUsage.rss) * 100)}%` }}
                          >
                            <span className="text-xs text-white px-2">Other</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p>Loading memory metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cpu">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
                <CardDescription>Process and system CPU metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Process CPU Usage</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">User CPU Time</span>
                              <span className="text-sm font-medium">{formatCpuTime(metrics.cpuUsage.user)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min((metrics.cpuUsage.user / 1000000) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">System CPU Time</span>
                              <span className="text-sm font-medium">{formatCpuTime(metrics.cpuUsage.system)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min((metrics.cpuUsage.system / 1000000) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">System Load Average</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">1 Minute Average</span>
                              <span className="text-sm font-medium">{metrics.systemInfo.loadAvg[0].toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={getCpuUsageColor(metrics.systemInfo.loadAvg[0] / metrics.systemInfo.cpuCount)} 
                                style={{ width: `${Math.min((metrics.systemInfo.loadAvg[0] / metrics.systemInfo.cpuCount) * 100, 100)}%`, height: '0.625rem' }}>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">5 Minute Average</span>
                              <span className="text-sm font-medium">{metrics.systemInfo.loadAvg[1].toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={getCpuUsageColor(metrics.systemInfo.loadAvg[1] / metrics.systemInfo.cpuCount)} 
                                style={{ width: `${Math.min((metrics.systemInfo.loadAvg[1] / metrics.systemInfo.cpuCount) * 100, 100)}%`, height: '0.625rem' }}>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">15 Minute Average</span>
                              <span className="text-sm font-medium">{metrics.systemInfo.loadAvg[2].toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={getCpuUsageColor(metrics.systemInfo.loadAvg[2] / metrics.systemInfo.cpuCount)} 
                                style={{ width: `${Math.min((metrics.systemInfo.loadAvg[2] / metrics.systemInfo.cpuCount) * 100, 100)}%`, height: '0.625rem' }}>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-2">System Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-xs text-muted-foreground">CPU Cores</h4>
                          <p className="text-lg font-medium">{metrics.systemInfo.cpuCount}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-xs text-muted-foreground">System Uptime</h4>
                          <p className="text-lg font-medium">{formatUptime(metrics.systemInfo.uptime)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p>Loading CPU metrics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Metrics History</CardTitle>
              <CardDescription>Historical performance data (last {MAX_HISTORY_POINTS} data points)</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold mb-4">Memory Usage Over Time</h3>
                    <div className="h-64 relative">
                      <HistoryChart 
                        data={history.slice(-MAX_HISTORY_POINTS)} 
                        dataKey="memoryUsage.heapUsed" 
                        label="Heap Used" 
                        color="#3b82f6"
                        formatter={formatBytes}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-4">CPU Load Average Over Time</h3>
                    <div className="h-64 relative">
                      <HistoryChart 
                        data={history.slice(-MAX_HISTORY_POINTS)} 
                        dataKey="systemInfo.loadAvg.0" 
                        label="1 Min Load Avg" 
                        color="#8b5cf6"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <p>No history data available yet. Wait a few moments for data collection.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions for formatting and visualization

const MAX_HISTORY_POINTS = 20;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function formatCpuTime(microseconds: number): string {
  const milliseconds = microseconds / 1000;
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(2)} ms`;
  } else {
    return `${(milliseconds / 1000).toFixed(2)} s`;
  }
}

function getMemoryUsageColor(ratio: number): string {
  if (ratio > 0.9) return 'bg-red-500';
  if (ratio > 0.7) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getCpuUsageColor(ratio: number): string {
  if (ratio > 0.9) return 'bg-red-500';
  if (ratio > 0.7) return 'bg-yellow-500';
  return 'bg-green-500';
}

interface HistoryChartProps {
  data: SystemMetrics[];
  dataKey: string;
  label: string;
  color: string;
  formatter?: (value: number) => string;
}

function HistoryChart({ data, dataKey, label, color, formatter }: HistoryChartProps) {
  if (data.length === 0) return null;
  
  // Extract the values using the dataKey (supports nested properties)
  const values = data.map(item => {
    const keys = dataKey.split('.');
    let value: any = item;
    for (const key of keys) {
      value = value[key];
    }
    return value as number;
  });
  
  const maxValue = Math.max(...values) * 1.1; // Add 10% margin
  const minValue = 0;
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-end relative">
        {values.map((value, index) => {
          const height = ((value - minValue) / (maxValue - minValue)) * 100;
          const timestamp = new Date(data[index].timestamp).toLocaleTimeString();
          
          return (
            <div 
              key={index}
              className="flex flex-col items-center justify-end h-full flex-1"
              title={`${timestamp}: ${formatter ? formatter(value) : value.toFixed(2)}`}
            >
              <div 
                className="w-full mx-px rounded-t" 
                style={{ 
                  backgroundColor: color,
                  height: `${Math.max(height, 1)}%`, // Ensure bars are at least 1px tall
                  opacity: 0.7 + ((index / values.length) * 0.3) // Make newer bars more opaque
                }}
              />
            </div>
          );
        })}
        
        {/* Y-axis labels */}
        <div className="absolute left-0 inset-y-0 flex flex-col justify-between pointer-events-none">
          <span className="text-xs text-muted-foreground">{formatter ? formatter(maxValue) : maxValue.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{formatter ? formatter(maxValue/2) : (maxValue/2).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{formatter ? formatter(minValue) : minValue.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{new Date(data[0].timestamp).toLocaleTimeString()}</span>
        <span>Time</span>
        <span>{new Date(data[data.length-1].timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
} 