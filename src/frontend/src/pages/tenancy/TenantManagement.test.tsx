import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TenantManagement from './TenantManagement';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', () => ({
  Card: ({
    children,
    title,
  }: {
    children?: React.ReactNode;
    title?: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

describe('TenantManagement', () => {
  it('renders the tenancy placeholder title and message', () => {
    render(<TenantManagement />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('underDevelopment')).toBeInTheDocument();
  });
});
