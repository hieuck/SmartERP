import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobileFormItemCard from './MobileFormItemCard';

describe('MobileFormItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the correct item number and children', () => {
    render(
      <MobileFormItemCard index={1}>
        <div>product-fields</div>
      </MobileFormItemCard>,
    );

    expect(screen.getByText('Sản phẩm #2')).toBeInTheDocument();
    expect(screen.getByText('product-fields')).toBeInTheDocument();
  });

  it('renders remove action when provided', () => {
    const handleRemove = vi.fn();

    render(
      <MobileFormItemCard index={0} onRemove={handleRemove}>
        <div>product-fields</div>
      </MobileFormItemCard>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleRemove).toHaveBeenCalled();
  });
});
