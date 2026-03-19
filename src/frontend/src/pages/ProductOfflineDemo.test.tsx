import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductOfflineDemo } from './ProductOfflineDemo';

const { getAllMock, getItemMock, messageMock, resetFieldsMock, setFieldsValueMock } = vi.hoisted(
  () => ({
    getAllMock: vi.fn(),
    getItemMock: vi.fn(),
    messageMock: {
      error: vi.fn(),
      success: vi.fn(),
    },
    resetFieldsMock: vi.fn(),
    setFieldsValueMock: vi.fn(),
  }),
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../services/offline-services', () => ({
  offlineServices: {
    products: {
      create: vi.fn(),
      delete: vi.fn(),
      getAll: getAllMock,
      update: vi.fn(),
    },
  },
}));

vi.mock('../lib/offline/sync-manager', () => ({
  syncManager: {
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
    Input: Object.assign(
      ({ disabled }: { disabled?: boolean }) => <input disabled={disabled} />,
      {
        TextArea: () => <textarea />,
      },
    ),
    InputNumber: () => <input type="number" />,
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
                  ? column.render(
                      column.dataIndex ? record[column.dataIndex] : undefined,
                      record,
                    )
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

describe('ProductOfflineDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAllMock.mockResolvedValue([
      {
        id: 'P-1',
        sku: 'SKU-1',
        name: 'Laptop',
        price: 1000,
        version: 2,
        syncStatus: 'PENDING',
      },
    ]);
    vi.mocked(global.localStorage.getItem).mockImplementation(getItemMock);
    getItemMock.mockReturnValue(null);
  });

  it('loads products from offline storage on mount', async () => {
    render(<App><ProductOfflineDemo /></App>);

    await waitFor(() => {
      expect(getAllMock).toHaveBeenCalled();
    });

    expect(screen.getByText('SKU-1')).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
  });

  it('opens the add-product modal and resets the form', async () => {
    render(<ProductOfflineDemo />);

    await waitFor(() => {
      expect(screen.getByText('offline:buttons.addProduct')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('offline:buttons.addProduct'));

    expect(resetFieldsMock).toHaveBeenCalled();
    expect(screen.getByText('offline:modal.addProduct')).toBeInTheDocument();
  });

  it('shows a login-required message when syncing without a token', async () => {
    render(<ProductOfflineDemo />);

    await waitFor(() => {
      expect(screen.getByText('offline:buttons.syncNow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('offline:buttons.syncNow'));

    expect(messageMock.error).toHaveBeenCalledWith('offline:messages.loginRequired');
  });
});
