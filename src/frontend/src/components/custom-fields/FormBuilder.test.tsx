import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormBuilder } from './FormBuilder';

const { resetFieldsMock } = vi.hoisted(() => ({
  resetFieldsMock: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  DeleteOutlined: () => <span>icon-delete</span>,
  DragOutlined: () => <span>icon-drag</span>,
  PlusOutlined: () => <span>icon-plus</span>,
}));

vi.mock('antd', () => {
  const formValues = {
    name: 'warranty_period',
    label: 'Warranty Period',
    type: 'dropdown',
    required: true,
    options: '12 months, 24 months',
  };

  const formInstance = {
    getFieldValue: (field: string) => formValues[field as keyof typeof formValues],
    resetFields: resetFieldsMock,
  };

  const FormComponent = ({
    children,
    onFinish,
  }: {
    children?: React.ReactNode;
    onFinish?: (values: typeof formValues) => void;
  }) => <form onSubmit={(event) => {
      event.preventDefault();
      onFinish?.(formValues);
    }}>{children}</form>;

  const FormItem = ({
    children,
    label,
  }: {
    children?: React.ReactNode | ((form: typeof formInstance) => React.ReactNode);
    label?: React.ReactNode;
  }) => (
    <div>
      {label ? <div>{label}</div> : null}
      {typeof children === 'function' ? children(formInstance) : children}
    </div>
  );

  return {
    Button: ({
      children,
      htmlType,
      icon,
      onClick,
    }: {
      children?: React.ReactNode;
      htmlType?: 'button' | 'submit' | 'reset';
      icon?: React.ReactNode;
      onClick?: () => void;
    }) => (
      <button type={htmlType ?? 'button'} onClick={onClick}>
        {icon}
        {children ?? 'button'}
      </button>
    ),
    Card: ({ children, title }: { children?: React.ReactNode; title?: React.ReactNode }) => (
      <section>
        {title ? <h2>{title}</h2> : null}
        {children}
      </section>
    ),
    Form: Object.assign(FormComponent, {
      Item: FormItem,
      useForm: () => [formInstance],
    }),
    Input: ({ placeholder }: { placeholder?: string }) => (
      <input aria-label={placeholder ?? 'input'} placeholder={placeholder} />
    ),
    List: Object.assign(
      ({
        dataSource = [],
        renderItem,
      }: {
        dataSource?: Array<{
          id: string;
          label: string;
          type: string;
          required: boolean;
        }>;
        renderItem: (item: {
          id: string;
          label: string;
          type: string;
          required: boolean;
        }) => React.ReactNode;
      }) => <div>{dataSource.map((item) => <div key={item.id}>{renderItem(item)}</div>)}</div>,
      {
        Item: Object.assign(({
          children,
          actions,
        }: {
          children?: React.ReactNode;
          actions?: React.ReactNode[];
        }) => (
          <div>
            <div>{children}</div>
            <div>{actions}</div>
          </div>
        ), {
          Meta: ({
            avatar,
            title,
            description,
          }: {
            avatar?: React.ReactNode;
            title?: React.ReactNode;
            description?: React.ReactNode;
          }) => (
            <div>
              {avatar}
              <div>{title}</div>
              <div>{description}</div>
            </div>
          ),
        }),
      },
    ),
    Select: Object.assign(
      ({ children }: { children?: React.ReactNode }) => <select>{children}</select>,
      {
        Option: ({
          children,
          value,
        }: {
          children?: React.ReactNode;
          value?: string;
        }) => <option value={value}>{children}</option>,
      },
    ),
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Switch: () => <input type="checkbox" aria-label="required-switch" />,
  };
});

describe('FormBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the add-field builder and shows conditional options input', () => {
    render(<FormBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /Thêm trường/ }));

    expect(screen.getByText('Thêm trường mới')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('vd: Tùy chọn 1, Tùy chọn 2, Tùy chọn 3'),
    ).toBeInTheDocument();
  });

  it('adds a new custom field through the form submit flow', () => {
    render(<FormBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /Thêm trường/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }));

    expect(screen.getByText('Warranty Period')).toBeInTheDocument();
    expect(screen.getByText('Loại: dropdown (Bắt buộc)')).toBeInTheDocument();
    expect(screen.queryByText('Thêm trường mới')).not.toBeInTheDocument();
    expect(resetFieldsMock).toHaveBeenCalled();
  });

  it('deletes a custom field after it has been added', () => {
    render(<FormBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /Thêm trường/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }));
    fireEvent.click(screen.getByText('icon-delete'));

    expect(screen.queryByText('Warranty Period')).not.toBeInTheDocument();
  });
});
