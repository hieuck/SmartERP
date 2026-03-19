import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedFilterPanel from './AdvancedFilterPanel';

const {
  setFieldsValueMock,
  getFieldsValueMock,
  resetFieldsMock,
  getSavedFiltersMock,
  saveFilterMock,
  deleteFilterMock,
  successMock,
  errorMock,
} = vi.hoisted(() => ({
  setFieldsValueMock: vi.fn(),
  getFieldsValueMock: vi.fn(),
  resetFieldsMock: vi.fn(),
  getSavedFiltersMock: vi.fn(),
  saveFilterMock: vi.fn(),
  deleteFilterMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn(),
}));

vi.mock('@/services/utils/searchService', () => ({
  default: {
    getSavedFilters: getSavedFiltersMock,
    saveFilter: saveFilterMock,
    deleteFilter: deleteFilterMock,
  },
}));

vi.mock('dayjs', () => ({
  default: (value?: string) => ({
    format: () => `formatted:${value ?? ''}`,
  }),
}));

vi.mock('@ant-design/icons', () => ({
  FilterOutlined: () => <span>icon-filter</span>,
  SaveOutlined: () => <span>icon-save</span>,
  DeleteOutlined: () => <span>icon-delete</span>,
}));

vi.mock('antd', () => {
  const formInstance = {
    setFieldsValue: setFieldsValueMock,
    getFieldsValue: getFieldsValueMock,
    resetFields: resetFieldsMock,
  };

  const FormItem = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => (
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
    }) => <button onClick={onClick}>{children ?? 'button'}</button>,
    DatePicker: {
      RangePicker: () => <div>range-picker</div>,
    },
    Divider: ({ children }: { children?: React.ReactNode }) => <div>{children ?? 'divider'}</div>,
    Drawer: ({
      children,
      footer,
      title,
      open,
    }: {
      children: React.ReactNode;
      footer?: React.ReactNode;
      title?: React.ReactNode;
      open?: boolean;
    }) => (open ? <div><div>{title}</div><div>{children}</div><div>{footer}</div></div> : null),
    Form: Object.assign(
      ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      {
        Item: FormItem,
        useForm: () => [formInstance],
      },
    ),
    Input: Object.assign(
      ({
        value,
        onChange,
        placeholder,
        onPressEnter,
      }: {
        value?: string;
        onChange?: (event: { target: { value: string } }) => void;
        placeholder?: string;
        onPressEnter?: () => void;
      }) => (
        <div>
          <input
            aria-label={String(placeholder ?? 'input')}
            value={value}
            onChange={(event) => onChange?.({ target: { value: event.target.value } })}
          />
          <button onClick={onPressEnter}>press-enter</button>
        </div>
      ),
      {},
    ),
    InputNumber: ({ placeholder }: { placeholder?: string }) => (
      <input aria-label={String(placeholder ?? 'number-input')} />
    ),
    List: Object.assign(
      ({
        dataSource = [],
        renderItem,
      }: {
        dataSource?: unknown[];
        renderItem: (item: unknown) => React.ReactNode;
      }) => <div>{dataSource.map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div>,
      {
        Item: Object.assign(
          ({
            children,
            actions,
          }: {
            children: React.ReactNode;
            actions?: React.ReactNode[];
          }) => (
            <div>
              <div>{children}</div>
              <div>{actions}</div>
            </div>
          ),
          {
            Meta: ({
              title,
              description,
            }: {
              title?: React.ReactNode;
              description?: React.ReactNode;
            }) => (
              <div>
                <div>{title}</div>
                <div>{description}</div>
              </div>
            ),
          },
        ),
      },
    ),
    Popconfirm: ({
      children,
      onConfirm,
    }: {
      children: React.ReactNode;
      onConfirm?: () => void;
    }) => <div onClick={onConfirm}>{children}</div>,
    Select: Object.assign(
      ({ children, placeholder }: { children?: React.ReactNode; placeholder?: string }) => (
        <div>
          <div>{placeholder}</div>
          {children}
        </div>
      ),
      {
        Option: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
          <option value={value}>{children}</option>
        ),
      },
    ),
    Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    App: {
      useApp: () => ({
        message: {
          success: successMock,
          error: errorMock,
        },
      }),
    },
  };
});

describe('AdvancedFilterPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSavedFiltersMock.mockReturnValue([
      {
        id: 'saved-1',
        name: 'Saved Products',
        filters: { status: 'active' },
        createdAt: '2026-03-19T00:00:00.000Z',
      },
    ]);
    getFieldsValueMock.mockReturnValue({
      status: 'active',
      minPrice: 100,
      emptyValue: '',
      nullable: null,
    });
  });

  it('loads saved filters and seeds initial filter values', () => {
    render(
      <AdvancedFilterPanel
        visible
        onClose={vi.fn()}
        onApplyFilters={vi.fn()}
        module="products"
        initialFilters={{ status: 'active' }}
      />,
    );

    expect(getSavedFiltersMock).toHaveBeenCalledWith('products');
    expect(setFieldsValueMock).toHaveBeenCalledWith({ status: 'active' });
    expect(screen.getByText('Saved Products')).toBeInTheDocument();
    expect(screen.getByText('Created: formatted:2026-03-19T00:00:00.000Z')).toBeInTheDocument();
  });

  it('applies cleaned filters and resets form state', () => {
    const onApplyFilters = vi.fn();
    const onClose = vi.fn();

    render(
      <AdvancedFilterPanel
        visible
        onClose={onClose}
        onApplyFilters={onApplyFilters}
        module="products"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onApplyFilters).toHaveBeenNthCalledWith(1, { status: 'active', minPrice: 100 });
    expect(onClose).toHaveBeenCalled();
    expect(resetFieldsMock).toHaveBeenCalled();
    expect(onApplyFilters).toHaveBeenNthCalledWith(2, {});
  });

  it('saves and deletes saved filters with validation messaging', () => {
    render(
      <AdvancedFilterPanel
        visible
        onClose={vi.fn()}
        onApplyFilters={vi.fn()}
        module="products"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Save Filter/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Current Filters' }));

    expect(errorMock).toHaveBeenCalledWith('Please enter a filter name');

    const filterNameInput = screen.getByLabelText('Enter filter name');
    fireEvent.change(filterNameInput, { target: { value: 'Active Products' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Current Filters' }));

    expect(saveFilterMock).toHaveBeenCalledWith('Active Products', 'products', {
      status: 'active',
      minPrice: 100,
    });
    expect(successMock).toHaveBeenCalledWith('Filter saved successfully');

    fireEvent.click(screen.getByRole('button', { name: 'Load' }));
    expect(setFieldsValueMock).toHaveBeenCalledWith({ status: 'active' });

    fireEvent.click(screen.getByRole('button', { name: 'button' }));
    expect(deleteFilterMock).toHaveBeenCalledWith('saved-1');
    expect(successMock).toHaveBeenCalledWith('Filter deleted');
  });
});
