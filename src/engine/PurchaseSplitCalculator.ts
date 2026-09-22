import { Member, PurchaseMemberShare } from '../types';
import { formatCurrency, getActiveAppCurrency } from '../utils/jalali';

export interface SplitResult {
  isValid: boolean;
  shares: PurchaseMemberShare[];
  totalAssigned: number;
  expectedTotal: number;
  difference: number;
  errorMessage?: string;
}

export class PurchaseSplitCalculator {
  /**
   * Split total cost equally among active primary members
   */
  public static splitEqually(totalCost: number, primaryMembers: Member[]): SplitResult {
    const activeMembers = primaryMembers.filter((m) => m.isActive && m.type === 'primary');
    if (activeMembers.length === 0) {
      return {
        isValid: false,
        shares: [],
        totalAssigned: 0,
        expectedTotal: totalCost,
        difference: totalCost,
        errorMessage: 'هیچ عضو اصلی فعالی برای تقسیم هزینه وجود ندارد.'
      };
    }

    const count = activeMembers.length;
    const baseShare = Math.floor(totalCost / count);
    const remainder = totalCost - baseShare * count;

    const shares: PurchaseMemberShare[] = activeMembers.map((m, index) => {
      // Allocate 1 extra toman to the first `remainder` members to ensure exact sum match
      const extra = index < remainder ? 1 : 0;
      return {
        memberId: m.id,
        memberName: m.name,
        amount: baseShare + extra
      };
    });

    const totalAssigned = shares.reduce((acc, s) => acc + s.amount, 0);

    return {
      isValid: totalAssigned === totalCost,
      shares,
      totalAssigned,
      expectedTotal: totalCost,
      difference: totalCost - totalAssigned
    };
  }

  /**
   * Validate manual split shares
   */
  public static validateManualSplit(
    shares: PurchaseMemberShare[],
    expectedTotal: number,
    currency?: string
  ): SplitResult {
    const totalAssigned = shares.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const diff = expectedTotal - totalAssigned;
    const activeCurrency = currency || getActiveAppCurrency();

    if (diff !== 0) {
      const formattedDiff = formatCurrency(Math.abs(diff), activeCurrency);
      const msg =
        diff > 0
          ? `مجموع سهم‌ها ${formattedDiff} کمتر از مبلغ کل خرید است.`
          : `مجموع سهم‌ها ${formattedDiff} بیشتر از مبلغ کل خرید است.`;
      return {
        isValid: false,
        shares,
        totalAssigned,
        expectedTotal,
        difference: diff,
        errorMessage: msg
      };
    }

    return {
      isValid: true,
      shares,
      totalAssigned,
      expectedTotal,
      difference: 0
    };
  }
}
