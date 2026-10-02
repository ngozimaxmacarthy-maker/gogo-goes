import { describe, expect, it } from "vitest";
import { balances, settleUp } from "@/lib/split";
import type { Expense } from "@/lib/types";

const expense = (paidById: string, amount: number, shares: Record<string, number>, fxToBase = 1, currency = "USD"): Expense => ({
  id: crypto.randomUUID(), tripId: "t", description: "", amount, currency, fxToBase, paidById, shares,
});

describe("split", () => {
  it("splits evenly and settles", () => {
    const expenses = [expense("ngozi", 300, { ngozi: 1, shana: 1, chelsea: 1 })];
    expect(balances(expenses)).toEqual({ ngozi: 200, shana: -100, chelsea: -100 });
    expect(settleUp(expenses)).toEqual([
      { fromId: "shana", toId: "ngozi", amount: 100 },
      { fromId: "chelsea", toId: "ngozi", amount: 100 },
    ]);
  });

  it("converts local currency to base", () => {
    const expenses = [expense("ngozi", 1500, { ngozi: 1, shana: 1 }, 0.065, "GHS")];
    expect(balances(expenses)).toEqual({ ngozi: 48.75, shana: -48.75 });
  });

  it("supports uneven shares and nets out cross debts", () => {
    const expenses = [
      expense("ngozi", 400, { ngozi: 1, shana: 3 }),
      expense("shana", 100, { ngozi: 1 }),
    ];
    expect(settleUp(expenses)).toEqual([{ fromId: "shana", toId: "ngozi", amount: 200 }]);
  });
});
