'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
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
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  // Transform data for recharts - use short date format for X-axis
  const chartData = data.map(point => ({
    date: point.date, // Full date for tooltip
    shortDate: point.date.split(',')[0], // Short date for X-axis (e.g., "Jan 15")
    weight: point.weight,
  }));

  // Chart configuration
  const chartConfig = {
    weight: {
      label: `${weightUnit}`,
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

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

        {/* Chart */}
        <div className="flex justify-center">
         <div className="w-full max-w-2xl">
          <ChartContainer config={chartConfig}>
           <ResponsiveContainer width="100%" height={300}>
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                left: 20,
                right: 20,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="shortDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={data.length > 6 ? 'preserveStartEnd' : 0}
                tickFormatter={(value) => value}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value, payload) => {
                      // Show full date in tooltip
                      const fullDate = payload?.[0]?.payload?.date;
                      return fullDate || value;
                    }}
                    formatter={(value) => [
                      `${value} ${weightUnit}`,
                    ]}
                  />
                }
              />
              <Line
                dataKey="weight"
                type="natural"
                stroke="var(--color-weight)"
                strokeWidth={3}
                dot={{
                  fill: "var(--color-weight)",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 0,
                }}
              />
            </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          </div>
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
                <p className="font-semibold">{minWeight.toFixed(4)} {weightUnit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max</p>
                <p className="font-semibold">{maxWeight.toFixed(4)} {weightUnit}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}