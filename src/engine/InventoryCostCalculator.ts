import { UnitType } from '../types';

export class InventoryCostCalculator {
  /**
   * Convert display quantity to base unit (grams, milliliters, pieces)
   */
  public static toBaseUnitQuantity(quantity: number, fromUnit: UnitType, baseUnit: UnitType): number {
    if (fromUnit === baseUnit) return quantity;
    if (fromUnit === 'kg' && baseUnit === 'g') return Math.round(quantity * 1000);
    if (fromUnit === 'g' && baseUnit === 'kg') return quantity / 1000;
    if (fromUnit === 'l' && baseUnit === 'ml') return Math.round(quantity * 1000);
    if (fromUnit === 'ml' && baseUnit === 'l') return quantity / 1000;
    return quantity;
  }

  /**
   * Calculates new weighted average cost per base unit when purchasing new inventory
   */
  public static calculateNewWeightedAverageCost(
    currentStockInBase: number,
    currentAvgCostPerBase: number,
    newQuantityInBase: number,
    newTotalCost: number
  ): number {
    if (newQuantityInBase <= 0) return currentAvgCostPerBase;
    
    // Existing value of current stock (only if current stock > 0)
    const existingValuation = currentStockInBase > 0 ? currentStockInBase * currentAvgCostPerBase : 0;
    const addedValuation = newTotalCost;
    const combinedStock = (currentStockInBase > 0 ? currentStockInBase : 0) + newQuantityInBase;

    if (combinedStock <= 0) return 0;
    const newAverage = (existingValuation + addedValuation) / combinedStock;
    return Math.round(newAverage * 100) / 100; // Preserve 2 decimals precision for small base units like grams
  }

  public static calculateNewAverageCost(
    currentStockInBase: number,
    currentAvgCostPerBase: number,
    newQuantityInBase: number,
    newTotalCost: number
  ): number {
    return this.calculateNewWeightedAverageCost(
      currentStockInBase,
      currentAvgCostPerBase,
      newQuantityInBase,
      newTotalCost
    );
  }

  /**
   * Calculate current stock valuation in Toman
   */
  public static calculateStockValuation(stockInBase: number, avgCostPerBase: number): number {
    if (stockInBase <= 0 || avgCostPerBase <= 0) return 0;
    return Math.round(stockInBase * avgCostPerBase);
  }
}
