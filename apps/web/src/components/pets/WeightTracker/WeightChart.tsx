'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { WeightChartData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

interface WeightChartProps {
  data: WeightChartData[];
  weightUnit: WeightUnit;
  className?: string;
}

export default function WeightChart({ data, weightUnit, className }: WeightChartProps) {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weight Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>No weight data yet. Add your first entry to see the chart!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate weight trend
  const getWeightTrend = () => {
    if (data.length < 2) return null;
    
    const firstWeight = data[0].weight;
    const lastWeight = data[data.length - 1].weight;
    const difference = lastWeight - firstWeight;
    
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  };

  const trend = getWeightTrend();
  const latestWeight = data[data.length - 1];

  // Simple SVG chart implementation
  const chartWidth = 400;
  const chartHeight = 200;
  const padding = 40;
  const innerWidth = chartWidth - (padding * 2);
  const innerHeight = chartHeight - (padding * 2);

  // Calculate chart scales
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1; // Avoid division by zero

  // Create chart points
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
    const y = padding + ((maxWeight - point.weight) / weightRange) * innerHeight;
    return { x, y, ...point };
  });

  // Create SVG path
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weight Progress
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              {trend === 'increasing' && <TrendingUp className="h-4 w-4 text-orange-500" />}
              {trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-blue-500" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-green-500" />}
              <span className="text-muted-foreground capitalize">{trend}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Latest Weight Display */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Current Weight</p>
            <p className="text-2xl font-bold">
              {latestWeight.weight} {weightUnit}
            </p>
            <p className="text-xs text-muted-foreground">
              as of {latestWeight.date}
            </p>
          </div>

          {/* SVG Chart */}
          <div className="flex justify-center">
            <svg width={chartWidth} height={chartHeight} className="border rounded">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Chart area background */}
              <rect 
                x={padding} 
                y={padding} 
                width={innerWidth} 
                height={innerHeight} 
                fill="white" 
                stroke="#e2e8f0" 
                strokeWidth="1"
              />
              
              {/* Weight line */}
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {points.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <title>{`${point.date}: ${point.weight} ${weightUnit}`}</title>
                </g>
              ))}
              
              {/* Y-axis labels */}
              <text x={padding - 10} y={padding} textAnchor="end" className="text-xs fill-gray-600">
                {maxWeight.toFixed(1)}
              </text>
              <text x={padding - 10} y={chartHeight - padding} textAnchor="end" className="text-xs fill-gray-600">
                {minWeight.toFixed(1)}
              </text>
              
              {/* Y-axis title */}
              <text 
                x={15} 
                y={chartHeight / 2} 
                textAnchor="middle" 
                transform={`rotate(-90, 15, ${chartHeight / 2})`}
                className="text-xs fill-gray-600 font-medium"
              >
                Weight ({weightUnit})
              </text>
              
              {/* X-axis title */}
              <text 
                x={chartWidth / 2} 
                y={chartHeight - 10} 
                textAnchor="middle" 
                className="text-xs fill-gray-600 font-medium"
              >
                Date
              </text>
            </svg>
          </div>

          {/* Chart Stats */}
          {data.length > 1 && (
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Entries</p>
                <p className="font-semibold">{data.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Min</p>
                <p className="font-semibold">{minWeight.toFixed(1)} {weightUnit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max</p>
                <p className="font-semibold">{maxWeight.toFixed(1)} {weightUnit}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}