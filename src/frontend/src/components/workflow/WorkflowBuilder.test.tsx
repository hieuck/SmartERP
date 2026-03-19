import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowBuilder } from './WorkflowBuilder';

const { successMock } = vi.hoisted(() => ({
  successMock: vi.fn(),
}));

vi.mock('./WorkflowBuilder.module.css', () => ({
  default: {
    container: 'container',
    stepsContainer: 'steps-container',
    actionBar: 'action-bar',
    saveButton: 'save-button',
  },
}));

vi.mock('@ant-design/icons', () => ({
  DeleteOutlined: () => <span>icon-delete</span>,
  PlusOutlined: () => <span>icon-plus</span>,
}));

vi.mock('antd', () => ({
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
    children: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{extra}</div>
      <div>{children}</div>
    </div>
  ),
  Form: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    {
      Item: ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => (
        <div>
          <div>{label}</div>
          <div>{children}</div>
        </div>
      ),
    },
  ),
  Input: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
  }) => <input aria-label="step-name" value={value} onChange={(event) => onChange?.({ target: { value: event.target.value } })} />,
  Select: Object.assign(
    ({
      value,
      onChange,
      children,
      placeholder,
    }: {
      value?: string;
      onChange?: (value: string) => void;
      children?: React.ReactNode;
      placeholder?: string;
    }) => (
      <div>
        <button onClick={() => onChange?.('notification')}>{value ?? placeholder ?? 'select'}</button>
        <div>{children}</div>
      </div>
    ),
    {
      Option: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
        <option value={value}>{children}</option>
      ),
    },
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  message: {
    success: successMock,
  },
}));

describe('WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a workflow step and lets the user rename it', () => {
    render(<WorkflowBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /ThÃªm bÆ°á»›c|Thêm bước/ }));

    expect(screen.getByText(/BÆ°á»›c 1|Bước 1/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('step-name'), { target: { value: 'Approval step' } });

    expect(screen.getByDisplayValue('Approval step')).toBeInTheDocument();
  });

  it('switches step type and removes the step', () => {
    render(<WorkflowBuilder />);

    fireEvent.click(screen.getByRole('button', { name: /ThÃªm bÆ°á»›c|Thêm bước/ }));
    fireEvent.click(screen.getByRole('button', { name: 'approval' }));

    expect(screen.getByRole('button', { name: 'notification' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'icon-delete' }));

    expect(screen.queryByText(/BÆ°á»›c 1|Bước 1/)).not.toBeInTheDocument();
  });

  it('saves the current steps and shows a success message', () => {
    const onSave = vi.fn();

    render(<WorkflowBuilder onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /ThÃªm bÆ°á»›c|Thêm bước/ }));
    fireEvent.click(screen.getByRole('button', { name: /LÆ°u quy trÃ¬nh|Lưu quy trình/ }));

    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'approval',
        name: expect.stringMatching(/BÆ°á»›c má»›i|Bước mới/),
      }),
    ]);
    expect(successMock).toHaveBeenCalledWith(expect.stringMatching(/ÄÃ£ lÆ°u quy trÃ¬nh|Đã lưu quy trình/));
  });
});
