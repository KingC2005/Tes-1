/**
 * Application Data Types & Entity Models
 * Designed in accordance with Room Database entity specifications
 */

export type MemberType = 'primary' | 'secondary';

export interface Member {
  id: string;
  name: string;
  nickname?: string;
  type: MemberType; // 'primary' (عضو اصلی) or 'secondary' (عضو فرعی)
  isActive: boolean;
  phone?: string;
  joinedDateJalali: string;
  joinedDateIso: string;
  joinedAt?: string;
}

export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'pack' | 'bottle';

export interface Ingredient {
  id: string;
  name: string;
  baseUnit: UnitType; // Stored in base units (e.g. 'g' or 'ml' or 'piece')
  displayUnit: UnitType; // Preferred display unit ('kg', 'l', etc.)
  currentStock: number; // in base unit
  minThresholdStock: number; // in base unit, for low-stock warning
  totalPurchased: number; // cumulative in base unit
  totalConsumed: number; // cumulative in base unit
  averageUnitCost: number; // Toman per base unit (Weighted Average)
  lastPurchasedDateJalali?: string;
  lastPurchasedDateIso?: string;
  notes?: string;
  updatedAt?: string;
}

export interface PurchaseMemberShare {
  memberId: string;
  memberName: string;
  amount: number; // In Toman (exact integer)
}

export type MemberPurchaseShare = PurchaseMemberShare;
export type PurchaseSplitMethod = 'equal' | 'manual';

export interface InventoryPurchase {
  id: string;
  dateJalali: string;
  dateIso: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number; // In base unit
  displayQuantity: number;
  displayUnit: UnitType;
  unitCost: number; // Cost per display unit
  totalCost: number; // In Toman
  buyerMemberId: string;
  buyerMemberName: string;
  splitMethod: PurchaseSplitMethod;
  shares: PurchaseMemberShare[];
  notes?: string;
  createdAt: string;
  unitPrice?: number;
  totalPrice?: number;
  memberShares?: PurchaseMemberShare[];
  unit?: UnitType;
}

export type Purchase = InventoryPurchase;

export type MeasurementMethod = 'per_person' | 'percentage';

export interface MealIngredientItem {
  ingredientId: string;
  ingredientName: string;
  unit: UnitType;
  measurementMethod: MeasurementMethod;
  perPersonAmount?: number; // e.g. 80 grams per person
  percentageAmount?: number; // e.g. 80%
  baseAmount?: number; // e.g. 1000 grams base
  finalQuantity: number; // calculated in base unit
  unitCost: number; // snapshot of unit cost at meal time
  totalCost: number; // finalQuantity * unitCost
}

export interface ExtraPurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unit: UnitType;
  totalCost: number; // in Toman
  buyerMemberId: string;
  buyerMemberName: string;
  mode: 'direct_consumption' | 'add_to_inventory';
  ingredientId?: string; // if adding to inventory
}

export interface MealParticipantSnapshot {
  memberId: string;
  memberName: string;
  memberType: MemberType;
  shareAmount: number; // Toman
  finalShare?: number;
}

export interface Meal {
  id: string;
  dateJalali: string;
  dateIso: string;
  title: string; // e.g. "قیمه", "قورمه‌سبزی"
  notes?: string;
  recipeId?: string;
  participantIds: string[];
  participantSnapshots: MealParticipantSnapshot[];
  ingredients: MealIngredientItem[];
  extraPurchases: ExtraPurchaseItem[];
  totalInventoryCost: number; // Sum of inventory ingredients
  totalExtraCost: number; // Sum of direct extra purchases
  totalCost: number; // totalInventoryCost + totalExtraCost
  costPerParticipant: number; // Toman per person
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'inventory_purchase_share' // سهم پرداختی عضو برای خرید انبار
  | 'meal_share' // هزینه سهم ناهار
  | 'extra_purchase_buyer' // پرداخت خرید اضافه برای وعده توسط عضو
  | 'direct_payment' // پرداخت مستقیم عضو
  | 'settlement_payout' // تسویه حساب (پرداخت به طلبکار)
  | 'settlement_receipt' // تسویه حساب (دریافت از بدهکار)
  | 'debt_transfer_out' // انتقال بدهی به حساب شخص دیگر (کاهش بدهی)
  | 'debt_transfer_in' // پذیرش بدهی انتقال‌یافته از شخص دیگر (افزایش بدهی)
  | 'reversal'; // برگشت تراکنش

export interface LedgerTransaction {
  id: string;
  dateJalali: string;
  dateIso: string;
  type: TransactionType;
  amount: number; // in Toman
  memberId: string;
  memberName: string;
  isCredit: boolean; // true: adds to credit / balance (پرداخت‌ها), false: debits balance (سهم ناهار)
  direction?: 'credit' | 'debit';
  mealId?: string;
  purchaseId?: string;
  extraPurchaseId?: string;
  settlementId?: string;
  notes?: string;
  description?: string;
  sourceType?: 'meal' | 'purchase' | 'settlement' | 'manual';
  sourceId?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  dateJalali: string;
  dateIso: string;
  memberId: string;
  memberName: string;
  type: 'payout_to_creditor' | 'receipt_from_debtor' | 'receipt' | 'payout' | 'transfer_debt';
  amount: number; // in Toman
  description?: string;
  notes?: string;
  targetMemberId?: string; // If transferring debt to another person
  targetMemberName?: string;
  createdAt: string;
}

export interface RecipeIngredientItem {
  ingredientId: string;
  ingredientName: string;
  unit: UnitType;
  defaultMethod: MeasurementMethod;
  defaultPerPerson?: number;
  baseAmount?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredientItem[];
  updatedAt?: string;
}

export interface AppSettings {
  allowNegativeInventory: boolean;
  currency: string; // Default: 'تومان'
  valuationMethod: 'weighted_average' | 'fifo';
  theme: 'light' | 'dark' | 'system';
  defaultPrimarySplit: 'equal' | 'manual';
}

export interface MemberFinancialSummary {
  member: Member;
  totalInventoryPaid: number;
  totalExtraPaid: number;
  totalDirectPaid: number;
  totalCredits: number; // All payments made by member
  totalMealCostDebits: number; // Total meal shares
  totalMealDebits?: number;
  totalSettledPayouts: number; // Money paid back to them
  totalSettledReceipts: number; // Money received from them
  totalSettled?: number;
  netBalance: number; // Positive = Creditor (طلبکار), Negative = Debtor (بدهکار)
  attendedMealsCount: number;
  totalMealsAttended?: number;
}

export interface AppDatabaseState {
  members: Member[];
  ingredients: Ingredient[];
  purchases: InventoryPurchase[];
  meals: Meal[];
  transactions: LedgerTransaction[];
  settlements: Settlement[];
  recipes: Recipe[];
  settings: AppSettings;
}
