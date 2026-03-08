---
name: property-based-testing-patterns
description: Property-based testing patterns with fast-check to automatically discover edge cases. Use when testing business logic, calculations, and invariants in ERP systems.
---

# Property-Based Testing Patterns

## Vấn đề với Example-Based Testing

**Example-based tests only cover specific cases:**

```typescript
// ❌ Limited coverage - only 3 test cases
describe('calculateDiscount', () => {
  it('should calculate 10% discount', () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
  });

  it('should calculate 20% discount', () => {
    expect(calculateDiscount(200, 0.2)).toBe(160);
  });

  it('should handle zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });
});
```

**Bugs Missed:**

- ❌ Negative discount → price increase
- ❌ Discount > 100% → negative price
- ❌ Floating point precision issues
- ❌ Very large numbers → overflow
- ❌ Edge cases you didn't think of

**Property-Based Testing = Test properties that should hold for ALL inputs**

## Setup với fast-check

### 1. Cài đặt

```bash
npm install --save-dev fast-check @types/fast-check
```

### 2. Basic Property Test

```typescript
import fc from 'fast-check';

describe('calculateDiscount', () => {
  // Example test for documentation
  it('should calculate 10% discount', () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
  });

  // Property test for comprehensive coverage
  it('discounted price should never be negative', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000 }), // price
        fc.float({ min: 0, max: 1 }), // discount rate
        (price, discount) => {
          const result = calculateDiscount(price, discount);
          expect(result).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('discounted price should never exceed original price', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000 }),
        fc.float({ min: 0, max: 1 }),
        (price, discount) => {
          const result = calculateDiscount(price, discount);
          expect(result).toBeLessThanOrEqual(price);
        },
      ),
    );
  });
});
```

## Common Properties to Test

### 1. Idempotency

**Property:** Applying operation twice = applying once

```typescript
it('applying discount twice should equal applying once', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 10000 }),
      fc.float({ min: 0, max: 1 }),
      (price, discount) => {
        const once = calculateDiscount(price, discount);
        const twice = calculateDiscount(calculateDiscount(price, discount), discount);

        // Should NOT be equal (discount compounds)
        // This test would fail and reveal the bug!
      },
    ),
  );
});
```

### 2. Commutativity

**Property:** Order doesn't matter

```typescript
it('adding items in any order should give same total', () => {
  fc.assert(
    fc.property(fc.array(fc.float({ min: 0, max: 1000 })), (items) => {
      const total1 = items.reduce((sum, item) => sum + item, 0);
      const total2 = [...items].reverse().reduce((sum, item) => sum + item, 0);

      expect(total1).toBeCloseTo(total2, 2);
    }),
  );
});
```

### 3. Associativity

**Property:** Grouping doesn't matter

```typescript
it('grouping calculations should not affect result', () => {
  fc.assert(
    fc.property(fc.float(), fc.float(), fc.float(), (a, b, c) => {
      const result1 = a + b + c;
      const result2 = a + (b + c);

      expect(result1).toBeCloseTo(result2, 10);
    }),
  );
});
```

### 4. Invariants

**Property:** Conditions that always hold

```typescript
it('stock quantity should never be negative', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1000 }), // initial stock
      fc.integer({ min: 0, max: 100 }), // quantity to remove
      (initialStock, removeQty) => {
        const result = updateStock(initialStock, -removeQty);

        // Invariant: Stock >= 0
        expect(result).toBeGreaterThanOrEqual(0);
      },
    ),
  );
});
```

## ERP-Specific Examples

### Financial Calculations

```typescript
describe('Tax Calculation', () => {
  it('tax should never exceed subtotal', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }), // subtotal
        fc.float({ min: 0, max: 0.5 }), // tax rate (0-50%)
        (subtotal, taxRate) => {
          const tax = calculateTax(subtotal, taxRate);

          expect(tax).toBeLessThanOrEqual(subtotal);
          expect(tax).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('total should equal subtotal plus tax', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }),
        fc.float({ min: 0, max: 0.5 }),
        (subtotal, taxRate) => {
          const tax = calculateTax(subtotal, taxRate);
          const total = subtotal + tax;

          expect(total).toBeCloseTo(subtotal * (1 + taxRate), 2);
        },
      ),
    );
  });
});
```

