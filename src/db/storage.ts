import {
  Member,
  Ingredient,
  InventoryPurchase,
  Meal,
  LedgerTransaction,
  Settlement,
  Recipe,
  AppSettings,
  AppDatabaseState
} from '../types';
import { getTodayJalali, setActiveAppCurrency } from '../utils/jalali';
import { InventoryTransactionManager } from '../engine/InventoryTransactionManager';
import { OfflineIndexedDB } from './offlineDb';

export const STORAGE_KEYS = {
  MEMBERS: 'lunch_app_members_v1',
  INGREDIENTS: 'lunch_app_ingredients_v1',
  PURCHASES: 'lunch_app_purchases_v1',
  MEALS: 'lunch_app_meals_v1',
  TRANSACTIONS: 'lunch_app_transactions_v1',
  SETTLEMENTS: 'lunch_app_settlements_v1',
  RECIPES: 'lunch_app_recipes_v1',
  SETTINGS: 'lunch_app_settings_v1',
  INITIALIZED: 'lunch_app_initialized_v1'
};

export const DEFAULT_SETTINGS: AppSettings = {
  allowNegativeInventory: false,
  currency: 'تومان',
  valuationMethod: 'weighted_average',
  theme: 'light',
  defaultPrimarySplit: 'equal'
};

