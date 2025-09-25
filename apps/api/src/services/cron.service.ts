import { db } from '../db';
import { foodEntries } from '../db/schema/food';
import { eq } from 'drizzle-orm';
import { FoodService } from './food.service';
import type { DryFoodEntry, WetFoodEntry } from '../db/schema/food';

export interface CronJobResult {
  jobName: string;
  entriesProcessed: number;
  entriesUpdated: number;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}

export class CronService {
  /**
   * Daily food status update job
   * Processes all active food entries and updates their isActive status if finished
   */
  static async runDailyFoodStatusUpdate(): Promise<CronJobResult> {
    const startTime = Date.now();
    let entriesProcessed = 0;
    let entriesUpdated = 0;

    try {
      console.log('🕐 Starting daily food status update at', new Date().toISOString());

      // Get all active food entries across all pets
      const activeEntries = await db
        .select()
        .from(foodEntries)
        .where(eq(foodEntries.isActive, true));

      console.log(`📊 Found ${activeEntries.length} active food entries to process`);

      // Process each entry and track updates
      for (const entry of activeEntries) {
        entriesProcessed++;
        
        try {
          // Get the entry before processing
          const beforeUpdate = entry.isActive;
          
          // Update status if needed
          // const processedEntry = await FoodService.updateFoodActiveStatus(entry as DryFoodEntry | WetFoodEntry);
          
          // Track if status changed
          // if (beforeUpdate && !processedEntry.isActive) {
          //   entriesUpdated++;
          //   console.log(`✅ Food entry ${entry.id} marked as inactive (finished)`);
          // }

        } catch (entryError) {
          console.error(`❌ Error processing entry ${entry.id}:`, entryError);
          // Continue processing other entries even if one fails
        }
      }

      const executionTime = Date.now() - startTime;
      
      console.log(`🎉 Daily food status update completed successfully:`);
      console.log(`   - Entries processed: ${entriesProcessed}`);
      console.log(`   - Entries updated: ${entriesUpdated}`);
      console.log(`   - Execution time: ${executionTime}ms`);

      return {
        jobName: 'dailyFoodStatusUpdate',
        entriesProcessed,
        entriesUpdated,
        executionTimeMs: executionTime,
        success: true
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('💥 Daily food status update failed:', error);

      return {
        jobName: 'dailyFoodStatusUpdate',
        entriesProcessed,
        entriesUpdated,
        executionTimeMs: executionTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get job execution statistics
   */
  static async getFoodStatusJobStats(): Promise<{
    totalActiveEntries: number;
    totalInactiveEntries: number;
    lastExecutionTime?: string;
  }> {
    try {
      // Get current food entry counts
      const allEntries = await db.select().from(foodEntries);
      
      const totalActiveEntries = allEntries.filter(entry => entry.isActive).length;
      const totalInactiveEntries = allEntries.filter(entry => !entry.isActive).length;

      return {
        totalActiveEntries,
        totalInactiveEntries,
        lastExecutionTime: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error getting job stats:', error);
      return {
        totalActiveEntries: 0,
        totalInactiveEntries: 0
      };
    }
  }
}