import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserList from './UserList';

const {
  confirmMock,
  getAllMock,
  getQueueSizeMock,
  isSyncingMock,
  messageMock,
  navigateMock,
  standardListPageMock,
} = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  getAllMock: vi.fn(),
  getQueueSizeMock: vi.fn(),
  isSyncingMock: vi.fn(),
  messageMock: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  navigateMock: vi.fn(),
  standardListPageMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.defaultValue ? String(options.defaultValue) : key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('dayjs', () => ({
  default: (value: unknown) => ({
    format: () => `formatted:${String(value)}`,
  }),
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/services/offline-services', () => ({
  offlineServices: {
    users: {
      delete: vi.fn(),
      getAll: getAllMock,
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueSize: getQueueSizeMock,
    isSyncing: isSyncingMock,
    sync: vi.fn(),
  },
}));

vi.mock('@/components/common/StandardListPage', () => ({
  default: (props: {
    title: React.ReactNode;
    createButtonText: string;
    onCreateClick: () => void;
    searchPlaceholder: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    dataSource: Array<{ id: string; email: string }>;
    extraActions?: React.ReactNode;
  }) => {
    standardListPageMock(props);
    return (
      <div>
        <div>{props.title}</div>
        <button onClick={props.onCreateClick}>{props.createButtonText}</button>
        <input
          aria-label={props.searchPlaceholder}
          value={props.searchValue}
          onChange={(event) => props.onSearchChange(event.target.value)}
        />
        <div>{props.extraActions}</div>
        {props.dataSource.map((user) => (
          <div key={user.id}>{user.email}</div>
        ))}
      </div>
    );
  },
}));

vi.mock('@ant-design/icons', () => ({
  CloudOutlined: () => <span>icon-cloud</span>,
  DeleteOutlined: () => <span>icon-delete</span>,
  DisconnectOutlined: () => <span>icon-disconnect</span>,
  EditOutlined: () => <span>icon-edit</span>,
  EyeOutlined: () => <span>icon-eye</span>,
  LockOutlined: () => <span>icon-lock</span>,
  MoreOutlined: () => <span>icon-more</span>,
  SyncOutlined: ({ spin }: { spin?: boolean }) => <span>{spin ? 'icon-sync-spin' : 'icon-sync'}</span>,
  UserOutlined: () => <span>icon-user</span>,
}));

vi.mock('antd', () => ({
  Badge: ({ children, text }: { children?: React.ReactNode; text?: React.ReactNode }) => (
    <div>
      {text}
      {children}
    </div>
  ),
  Button: ({
    children,
    disabled,
    icon,
    onClick,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {children ?? icon ?? 'button'}
    </button>
  ),
  Dropdown: ({
    children,
    menu,
  }: {
    children?: React.ReactNode;
    menu?: { items?: Array<{ key: string; label?: React.ReactNode; onClick?: () => void }> };
  }) => (
    <div>
      {children}
      {menu?.items?.map((item) =>
        item ? (
          <button key={item.key} onClick={item.onClick}>
            {item.label}
          </button>
        ) : null,
      )}
    </div>
  ),
  Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  App: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    useApp: () => ({
      message: messageMock,
      modal: {
        confirm: confirmMock,
      },
    }),
  }),
}));

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue([
      {
        id: '1',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'active',
        createdAt: '2026-03-01',
      },
      {
        id: '2',
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Viewer',
        role: 'VIEWER',
        status: 'inactive',
        createdAt: '2026-03-02',
      },
    ]);
    getQueueSizeMock.mockResolvedValue(2);
    isSyncingMock.mockReturnValue(false);
    vi.mocked(global.localStorage.getItem).mockReturnValue(null);
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('loads users from offline storage and renders the initial list', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalled();
    });

    expect(getQueueSizeMock).toHaveBeenCalled();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('users:createButton')).toBeInTheDocument();
  });

  it('filters the rendered users when the search term changes', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('users:searchPlaceholder'), {
      target: { value: 'bob' },
    });

    await waitFor(() => {
      expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
    });

    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('navigates to the new-user route from the create action', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('users:createButton')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('users:createButton'));

    expect(navigateMock).toHaveBeenCalledWith('/dashboard/users/new');
  });

  it('opens a context-aware reset password confirmation from the action menu', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    const firstRenderProps = standardListPageMock.mock.calls[0][0] as {
      columns: Array<{
        key?: string;
        render?: (value: string, record: { id: string; status: string }) => React.ReactNode;
      }>;
    };
    const actionsColumn = firstRenderProps.columns.find((column) => column.key === 'action');

    render(actionsColumn?.render?.('', { id: '1', status: 'active' }) ?? null);
    fireEvent.click(screen.getByRole('button', { name: 'users:actions.resetPassword' }));

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'users:messages.resetPasswordConfirm',
        content: 'users:messages.resetPasswordDescription (#1)',
        onOk: expect.any(Function),
      }),
    );
  });
});
