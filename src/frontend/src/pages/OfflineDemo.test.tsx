import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OfflineDemo from './OfflineDemo';

const {
  getItemMock,
  messageMock,
  resetFieldsMock,
  setFieldsValueMock,
  toArrayMock,
} = vi.hoisted(() => ({
  getItemMock: vi.fn(),
  messageMock: {
    error: vi.fn(),
    success: vi.fn(),
  },
  resetFieldsMock: vi.fn(),
  setFieldsValueMock: vi.fn(),
  toArrayMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/offline', () => ({
  SyncStatus: {
    CONFLICT: 'CONFLICT',
    PENDING: 'PENDING',
    SYNCED: 'SYNCED',
  },
  db: {
    users: {
      add: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      toArray: toArrayMock,
    },
  },
  syncManager: {
    queueOperation: vi.fn(),
    sync: vi.fn(),
  },
}));

vi.mock('antd', () => {
  const formApi = {
    resetFields: resetFieldsMock,
    setFieldsValue: setFieldsValueMock,
    submit: vi.fn(),
  };

  const FormComponent = ({
    children,
  }: {
    children?: React.ReactNode;
  }) => <form>{children}</form>;

  const FormItem = ({
    children,
    label,
  }: {
    children?: React.ReactNode;
    label?: React.ReactNode;
  }) => (
    <div>
      {label ? <div>{label}</div> : null}
      {children}
    </div>
  );

  return {
    Button: ({
      children,
      onClick,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
    }) => <button onClick={onClick}>{children}</button>,
    Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Form: Object.assign(FormComponent, {
      Item: FormItem,
      useForm: () => [formApi],
    }),
    Input: () => <input />,
    App: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, { useApp: () => ({ message: messageMock }) }),
    Modal: ({
      children,
      open,
      title,
    }: {
      children?: React.ReactNode;
      open?: boolean;
      title?: React.ReactNode;
    }) =>
      open ? (
        <div>
          <div>{title}</div>
          {children}
        </div>
      ) : null,
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Table: ({
      dataSource = [],
      columns = [],
    }: {
      dataSource?: Array<Record<string, unknown>>;
      columns?: Array<{
        key?: string;
        dataIndex?: string;
        render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
      }>;
    }) => (
      <div>
        {dataSource.map((record) => (
          <div key={String(record.id)}>
            {columns.map((column, index) => (
              <div key={`${String(record.id)}-${column.key ?? column.dataIndex ?? index}`}>
                {column.render
                  ? column.dataIndex
                    ? column.render(record[column.dataIndex], record)
                    : column.render(record)
                  : String(column.dataIndex ? record[column.dataIndex] ?? '' : '')}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
    Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Typography: {
      Paragraph: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
      Title: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
    },
  };
});

vi.mock('@ant-design/icons', () => ({
  DeleteOutlined: () => <span>icon-delete</span>,
  EditOutlined: () => <span>icon-edit</span>,
  PlusOutlined: () => <span>icon-plus</span>,
  SyncOutlined: () => <span>icon-sync</span>,
}));

describe('OfflineDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toArrayMock.mockResolvedValue([
      {
        id: 'U-1',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Admin',
        version: 2,
        syncStatus: 'PENDING',
      },
    ]);
    vi.mocked(global.localStorage.getItem).mockImplementation(getItemMock);
    getItemMock.mockReturnValue(null);
  });

  it('loads users from the offline database on mount', async () => {
    render(<App><OfflineDemo /></App>);

    await waitFor(() => {
      expect(toArrayMock).toHaveBeenCalled();
    });

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
  });

  it('opens the add-user modal and resets the form', async () => {
    render(<OfflineDemo />);

    await waitFor(() => {
      expect(screen.getByText('offline:buttons.addUser')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('offline:buttons.addUser'));

    expect(resetFieldsMock).toHaveBeenCalled();
    expect(screen.getByText('offline:modal.addUser')).toBeInTheDocument();
  });

  it('shows a login-required message when syncing without a token', async () => {
    render(<OfflineDemo />);

    await waitFor(() => {
      expect(screen.getByText('offline:buttons.syncNow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('offline:buttons.syncNow'));

    expect(messageMock.error).toHaveBeenCalledWith('offline:messages.loginRequired');
  });
});
