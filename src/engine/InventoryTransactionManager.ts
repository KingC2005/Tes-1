import {
  Ingredient,
  MealIngredientItem,
  ExtraPurchaseItem,
  LedgerTransaction,
  MealParticipantSnapshot,
  Meal
} from '../types';
import { InventoryCostCalculator } from './InventoryCostCalculator';

export interface StockCheckResult {
  hasShortage: boolean;
  shortages: Array<{
    ingredientId: string;
    ingredientName: string;
    requiredQuantity: number;
    currentStock: number;
    shortage: number;
    unit: any;
  }>;
}

export class InventoryTransactionManager {
  /**
   * Check if all ingredients have enough inventory stock
   */
  public static checkStockAvailability(
    ingredients: MealIngredientItem[],
    inventory: Ingredient[],
    allowNegative: boolean = false
  ): StockCheckResult {
    const shortages: StockCheckResult['shortages'] = [];

    for (const item of ingredients) {
      const inv = inventory.find((i) => i.id === item.ingredientId);
      const current = inv ? inv.currentStock : 0;
      if (current < item.finalQuantity) {
        shortages.push({
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          requiredQuantity: item.finalQuantity,
          currentStock: current,
          shortage: item.finalQuantity - current,
          unit: item.unit
        });
      }
    }

    return {
      hasShortage: !allowNegative && shortages.length > 0,
      shortages
    };
  }

  /**
   * Applies a meal's consumption to the inventory list, returning updated inventory
   */
  public static applyMealConsumption(
    currentInventory: Ingredient[],
    mealIngredients: MealIngredientItem[]
  ): Ingredient[] {
    return currentInventory.map((inv) => {
      const consumed = mealIngredients.find((m) => m.ingredientId === inv.id);
      if (!consumed) return inv;

      const newStock = inv.currentStock - consumed.finalQuantity;
      const newTotalConsumed = inv.totalConsumed + consumed.finalQuantity;

      return {
        ...inv,
        currentStock: newStock,
        totalConsumed: newTotalConsumed
      };
    });
  }

  /**
   * Reverses a meal's consumption from the inventory list (used during edit or delete)
   */
  public static reverseMealConsumption(
    currentInventory: Ingredient[],
    mealIngredients: MealIngredientItem[]
  ): Ingredient[] {
    return currentInventory.map((inv) => {
      const consumed = mealIngredients.find((m) => m.ingredientId === inv.id);
      if (!consumed) return inv;

      const restoredStock = inv.currentStock + consumed.finalQuantity;
      const restoredTotalConsumed = Math.max(0, inv.totalConsumed - consumed.finalQuantity);

      return {
        ...inv,
        currentStock: restoredStock,
        totalConsumed: restoredTotalConsumed
      };
    });
  }

  /**
   * Applies an inventory purchase to the ingredient
   */
  public static applyPurchaseToInventory(
    currentInventory: Ingredient[],
    ingredientId: string,
    addedQuantityInBase: number,
    totalCost: number,
    dateJalali: string,
    dateIso: string
  ): Ingredient[] {
    return currentInventory.map((inv) => {
      if (inv.id !== ingredientId) return inv;

      const newAvgCost = InventoryCostCalculator.calculateNewWeightedAverageCost(
        inv.currentStock,
        inv.averageUnitCost,
        addedQuantityInBase,
        totalCost
      );

      return {
        ...inv,
        currentStock: inv.currentStock + addedQuantityInBase,
        totalPurchased: inv.totalPurchased + addedQuantityInBase,
        averageUnitCost: newAvgCost,
        lastPurchasedDateJalali: dateJalali,
        lastPurchasedDateIso: dateIso
      };
    });
  }

  /**
   * Generates the financial ledger transactions for a meal
   */
  public static generateMealTransactions(
    mealOrId: Meal | string,
    dateJalali?: string,
    dateIso?: string,
    mealTitle?: string,
    participantSnapshots?: MealParticipantSnapshot[],
    extraPurchases?: ExtraPurchaseItem[]
  ): LedgerTransaction[] {
    if (typeof mealOrId === 'object') {
      const meal = mealOrId;
      return this.generateMealTransactions(
        meal.id,
        meal.dateJalali,
        meal.dateIso,
        meal.title,
        meal.participantSnapshots,
        meal.extraPurchases
      );
    }

    const mealId = mealOrId;
    const transactions: LedgerTransaction[] = [];
    const timestamp = new Date().toISOString();

    // 1. Participant share debits (سهم ناهار)
    for (const p of (participantSnapshots || [])) {
      if (p.shareAmount > 0) {
        transactions.push({
          id: `tx-meal-share-${mealId}-${p.memberId}`,
          dateJalali: dateJalali || '',
          dateIso: dateIso || '',
          type: 'meal_share',
          amount: p.shareAmount,
          memberId: p.memberId,
          memberName: p.memberName,
          isCredit: false, // Debit
          direction: 'debit',
          sourceType: 'meal',
          sourceId: mealId,
          mealId,
          notes: `سهم وعده ناهار (${mealTitle || ''})`,
          description: `سهم وعده ناهار (${mealTitle || ''})`,
          createdAt: timestamp
        });
      }
    }

    // 2. Extra purchase buyer credits (پرداخت خرید اضافه توسط خریدار)
    for (const ep of (extraPurchases || [])) {
      if (ep.totalCost > 0 && ep.buyerMemberId) {
        transactions.push({
          id: `tx-extra-buyer-${mealId}-${ep.id}`,
          dateJalali: dateJalali || '',
          dateIso: dateIso || '',
          type: 'extra_purchase_buyer',
          amount: ep.totalCost,
          memberId: ep.buyerMemberId,
          memberName: ep.buyerMemberName,
          isCredit: true, // Credit
          direction: 'credit',
          sourceType: 'meal',
          sourceId: mealId,
          mealId,
          extraPurchaseId: ep.id,
          notes: `پرداخت خرید اضافه (${ep.name}) برای وعده ${mealTitle || ''}`,
          description: `پرداخت خرید اضافه (${ep.name}) برای وعده ${mealTitle || ''}`,
          createdAt: timestamp
        });
      }
    }

    return transactions;
  }

  /**
   * Generates purchase transactions for a bulk inventory purchase
   */
  public static generatePurchaseTransactions(purchase: any): LedgerTransaction[] {
    const transactions: LedgerTransaction[] = [];
    const timestamp = new Date().toISOString();
    const shares = purchase.shares || purchase.memberShares || [];

    for (const share of shares) {
      if (share.amount > 0) {
        transactions.push({
          id: `tx-pur-${purchase.id}-${share.memberId}`,
          dateJalali: purchase.dateJalali,
          dateIso: purchase.dateIso,
          type: 'inventory_purchase_share',
          amount: share.amount,
          memberId: share.memberId,
          memberName: share.memberName,
          isCredit: true,
          direction: 'credit',
          sourceType: 'purchase',
          sourceId: purchase.id,
          purchaseId: purchase.id,
          notes: `سهم خرید انبار (${purchase.ingredientName})`,
          description: `سهم خرید انبار (${purchase.ingredientName})`,
          createdAt: timestamp
        });
      }
    }

    return transactions;
  }
}
