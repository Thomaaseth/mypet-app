import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { WeightChartData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';
import { Button } from '@/components/ui/button';

interface WeightChartProps {
  data: WeightChartData[];
  weightUnit: WeightUnit;
  targetWeightMin?: number;
  targetWeightMax?: number;
  className?: string;
  onAddEntry?: () => void;
}

export default function WeightChart({ 
  data, 
  weightUnit,
  targetWeightMin,
  targetWeightMax, 
  className, 
  onAddEntry
 }: WeightChartProps) {

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
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="rounded-full bg-muted p-3 mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No weight tracked yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Add your first weight entry to start tracking your pet&apos;s weight progress.
            </p>
            {onAddEntry && (
              <Button onClick={onAddEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate weight trend
  const getWeightTrend = () => {
    if (data.length < 2) return null;
    
    const secondToLastWeight = data[data.length - 2].weight;
    const lastWeight = data[data.length - 1].weight;
    const difference = lastWeight - secondToLastWeight;
    
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  };

  const trend = getWeightTrend();
  const latestWeight = data[data.length - 1];
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  const chartData = data.map(point => ({
    date: point.date, // Full date for tooltip
    shortDate: point.date.split(',')[0], // Short date for X-axis
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
                domain={[
                  (dataMin: number) => {
                    const minValue = targetWeightMin ? Math.min(dataMin, targetWeightMin) : dataMin;
                    return minValue - 0.5;
                  },
                  (dataMax: number) => {
                    const maxValue = targetWeightMax ? Math.max(dataMax, targetWeightMax) : dataMax;
                    return maxValue + 0.5;
                  }
                ]}                
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
               {/* Target Range Shaded Zone */}
               {targetWeightMin && targetWeightMax && (
                <ReferenceArea
                  y1={targetWeightMin}
                  y2={targetWeightMax}
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.15}
                  stroke="hsl(var(--chart-1))"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
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