import {
  Member,
  LedgerTransaction,
  MemberFinancialSummary,
  Meal
} from '../types';

export class MemberBalanceCalculator {
  /**
   * Calculate financial summary and net ledger balance for a specific member
   */
  public static calculateMemberSummary(
    member: Member,
    transactions: LedgerTransaction[],
    meals: Meal[]
  ): MemberFinancialSummary {
    const memberTx = transactions.filter((t) => t.memberId === member.id);

    let totalInventoryPaid = 0;
    let totalExtraPaid = 0;
    let totalDirectPaid = 0;
    let totalMealCostDebits = 0;
    let totalSettledPayouts = 0;
    let totalSettledReceipts = 0;

    for (const tx of memberTx) {
      const amt = Math.abs(Number(tx.amount) || 0);
      switch (tx.type) {
        case 'inventory_purchase_share':
          totalInventoryPaid += amt;
          break;
        case 'extra_purchase_buyer':
          totalExtraPaid += amt;
          break;
        case 'direct_payment':
          totalDirectPaid += amt;
          break;
        case 'meal_share':
          totalMealCostDebits += amt;
          break;
        case 'settlement_payout':
          totalSettledPayouts += amt;
          break;
        case 'settlement_receipt':
          totalSettledReceipts += amt;
          break;
        case 'debt_transfer_out':
          // Person transferred their debt to someone else -> treated as settlement receipt (increases netBalance toward 0)
          totalSettledReceipts += amt;
          break;
        case 'debt_transfer_in':
          // Person accepted debt from someone else -> treated as debit (decreases netBalance)
          totalMealCostDebits += amt;
          break;
        case 'reversal':
          // Reversals take into account isCredit
          break;
      }
    }

    const totalCredits = totalInventoryPaid + totalExtraPaid + totalDirectPaid;
    // Net balance formula:
    // Positive balance = Creditor (طلبکار)
    // Negative balance = Debtor (بدهکار)
    const netBalance =
      totalCredits - totalMealCostDebits - totalSettledPayouts + totalSettledReceipts;

    // Count how many meals this member attended
    const attendedMealsCount = meals.filter((m) =>
      m.participantIds.includes(member.id)
    ).length;

    return {
      member,
      totalInventoryPaid,
      totalExtraPaid,
      totalDirectPaid,
      totalCredits,
      totalMealCostDebits,
      totalSettledPayouts,
      totalSettledReceipts,
      netBalance,
      attendedMealsCount
    };
  }

  /**
   * Calculate summary for all members
   */
  public static calculateAllMembersSummaries(
    members: Member[],
    transactions: LedgerTransaction[],
    meals: Meal[]
  ): MemberFinancialSummary[] {
    return members.map((m) => this.calculateMemberSummary(m, transactions, meals));
  }

  public static calculateAllSummaries(
    members: Member[],
    transactions: LedgerTransaction[],
    meals: Meal[]
  ): MemberFinancialSummary[] {
    return this.calculateAllMembersSummaries(members, transactions, meals);
  }
}