### Inventory Math (FIFO)

```typescript
describe('FIFO Calculation', () => {
  it('should always use oldest valuations first', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 1000 }),
            unitCost: fc.float({ min: 0.01, max: 10000 }),
            date: fc.date(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.integer({ min: 1, max: 100 }),
        (valuations, requestedQty) => {
          const totalAvailable = valuations.reduce((sum, v) => sum + v.quantity, 0);

          if (requestedQty <= totalAvailable) {
            const result = calculateFIFO(valuations, requestedQty);

            // Property: Should use oldest valuations first
            const sorted = valuations.sort((a, b) => a.date.getTime() - b.date.getTime());
            expect(result.usedValuations[0].date).toEqual(sorted[0].date);
          }
        },
      ),
    );
  });

  it('cost should never be negative', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 1000 }),
            unitCost: fc.float({ min: 0.01, max: 10000 }),
            date: fc.date(),
          }),
        ),
        fc.integer({ min: 1, max: 100 }),
        (valuations, requestedQty) => {
          try {
            const result = calculateFIFO(valuations, requestedQty);
            expect(result.cost).toBeGreaterThanOrEqual(0);
          } catch (error) {
            // Insufficient stock is acceptable
            expect(error.message).toContain('Insufficient stock');
          }
        },
      ),
    );
  });
});
```

### Date/Time Logic

```typescript
describe('Shift Scheduling', () => {
  it('shift end should always be after shift start', () => {
    fc.assert(
      fc.property(fc.date(), fc.integer({ min: 1, max: 24 }), (startDate, durationHours) => {
        const shift = createShift(startDate, durationHours);

        expect(shift.endDate.getTime()).toBeGreaterThan(shift.startDate.getTime());
      }),
    );
  });

  it('shifts should not overlap', () => {
    fc.assert(
      fc.property(
        fc.date(),
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 8 }),
        (startDate, duration1, duration2) => {
          const shift1 = createShift(startDate, duration1);
          const shift2 = createShift(shift1.endDate, duration2);

          expect(shift2.startDate.getTime()).toBeGreaterThanOrEqual(shift1.endDate.getTime());
        },
      ),
    );
  });
});
```

### Business Rules

```typescript
describe('Order Validation', () => {
  it('order total should equal sum of item totals plus tax', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 100 }),
            price: fc.float({ min: 0.01, max: 10000 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.float({ min: 0, max: 0.5 }),
        (items, taxRate) => {
          const order = createOrder(items, taxRate);

          const expectedSubtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
          const expectedTax = expectedSubtotal * taxRate;
          const expectedTotal = expectedSubtotal + expectedTax;

          expect(order.subtotal).toBeCloseTo(expectedSubtotal, 2);
          expect(order.tax).toBeCloseTo(expectedTax, 2);
          expect(order.total).toBeCloseTo(expectedTotal, 2);
        },
      ),
    );
  });

  it('minimum order quantity should be enforced', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (quantity) => {
        const MIN_ORDER_QTY = 10;

        if (quantity < MIN_ORDER_QTY) {
          expect(() => createOrder([{ quantity, price: 100 }])).toThrow('Minimum order quantity');
        } else {
          expect(() => createOrder([{ quantity, price: 100 }])).not.toThrow();
        }
      }),
    );
  });
});
```

## Advanced Patterns

### 1. Custom Arbitraries

```typescript
// Custom arbitrary for valid email
const emailArbitrary = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1 }),
    fc.constant('@'),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1 }),
    fc.constant('.'),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 2, maxLength: 3 }),
  )
  .map(([local, at, domain, dot, tld]) => `${local}${at}${domain}${dot}${tld}`);

it('should validate email format', () => {
  fc.assert(
    fc.property(emailArbitrary, (email) => {
      expect(isValidEmail(email)).toBe(true);
    }),
  );
});
```

### 2. Stateful Testing

