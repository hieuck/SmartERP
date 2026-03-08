---
name: accessibility-testing-patterns
description: Accessibility testing patterns with axe-core to ensure WCAG 2.1 AA compliance. Use when testing email templates, PDF generation, and API responses for screen reader compatibility.
---

# Accessibility Testing Patterns

## Vấn đề với Manual Accessibility Testing

**Manual testing KHÔNG scale:**

```typescript
// ❌ Test này pass nhưng có accessibility issues
it('should generate invoice email', () => {
  const html = generateInvoiceEmail(invoice);
  expect(html).toContain('<table>');
  expect(html).toContain(invoice.number);
});

// Accessibility issues missed:
// - Missing alt text on images
// - Poor color contrast
// - Missing table headers
// - No ARIA labels
```

**Accessibility Testing = Automated WCAG compliance checks**

## Setup với jest-axe

### 1. Cài đặt

```bash
npm install --save-dev jest-axe axe-core @types/jest-axe
```

### 2. Basic Accessibility Test

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Invoice Email Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const html = generateInvoiceEmail(invoice);
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
```

## WCAG 2.1 AA Requirements

### 1. Text Alternatives (Level A)

**All images must have alt text:**

```typescript
it('should have alt text for all images', () => {
  const html = generateInvoiceEmail(invoice);

  // Check all img tags have alt attribute
  const imgTags = html.match(/<img[^>]*>/g) || [];
  imgTags.forEach((img) => {
    expect(img).toMatch(/alt="[^"]+"/);
  });
});
```

### 2. Color Contrast (Level AA)

**Text must have sufficient contrast:**

```typescript
it('should have sufficient color contrast', async () => {
  const html = generateInvoiceEmail(invoice);

  const results = await axe(html, {
    rules: {
      'color-contrast': { enabled: true },
    },
  });

  expect(results).toHaveNoViolations();
});
```

### 3. Table Structure (Level A)

**Tables must have proper headers:**

```typescript
it('should have proper table structure', () => {
  const html = generateInvoiceEmail(invoice);

  // Check for table headers
  expect(html).toContain('<th scope="col">');
  expect(html).toContain('<caption>');

  // Check for proper structure
  expect(html).toMatch(/<table[^>]*>[\s\S]*<thead>[\s\S]*<tbody>/);
});
```

## ERP-Specific Testing

### Email Templates

```typescript
describe('Invoice Email Accessibility', () => {
  it('should be accessible', async () => {
    const invoice = InvoiceFactory.create();
    const html = generateInvoiceEmail(invoice);

    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it('should have semantic HTML', () => {
    const html = generateInvoiceEmail(invoice);

    // Check for semantic elements
    expect(html).toContain('<header>');
    expect(html).toContain('<main>');
    expect(html).toContain('<footer>');
  });

  it('should have proper heading hierarchy', () => {
    const html = generateInvoiceEmail(invoice);

    // Check heading order (h1 → h2 → h3)
    const headings = html.match(/<h[1-6][^>]*>/g) || [];
    // Verify no skipped levels
  });
});
```

### PDF Generation

```typescript
describe('Invoice PDF Accessibility', () => {
  it('should generate tagged PDF', async () => {
    const pdf = await generateInvoicePDF(invoice);

    // Check PDF is tagged for accessibility
    expect(pdf.metadata.tagged).toBe(true);
  });

  it('should have document structure', async () => {
    const pdf = await generateInvoicePDF(invoice);

    // Check for structure elements
    expect(pdf.structure).toContain('Document');
    expect(pdf.structure).toContain('Table');
    expect(pdf.structure).toContain('Header');
  });

  it('should have alt text for images', async () => {
    const pdf = await generateInvoicePDF(invoice);

    // Check all images have alt text
    pdf.images.forEach((image) => {
      expect(image.altText).toBeDefined();
      expect(image.altText.length).toBeGreaterThan(0);
    });
  });
});
```

### API Responses

```typescript
describe('API Response Accessibility', () => {
  it('should have screen reader friendly structure', () => {
    const response = {
      success: true,
      data: {
        invoice: {
          number: 'INV-001',
          total: 1000,
        },
      },
      message: 'Invoice retrieved successfully',
    };

    // Check for descriptive messages
    expect(response.message).toBeDefined();
    expect(response.message.length).toBeGreaterThan(0);

    // Check for clear structure
    expect(response.success).toBeDefined();
    expect(response.data).toBeDefined();
  });
});
```

## Best Practices

### 1. Test Critical Paths

```typescript
// ✅ Test important templates
- Invoice emails
- Order confirmations
- Password reset emails
- Reports

// ❌ Don't test every page
- Admin settings
- Debug pages
```

### 2. Use Semantic HTML

```html
<!-- ✅ Good - Semantic HTML -->
<header>
  <h1>Invoice #INV-001</h1>
</header>
<main>
  <table>
    <caption>
      Invoice Items
    </caption>
    <thead>
      <tr>
        <th scope="col">Product</th>
        <th scope="col">Quantity</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Laptop</td>
        <td>2</td>
      </tr>
    </tbody>
  </table>
</main>

<!-- ❌ Bad - Non-semantic -->
<div class="header">
  <div class="title">Invoice #INV-001</div>
</div>
<div class="content">
  <div class="table">
    <div class="row">
      <div class="cell">Product</div>
      <div class="cell">Quantity</div>
    </div>
  </div>
</div>
```

### 3. Provide Alt Text

```html
<!-- ✅ Good - Descriptive alt text -->
<img src="logo.png" alt="Company Logo" />
<img src="product.jpg" alt="Laptop Dell XPS 15" />

<!-- ❌ Bad - Missing or generic alt text -->
<img src="logo.png" />
<img src="product.jpg" alt="image" />
```

### 4. Ensure Color Contrast

```css
/* ✅ Good - Sufficient contrast (4.5:1 for normal text) */
color: #000000; /* Black */
background: #ffffff; /* White */

/* ❌ Bad - Poor contrast */
color: #cccccc; /* Light gray */
background: #ffffff; /* White */
```

## CI/CD Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Testing

on:
  pull_request:
    branches: [main, develop]

jobs:
  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run accessibility tests
        run: npm run test:a11y

      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: accessibility-results
          path: accessibility-report/
```

## Accessibility Checklist

- [ ] ✅ jest-axe configured
- [ ] ✅ Email templates tested
- [ ] ✅ PDF generation tested
- [ ] ✅ API responses tested
- [ ] ✅ Semantic HTML used
- [ ] ✅ Alt text provided
- [ ] ✅ Color contrast verified
- [ ] ✅ Table structure proper
- [ ] ✅ CI/CD integration

## Expected Impact

**Before Accessibility Testing:**

- WCAG violations: Unknown
- Legal risk: High
- User experience: Poor for disabled users

**After Accessibility Testing:**

- WCAG violations: 0 in critical paths
- Legal risk: Low
- User experience: Good for all users

## Summary

Accessibility Testing = **WCAG 2.1 AA compliance**

- ✅ Automated violation detection
- ✅ Email template accessibility
- ✅ PDF accessibility
- ✅ API response clarity
- ✅ Legal compliance
- ✅ Better UX for all

**Goal: Ensure system is accessible to everyone**
