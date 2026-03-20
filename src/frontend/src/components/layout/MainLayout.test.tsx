import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './MainLayout';
import { ResponsiveInfo, useResponsive } from '@/hooks/useResponsive';
import { vi } from 'vitest';

const { useResponsiveMock } = vi.hoisted(() => ({
  useResponsiveMock: vi.fn(),
}));

// Mock dependencies
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: useResponsiveMock,
}));
vi.mock('antd', () => {
  const Layout = Object.assign(
    ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: React.CSSProperties;
    }) => <div style={style}>{children}</div>,
    {
      Content: ({
        children,
        className,
        style,
      }: {
        children?: React.ReactNode;
        className?: string;
        style?: React.CSSProperties;
      }) => (
        <div className={className} style={style}>
          {children}
        </div>
      ),
    },
  );

  return {
    Layout,
    Drawer: ({
      children,
      open,
    }: {
      children?: React.ReactNode;
      open?: boolean;
    }) => (open ? <div data-testid="mobile-drawer">{children}</div> : null),
  };
});
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

const mockUseResponsive = vi.mocked(useResponsive);
const createResponsiveInfo = (overrides: Partial<ResponsiveInfo> = {}): ResponsiveInfo => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screens: {
    xs: false,
    sm: false,
    md: true,
    lg: true,
    xl: false,
    xxl: false,
  },
  ...overrides,
});

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render layout with sidebar and header on desktop', () => {
    mockUseResponsive.mockReturnValue(createResponsiveInfo());

    renderWithRouter(<MainLayout />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should auto-collapse sidebar on mobile', () => {
    mockUseResponsive.mockReturnValue(
      createResponsiveInfo({
        isMobile: true,
        isDesktop: false,
        screens: { xs: true, sm: false, md: false, lg: false, xl: false, xxl: false },
      }),
    );

    renderWithRouter(<MainLayout />);

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('should auto-collapse sidebar on tablet', () => {
    mockUseResponsive.mockReturnValue(
      createResponsiveInfo({
        isTablet: true,
        isDesktop: false,
        screens: { xs: false, sm: true, md: true, lg: false, xl: false, xxl: false },
      }),
    );

    renderWithRouter(<MainLayout />);

    expect(screen.getByTestId('sidebar')).toHaveTextContent('collapsed');
  });

  it('should toggle sidebar on desktop', () => {
    mockUseResponsive.mockReturnValue(createResponsiveInfo());

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
    mockUseResponsive.mockReturnValue(
      createResponsiveInfo({
        isMobile: true,
        isDesktop: false,
        screens: { xs: true, sm: false, md: false, lg: false, xl: false, xxl: false },
      }),
    );

    renderWithRouter(<MainLayout />);

    const toggleButton = screen.getByTestId('toggle-button');

    // Click to open drawer
    fireEvent.click(toggleButton);

    // Drawer should be rendered (Ant Design Drawer)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should apply correct padding on mobile', () => {
    mockUseResponsive.mockReturnValue(
      createResponsiveInfo({
        isMobile: true,
        isDesktop: false,
        screens: { xs: true, sm: false, md: false, lg: false, xl: false, xxl: false },
      }),
    );

    const { container } = renderWithRouter(<MainLayout />);

    const content = container.querySelector('.main-content');
    expect(content).toHaveStyle({ padding: '12px' });
  });

  it('should apply correct padding on tablet', () => {
    mockUseResponsive.mockReturnValue(
      createResponsiveInfo({
        isTablet: true,
        isDesktop: false,
        screens: { xs: false, sm: true, md: true, lg: false, xl: false, xxl: false },
      }),
    );

    const { container } = renderWithRouter(<MainLayout />);

    const content = container.querySelector('.main-content');
    expect(content).toHaveStyle({ padding: '20px' });
  });

  it('should apply correct padding on desktop', () => {
    mockUseResponsive.mockReturnValue(createResponsiveInfo());

    const { container } = renderWithRouter(<MainLayout />);

    const content = container.querySelector('.main-content');
    expect(content).toHaveStyle({ padding: '24px' });
  });
});
