import {
  MealIngredientItem,
  ExtraPurchaseItem,
  Member,
  MealParticipantSnapshot
} from '../types';

export interface CalculatedMealResult {
  ingredients: MealIngredientItem[];
  extraPurchases: ExtraPurchaseItem[];
  totalInventoryCost: number;
  totalExtraCost: number;
  totalCost: number;
  costPerParticipant: number;
  participantSnapshots: MealParticipantSnapshot[];
}

export class MealCostCalculator {
  /**
   * Calculates all ingredient quantities and costs based on the participants count and chosen measurement method
   */
  public static calculateMealCost(
    ingredientsInput: Array<{
      ingredientId: string;
      ingredientName: string;
      unit: any;
      measurementMethod: 'per_person' | 'percentage';
      perPersonAmount?: number;
      percentageAmount?: number;
      baseAmount?: number;
      unitCost: number; // Toman per base unit
    }>,
    extraPurchases: ExtraPurchaseItem[],
    participants: Member[]
  ): CalculatedMealResult {
    const participantsCount = participants.length;

    // Process ingredients
    let totalInventoryCost = 0;
    const computedIngredients: MealIngredientItem[] = ingredientsInput.map((item) => {
      let finalQuantity = 0;
      if (item.measurementMethod === 'per_person') {
        const perPerson = Number(item.perPersonAmount) || 0;
        finalQuantity = perPerson * participantsCount;
      } else {
        const base = Number(item.baseAmount) || 0;
        const pct = Number(item.percentageAmount) || 0;
        finalQuantity = Math.round((base * pct) / 100);
      }

      const unitCost = Number(item.unitCost) || 0;
      const totalCost = Math.round(finalQuantity * unitCost);
      totalInventoryCost += totalCost;

      return {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        unit: item.unit,
        measurementMethod: item.measurementMethod,
        perPersonAmount: item.perPersonAmount,
        percentageAmount: item.percentageAmount,
        baseAmount: item.baseAmount,
        finalQuantity,
        unitCost,
        totalCost
      };
    });

    // Process extra purchases (only direct consumption adds directly to the meal cost)
    let totalExtraCost = 0;
    for (const ep of extraPurchases) {
      if (ep.mode === 'direct_consumption') {
        totalExtraCost += Number(ep.totalCost) || 0;
      }
    }

    const totalCost = totalInventoryCost + totalExtraCost;
    const costPerParticipant = participantsCount > 0 ? Math.round(totalCost / participantsCount) : 0;

    // Build immutable participant snapshots
    const participantSnapshots: MealParticipantSnapshot[] = participants.map((p) => ({
      memberId: p.id,
      memberName: p.name,
      memberType: p.type,
      shareAmount: costPerParticipant
    }));

    return {
      ingredients: computedIngredients,
      extraPurchases,
      totalInventoryCost,
      totalExtraCost,
      totalCost,
      costPerParticipant,
      participantSnapshots
    };
  }
}
