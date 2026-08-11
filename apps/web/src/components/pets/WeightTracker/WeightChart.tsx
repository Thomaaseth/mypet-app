import { TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceArea, ReferenceLine } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';
import type { WeightChartData } from '@/queries/weights';
import type { WeightUnit } from '@/lib/validations/pet';
import { 
  StatLabel, 
  StatValue, 
  MetricLabel, 
  MetricValue, 
  BodyText,
  HelperText,
} from '@/components/ui/typography';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ReactNode, useState } from 'react';
import { useDateTimeFormatters } from '@/hooks/useDateTimeFormatters';
import { formatWeight } from '@/lib/validations/pet';
import { EmptyStateCta } from '@/components/ui/empty-state-cta';
import { useTranslation } from 'react-i18next';

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

type ChartPoint = { date: string; timestamp: number; weight: number };

interface ChartScrubState {
  isTooltipActive?: boolean;
  activePayload?: Array<{ payload?: ChartPoint }>;
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

  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { formatDate, formatChartTick } = useDateTimeFormatters();
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

    // Mobile-only: capture the point under the finger while scrubbing.
  const handleChartMove = (state: ChartScrubState) => {
    if (!isMobile) return;
    const point = state?.activePayload?.[0]?.payload ?? null;
    setActivePoint(state?.isTooltipActive ? point : null);
  };

  if (data.length === 0 && !hasAnyEntries) {
    return (
      <div className="mt-6">
      <EmptyStateCta
        icon={TrendingUp}
        title={t('weights.chart.noWeightTitle')}
        description={t('weights.chart.noWeightDescription')}
        buttonLabel={t('weights.chart.addFirstEntry')}
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
  
  const chartData: ChartPoint[] = data.map(point => ({
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

  const scrubPoint = isMobile ? activePoint : null;
  const shownWeight = scrubPoint ? scrubPoint.weight : latestWeight.weight;
  const shownDate = scrubPoint ? formatDate(scrubPoint.date) : latestWeight.date;

  return (
        <div className="space-y-4">
        {/* Latest Weight Display */}
          <div className="text-center p-4 bg-muted/75 rounded-lg">
            <MetricLabel>{scrubPoint ? t('weights.chart.selectedWeight') : t('weights.chart.currentWeight')}</MetricLabel>
            <MetricValue>{formatWeight(shownWeight)} {weightUnit}</MetricValue>
            <MetricLabel className="text-xs">{t('weights.chart.asOf', { date: shownDate })}</MetricLabel>
          </div>

        {filterSlot}

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[150px] sm:h-[160px]">
            <HelperText>{t('weights.chart.noEntriesInPeriod')}</HelperText>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[150px] sm:h-[160px] w-full">
                  <LineChart
                      accessibilityLayer
                      data={chartData}
                      margin={{ top: 5, left: 8, right: 8, bottom: 5 }}
                      onMouseMove={handleChartMove}
                      onClick={handleChartMove}
                      onMouseLeave={() => { if (isMobile) setActivePoint(null); }}
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
                        tickFormatter={formatChartTick}
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
                          content={isMobile ? () => null : (props) => {
                            if (!props.active || !props.payload?.[0]) return null;
                            
                            const data = props.payload[0].payload;
                            const weight = data.weight;
                            
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-1.5">
                                {/* Date */}
                                <BodyText className="font-medium text-foreground">
                                  {formatDate(data.date)}
                                </BodyText>                                
                                {/* Weight */}
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                                  <span className="text-sm">
                                  <span className="text-muted-foreground">{t('weights.chart.weightTooltipLabel')} </span>
                                  <span className="font-semibold font-display">{formatWeight(weight)} {weightUnit}</span>                                  </span>
                                </div>
                                
                                {/* Target Range (if exists) */}
                                {targetWeightMin && targetWeightMax && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                    <div className="w-3 h-2 bg-secondary/20 border border-secondary border-dashed rounded-sm" />
                                    <span className="text-xs text-muted-foreground">
                                    {t('weights.chart.targetLabel')} <span className="font-display">{formatWeight(targetWeightMin)}-{formatWeight(targetWeightMax)} {weightUnit}</span>
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
                      {scrubPoint && (
                        <ReferenceLine
                          x={scrubPoint.timestamp}
                          stroke="var(--muted-foreground)"
                          strokeOpacity={0.5}
                          strokeDasharray="4 4"
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
                <StatLabel>{t('weights.chart.entries')}</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{data.length}</StatValue>
              </div>
              <div>
                <StatLabel>{t('weights.chart.min')}</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{formatWeight(minWeight)} {weightUnit}</StatValue>
              </div>
              <div>
                <StatLabel>{t('weights.chart.max')}</StatLabel>
                <StatValue className='text-sm sm:text-lg'>{formatWeight(maxWeight)} {weightUnit}</StatValue>
              </div>
            </div>
          )}
        </div>
  );
}