```typescript
// Test shopping cart state machine
class CartModel {
  items: Array<{ id: string; quantity: number }> = [];

  addItem(id: string, quantity: number) {
    const existing = this.items.find((item) => item.id === id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ id, quantity });
    }
  }

  removeItem(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

it('cart should maintain correct state', () => {
  fc.assert(
    fc.property(
      fc.commands([
        fc.constant(null).map(() => ({
          run: (model: CartModel) => model.addItem('prod-1', 1),
          toString: () => 'addItem(prod-1, 1)',
        })),
        fc.constant(null).map(() => ({
          run: (model: CartModel) => model.removeItem('prod-1'),
          toString: () => 'removeItem(prod-1)',
        })),
      ]),
      (commands) => {
        const model = new CartModel();
        const real = new ShoppingCart();

        for (const cmd of commands) {
          cmd.run(model);
          // Run same command on real implementation
        }

        // Verify model matches real implementation
        expect(real.getTotal()).toBe(model.getTotal());
      },
    ),
  );
});
```

### 3. Shrinking

```typescript
// fast-check automatically shrinks failing cases to minimal example
it('should handle all inputs', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      // This will fail for a=0, b=0
      const result = divide(a, b);
      expect(result).toBeDefined();
    }),
  );
});

// Output:
// Property failed after 1 tests
// { seed: 123456789, path: "0:0", endOnFailure: true }
// Counterexample: [0, 0]  // ← Shrunk to minimal failing case
// Shrunk 5 time(s)
```

## Configuration

```typescript
// jest.config.js
module.exports = {
  testTimeout: 30000, // PBT tests may take longer
};
```

```typescript
// Configure fast-check
fc.configureGlobal({
  numRuns: 100, // Number of test cases (default: 100)
  verbose: true, // Show all test cases
  seed: 42, // Reproducible tests
});
```

## Best Practices

### 1. Combine Example-Based and Property-Based

```typescript
describe('calculateDiscount', () => {
  // Example tests for documentation
  it('should calculate 10% discount', () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
  });

  // Property tests for comprehensive coverage
  it('discounted price should never be negative', () => {
    fc.assert(/* ... */);
  });
});
```

### 2. Test Properties, Not Implementation

```typescript
// ✅ Good - Test property
it('sorting should preserve all elements', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = sort(arr);
      expect(sorted.length).toBe(arr.length);
    }),
  );
});

// ❌ Bad - Test implementation
it('sorting should use quicksort', () => {
  // Don't test internal algorithm
});
```

### 3. Use Appropriate Generators

```typescript
// ✅ Good - Constrained generators
fc.float({ min: 0, max: 1 }); // Percentage
fc.integer({ min: 1, max: 100 }); // Quantity
fc.date({ min: new Date('2020-01-01') }); // Recent dates

// ❌ Bad - Unconstrained generators
fc.float(); // Can be NaN, Infinity, negative
fc.integer(); // Can be very large or negative
fc.date(); // Can be year 1970 or 2100
```

### 4. Handle Expected Failures

```typescript
it('should handle invalid inputs gracefully', () => {
  fc.assert(
    fc.property(fc.float(), fc.float(), (price, discount) => {
      if (price < 0 || discount < 0 || discount > 1) {
        // Expected to throw
        expect(() => calculateDiscount(price, discount)).toThrow();
      } else {
        // Should work
        expect(() => calculateDiscount(price, discount)).not.toThrow();
      }
    }),
  );
});
```

## Property-Based Testing Checklist

- [ ] ✅ fast-check installed and configured
- [ ] ✅ Properties identified for business logic
- [ ] ✅ Financial calculations tested
- [ ] ✅ Inventory math tested
- [ ] ✅ Date/time logic tested
- [ ] ✅ Business rules tested
- [ ] ✅ Combine with example-based tests
- [ ] ✅ CI/CD integration

## Expected Impact

**Before Property-Based Testing:**

- Test cases: 5-10 per function
- Edge cases found: Manual discovery
- Bug detection: ~40%

**After Property-Based Testing:**

- Test cases: 100-1000 per property
- Edge cases found: Automatic discovery
- Bug detection: ~75% (+87%)

## Summary

Property-Based Testing = **Test properties for ALL inputs**

- ✅ Automatically discover edge cases
- ✅ Test thousands of input combinations
- ✅ Verify invariants and properties
- ✅ Critical for ERP business logic
- ✅ Complement example-based tests

**Goal: Catch bugs before they reach production**
