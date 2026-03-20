import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductCatalogForm from './ProductCatalogForm';

const {
  axiosGetMock,
  invalidateQueriesMock,
  mutateMock,
  navigateMock,
  setFieldsValueMock,
  useParamsMock,
} = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  mutateMock: vi.fn(),
  navigateMock: vi.fn(),
  setFieldsValueMock: vi.fn(),
  useParamsMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock,
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({
    enabled,
    queryFn,
  }: {
    enabled?: boolean;
    queryFn?: () => Promise<unknown>;
  }) => {
    if (enabled && queryFn) {
      void queryFn();
    }
    return { data: undefined, isLoading: false };
  },
  useMutation: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => useParamsMock(),
}));

vi.mock('@ant-design/icons', () => ({
  ArrowLeftOutlined: () => <span>icon-back</span>,
  SaveOutlined: () => <span>icon-save</span>,
}));

vi.mock('antd', () => {
  const formApi = {
    setFieldsValue: setFieldsValueMock,
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

  const SelectComponent = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  SelectComponent.Option = ({ children }: { children?: React.ReactNode }) => <option>{children}</option>;

  return {
    App: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
      useApp: () => ({
        message: {
          error: vi.fn(),
          success: vi.fn(),
        },
      }),
    }),
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
      ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
      {
        TextArea: ({ placeholder }: { placeholder?: string }) => <textarea placeholder={placeholder} />,
      },
    ),
    InputNumber: () => <input type="number" />,
    Select: SelectComponent,
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Switch: () => <input type="checkbox" />,
    Typography: {
      Title: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
    },
  };
});

describe('ProductCatalogForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParamsMock.mockReturnValue({});
    axiosGetMock.mockResolvedValue({
      data: {
        sku: 'SKU-001',
        name: 'Laptop Pro',
      },
    });
  });

  it('renders create mode labels and actions', () => {
    render(<ProductCatalogForm />);

    expect(screen.getByText('catalog.form.titleCreate')).toBeInTheDocument();
    expect(screen.getByText('catalog.form.back')).toBeInTheDocument();
    expect(screen.getByText('catalog.form.buttons.create')).toBeInTheDocument();
    expect(screen.getByText('catalog.form.buttons.cancel')).toBeInTheDocument();
    expect(screen.getByText('catalog.categories.electronics')).toBeInTheDocument();
  });

  it('loads product data in edit mode', async () => {
    useParamsMock.mockReturnValue({ id: 'P-1' });

    render(<ProductCatalogForm />);

    expect(screen.getByText('catalog.form.titleEdit')).toBeInTheDocument();

    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenCalledWith('/api/ecommerce/products/P-1');
      expect(setFieldsValueMock).toHaveBeenCalledWith({
        sku: 'SKU-001',
        name: 'Laptop Pro',
      });
    });
  });
});
