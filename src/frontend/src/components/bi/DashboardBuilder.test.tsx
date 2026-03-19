import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardBuilder } from './DashboardBuilder';

const { resetFieldsMock } = vi.hoisted(() => ({
  resetFieldsMock: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => <span>icon-plus</span>,
  EditOutlined: () => <span>icon-edit</span>,
  DeleteOutlined: () => <span>icon-delete</span>,
  DragOutlined: () => <span>icon-drag</span>,
}));

vi.mock('antd', () => {
  let submitHandler: (() => void) | undefined;

  const formInstance = {
    resetFields: resetFieldsMock,
    submit: () => submitHandler?.(),
  };

  const FormComponent = ({
    children,
    onFinish,
  }: {
    children?: React.ReactNode;
    onFinish?: (values: {
      title: string;
      type: 'chart' | 'kpi' | 'table';
      chartType?: 'line' | 'bar' | 'pie' | 'area';
      dataSource?: string;
    }) => void;
  }) => {
    submitHandler = () =>
      onFinish?.({
        title: 'New Widget',
        type: 'table',
        dataSource: 'orders',
      });

    return <div>{children}</div>;
  };

  const FormItem = ({
    children,
    label,
    shouldUpdate,
  }: {
    children?: React.ReactNode | ((ctx: { getFieldValue: (name: string) => string | undefined }) => React.ReactNode);
    label?: React.ReactNode;
    shouldUpdate?: unknown;
  }) => {
    if (typeof children === 'function' && shouldUpdate) {
      return (
        <div>
          {children({
            getFieldValue: () => 'chart',
          })}
        </div>
      );
    }

    return (
      <div>
        <div>{label}</div>
        <div>{children}</div>
      </div>
    );
  };

  return {
    Button: ({
      children,
      onClick,
      icon,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      icon?: React.ReactNode;
    }) => <button onClick={onClick}>{children ?? icon ?? 'button'}</button>,
    Card: ({
      title,
      extra,
      children,
    }: {
      title?: React.ReactNode;
      extra?: React.ReactNode;
      children?: React.ReactNode;
    }) => (
      <div>
        <div>{title}</div>
        <div>{extra}</div>
        <div>{children}</div>
      </div>
    ),
    Col: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Form: Object.assign(FormComponent, {
      Item: FormItem,
      useForm: () => [formInstance],
    }),
    Input: () => <input aria-label="dashboard-input" />,
    Modal: ({
      title,
      open,
      onCancel,
      onOk,
      children,
    }: {
      title?: React.ReactNode;
      open?: boolean;
      onCancel?: () => void;
      onOk?: () => void;
      children?: React.ReactNode;
    }) =>
      open ? (
        <div>
          <div>{title}</div>
          <button onClick={onCancel}>cancel-modal</button>
          <button onClick={onOk}>confirm-modal</button>
          <div>{children}</div>
        </div>
      ) : null,
    Row: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Select: Object.assign(
      ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
      {
        Option: ({ children }: { children?: React.ReactNode }) => <option>{children}</option>,
      },
    ),
  };
});

describe('DashboardBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the seeded widgets', () => {
    render(<DashboardBuilder />);

    expect(screen.getByText(/Doanh thu thÃ¡ng|Doanh thu tháng/)).toBeInTheDocument();
    expect(screen.getByText(/Xu hÆ°á»›ng bÃ¡n hÃ ng|Xu hướng bán hàng/)).toBeInTheDocument();
    expect(screen.getByText(/Top sáº£n pháº©m|Top sản phẩm/)).toBeInTheDocument();
  });

  it('adds a widget through the modal submit flow', () => {
    render(<DashboardBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /ThÃªm widget|Thêm widget/ }));
    expect(screen.getByRole('button', { name: 'confirm-modal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'confirm-modal' }));

    expect(screen.getByText('New Widget')).toBeInTheDocument();
    expect(screen.getByText(/Báº£ng dá»¯ liá»‡u|Bảng dữ liệu/)).toBeInTheDocument();
    expect(resetFieldsMock).toHaveBeenCalled();
  });

  it('deletes a widget from the current layout', () => {
    render(<DashboardBuilder />);

    fireEvent.click(screen.getAllByRole('button', { name: 'icon-delete' })[0]);

    expect(screen.queryByText(/Doanh thu thÃ¡ng|Doanh thu tháng/)).not.toBeInTheDocument();
  });
});
