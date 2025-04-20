import { NextResponse } from 'next/server';
import { getLatestMetrics, getMetricsHistory, SystemMetrics, startMetricsCollection } from 'shared';

// Start collecting metrics when the server starts
const stopMetricsCollection = startMetricsCollection(10000); // Collect every 10 seconds

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'latest') {
      // Get latest metrics
      const metrics = getLatestMetrics(true);
      return NextResponse.json({ metrics });
    } else if (action === 'history') {
      // Get metrics history
      const history = getMetricsHistory();
      return NextResponse.json({ history });
    } else {
      // Get both latest metrics and history
      const metrics = getLatestMetrics(true);
      const history = getMetricsHistory();
      return NextResponse.json({ metrics, history });
    }
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 