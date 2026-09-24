import { computeSettlement } from '../src/services/payoutCalculator';

const o = (subtotal: number, method = 'Safepay') => ({ pricing: { subtotal }, payment: { method } });

describe('computeSettlement', () => {
  it('returns zeros for no orders', () => {
    expect(computeSettlement([], 0.15, 0.025)).toEqual({
      orderCount: 0,
      grossSales: 0,
      onlineSales: 0,
      cashSales: 0,
      commission: 0,
      paymentFees: 0,
      netAmount: 0,
    });
  });

  it('online only: net = online − commission − fees', () => {
    const s = computeSettlement([o(1000), o(2000)], 0.15, 0.025);
    expect(s).toMatchObject({
      orderCount: 2,
      grossSales: 3000,
      onlineSales: 3000,
      cashSales: 0,
      commission: 450,
      paymentFees: 75,
      netAmount: 2475,
    });
  });

  it('cash only: restaurant owes the commission', () => {
    const s = computeSettlement([o(1000, 'Cash')], 0.15, 0.025);
    expect(s).toMatchObject({ cashSales: 1000, paymentFees: 0, commission: 150, netAmount: -150 });
  });

  it('mixed cash and online', () => {
    const s = computeSettlement([o(1000, 'Cash'), o(2000, 'Card')], 0.1, 0.02);
    expect(s).toMatchObject({
      grossSales: 3000,
      onlineSales: 2000,
      cashSales: 1000,
      commission: 300,
      paymentFees: 40,
      netAmount: 1660,
    });
  });

  it('rounds to 2 decimals', () => {
    const s = computeSettlement([o(333.33)], 0.15, 0.025);
    expect(s.commission).toBe(50);
    expect(s.paymentFees).toBe(8.33);
    expect(s.netAmount).toBe(275);
  });
});
