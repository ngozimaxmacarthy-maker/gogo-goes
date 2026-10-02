import type { Expense } from "./types";

export interface Transfer {
  fromId: string;
  toId: string;
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Net position per traveler in the trip's base currency.
 * Positive = they're owed money, negative = they owe.
 */
export function balances(expenses: Expense[]): Record<string, number> {
  const net: Record<string, number> = {};
  for (const e of expenses) {
    const total = e.amount * e.fxToBase;
    const weights = Object.entries(e.shares).filter(([, w]) => w > 0);
    const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0);
    if (totalWeight === 0) continue;

    net[e.paidById] = (net[e.paidById] ?? 0) + total;
    for (const [id, w] of weights) {
      net[id] = (net[id] ?? 0) - (total * w) / totalWeight;
    }
  }
  for (const id of Object.keys(net)) net[id] = round2(net[id]);
  return net;
}

/** Fewest-ish transfers to settle up: biggest debtor pays biggest creditor. */
export function settleUp(expenses: Expense[]): Transfer[] {
  const net = balances(expenses);
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.005)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const amount = round2(Math.min(debtors[d].amount, creditors[c].amount));
    if (amount > 0) transfers.push({ fromId: debtors[d].id, toId: creditors[c].id, amount });
    debtors[d].amount = round2(debtors[d].amount - amount);
    creditors[c].amount = round2(creditors[c].amount - amount);
    if (debtors[d].amount <= 0.005) d++;
    if (creditors[c].amount <= 0.005) c++;
  }
  return transfers;
}
