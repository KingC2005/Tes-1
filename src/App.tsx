import React, { useState, useEffect, useMemo } from 'react';
import { AppStorage } from './db/storage';
import {
  AppDatabaseState,
  Meal,
  Purchase,
  Member,
  Ingredient,
  Recipe,
  Settlement,
  AppSettings,
  LedgerTransaction
} from './types';
import { getTodayJalali, setActiveAppCurrency } from './utils/jalali';
import { MemberBalanceCalculator } from './engine/MemberBalanceCalculator';
import { InventoryTransactionManager } from './engine/InventoryTransactionManager';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { MealFormModal } from './components/MealFormModal';
import { InventoryView } from './components/InventoryView';
import { PurchasesView } from './components/PurchasesView';
import { MembersView } from './components/MembersView';
import { AccountsView } from './components/AccountsView';
import { RecipesView } from './components/RecipesView';
import { ReportsView } from './components/ReportsView';
import { SettlementsView } from './components/SettlementsView';
import { BackupView } from './components/BackupView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [dbState, setDbState] = useState<AppDatabaseState>(() => AppStorage.load());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // Modals and contextual navigation states
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [activeMealForEdit, setActiveMealForEdit] = useState<Meal | null>(null);
  const [prefilledMealDate, setPrefilledMealDate] = useState<string | undefined>();
  const [selectedMemberForLedger, setSelectedMemberForLedger] = useState<string | undefined>();
  const [selectedIngredientForPurchase, setSelectedIngredientForPurchase] = useState<string | undefined>();
  const [selectedMemberForSettlement, setSelectedMemberForSettlement] = useState<string | undefined>();

  // Synchronize dark mode class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Synchronize global active currency with settings
  useEffect(() => {
    const activeCurr = dbState.settings?.currency || 'تومان';
    setActiveAppCurrency(activeCurr);
  }, [dbState.settings?.currency]);

  // Offline-First: Hydrate from IndexedDB on startup
  useEffect(() => {
    AppStorage.loadFromIndexedDB().then((offlineState) => {
      if (offlineState) {
        setDbState(offlineState);
        if (offlineState.settings?.currency) {
          setActiveAppCurrency(offlineState.settings.currency);
        }
      }
    });
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Calculated Member Summaries
  const memberSummaries = useMemo(() => {
    return MemberBalanceCalculator.calculateAllSummaries(
      dbState.members,
      dbState.transactions,
      dbState.meals
    );
  }, [dbState.members, dbState.transactions, dbState.meals]);

  const today = useMemo(() => getTodayJalali(), []);

  // Today's Meal
  const todayMeal = useMemo(() => {
    return dbState.meals.find((m) => m.dateJalali === today.formatted);
  }, [dbState.meals, today.formatted]);

  // Low stock ingredients count
  const lowStockCount = useMemo(() => {
    return dbState.ingredients.filter((i) => i.currentStock <= i.minThresholdStock).length;
  }, [dbState.ingredients]);

  // Handlers for Meals
  const handleOpenNewMeal = (prefilledDate?: string) => {
    setActiveMealForEdit(null);
    setPrefilledMealDate(prefilledDate || today.formatted);
    setIsMealModalOpen(true);
  };

  const handleEditMeal = (meal: Meal) => {
    setActiveMealForEdit(meal);
    setPrefilledMealDate(meal.dateJalali);
    setIsMealModalOpen(true);
  };

  const handleSaveMeal = (meal: Meal) => {
    setDbState((prev) => {
      let updatedIngredients = prev.ingredients;
      let updatedTransactions = prev.transactions;

      // If editing existing meal, first revert old consumption and old transactions
      if (activeMealForEdit) {
        updatedIngredients = InventoryTransactionManager.reverseMealConsumption(
          updatedIngredients,
          activeMealForEdit.ingredients
        );
        updatedTransactions = updatedTransactions.filter(
          (t) => !(t.sourceType === 'meal' && t.sourceId === activeMealForEdit.id)
        );
      }

      // Apply new consumption
      updatedIngredients = InventoryTransactionManager.applyMealConsumption(
        updatedIngredients,
        meal.ingredients
      );

      // Generate new meal transactions
      const newTransactions = InventoryTransactionManager.generateMealTransactions(meal);
      updatedTransactions = [...updatedTransactions, ...newTransactions];

      // Update meals list
      const mealIndex = prev.meals.findIndex((m) => m.id === meal.id);
      let updatedMeals: Meal[];
      if (mealIndex >= 0) {
        updatedMeals = [...prev.meals];
        updatedMeals[mealIndex] = meal;
      } else {
        updatedMeals = [meal, ...prev.meals];
      }

      const newState: AppDatabaseState = {
        ...prev,
        meals: updatedMeals,
        ingredients: updatedIngredients,
        transactions: updatedTransactions
      };

      AppStorage.save(newState);
      return newState;
    });
  };

  const handleDeleteMeal = (mealId: string) => {
    setDbState((prev) => {
      const mealToDelete = prev.meals.find((m) => m.id === mealId);
      if (!mealToDelete) return prev;

      // Reverse inventory
      const updatedIngredients = InventoryTransactionManager.reverseMealConsumption(
        prev.ingredients,
        mealToDelete.ingredients
      );

      // Remove meal transactions
      const updatedTransactions = prev.transactions.filter(
        (t) => !(t.sourceType === 'meal' && t.sourceId === mealId)
      );

      const updatedMeals = prev.meals.filter((m) => m.id !== mealId);

      const newState: AppDatabaseState = {
        ...prev,
        meals: updatedMeals,
        ingredients: updatedIngredients,
        transactions: updatedTransactions
      };

      AppStorage.save(newState);
      return newState;
    });
  };

  // Handlers for Purchases
  const handleSavePurchase = (purchase: Purchase, updatedIngredient: Ingredient) => {
    setDbState((prev) => {
      // Generate purchase transactions
      const newTransactions = InventoryTransactionManager.generatePurchaseTransactions(purchase);

      // Update ingredient in state
      const updatedIngredients = prev.ingredients.map((ing) =>
        ing.id === updatedIngredient.id ? updatedIngredient : ing
      );

      const newState: AppDatabaseState = {
        ...prev,
        purchases: [purchase, ...prev.purchases],
        ingredients: updatedIngredients,
        transactions: [...prev.transactions, ...newTransactions]
      };

      AppStorage.save(newState);
      return newState;
    });
  };

  const handleDeletePurchase = (purchaseId: string) => {
    setDbState((prev) => {
      const purch = prev.purchases.find((p) => p.id === purchaseId);
      if (!purch) return prev;

      // Revert stock of ingredient
      const updatedIngredients = prev.ingredients.map((ing) => {
        if (ing.id === purch.ingredientId) {
          return {
            ...ing,
            currentStock: Math.max(0, ing.currentStock - purch.quantity)
          };
        }
        return ing;
      });

      // Remove purchase transactions
      const updatedTransactions = prev.transactions.filter(
        (t) => !(t.sourceType === 'purchase' && t.sourceId === purchaseId)
      );

      const newState: AppDatabaseState = {
        ...prev,
        purchases: prev.purchases.filter((p) => p.id !== purchaseId),
        ingredients: updatedIngredients,
        transactions: updatedTransactions
      };

      AppStorage.save(newState);
      return newState;
    });
  };

  // Handlers for Settlements
  const handleSaveSettlement = (settlement: Settlement) => {
    setDbState((prev) => {
      let newTransactions: LedgerTransaction[] = [];

      if (settlement.type === 'transfer_debt') {
        const txOut: LedgerTransaction = {
          id: `tx-set-${settlement.id}-out`,
          memberId: settlement.memberId,
          memberName: settlement.memberName,
          dateJalali: settlement.dateJalali,
          dateIso: settlement.dateIso,
          type: 'debt_transfer_out',
          direction: 'credit',
          isCredit: true,
          amount: settlement.amount,
          description:
            settlement.notes ||
            settlement.description ||
            `انتقال بدهی به حساب ${settlement.targetMemberName || 'عضو دیگر'}`,
          notes:
            settlement.notes ||
            settlement.description ||
            `انتقال بدهی به حساب ${settlement.targetMemberName || 'عضو دیگر'}`,
          sourceType: 'settlement',
          sourceId: settlement.id,
          settlementId: settlement.id,
          createdAt: settlement.createdAt
        };

        const txIn: LedgerTransaction = {
          id: `tx-set-${settlement.id}-in`,
          memberId: settlement.targetMemberId || '',
          memberName: settlement.targetMemberName || 'عضو مقصد',
          dateJalali: settlement.dateJalali,
          dateIso: settlement.dateIso,
          type: 'debt_transfer_in',
          direction: 'debit',
          isCredit: false,
          amount: settlement.amount,
          description:
            settlement.notes ||
            settlement.description ||
            `پذیرش بدهی انتقال یافته از حساب ${settlement.memberName}`,
          notes:
            settlement.notes ||
            settlement.description ||
            `پذیرش بدهی انتقال یافته از حساب ${settlement.memberName}`,
          sourceType: 'settlement',
          sourceId: settlement.id,
          settlementId: settlement.id,
          createdAt: settlement.createdAt
        };

        newTransactions = [txOut, txIn];
      } else {
        const isReceipt = settlement.type === 'receipt' || settlement.type === 'receipt_from_debtor';
        const tx: LedgerTransaction = {
          id: `tx-set-${settlement.id}`,
          memberId: settlement.memberId,
          memberName: settlement.memberName,
          dateJalali: settlement.dateJalali,
          dateIso: settlement.dateIso,
          type: isReceipt ? 'settlement_receipt' : 'settlement_payout',
          direction: isReceipt ? 'credit' : 'debit',
          isCredit: isReceipt,
          amount: settlement.amount,
          description:
            settlement.notes ||
            settlement.description ||
            (isReceipt
              ? 'وصول وجه تسویه بدهی به صندوق'
              : 'پرداخت وجه تسویه طلب از صندوق'),
          notes:
            settlement.notes ||
            settlement.description ||
            (isReceipt
              ? 'وصول وجه تسویه بدهی به صندوق'
              : 'پرداخت وجه تسویه طلب از صندوق'),
          sourceType: 'settlement',
          sourceId: settlement.id,
          settlementId: settlement.id,
          createdAt: settlement.createdAt
        };
        newTransactions = [tx];
      }

      const newState: AppDatabaseState = {
        ...prev,
        settlements: [settlement, ...prev.settlements],
        transactions: [...prev.transactions, ...newTransactions]
      };
      AppStorage.save(newState);
      return newState;
    });
  };

  const handleDeleteSettlement = (settlementId: string) => {
    setDbState((prev) => {
      const newState: AppDatabaseState = {
        ...prev,
        settlements: prev.settlements.filter((s) => s.id !== settlementId),
        transactions: prev.transactions.filter(
          (t) => !(t.sourceType === 'settlement' && t.sourceId === settlementId)
        )
      };

      AppStorage.save(newState);
      return newState;
    });
  };

  // Member CRUD
  const handleSaveMember = (member: Member) => {
    setDbState((prev) => {
      const index = prev.members.findIndex((m) => m.id === member.id);
      let updated: Member[];
      if (index >= 0) {
        updated = [...prev.members];
        updated[index] = member;
      } else {
        updated = [...prev.members, member];
      }
      const newState = { ...prev, members: updated };
      AppStorage.save(newState);
      return newState;
    });
  };

  const handleDeleteMember = (memberId: string) => {
    setDbState((prev) => {
      const newState = {
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId)
      };
      AppStorage.save(newState);
      return newState;
    });
  };

  // Ingredient CRUD
  const handleSaveIngredient = (ingredient: Ingredient) => {
    setDbState((prev) => {
      const index = prev.ingredients.findIndex((i) => i.id === ingredient.id);
      let updated: Ingredient[];
      if (index >= 0) {
        updated = [...prev.ingredients];
        updated[index] = ingredient;
      } else {
        updated = [...prev.ingredients, ingredient];
      }
      const newState = { ...prev, ingredients: updated };
      AppStorage.save(newState);
      return newState;
    });
  };

  const handleDeleteIngredient = (ingredientId: string) => {
    setDbState((prev) => {
      const newState = {
        ...prev,
        ingredients: prev.ingredients.filter((i) => i.id !== ingredientId)
      };
      AppStorage.save(newState);
      return newState;
    });
  };

  // Recipe CRUD
  const handleSaveRecipe = (recipe: Recipe) => {
    setDbState((prev) => {
      const index = prev.recipes.findIndex((r) => r.id === recipe.id);
      let updated: Recipe[];
      if (index >= 0) {
        updated = [...prev.recipes];
        updated[index] = recipe;
      } else {
        updated = [...prev.recipes, recipe];
      }
      const newState = { ...prev, recipes: updated };
      AppStorage.save(newState);
      return newState;
    });
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setDbState((prev) => {
      const newState = {
        ...prev,
        recipes: prev.recipes.filter((r) => r.id !== recipeId)
      };
      AppStorage.save(newState);
      return newState;
    });
  };

  const handleCookRecipe = (recipeId: string) => {
    setActiveMealForEdit(null);
    setPrefilledMealDate(today.formatted);
    setIsMealModalOpen(true);
  };

  // Settings update
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setDbState((prev) => {
      const newState = {
        ...prev,
        settings: { ...prev.settings, ...newSettings }
      };
      AppStorage.save(newState);
      return newState;
    });
  };

  // Backup & Restore
  const handleExportJson = () => {
    AppStorage.exportBackupFile();
  };

  const handleImportJson = (jsonString: string): boolean => {
    const success = AppStorage.importBackupFile(jsonString);
    if (success) {
      setDbState(AppStorage.load());
    }
    return success;
  };

  const handleResetDemoData = () => {
    const demo = AppStorage.resetToDefault();
    setDbState(demo);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans antialiased">
      {/* Navbar Header & Tabs */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewMeal={() => handleOpenNewMeal()}
        todayJalaliReadable={today.readableFa}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            todayJalali={today}
            todayMeal={todayMeal}
            ingredients={dbState.ingredients}
            members={dbState.members}
            memberSummaries={memberSummaries}
            recentMeals={dbState.meals}
            allMeals={dbState.meals}
            onOpenNewMeal={handleOpenNewMeal}
            onNavigateTab={setCurrentTab}
            onSelectMealDetails={(m) => handleEditMeal(m)}
            currency={dbState.settings.currency || 'تومان'}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            meals={dbState.meals}
            members={dbState.members}
            onOpenNewMeal={handleOpenNewMeal}
            onEditMeal={handleEditMeal}
            onDeleteMeal={handleDeleteMeal}
            currency={dbState.settings.currency || 'تومان'}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            ingredients={dbState.ingredients}
            onSaveIngredient={handleSaveIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onNavigateToPurchaseForIngredient={(ingId) => {
              setSelectedIngredientForPurchase(ingId);
              setCurrentTab('purchases');
            }}
            currency={dbState.settings.currency || 'تومان'}
          />
        )}

        {currentTab === 'purchases' && (
          <PurchasesView
            purchases={dbState.purchases}
            ingredients={dbState.ingredients}
            members={dbState.members}
            onSavePurchase={handleSavePurchase}
            onDeletePurchase={handleDeletePurchase}
            preselectedIngredientId={selectedIngredientForPurchase}
            currency={dbState.settings.currency || 'تومان'}
          />
        )}

        {currentTab === 'members' && (
          <MembersView
            members={dbState.members}
            memberSummaries={memberSummaries}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onViewMemberLedger={(memberId) => {
              setSelectedMemberForLedger(memberId);
              setCurrentTab('accounts');
            }}
            currency={dbState.settings.currency || 'تومان'}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            members={dbState.members}
            memberSummaries={memberSummaries}
            transactions={dbState.transactions}
            meals={dbState.meals}
            currency={dbState.settings.currency || 'تومان'}
            selectedMemberId={selectedMemberForLedger}
            onSelectMember={setSelectedMemberForLedger}
            onOpenSettlementForMember={(memberId) => {
              setSelectedMemberForSettlement(memberId);
              setCurrentTab('settlements');
            }}
            onSaveSettlement={handleSaveSettlement}
          />
        )}

        {currentTab === 'recipes' && (
          <RecipesView
            recipes={dbState.recipes}
            ingredients={dbState.ingredients}
            onSaveRecipe={handleSaveRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onCookRecipe={handleCookRecipe}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            meals={dbState.meals}
            purchases={dbState.purchases}
            members={dbState.members}
            memberSummaries={memberSummaries}
            currency={dbState.settings.currency || 'تومان'}
          />
        )}

        {currentTab === 'settlements' && (
          <SettlementsView
            settlements={dbState.settlements}
            members={dbState.members}
            memberSummaries={memberSummaries}
            transactions={dbState.transactions}
            meals={dbState.meals}
            currency={dbState.settings.currency || 'تومان'}
            onSaveSettlement={handleSaveSettlement}
            onDeleteSettlement={handleDeleteSettlement}
            preselectedMemberId={selectedMemberForSettlement}
          />
        )}

        {currentTab === 'backup' && (
          <BackupView
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onResetDemoData={handleResetDemoData}
            dbState={dbState}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={dbState.settings}
            onUpdateSettings={handleUpdateSettings}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        )}
      </main>

      {/* Unified Fast Meal Registration / Edit Modal */}
      <MealFormModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onSave={handleSaveMeal}
        initialMeal={activeMealForEdit}
        defaultDate={prefilledMealDate}
        members={dbState.members}
        ingredients={dbState.ingredients}
        recipes={dbState.recipes}
        allowNegativeInventory={dbState.settings.allowNegativeInventory}
        currency={dbState.settings.currency || 'تومان'}
      />

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
