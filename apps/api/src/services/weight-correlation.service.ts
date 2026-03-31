// import { WeightEntriesService } from '../../weight-entries.service';
// import type { DryFoodEntry, WetFoodEntry, FeedingStatus } from '../../../db/schema/food';
// import type { WeightUnit } from '../../../db/schema/weight-entries';
// import { dbLogger } from '../../../lib/logger';

// /**
//  * Weight Correlation Result Type
//  * 
//  * Represents the correlation between food consumption and weight changes
//  * during a specific feeding period.
//  */
// export type WeightCorrelationResult = {
//   hasWeightData: boolean;
//   baselineWeight?: number;
//   baselineDate?: string;
//   endWeight?: number;
//   endDate?: string;
//   weightChange?: number;
//   weightChangePercentage?: number;
//   weightUnit: WeightUnit;
//   correlation?: 'positive' | 'negative' | 'neutral' | 'insufficient-data';
//   insight?: string;
// };

// /**
//  * Correlation Type for Internal Calculation
//  */
// type CorrelationType = 'positive' | 'negative' | 'neutral' | 'insufficient-data';

// /**
//  * Weight Correlation Service
//  * 
//  * Analyzes the relationship between food consumption patterns and weight changes.
//  * This service:
//  * 1. Queries weight entries for the feeding period
//  * 2. Calculates weight changes
//  * 3. Correlates feeding variance with weight trends
//  * 4. Generates human-readable insights
//  * 
//  * Design Principles:
//  * - Non-blocking: Always returns a result, even if weight data is missing
//  * - Graceful degradation: Handles partial data (only start or end weight)
//  * - Unit normalization: All calculations in kg, display in user's preferred unit
//  * - Type-safe: No 'any' types, fully typed throughout
//  */
// export class WeightCorrelationService {
//   /**
//    * Main correlation method - called from FoodService.markFoodAsFinished()
//    * 
//    * @param petId - Pet identifier
//    * @param userId - User identifier (for authorization)
//    * @param foodEntry - Finished food entry with feeding status
//    * @returns Weight correlation result with insights
//    */
//   static async correlateWithFeeding(
//     petId: string,
//     userId: string,
//     foodEntry: DryFoodEntry | WetFoodEntry
//   ): Promise<WeightCorrelationResult> {
//     try {
//       // Validate that food entry is finished
//       if (!foodEntry.dateFinished || foodEntry.isActive) {
//         throw new Error('Cannot correlate with active food entry - must be finished');
//       }

//       // Get weight entries for the pet
//       const { weightEntries, weightUnit } = await WeightEntriesService.getWeightEntries(
//         petId,
//         userId
//       );

//       // No weight data - return early with helpful message
//       if (weightEntries.length === 0) {
//         return {
//           hasWeightData: false,
//           weightUnit: weightUnit || 'kg',
//           insight: 'Start tracking weight to see correlations with feeding patterns',
//         };
//       }

//       // Find baseline weight (closest to or before dateStarted)
//       const baselineWeight = this.findClosestWeight(
//         weightEntries,
//         foodEntry.dateStarted,
//         'before'
//       );

//       // Find end weight (closest to or after dateFinished)
//       const endWeight = this.findClosestWeight(
//         weightEntries,
//         foodEntry.dateFinished,
//         'after'
//       );

//       // Handle partial data cases
//       if (!baselineWeight && !endWeight) {
//         return {
//           hasWeightData: false,
//           weightUnit,
//           insight: 'No weight data found for this feeding period',
//         };
//       }

//       if (!baselineWeight) {
//         return {
//           hasWeightData: true,
//           endWeight: parseFloat(endWeight!.weight),
//           endDate: endWeight!.date,
//           weightUnit,
//           correlation: 'insufficient-data',
//           insight: 'Record a baseline weight at the start of feeding periods for full insights',
//         };
//       }

//       if (!endWeight) {
//         return {
//           hasWeightData: true,
//           baselineWeight: parseFloat(baselineWeight.weight),
//           baselineDate: baselineWeight.date,
//           weightUnit,
//           correlation: 'insufficient-data',
//           insight: 'Record a final weight to see the impact of this feeding period',
//         };
//       }

//       // We have both weights - calculate correlation
//       return this.calculateFullCorrelation(
//         baselineWeight.weight,
//         baselineWeight.date,
//         endWeight.weight,
//         endWeight.date,
//         weightUnit,
//         foodEntry.feedingStatus!,
//         foodEntry.variancePercentage!
//       );
//     } catch (error) {
//       dbLogger.error({ err: error }, 'Error calculating weight correlation');
      
//       // Return graceful fallback - don't throw
//       return {
//         hasWeightData: false,
//         weightUnit: 'kg',
//         insight: 'Unable to calculate weight correlation at this time',
//       };
//     }
//   }

