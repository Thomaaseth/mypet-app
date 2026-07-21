import { TrendingUp, Plus } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceArea } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import type { WeightChartData } from '@/queries/weights';
import type { WeightUnit } from '@/types/pet';
import { 
  StatLabel, 
  StatValue, 
  MetricLabel, 
  MetricValue, 
  BodyText,
  HelperText,
} from '@/components/ui/typography';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ReactNode } from 'react';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateTimeLocale } from '@/lib/utils/locale';
import { formatDateForDisplay, formatChartTickMonthYear } from '@/lib/utils/date-formatting';
import { formatWeight } from '@/lib/validations/pet';
import { EmptyStateCta } from '@/components/ui/empty-state-cta';

interface WeightChartProps {
  data: WeightChartData[]; // pre-filtered by parent based on selected time range
  hasAnyEntries: boolean;
  weightUnit: WeightUnit;
  targetWeightMin?: number;
  targetWeightMax?: number;
  onAddEntry: () => void;
  latestWeight: { weight: number; date: string }; // always the true latest, not affected by filtering
  filterSlot?: ReactNode;
}

export default function WeightChart({ 
  data, 
  hasAnyEntries,
  weightUnit,
  targetWeightMin,
  targetWeightMax, 
  onAddEntry,
  latestWeight,
  filterSlot,
 }: WeightChartProps) {

  
  const isMobile = useIsMobile();
  const { units, dateTimeLocale } = usePreferencesContext();
  const displayLocale = dateTimeLocale  ?? getFallbackDateTimeLocale();

  if (data.length === 0 && !hasAnyEntries) {
    return (
      <div className="mt-6">
      <EmptyStateCta
        icon={TrendingUp}
        title="No weight tracked yet"
        description="Add your first weight entry to start tracking your pet's weight progress."
        buttonLabel="Add First Entry"
        onAction={onAddEntry}
      />
     </div>
    );
  }
  
  const weights = data.map(d => d.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

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
  
  const chartData = data.map(point => ({
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
          <div className="text-center p-4 bg-muted/75 rounded-lg">
            <MetricLabel>Current Weight</MetricLabel>
            <MetricValue>{formatWeight(latestWeight.weight)} {weightUnit}</MetricValue>
            <MetricLabel className="text-xs">as of {latestWeight.date}</MetricLabel>
          </div>

        {filterSlot}

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[150px] sm:h-[160px]">
            <HelperText>No entries in this period</HelperText>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[150px] sm:h-[160px] w-full">
                  <LineChart
                      accessibilityLayer
                      data={chartData}
                      margin={{
                        top: 5,
                        left: 8,
                        right: 8,
                        bottom: 5,
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
                        tickFormatter={formatChartTickMonthYear}
                    />
                    <YAxis
                        width={36}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        domain={[yMin, yMax]}          
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
                                <BodyText className="font-medium text-foreground">
                                  {formatDateForDisplay(data.date, displayLocale)}
                                </BodyText>                                
                                {/* Weight */}
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                                  <span className="text-sm">
                                    <span className="text-muted-foreground">Weight: </span>
                                    <span className="font-semibold font-display">{formatWeight(weight)} {weightUnit}</span>
                                  </span>
                                </div>
                                
                                {/* Target Range (if exists) */}
                                {targetWeightMin && targetWeightMax && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                    <div className="w-3 h-2 bg-secondary/20 border border-secondary border-dashed rounded-sm" />
                                    <span className="text-xs text-muted-foreground">
                                      Target: <span className="font-display">{formatWeight(targetWeightMin)}-{formatWeight(targetWeightMax)} {weightUnit}</span>
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
                          fill="var(--secondary)"
                          fillOpacity={0.15}
                          stroke="var(--secondary)"
                          strokeOpacity={0.4}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                        />
                      )}
                      <Line
                        dataKey="weight"
                        type="monotone"
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
          {data.length > 1 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <StatLabel>Entries</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{data.length}</StatValue>
              </div>
              <div>
                <StatLabel>Min</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{formatWeight(minWeight)} {weightUnit}</StatValue>
              </div>
              <div>
                <StatLabel>Max</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{formatWeight(maxWeight)} {weightUnit}</StatValue>
              </div>
            </div>
          )}
        </div>
  );
}