export class AppStorage {
  public static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  public static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving key ${key} to localStorage`, e);
    }
  }

  public static initializeIfEmpty(): void {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      this.seedDefaultData();
    }
  }

  public static seedDefaultData(): void {
    const today = getTodayJalali();

    const members: Member[] = [
      {
        id: 'mem-1',
        name: 'علی تقویان',
        nickname: 'علی',
        type: 'primary',
        isActive: true,
        phone: '09121111111',
        joinedDateJalali: '1405/06/01',
        joinedDateIso: '2026-08-23'
      },
      {
        id: 'mem-2',
        name: 'رضا کمالی',
        nickname: 'رضا',
        type: 'primary',
        isActive: true,
        phone: '09122222222',
        joinedDateJalali: '1405/06/01',
        joinedDateIso: '2026-08-23'
      },
      {
        id: 'mem-3',
        name: 'مهدی خسروی',
        nickname: 'مهدی',
        type: 'primary',
        isActive: true,
        phone: '09123333333',
        joinedDateJalali: '1405/06/01',
        joinedDateIso: '2026-08-23'
      },
      {
        id: 'mem-4',
        name: 'امیر صادقی',
        nickname: 'امیر',
        type: 'primary',
        isActive: true,
        phone: '09124444444',
        joinedDateJalali: '1405/06/01',
        joinedDateIso: '2026-08-23'
      },
      {
        id: 'mem-5',
        name: 'سارا احمدی',
        nickname: 'سارا',
        type: 'secondary',
        isActive: true,
        phone: '09125555555',
        joinedDateJalali: '1405/06/15',
        joinedDateIso: '2026-09-06'
      },
      {
        id: 'mem-6',
        name: 'حسین حسینی',
        nickname: 'حسین',
        type: 'secondary',
        isActive: true,
        phone: '09126666666',
        joinedDateJalali: '1405/06/15',
        joinedDateIso: '2026-09-06'
      }
    ];

    const ingredients: Ingredient[] = [
      {
        id: 'ing-1',
        name: 'برنج طارم هاشمی',
        baseUnit: 'g',
        displayUnit: 'kg',
        currentStock: 6400, // 6.4 kg
        minThresholdStock: 3000,
        totalPurchased: 15000,
        totalConsumed: 8600,
        averageUnitCost: 250, // 250 Toman/g = 250,000 Toman/kg
        lastPurchasedDateJalali: '1405/07/01',
        lastPurchasedDateIso: '2026-09-23'
      },
      {
        id: 'ing-2',
        name: 'گوشت گوسفندی خورشتی',
        baseUnit: 'g',
        displayUnit: 'kg',
        currentStock: 1800, // 1.8 kg
        minThresholdStock: 1500,
        totalPurchased: 6000,
        totalConsumed: 4200,
        averageUnitCost: 750, // 750,000 Toman/kg
        lastPurchasedDateJalali: '1405/07/01',
        lastPurchasedDateIso: '2026-09-23'
      },
      {
        id: 'ing-3',
        name: 'لپه آذرشهر',
        baseUnit: 'g',
        displayUnit: 'kg',
        currentStock: 2200, // 2.2 kg
        minThresholdStock: 800,
        totalPurchased: 4000,
        totalConsumed: 1800,
        averageUnitCost: 300, // 300,000 Toman/kg
        lastPurchasedDateJalali: '1405/06/25',
        lastPurchasedDateIso: '2026-09-16'
      },
      {
        id: 'ing-4',
        name: 'روغن سرخ‌کردنی و پخت',
        baseUnit: 'ml',
        displayUnit: 'l',
        currentStock: 2800, // 2.8 L
        minThresholdStock: 1000,
        totalPurchased: 5000,
        totalConsumed: 2200,
        averageUnitCost: 160, // 160,000 Toman/L
        lastPurchasedDateJalali: '1405/06/28',
        lastPurchasedDateIso: '2026-09-19'
      },
      {
        id: 'ing-5',
        name: 'رب گوجه‌فرنگی طبیعت',
        baseUnit: 'g',
        displayUnit: 'kg',
        currentStock: 1600, // 1.6 kg
        minThresholdStock: 600,
        totalPurchased: 3000,
        totalConsumed: 1400,
        averageUnitCost: 140, // 140,000 Toman/kg
        lastPurchasedDateJalali: '1405/06/20',
        lastPurchasedDateIso: '2026-09-11'
      },
      {
        id: 'ing-6',
        name: 'سیب‌زمینی تازه',
        baseUnit: 'g',
        displayUnit: 'kg',
        currentStock: 1200, // 1.2 kg (below minThreshold 2000g -> low stock alert)
        minThresholdStock: 2000,
        totalPurchased: 8000,
        totalConsumed: 6800,
        averageUnitCost: 45, // 45,000 Toman/kg
        lastPurchasedDateJalali: '1405/06/29',
        lastPurchasedDateIso: '2026-09-20'
      }
    ];

    const recipes: Recipe[] = [
      {
        id: 'rec-1',
        name: 'خورشت قیمه سیب‌زمینی',
        description: 'خورشت قیمه با سیب‌زمینی سرخ‌کرده و برنج ایرانی',
        ingredients: [
          {
            ingredientId: 'ing-1',
            ingredientName: 'برنج طارم هاشمی',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 80,
            baseAmount: 1000
          },
          {
            ingredientId: 'ing-2',
            ingredientName: 'گوشت گوسفندی خورشتی',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 60,
            baseAmount: 600
          },
          {
            ingredientId: 'ing-3',
            ingredientName: 'لپه آذرشهر',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 35,
            baseAmount: 350
          },
          {
            ingredientId: 'ing-4',
            ingredientName: 'روغن سرخ‌کردنی و پخت',
            unit: 'ml',
            defaultMethod: 'per_person',
            defaultPerPerson: 20,
            baseAmount: 200
          },
          {
            ingredientId: 'ing-5',
            ingredientName: 'رب گوجه‌فرنگی طبیعت',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 20,
            baseAmount: 150
          },
          {
            ingredientId: 'ing-6',
            ingredientName: 'سیب‌زمینی تازه',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 50,
            baseAmount: 400
          }
        ]
      },
      {
        id: 'rec-2',
        name: 'قورمه‌سبزی مجلسی',
        description: 'قورمه‌سبزی با گوشت تازه و برنج',
        ingredients: [
          {
            ingredientId: 'ing-1',
            ingredientName: 'برنج طارم هاشمی',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 80,
            baseAmount: 1000
          },
          {
            ingredientId: 'ing-2',
            ingredientName: 'گوشت گوسفندی خورشتی',
            unit: 'g',
            defaultMethod: 'per_person',
            defaultPerPerson: 70,
            baseAmount: 700
          },
          {
            ingredientId: 'ing-4',
            ingredientName: 'روغن سرخ‌کردنی و پخت',
            unit: 'ml',
            defaultMethod: 'per_person',
            defaultPerPerson: 25,
            baseAmount: 250
          }
        ]
      }
    ];

    // Seed initial purchases
    const purchases: InventoryPurchase[] = [
      {
        id: 'pur-1',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        ingredientId: 'ing-1',
        ingredientName: 'برنج طارم هاشمی',
        quantity: 10000, // 10 kg in grams
        displayQuantity: 10,
        displayUnit: 'kg',
        unitCost: 250000,
        totalCost: 2500000,
        buyerMemberId: 'mem-1',
        buyerMemberName: 'علی تقویان',
        splitMethod: 'equal',
        shares: [
          { memberId: 'mem-1', memberName: 'علی تقویان', amount: 625000 },
          { memberId: 'mem-2', memberName: 'رضا کمالی', amount: 625000 },
          { memberId: 'mem-3', memberName: 'مهدی خسروی', amount: 625000 },
          { memberId: 'mem-4', memberName: 'امیر صادقی', amount: 625000 }
        ],
        notes: 'خرید کیسه ۱۰ کیلویی برنج برای انبار',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pur-2',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        ingredientId: 'ing-2',
        ingredientName: 'گوشت گوسفندی خورشتی',
        quantity: 4000, // 4 kg in grams
        displayQuantity: 4,
        displayUnit: 'kg',
        unitCost: 750000,
        totalCost: 3000000,
        buyerMemberId: 'mem-2',
        buyerMemberName: 'رضا کمالی',
        splitMethod: 'manual',
        shares: [
          { memberId: 'mem-1', memberName: 'علی تقویان', amount: 1000000 },
          { memberId: 'mem-2', memberName: 'رضا کمالی', amount: 1000000 },
          { memberId: 'mem-3', memberName: 'مهدی خسروی', amount: 500000 },
          { memberId: 'mem-4', memberName: 'امیر صادقی', amount: 500000 }
        ],
        notes: 'خرید ۴ کیلو گوشت خورشتی',
        createdAt: new Date().toISOString()
      }
    ];

    // Seed transactions for initial purchases
    const transactions: LedgerTransaction[] = [
      {
        id: 'tx-pur-1-mem-1',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 625000,
        memberId: 'mem-1',
        memberName: 'علی تقویان',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-1',
        purchaseId: 'pur-1',
        notes: 'سهم خرید برنج طارم هاشمی',
        description: 'سهم خرید برنج طارم هاشمی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-1-mem-2',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 625000,
        memberId: 'mem-2',
        memberName: 'رضا کمالی',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-1',
        purchaseId: 'pur-1',
        notes: 'سهم خرید برنج طارم هاشمی',
        description: 'سهم خرید برنج طارم هاشمی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-1-mem-3',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 625000,
        memberId: 'mem-3',
        memberName: 'مهدی خسروی',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-1',
        purchaseId: 'pur-1',
        notes: 'سهم خرید برنج طارم هاشمی',
        description: 'سهم خرید برنج طارم هاشمی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-1-mem-4',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 625000,
        memberId: 'mem-4',
        memberName: 'امیر صادقی',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-1',
        purchaseId: 'pur-1',
        notes: 'سهم خرید برنج طارم هاشمی',
        description: 'سهم خرید برنج طارم هاشمی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-2-mem-1',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 1000000,
        memberId: 'mem-1',
        memberName: 'علی تقویان',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-2',
        purchaseId: 'pur-2',
        notes: 'سهم خرید گوشت گوسفندی خورشتی',
        description: 'سهم خرید گوشت گوسفندی خورشتی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-2-mem-2',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 1000000,
        memberId: 'mem-2',
        memberName: 'رضا کمالی',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-2',
        purchaseId: 'pur-2',
        notes: 'سهم خرید گوشت گوسفندی خورشتی',
        description: 'سهم خرید گوشت گوسفندی خورشتی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-2-mem-3',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 500000,
        memberId: 'mem-3',
        memberName: 'مهدی خسروی',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-2',
        purchaseId: 'pur-2',
        notes: 'سهم خرید گوشت گوسفندی خورشتی',
        description: 'سهم خرید گوشت گوسفندی خورشتی',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx-pur-2-mem-4',
        dateJalali: '1405/07/01',
        dateIso: '2026-09-23',
        type: 'inventory_purchase_share',
        amount: 500000,
        memberId: 'mem-4',
        memberName: 'امیر صادقی',
        isCredit: true,
        direction: 'credit',
        sourceType: 'purchase',
        sourceId: 'pur-2',
        purchaseId: 'pur-2',
        notes: 'سهم خرید گوشت گوسفندی خورشتی',
        description: 'سهم خرید گوشت گوسفندی خورشتی',
        createdAt: new Date().toISOString()
      }
    ];

    const sampleMealDateJalali = today.formatted;
    const sampleMealDateIso = today.isoString;
    const sampleMealParticipants = ['mem-1', 'mem-2', 'mem-3', 'mem-4', 'mem-5', 'mem-6'];
    const sampleCostPerPerson = 120000;

    const sampleMeal: Meal = {
      id: 'meal-seed-1',
      dateJalali: sampleMealDateJalali,
      dateIso: sampleMealDateIso,
      title: 'خورشت قیمه سیب‌زمینی',
      notes: 'ناهار روز کاری با حضور ۶ نفر از همکاران',
      recipeId: 'rec-1',
      participantIds: sampleMealParticipants,
      participantSnapshots: sampleMealParticipants.map((id) => {
        const m = members.find((x) => x.id === id)!;
        return {
          memberId: m.id,
          memberName: m.name,
          memberType: m.type,
          shareAmount: sampleCostPerPerson,
          finalShare: sampleCostPerPerson
        };
      }),
      ingredients: [
        {
          ingredientId: 'ing-1',
          ingredientName: 'برنج طارم هاشمی',
          unit: 'g',
          measurementMethod: 'per_person',
          perPersonAmount: 80,
          finalQuantity: 480,
          unitCost: 250,
          totalCost: 120000
        },
        {
          ingredientId: 'ing-2',
          ingredientName: 'گوشت گوسفندی خورشتی',
          unit: 'g',
          measurementMethod: 'per_person',
          perPersonAmount: 60,
          finalQuantity: 360,
          unitCost: 750,
          totalCost: 270000
        },
        {
          ingredientId: 'ing-3',
          ingredientName: 'لپه آذرشهر',
          unit: 'g',
          measurementMethod: 'per_person',
          perPersonAmount: 35,
          finalQuantity: 210,
          unitCost: 300,
          totalCost: 63000
        },
        {
          ingredientId: 'ing-4',
          ingredientName: 'روغن سرخ‌کردنی و پخت',
          unit: 'ml',
          measurementMethod: 'per_person',
          perPersonAmount: 20,
          finalQuantity: 120,
          unitCost: 160,
          totalCost: 19200
        },
        {
          ingredientId: 'ing-5',
          ingredientName: 'رب گوجه‌فرنگی طبیعت',
          unit: 'g',
          measurementMethod: 'per_person',
          perPersonAmount: 20,
          finalQuantity: 120,
          unitCost: 140,
          totalCost: 16800
        },
        {
          ingredientId: 'ing-6',
          ingredientName: 'سیب‌زمینی تازه',
          unit: 'g',
          measurementMethod: 'per_person',
          perPersonAmount: 50,
          finalQuantity: 300,
          unitCost: 45,
          totalCost: 13500
        }
      ],
      extraPurchases: [
        {
          id: 'ep-seed-1',
          name: 'سالاد شیرازی و ماست موسیر',
          quantity: 6,
          unit: 'piece',
          totalCost: 217500,
          buyerMemberId: 'mem-2',
          buyerMemberName: 'رضا کمالی',
          mode: 'direct_consumption'
        }
      ],
      totalInventoryCost: 502500,
      totalExtraCost: 217500,
      totalCost: 720000,
      costPerParticipant: sampleCostPerPerson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    for (const p of sampleMeal.participantSnapshots) {
      transactions.push({
        id: `tx-meal-share-meal-seed-1-${p.memberId}`,
        dateJalali: sampleMeal.dateJalali,
        dateIso: sampleMeal.dateIso,
        type: 'meal_share',
        amount: p.shareAmount,
        memberId: p.memberId,
        memberName: p.memberName,
        isCredit: false,
        direction: 'debit',
        sourceType: 'meal',
        sourceId: 'meal-seed-1',
        mealId: 'meal-seed-1',
        notes: 'سهم وعده ناهار (خورشت قیمه سیب‌زمینی)',
        description: 'سهم وعده ناهار (خورشت قیمه سیب‌زمینی)',
        createdAt: new Date().toISOString()
      });
    }

    transactions.push({
      id: 'tx-extra-buyer-meal-seed-1-ep-seed-1',
      dateJalali: sampleMeal.dateJalali,
      dateIso: sampleMeal.dateIso,
      type: 'extra_purchase_buyer',
      amount: 217500,
      memberId: 'mem-2',
      memberName: 'رضا کمالی',
      isCredit: true,
      direction: 'credit',
      sourceType: 'meal',
      sourceId: 'meal-seed-1',
      mealId: 'meal-seed-1',
      extraPurchaseId: 'ep-seed-1',
      notes: 'پرداخت خرید اضافه (سالاد شیرازی و ماست موسیر) برای وعده خورشت قیمه سیب‌زمینی',
      description: 'پرداخت خرید اضافه (سالاد شیرازی و ماست موسیر)',
      createdAt: new Date().toISOString()
    });

    this.setItem(STORAGE_KEYS.MEMBERS, members);
    this.setItem(STORAGE_KEYS.INGREDIENTS, ingredients);
    this.setItem(STORAGE_KEYS.RECIPES, recipes);
    this.setItem(STORAGE_KEYS.PURCHASES, purchases);
    this.setItem(STORAGE_KEYS.MEALS, [sampleMeal]);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.setItem(STORAGE_KEYS.SETTLEMENTS, []);
    this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // --- Aggregate Database Methods ---
  public static load(): AppDatabaseState {
    this.initializeIfEmpty();
    return {
      members: this.getMembers(),
      ingredients: this.getIngredients(),
      purchases: this.getPurchases(),
      meals: this.getMeals(),
      transactions: this.getTransactions(),
      settlements: this.getSettlements(),
      recipes: this.getRecipes(),
      settings: this.getSettings()
    };
  }

  public static saveState(state: AppDatabaseState): void {
    if (state.settings?.currency) {
      setActiveAppCurrency(state.settings.currency);
    }
    this.setItem(STORAGE_KEYS.MEMBERS, state.members);
    this.setItem(STORAGE_KEYS.INGREDIENTS, state.ingredients);
    this.setItem(STORAGE_KEYS.PURCHASES, state.purchases);
    this.setItem(STORAGE_KEYS.MEALS, state.meals);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, state.transactions);
    this.setItem(STORAGE_KEYS.SETTLEMENTS, state.settlements);
    this.setItem(STORAGE_KEYS.RECIPES, state.recipes);
    this.setItem(STORAGE_KEYS.SETTINGS, state.settings);

    // Persist asynchronously to offline IndexedDB on local machine
    OfflineIndexedDB.saveState(state).catch((err) => {
      console.warn('Could not save to IndexedDB:', err);
    });
  }

  public static async loadFromIndexedDB(): Promise<AppDatabaseState | null> {
    try {
      const state = await OfflineIndexedDB.loadState();
      if (state && Array.isArray(state.members) && state.members.length > 0) {
        if (state.settings?.currency) {
          setActiveAppCurrency(state.settings.currency);
        }
        return state;
      }
    } catch (e) {
      console.warn('Error loading from IndexedDB:', e);
    }
    return null;
  }

  public static save(state: AppDatabaseState): void {
    this.saveState(state);
  }

  public static resetToDefault(): AppDatabaseState {
    this.seedDefaultData();
    const data = this.load();
    OfflineIndexedDB.saveState(data).catch(() => {});
    return data;
  }

  // --- Read Methods ---
  public static getMembers(): Member[] {
    this.initializeIfEmpty();
    return this.getItem<Member[]>(STORAGE_KEYS.MEMBERS, []);
  }

  public static getIngredients(): Ingredient[] {
    this.initializeIfEmpty();
    return this.getItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, []);
  }

  public static getPurchases(): InventoryPurchase[] {
    this.initializeIfEmpty();
    return this.getItem<InventoryPurchase[]>(STORAGE_KEYS.PURCHASES, []);
  }

  public static getMeals(): Meal[] {
    this.initializeIfEmpty();
    return this.getItem<Meal[]>(STORAGE_KEYS.MEALS, []);
  }

  public static getTransactions(): LedgerTransaction[] {
    this.initializeIfEmpty();
    return this.getItem<LedgerTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  public static getSettlements(): Settlement[] {
    this.initializeIfEmpty();
    return this.getItem<Settlement[]>(STORAGE_KEYS.SETTLEMENTS, []);
  }

  public static getRecipes(): Recipe[] {
    this.initializeIfEmpty();
    return this.getItem<Recipe[]>(STORAGE_KEYS.RECIPES, []);
  }

  public static getSettings(): AppSettings {
    this.initializeIfEmpty();
    return this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // --- Write Methods ---
  public static saveSettings(settings: AppSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  public static saveMember(member: Member): void {
    const list = this.getMembers();
    const idx = list.findIndex((m) => m.id === member.id);
    if (idx >= 0) {
      list[idx] = member;
    } else {
      list.push(member);
    }
    this.setItem(STORAGE_KEYS.MEMBERS, list);
  }

  public static deleteMember(memberId: string): void {
    const list = this.getMembers();
    this.setItem(
      STORAGE_KEYS.MEMBERS,
      list.filter((m) => m.id !== memberId)
    );
  }

  public static toggleMemberActive(memberId: string): void {
    const list = this.getMembers();
    const idx = list.findIndex((m) => m.id === memberId);
    if (idx >= 0) {
      list[idx].isActive = !list[idx].isActive;
      this.setItem(STORAGE_KEYS.MEMBERS, list);
    }
  }

  public static saveIngredient(ingredient: Ingredient): void {
    const list = this.getIngredients();
    const idx = list.findIndex((i) => i.id === ingredient.id);
    if (idx >= 0) {
      list[idx] = ingredient;
    } else {
      list.push(ingredient);
    }
    this.setItem(STORAGE_KEYS.INGREDIENTS, list);
  }

  public static deleteIngredient(ingredientId: string): boolean {
    const list = this.getIngredients();
    const filtered = list.filter((i) => i.id !== ingredientId);
    this.setItem(STORAGE_KEYS.INGREDIENTS, filtered);
    return true;
  }

  public static saveRecipe(recipe: Recipe): void {
    const list = this.getRecipes();
    const idx = list.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) {
      list[idx] = recipe;
    } else {
      list.push(recipe);
    }
    this.setItem(STORAGE_KEYS.RECIPES, list);
  }

  public static deleteRecipe(recipeId: string): void {
    const list = this.getRecipes();
    this.setItem(
      STORAGE_KEYS.RECIPES,
      list.filter((r) => r.id !== recipeId)
    );
  }

  public static savePurchase(purchase: InventoryPurchase): void {
    const purchases = this.getPurchases();
    let inventory = this.getIngredients();
    let transactions = this.getTransactions();

    const existingIndex = purchases.findIndex((p) => p.id === purchase.id);
    if (existingIndex >= 0) {
      transactions = transactions.filter((t) => t.purchaseId !== purchase.id);
      purchases[existingIndex] = purchase;
    } else {
      purchases.push(purchase);
    }

    inventory = InventoryTransactionManager.applyPurchaseToInventory(
      inventory,
      purchase.ingredientId,
      purchase.quantity,
      purchase.totalCost,
      purchase.dateJalali,
      purchase.dateIso
    );

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
          createdAt: new Date().toISOString()
        });
      }
    }

    this.setItem(STORAGE_KEYS.PURCHASES, purchases);
    this.setItem(STORAGE_KEYS.INGREDIENTS, inventory);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  public static deletePurchase(purchaseId: string): void {
    let purchases = this.getPurchases();
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return;

    let inventory = this.getIngredients();
    inventory = inventory.map((inv) => {
      if (inv.id === purchase.ingredientId) {
        return {
          ...inv,
          currentStock: Math.max(0, inv.currentStock - purchase.quantity),
          totalPurchased: Math.max(0, inv.totalPurchased - purchase.quantity)
        };
      }
      return inv;
    });

    let transactions = this.getTransactions();
    transactions = transactions.filter((t) => t.purchaseId !== purchaseId);
    purchases = purchases.filter((p) => p.id !== purchaseId);

    this.setItem(STORAGE_KEYS.PURCHASES, purchases);
    this.setItem(STORAGE_KEYS.INGREDIENTS, inventory);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  public static saveMeal(meal: Meal): { success: boolean; error?: string } {
    let meals = this.getMeals();
    let inventory = this.getIngredients();
    let transactions = this.getTransactions();

    const existingMeal = meals.find((m) => m.id === meal.id);
    if (existingMeal) {
      inventory = InventoryTransactionManager.reverseMealConsumption(
        inventory,
        existingMeal.ingredients
      );
      transactions = transactions.filter((t) => t.mealId !== meal.id);
    }

    inventory = InventoryTransactionManager.applyMealConsumption(
      inventory,
      meal.ingredients
    );

    for (const ep of meal.extraPurchases) {
      if (ep.mode === 'add_to_inventory' && ep.ingredientId) {
        inventory = inventory.map((inv) => {
          if (inv.id === ep.ingredientId) {
            return {
              ...inv,
              currentStock: inv.currentStock + ep.quantity,
              totalPurchased: inv.totalPurchased + ep.quantity
            };
          }
          return inv;
        });
      }
    }

    const newTx = InventoryTransactionManager.generateMealTransactions(meal);
    transactions.push(...newTx);

    if (existingMeal) {
      const idx = meals.findIndex((m) => m.id === meal.id);
      meals[idx] = meal;
    } else {
      meals.push(meal);
    }

    this.setItem(STORAGE_KEYS.MEALS, meals);
    this.setItem(STORAGE_KEYS.INGREDIENTS, inventory);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

    return { success: true };
  }

  public static deleteMeal(mealId: string): void {
    let meals = this.getMeals();
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    let inventory = this.getIngredients();
    inventory = InventoryTransactionManager.reverseMealConsumption(
      inventory,
      meal.ingredients
    );

    let transactions = this.getTransactions();
    transactions = transactions.filter((t) => t.mealId !== mealId);
    meals = meals.filter((m) => m.id !== mealId);

    this.setItem(STORAGE_KEYS.MEALS, meals);
    this.setItem(STORAGE_KEYS.INGREDIENTS, inventory);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  public static saveSettlement(settlement: Settlement): void {
    const settlements = this.getSettlements();
    settlements.push(settlement);

    const transactions = this.getTransactions();

    if (settlement.type === 'transfer_debt') {
      // 1. Transaction for Person A (debt decreased / credited)
      transactions.push({
        id: `tx-settlement-${settlement.id}-out`,
        dateJalali: settlement.dateJalali,
        dateIso: settlement.dateIso,
        type: 'debt_transfer_out',
        amount: settlement.amount,
        memberId: settlement.memberId,
        memberName: settlement.memberName,
        isCredit: true,
        direction: 'credit',
        sourceType: 'settlement',
        sourceId: settlement.id,
        settlementId: settlement.id,
        notes:
          settlement.notes ||
          settlement.description ||
          `انتقال بدهی به حساب ${settlement.targetMemberName || 'عضو دیگر'}`,
        description:
          settlement.description ||
          settlement.notes ||
          `انتقال بدهی به حساب ${settlement.targetMemberName || 'عضو دیگر'}`,
        createdAt: new Date().toISOString()
      });

      // 2. Transaction for Target Member B (debt added / debited)
      transactions.push({
        id: `tx-settlement-${settlement.id}-in`,
        dateJalali: settlement.dateJalali,
        dateIso: settlement.dateIso,
        type: 'debt_transfer_in',
        amount: settlement.amount,
        memberId: settlement.targetMemberId || '',
        memberName: settlement.targetMemberName || 'عضو مقصد',
        isCredit: false,
        direction: 'debit',
        sourceType: 'settlement',
        sourceId: settlement.id,
        settlementId: settlement.id,
        notes:
          settlement.notes ||
          settlement.description ||
          `پذیرش بدهی انتقال یافته از حساب ${settlement.memberName}`,
        description:
          settlement.description ||
          settlement.notes ||
          `پذیرش بدهی انتقال یافته از حساب ${settlement.memberName}`,
        createdAt: new Date().toISOString()
      });
    } else {
      const isPayout = settlement.type === 'payout_to_creditor' || settlement.type === 'payout';

      transactions.push({
        id: `tx-settlement-${settlement.id}`,
        dateJalali: settlement.dateJalali,
        dateIso: settlement.dateIso,
        type: isPayout ? 'settlement_payout' : 'settlement_receipt',
        amount: settlement.amount,
        memberId: settlement.memberId,
        memberName: settlement.memberName,
        isCredit: !isPayout,
        direction: !isPayout ? 'credit' : 'debit',
        sourceType: 'settlement',
        sourceId: settlement.id,
        settlementId: settlement.id,
        notes:
          settlement.notes ||
          settlement.description ||
          (isPayout
            ? `تسویه حساب: پرداخت وجه به ${settlement.memberName}`
            : `تسویه حساب: دریافت وجه از ${settlement.memberName}`),
        description: settlement.description || settlement.notes,
        createdAt: new Date().toISOString()
      });
    }

    this.setItem(STORAGE_KEYS.SETTLEMENTS, settlements);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  public static deleteSettlement(settlementId: string): void {
    let settlements = this.getSettlements();
    settlements = settlements.filter((s) => s.id !== settlementId);

    let transactions = this.getTransactions();
    transactions = transactions.filter((t) => t.settlementId !== settlementId);

    this.setItem(STORAGE_KEYS.SETTLEMENTS, settlements);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  // --- Backup & Restore ---
  public static exportFullBackup(): string {
    const backup: AppDatabaseState & { version: number; exportedAt: string } = {
      version: 1,
      exportedAt: new Date().toISOString(),
      members: this.getMembers(),
      ingredients: this.getIngredients(),
      purchases: this.getPurchases(),
      meals: this.getMeals(),
      transactions: this.getTransactions(),
      settlements: this.getSettlements(),
      recipes: this.getRecipes(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  }

  public static exportBackupFile(): void {
    const jsonStr = this.exportFullBackup();
    const today = getTodayJalali();
    const filename = `lunch-backup-${today.jy}-${String(today.jm).padStart(2, '0')}-${String(today.jd).padStart(2, '0')}.json`;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  public static importBackupFile(jsonString: string): boolean {
    const res = this.importFullBackup(jsonString, 'replace');
    return res.success;
  }

  public static importFullBackup(
    jsonString: string,
    mode: 'replace' | 'merge'
  ): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.members)) {
        return { success: false, message: 'ساختار فایل پشتیبان نامعتبر است.' };
      }

      if (mode === 'replace') {
        this.setItem(STORAGE_KEYS.MEMBERS, data.members || []);
        this.setItem(STORAGE_KEYS.INGREDIENTS, data.ingredients || []);
        this.setItem(STORAGE_KEYS.PURCHASES, data.purchases || []);
        this.setItem(STORAGE_KEYS.MEALS, data.meals || []);
        this.setItem(STORAGE_KEYS.TRANSACTIONS, data.transactions || []);
        this.setItem(STORAGE_KEYS.SETTLEMENTS, data.settlements || []);
        this.setItem(STORAGE_KEYS.RECIPES, data.recipes || []);
        this.setItem(STORAGE_KEYS.SETTINGS, data.settings || DEFAULT_SETTINGS);
        return { success: true, message: 'تمام اطلاعات با موفقیت جایگزین و بازیابی شدند.' };
      } else {
        const mergeById = <T extends { id: string }>(current: T[], incoming: T[] = []): T[] => {
          const map = new Map<string, T>();
          current.forEach((item) => map.set(item.id, item));
          incoming.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        };

        this.setItem(STORAGE_KEYS.MEMBERS, mergeById(this.getMembers(), data.members));
        this.setItem(STORAGE_KEYS.INGREDIENTS, mergeById(this.getIngredients(), data.ingredients));
        this.setItem(STORAGE_KEYS.PURCHASES, mergeById(this.getPurchases(), data.purchases));
        this.setItem(STORAGE_KEYS.MEALS, mergeById(this.getMeals(), data.meals));
        this.setItem(STORAGE_KEYS.TRANSACTIONS, mergeById(this.getTransactions(), data.transactions));
        this.setItem(STORAGE_KEYS.SETTLEMENTS, mergeById(this.getSettlements(), data.settlements));
        this.setItem(STORAGE_KEYS.RECIPES, mergeById(this.getRecipes(), data.recipes));
        return { success: true, message: 'اطلاعات با موفقیت با داده‌های فعلی ادغام شدند.' };
      }
    } catch {
      return { success: false, message: 'خطا در خواندن فایل JSON.' };
    }
  }

  public static exportTransactionsCsv(): string {
    const txs = this.getTransactions();
    const currency = this.getSettings().currency || 'تومان';
    const isRial = currency === 'ریال';
    const rows = [
      ['شناسه', 'تاریخ شمسی', 'نوع تراکنش', 'نام شخص', `مبلغ (${currency})`, 'نوع مالی', 'توضیحات'].join(',')
    ];
    for (const t of txs) {
      const typeLabel =
        t.type === 'inventory_purchase_share'
          ? 'سهم خرید انبار'
          : t.type === 'meal_share'
          ? 'سهم ناهار'
          : t.type === 'extra_purchase_buyer'
          ? 'خرید اضافه'
          : t.type === 'settlement_payout'
          ? 'پرداخت به طلبکار'
          : t.type === 'settlement_receipt'
          ? 'دریافت از بدهکار'
          : t.type === 'debt_transfer_out'
          ? 'انتقال بدهی به حساب دیگر'
          : t.type === 'debt_transfer_in'
          ? 'پذیرش بدهی از عضو دیگر'
          : t.type;
      const creditLabel = t.isCredit ? 'بستانکار (طلب)' : 'بدهکار';
      const exportAmount = isRial ? t.amount * 10 : t.amount;
      rows.push(
        [
          `"${t.id}"`,
          `"${t.dateJalali}"`,
          `"${typeLabel}"`,
          `"${t.memberName}"`,
          exportAmount,
          `"${creditLabel}"`,
          `"${(t.notes || t.description || '').replace(/"/g, '""')}"`
        ].join(',')
      );
    }
    return '\uFEFF' + rows.join('\n');
  }
}