//   /**
//    * Find the weight entry closest to a target date
//    * 
//    * @param entries - Array of weight entries (sorted by date)
//    * @param targetDate - Target date string (YYYY-MM-DD)
//    * @param direction - Whether to find entry 'before' or 'after' target date
//    * @returns Closest weight entry or null
//    */
//   private static findClosestWeight(
//     entries: Array<{ date: string; weight: string; weightUnit: WeightUnit }>,
//     targetDate: string,
//     direction: 'before' | 'after'
//   ): { date: string; weight: string; weightUnit: WeightUnit } | null {
//     const target = new Date(targetDate);
    
//     if (direction === 'before') {
//       // Find the most recent entry on or before target date
//       const candidates = entries.filter(e => new Date(e.date) <= target);
//       if (candidates.length === 0) return null;
      
//       // Sort by date descending (most recent first)
//       return candidates.sort((a, b) => 
//         new Date(b.date).getTime() - new Date(a.date).getTime()
//       )[0];
//     } else {
//       // Find the earliest entry on or after target date
//       const candidates = entries.filter(e => new Date(e.date) >= target);
//       if (candidates.length === 0) return null;
      
//       // Sort by date ascending (earliest first)
//       return candidates.sort((a, b) => 
//         new Date(a.date).getTime() - new Date(b.date).getTime()
//       )[0];
//     }
//   }

//   /**
//    * Calculate full correlation with both baseline and end weights
//    * 
//    * @param baselineWeight - Starting weight (as string from DB)
//    * @param baselineDate - Starting date
//    * @param endWeight - Ending weight (as string from DB)
//    * @param endDate - Ending date
//    * @param weightUnit - Unit of weight (kg or lbs)
//    * @param feedingStatus - Feeding status from food calculations
//    * @param variancePercentage - Variance percentage from food calculations
//    * @returns Full correlation result with insights
//    */
//   private static calculateFullCorrelation(
//     baselineWeight: string,
//     baselineDate: string,
//     endWeight: string,
//     endDate: string,
//     weightUnit: WeightUnit,
//     feedingStatus: FeedingStatus,
//     variancePercentage: number
//   ): WeightCorrelationResult {
//     // Convert string weights to numbers and normalize to kg
//     const baselineKg = this.normalizeWeightToKg(parseFloat(baselineWeight), weightUnit);
//     const endKg = this.normalizeWeightToKg(parseFloat(endWeight), weightUnit);

//     // Calculate weight change in kg
//     const weightChangeKg = endKg - baselineKg;
//     const weightChangePercentage = (weightChangeKg / baselineKg) * 100;

//     // Convert back to user's preferred unit for display
//     const displayWeightChange = weightUnit === 'kg' 
//       ? weightChangeKg 
//       : this.kgToLbs(weightChangeKg);

//     // Determine correlation type
//     const correlation = this.determineCorrelation(
//       feedingStatus,
//       variancePercentage,
//       weightChangePercentage
//     );

//     // Generate insight message
//     const insight = this.generateInsight(
//       feedingStatus,
//       variancePercentage,
//       weightChangeKg,
//       weightChangePercentage,
//       correlation,
//       weightUnit
//     );

//     return {
//       hasWeightData: true,
//       baselineWeight: parseFloat(baselineWeight),
//       baselineDate,
//       endWeight: parseFloat(endWeight),
//       endDate,
//       weightChange: this.roundToDecimal(displayWeightChange, 2),
//       weightChangePercentage: this.roundToDecimal(weightChangePercentage, 2),
//       weightUnit,
//       correlation,
//       insight,
//     };
//   }

//   /**
//    * Normalize weight to kg for consistent calculations
//    * 
//    * @param weight - Weight value
//    * @param unit - Current unit
//    * @returns Weight in kg
//    */
//   private static normalizeWeightToKg(weight: number, unit: WeightUnit): number {
//     if (unit === 'lbs') {
//       return weight / 2.20462; // 1 lb = 0.453592 kg
//     }
//     return weight;
//   }

//   /**
//    * Convert kg to lbs
//    * 
//    * @param kg - Weight in kg
//    * @returns Weight in lbs
//    */
//   private static kgToLbs(kg: number): number {
//     return kg * 2.20462;
//   }

