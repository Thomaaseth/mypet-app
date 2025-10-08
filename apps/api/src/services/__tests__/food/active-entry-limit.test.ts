import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { BadRequestError } from '../../../middleware/errors';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData, makeWetFoodData } from './helpers/factories';

describe('Active Entry Limit - One Active Entry Per Food Type', () => {
  describe('Dry Food - Active Entry Limit', () => {
    it('should allow creating first active dry food entry', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      const result = await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'First Dry Food' })
      );
      
      expect(result.isActive).toBe(true);
      expect(result.brandName).toBe('First Dry Food');
    });

    it('should prevent creating second active dry food entry', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create first active entry
      await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'First Dry Food' })
      );
      
      // Attempt to create second active entry should fail
      await expect(
        FoodService.createDryFoodEntry(
          testPet.id, 
          primary.id, 
          makeDryFoodData({ brandName: 'Second Dry Food' })
        )
      ).rejects.toThrow(BadRequestError);
      
      await expect(
        FoodService.createDryFoodEntry(
          testPet.id, 
          primary.id, 
          makeDryFoodData({ brandName: 'Second Dry Food' })
        )
      ).rejects.toThrow('You already have an active dry food entry');
    });

    it('should allow creating new active dry food entry after finishing previous one', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create first active entry
      const firstEntry = await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'First Dry Food' })
      );
      
      // Mark first entry as finished
      await FoodService.markFoodAsFinished(testPet.id, firstEntry.id, primary.id);
      
      // Should now be able to create second active entry
      const secondEntry = await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'Second Dry Food' })
      );
      
      expect(secondEntry.isActive).toBe(true);
      expect(secondEntry.brandName).toBe('Second Dry Food');
    });

    it('should allow creating new active dry food entry after deleting previous one', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create first active entry
      const firstEntry = await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'First Dry Food' })
      );
      
      // Delete first entry
      await FoodService.deleteFoodEntry(testPet.id, firstEntry.id, primary.id);
      
      // Should now be able to create second active entry
      const secondEntry = await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'Second Dry Food' })
      );
      
      expect(secondEntry.isActive).toBe(true);
      expect(secondEntry.brandName).toBe('Second Dry Food');
    });
  });

  describe('Wet Food - Active Entry Limit', () => {
    it('should allow creating first active wet food entry', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      const result = await FoodService.createWetFoodEntry(
        testPet.id, 
        primary.id, 
        makeWetFoodData({ brandName: 'First Wet Food' })
      );
      
      expect(result.isActive).toBe(true);
      expect(result.brandName).toBe('First Wet Food');
    });

    it('should prevent creating second active wet food entry', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create first active entry
      await FoodService.createWetFoodEntry(
        testPet.id, 
        primary.id, 
        makeWetFoodData({ brandName: 'First Wet Food' })
      );
      
      // Attempt to create second active entry should fail
      await expect(
        FoodService.createWetFoodEntry(
          testPet.id, 
          primary.id, 
          makeWetFoodData({ brandName: 'Second Wet Food' })
        )
      ).rejects.toThrow(BadRequestError);
      
      await expect(
        FoodService.createWetFoodEntry(
          testPet.id, 
          primary.id, 
          makeWetFoodData({ brandName: 'Second Wet Food' })
        )
      ).rejects.toThrow('You already have an active wet food entry');
    });

    it('should allow creating new active wet food entry after finishing previous one', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create first active entry
      const firstEntry = await FoodService.createWetFoodEntry(
        testPet.id, 
        primary.id, 
        makeWetFoodData({ brandName: 'First Wet Food' })
      );
      
      // Mark first entry as finished
      await FoodService.markFoodAsFinished(testPet.id, firstEntry.id, primary.id);
      
      // Should now be able to create second active entry
      const secondEntry = await FoodService.createWetFoodEntry(
        testPet.id, 
        primary.id, 
        makeWetFoodData({ brandName: 'Second Wet Food' })
      );
      
      expect(secondEntry.isActive).toBe(true);
      expect(secondEntry.brandName).toBe('Second Wet Food');
    });
  });

  describe('Independent Dry and Wet Food Limits', () => {
    it('should allow one active dry food AND one active wet food simultaneously', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create active dry food entry
      const dryEntry = await FoodService.createDryFoodEntry(
        testPet.id, 
        primary.id, 
        makeDryFoodData({ brandName: 'Active Dry Food' })
      );
      
      // Create active wet food entry - should succeed
      const wetEntry = await FoodService.createWetFoodEntry(
        testPet.id, 
        primary.id, 
        makeWetFoodData({ brandName: 'Active Wet Food' })
      );
      
      expect(dryEntry.isActive).toBe(true);
      expect(wetEntry.isActive).toBe(true);
      
      // But trying to add another dry food should fail
      await expect(
        FoodService.createDryFoodEntry(
          testPet.id, 
          primary.id, 
          makeDryFoodData({ brandName: 'Second Dry Food' })
        )
      ).rejects.toThrow('You already have an active dry food entry');
      
      // And trying to add another wet food should fail
      await expect(
        FoodService.createWetFoodEntry(
          testPet.id, 
          primary.id, 
          makeWetFoodData({ brandName: 'Second Wet Food' })
        )
      ).rejects.toThrow('You already have an active wet food entry');
    });
  });

  describe('Sequential Entry Management', () => {
    it('should handle creating and finishing multiple entries sequentially', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      const entryIds: string[] = [];
      
      // Create 5 entries sequentially, finishing each before creating the next
      for (let i = 0; i < 5; i++) {
        const entry = await FoodService.createDryFoodEntry(
          testPet.id,
          primary.id,
          makeDryFoodData({ brandName: `Sequential Entry ${i + 1}` })
        );
        entryIds.push(entry.id);
        
        // Finish the first 4 entries, leave the 5th active
        if (i < 4) {
          await FoodService.markFoodAsFinished(testPet.id, entry.id, primary.id);
        }
      }
      
      // Get all entries (active + finished)
      const allEntries = await FoodService.getAllFoodEntries(testPet.id, primary.id);
      
      // Should have 5 total entries
      expect(allEntries.length).toBe(5);
      
      // Filter by active status
      const activeEntries = allEntries.filter(e => e.isActive);
      const finishedEntries = allEntries.filter(e => !e.isActive);
      
      // Should have exactly 1 active entry
      expect(activeEntries.length).toBe(1);
      expect(activeEntries[0].brandName).toBe('Sequential Entry 5');
      expect(activeEntries[0].isActive).toBe(true);
      
      // Should have exactly 4 finished entries
      expect(finishedEntries.length).toBe(4);
      expect(finishedEntries.every(e => !e.isActive)).toBe(true);
      expect(finishedEntries.every(e => e.dateFinished !== null)).toBe(true);
      
      // Verify the finished entries are the first 4
      const finishedBrands = finishedEntries.map(e => e.brandName).sort();
      expect(finishedBrands).toEqual([
        'Sequential Entry 1',
        'Sequential Entry 2',
        'Sequential Entry 3',
        'Sequential Entry 4'
      ]);
    });
  
    it('should handle the same workflow for wet food', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create 3 wet food entries sequentially
      for (let i = 0; i < 3; i++) {
        const entry = await FoodService.createWetFoodEntry(
          testPet.id,
          primary.id,
          makeWetFoodData({ brandName: `Wet Sequential ${i + 1}` })
        );
        
        // Finish the first 2, leave the 3rd active
        if (i < 2) {
          await FoodService.markFoodAsFinished(testPet.id, entry.id, primary.id);
        }
      }
      
      const allEntries = await FoodService.getAllFoodEntries(testPet.id, primary.id);
      const wetEntries = allEntries.filter(e => e.foodType === 'wet');
      
      expect(wetEntries.length).toBe(3);
      
      const activeWet = wetEntries.filter(e => e.isActive);
      const finishedWet = wetEntries.filter(e => !e.isActive);
      
      expect(activeWet.length).toBe(1);
      expect(activeWet[0].brandName).toBe('Wet Sequential 3');
      
      expect(finishedWet.length).toBe(2);
    });
  });
});