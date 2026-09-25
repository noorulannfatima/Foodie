import { cashToCollect, toDeliveryOrderView } from '../src/services/deliveryOrderView';

function order(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'o1',
    orderNumber: 'ORD1',
    status: 'Ready',
    items: [{ name: 'Steak', quantity: 2, price: 100 }],
    estimatedPreparationTime: 20,
    pricing: { subtotal: 200, deliveryFee: 100, tax: 0, tip: 0, total: 300 },
    payment: { method: 'Cash', status: 'Pending' },
    customer: { _id: 'c1', name: 'Noor', phone: '0300 1111111' },
    restaurant: {
      _id: 'r1',
      name: 'Beef House',
      logo: 'logo.png',
      address: { street: '1 Main St', city: 'Karachi' },
      coordinates: { type: 'Point', coordinates: [67.0011, 24.8607] },
    },
    deliveryAddress: {
      street: '2 Side St',
      city: 'Karachi',
      zipCode: '74000',
      latitude: 24.87,
      longitude: 67.02,
      instructions: 'Ring twice',
    },
    specialInstructions: 'No onions',
    ...overrides,
  };
}

describe('cashToCollect', () => {
  it('is the order total for an unpaid cash order', () => {
    expect(cashToCollect(order())).toBe(300);
  });

  it.each([
    ['Cash', 'Completed'],
    ['Safepay', 'Completed'],
    ['Safepay', 'Pending'],
  ])('is zero for %s / %s', (method, status) => {
    expect(cashToCollect(order({ payment: { method, status } }))).toBe(0);
  });
});

describe('toDeliveryOrderView', () => {
  it('hides every customer detail from riders browsing requests', () => {
    const view = toDeliveryOrderView(order(), 'request') as Record<string, unknown>;

    expect(view.customer).toBeUndefined();
    expect(view.specialInstructions).toBeUndefined();
    expect(view.deliveryAddress).toEqual({ street: '2 Side St', city: 'Karachi', zipCode: '74000' });
  });

  it('gives the assigned rider name, phone, instructions and coordinates', () => {
    const view = toDeliveryOrderView(order(), 'active') as any;

    expect(view.customer).toEqual({ name: 'Noor', phone: '0300 1111111' });
    expect(view.specialInstructions).toBe('No onions');
    expect(view.deliveryAddress).toMatchObject({ latitude: 24.87, longitude: 67.02, instructions: 'Ring twice' });
  });

  it('keeps only the customer name in history', () => {
    const view = toDeliveryOrderView(order(), 'history') as any;

    expect(view.customer).toEqual({ name: 'Noor' });
    expect(view.specialInstructions).toBeUndefined();
  });

  it('reports payment and cash to collect at every level', () => {
    for (const level of ['request', 'active', 'history'] as const) {
      const view = toDeliveryOrderView(order(), level) as any;
      expect(view.payment).toEqual({ method: 'Cash', status: 'Pending' });
      expect(view.cashToCollect).toBe(300);
    }
  });

  it('includes the restaurant location, but not the [0,0] placeholder', () => {
    const located = toDeliveryOrderView(order(), 'active') as any;
    expect(located.restaurant.location).toEqual({ latitude: 24.8607, longitude: 67.0011 });

    const unlocated = toDeliveryOrderView(
      order({ restaurant: { _id: 'r1', name: 'X', address: {}, coordinates: { coordinates: [0, 0] } } }),
      'active',
    ) as any;
    expect(unlocated.restaurant.location).toBeUndefined();
  });

  it('treats an unpopulated customer id as no customer', () => {
    const view = toDeliveryOrderView(order({ customer: 'c1' }), 'active') as any;
    expect(view.customer).toBeNull();
  });
});