//   /**
//    * Determine correlation type based on feeding status and weight change
//    * 
//    * Logic:
//    * - Positive: Feeding behavior matches weight trend (e.g., overfeeding + weight gain)
//    * - Negative: Feeding behavior conflicts with weight trend (e.g., overfeeding + weight loss)
//    * - Neutral: Minimal weight change regardless of feeding (<0.5% weight change)
//    * 
//    * @param feedingStatus - Feeding status
//    * @param variancePercentage - Feeding variance percentage
//    * @param weightChangePercentage - Weight change percentage
//    * @returns Correlation type
//    */
//   private static determineCorrelation(
//     feedingStatus: FeedingStatus,
//     variancePercentage: number,
//     weightChangePercentage: number
//   ): CorrelationType {
//     // Neutral zone: minimal weight change (<0.5%)
//     const isMinimalWeightChange = Math.abs(weightChangePercentage) < 0.5;
    
//     if (isMinimalWeightChange) {
//       return 'neutral';
//     }

//     // Determine if feeding and weight trends align
//     const isOverfeeding = feedingStatus === 'overfeeding' || feedingStatus === 'slightly-over';
//     const isUnderfeeding = feedingStatus === 'underfeeding' || feedingStatus === 'slightly-under';
//     const isWeightGain = weightChangePercentage > 0;
//     const isWeightLoss = weightChangePercentage < 0;

//     // Positive correlation: behavior matches trend
//     if ((isOverfeeding && isWeightGain) || (isUnderfeeding && isWeightLoss)) {
//       return 'positive';
//     }

//     // Negative correlation: behavior conflicts with trend
//     if ((isOverfeeding && isWeightLoss) || (isUnderfeeding && isWeightGain)) {
//       return 'negative';
//     }

//     // Normal feeding with any weight change
//     return 'neutral';
//   }

//   /**
//    * Generate human-readable insight message
//    * 
//    * @param feedingStatus - Feeding status
//    * @param variancePercentage - Feeding variance percentage
//    * @param weightChangeKg - Weight change in kg
//    * @param weightChangePercentage - Weight change percentage
//    * @param correlation - Correlation type
//    * @param displayUnit - Unit to display to user
//    * @returns Insight message
//    */
//   private static generateInsight(
//     feedingStatus: FeedingStatus,
//     variancePercentage: number,
//     weightChangeKg: number,
//     weightChangePercentage: number,
//     correlation: CorrelationType,
//     displayUnit: WeightUnit
//   ): string {
//     // Format weight change for display
//     const weightChangeDisplay = displayUnit === 'kg' 
//       ? weightChangeKg 
//       : this.kgToLbs(weightChangeKg);
    
//     const weightChangeStr = `${weightChangeDisplay >= 0 ? '+' : ''}${this.roundToDecimal(weightChangeDisplay, 2)}${displayUnit}`;
//     const percentStr = `${weightChangePercentage >= 0 ? '+' : ''}${this.roundToDecimal(weightChangePercentage, 1)}%`;

//     // Base weight change description
//     const weightTrend = weightChangeKg > 0 ? 'gained' : 'lost';
//     const weightDesc = `Pet ${weightTrend} ${Math.abs(this.roundToDecimal(weightChangeDisplay, 2))}${displayUnit} (${percentStr})`;

//     // Feeding status description
//     const feedingDesc = this.getFeedingDescription(feedingStatus, variancePercentage);

//     // Combine based on correlation type
//     if (correlation === 'positive') {
//       return `${weightDesc} during ${feedingDesc}. This aligns with feeding patterns.`;
//     } else if (correlation === 'negative') {
//       return `${weightDesc} during ${feedingDesc}. This is unexpected - consider consulting your vet.`;
//     } else if (correlation === 'neutral') {
//       return `${weightDesc} during ${feedingDesc}. Weight remained relatively stable.`;
//     }

//     return `${weightDesc} during ${feedingDesc}.`;
//   }

//   /**
//    * Get human-readable feeding description
//    * 
//    * @param feedingStatus - Feeding status
//    * @param variancePercentage - Variance percentage
//    * @returns Human-readable description
//    */
//   private static getFeedingDescription(
//     feedingStatus: FeedingStatus,
//     variancePercentage: number
//   ): string {
//     const variance = Math.abs(variancePercentage).toFixed(1);
    
//     switch (feedingStatus) {
//       case 'overfeeding':
//         return `overfeeding (+${variance}%)`;
//       case 'slightly-over':
//         return `slight overfeeding (+${variance}%)`;
//       case 'underfeeding':
//         return `underfeeding (-${variance}%)`;
//       case 'slightly-under':
//         return `slight underfeeding (-${variance}%)`;
//       case 'normal':
//         return 'normal feeding';
//       default:
//         return 'this feeding period';
//     }
//   }

//   /**
//    * Round number to specified decimal places
//    * 
//    * @param value - Number to round
//    * @param decimals - Number of decimal places
//    * @returns Rounded number
//    */
//   private static roundToDecimal(value: number, decimals: number): number {
//     const multiplier = Math.pow(10, decimals);
//     return Math.round(value * multiplier) / multiplier;
//   }
// }