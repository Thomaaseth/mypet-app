import { TrendingUp, Plus } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceArea } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import type { WeightChartData } from '@/queries/weights';
import type { WeightUnit } from '@/types/pet';
import { Button } from '@/components/ui/button';
import { EmptyStateTitle, 
  EmptyStateDescription, 
  StatLabel, 
  StatValue, 
  MetricLabel, 
  MetricValue, 
  BodyText,
  HelperText,
} from '@/components/ui/typography';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useState } from 'react';

interface WeightChartProps {
  data: WeightChartData[];
  weightUnit: WeightUnit;
  targetWeightMin?: number;
  targetWeightMax?: number;
  onAddEntry?: () => void;
}



export default function WeightChart({ 
  data, 
  weightUnit,
  targetWeightMin,
  targetWeightMax, 
  // className, 
  onAddEntry
 }: WeightChartProps) {

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="rounded-full bg-muted p-3 mb-4">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <EmptyStateTitle className="mb-2">No weight tracked yet</EmptyStateTitle>
        <EmptyStateDescription className="text-center mb-6">
          Add your first weight entry to start tracking your pet&apos;s weight progress.
        </EmptyStateDescription>
        {onAddEntry && (
          <Button size="sm" onClick={onAddEntry}>
            <Plus className="h-4 w-4" />
            Add First Entry
          </Button>
        )}
      </div>
    );
  }

  const isMobile = useIsMobile();
  
  type TimeRange = '3M' | '6M' | '1Y' | 'ALL';
  
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  
  const cutoffDate = (() => {
    if (timeRange === 'ALL') return null;
    const d = new Date();
    const months = timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 12;
    d.setMonth(d.getMonth() - months);
    return d;
  })();
  
  const filteredData = cutoffDate
    ? data.filter(point => point.timestamp >= cutoffDate.getTime())
    : data;

    const weights = filteredData.map(d => d.weight);
    const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

  // Calculate weight trend
  const getWeightTrend = () => {
    if (data.length < 2) return null;
    
    const secondToLastWeight = data[data.length - 2].weight;
    const lastWeight = data[data.length - 1].weight;
    const difference = lastWeight - secondToLastWeight;

    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  };

  const yMin = (() => {
    const minValue = targetWeightMin ? Math.min(minWeight, targetWeightMin) : minWeight;
    const range = maxWeight - minWeight;
    const pad = Math.max(range * 0.15, 0.1);
    return Math.floor((minValue - pad) * 10) / 10;
  })();
  
  const yMax = (() => {
    const maxValue = targetWeightMax ? Math.max(maxWeight, targetWeightMax) : maxWeight;
    const range = maxWeight - minWeight;
    const pad = Math.max(range * 0.15, 0.1);
    return Math.ceil((maxValue + pad) * 10) / 10;
  })();

  const trend = getWeightTrend();

  const latestWeight = data[data.length - 1]; // always latest regardless of filter
  
  const chartData = filteredData.map(point => ({
    date: point.date,           // tooltip
    timestamp: point.timestamp, // X axis
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
        <div className="space-y-4">
          {/* Latest Weight Display */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MetricLabel>Current Weight</MetricLabel>
            <MetricValue>{latestWeight.weight} {weightUnit}</MetricValue>
            <MetricLabel className="text-xs">as of {latestWeight.date}</MetricLabel>
          </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 justify-center">
          {(['3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] sm:h-[300px]">
            <HelperText>No entries in this period</HelperText>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] sm:h-[300px] w-full">
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      top: 10,
                      left: 0,
                      right: 8,
                      bottom: 8,
                    }}
                  >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickCount={3}
                        tickFormatter={(value: number) => {
                          const d = new Date(value);
                          return `${d.toLocaleString('default', { month: 'short' })} '${String(d.getFullYear()).slice(-2)}`;
                        }}
                      />
                      <YAxis
                        width={38}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        domain={[
                          (dataMin: number) => {
                            const minValue = targetWeightMin ? Math.min(dataMin, targetWeightMin) : dataMin;
                            const range = maxWeight - minWeight;
                            const pad = Math.max(range * 0.15, 0.1);
                            return Math.floor((minValue - pad) * 10) / 10; // round to 1dp
                          },
                          (dataMax: number) => {
                            const maxValue = targetWeightMax ? Math.max(dataMax, targetWeightMax) : dataMax;
                            const range = maxWeight - minWeight;
                            const pad = Math.max(range * 0.15, 0.1);
                            return Math.ceil((maxValue + pad) * 10) / 10; // round to 1dp
                          }
                        ]}              
                        tickFormatter={(value) => `${value}`}
                      />
                      
                      <ChartTooltip
                          cursor={false}
                          content={(props) => {
                            if (!props.active || !props.payload?.[0]) return null;
                            
                            const data = props.payload[0].payload;
                            const weight = data.weight;
                            
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-1.5">
                                {/* Date */}
                                <BodyText className="font-medium text-foreground">{data.date}</BodyText>
                                
                                {/* Weight */}
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                                  <span className="text-sm">
                                    <span className="text-muted-foreground">Weight: </span>
                                    <span className="font-semibold font-display">{weight} {weightUnit}</span>
                                  </span>
                                </div>
                                
                                {/* Target Range (if exists) */}
                                {targetWeightMin && targetWeightMax && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                    <div className="w-3 h-2 bg-success/20 border border-success border-dashed rounded-sm" />
                                    <span className="text-xs text-muted-foreground">
                                      Target: <span className="font-display">{targetWeightMin}-{targetWeightMax} {weightUnit}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      {/* Target Range Shaded Zone */}
                      {targetWeightMin && targetWeightMax && (
                        <ReferenceArea
                          y1={targetWeightMin}
                          y2={targetWeightMax}
                          fill="hsl(var(--success))"
                          fillOpacity={0.15}
                          stroke="hsl(var(--success))"
                          strokeOpacity={0.4}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      )}
                      <Line
                        dataKey="weight"
                        type="natural"
                        stroke="var(--color-weight)"
                        strokeWidth={isMobile ? 2 : 3}
                        dot={{
                          fill: "var(--color-weight)",
                          strokeWidth: 0,
                          r: isMobile ? 2 : 4,
                        }}
                        activeDot={{
                          r: isMobile ? 4 : 6,
                          strokeWidth: 0,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}


          {/* Chart Stats */}
          {filteredData.length > 1 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <StatLabel>Entries</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{filteredData.length}</StatValue>
              </div>
              <div>
                <StatLabel>Min</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{minWeight.toFixed(2)} {weightUnit}</StatValue>
              </div>
              <div>
                <StatLabel>Max</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{maxWeight.toFixed(2)} {weightUnit}</StatValue>
              </div>
            </div>
          )}
        </div>
  );
}