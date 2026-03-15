import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useResponsive } from '@/hooks/useResponsive';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/hooks/useResponsive');
vi.mock('./Sidebar', () => ({
  __esModule: true,
  default: ({ collapsed }: { collapsed: boolean }) => (
    <div data-testid="sidebar">Sidebar {collapsed ? 'collapsed' : 'expanded'}</div>
  ),
}));
vi.mock('./Header', () => ({
  __esModule: true,
  default: ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
    <div data-testid="header">
      <button onClick={onToggle} data-testid="toggle-button">
        Toggle {collapsed ? 'collapsed' : 'expanded'}
      </button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render layout with sidebar and header on desktop', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    renderWithRouter(<MainLayout />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should auto-collapse sidebar on mobile', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    renderWithRouter(<MainLayout />);

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('should auto-collapse sidebar on tablet', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    renderWithRouter(<MainLayout />);

    expect(screen.getByTestId('sidebar')).toHaveTextContent('collapsed');
  });

  it('should toggle sidebar on desktop', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    renderWithRouter(<MainLayout />);

    const toggleButton = screen.getByTestId('toggle-button');

    // Initially not collapsed
    expect(screen.getByTestId('sidebar')).toHaveTextContent('expanded');

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('sidebar')).toHaveTextContent('collapsed');

    // Click to expand
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('sidebar')).toHaveTextContent('expanded');
  });

  it('should open mobile drawer on toggle', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    renderWithRouter(<MainLayout />);

    const toggleButton = screen.getByTestId('toggle-button');

    // Click to open drawer
    fireEvent.click(toggleButton);

    // Drawer should be rendered (Ant Design Drawer)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should apply correct padding on mobile', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    const { container } = renderWithRouter(<MainLayout />);

    const content = container.querySelector('.main-content');
    expect(content).toHaveStyle({ padding: '12px' });
  });

  it('should apply correct padding on tablet', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    const { container } = renderWithRouter(<MainLayout />);

    const content = container.querySelector('.main-content');
    expect(content).toHaveStyle({ padding: '16px' });
  });

  it('should apply correct padding on desktop', () => {
    (useResponsive as any).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    const { container } = renderWithRouter(<MainLayout />);

    const content = container.querySelector('.main-content');
    expect(content).toHaveStyle({ padding: '24px' });
  });
});
