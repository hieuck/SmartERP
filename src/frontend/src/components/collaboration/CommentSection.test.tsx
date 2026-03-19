import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentSection } from './CommentSection';

vi.mock('@ant-design/icons', () => ({
  UserOutlined: () => <span>icon-user</span>,
}));

vi.mock('antd', () => ({
  Avatar: ({ children, icon }: { children?: React.ReactNode; icon?: React.ReactNode }) => (
    <div>{children ?? icon}</div>
  ),
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children ?? 'button'}</button>,
  Form: {
    Item: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  },
  Input: {
    TextArea: ({
      value,
      onChange,
      placeholder,
    }: {
      value?: string;
      onChange?: (event: { target: { value: string } }) => void;
      placeholder?: string;
    }) => (
      <textarea
        aria-label={String(placeholder ?? 'comment-input')}
        value={value}
        onChange={(event) => onChange?.({ target: { value: event.target.value } })}
      />
    ),
  },
  List: Object.assign(
    ({
      dataSource = [],
      header,
      renderItem,
    }: {
      dataSource?: unknown[];
      header?: React.ReactNode;
      renderItem: (item: unknown) => React.ReactNode;
    }) => (
      <div>
        <div>{header}</div>
        {dataSource.map((item, index) => (
          <div key={index}>{renderItem(item)}</div>
        ))}
      </div>
    ),
    {
      Item: Object.assign(
        ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        {
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
              <div>{avatar}</div>
              <div>{title}</div>
              <div>{description}</div>
            </div>
          ),
        },
      ),
    },
  ),
}));

describe('CommentSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the seeded comments and exposes the record id container attribute', () => {
    const { container } = render(<CommentSection recordId="order-1" />);

    expect(container.firstChild).toHaveAttribute('data-record-id', 'order-1');
    expect(screen.getByText(/2 bÃ¬nh luáº­n|2 bình luận/)).toBeInTheDocument();
    expect(screen.getAllByText(/Nguyá»…n VÄƒn A|Nguyễn Văn A/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tráº§n Thá»‹ B|Trần Thị B/)).toBeInTheDocument();
  });

  it('ignores empty submissions', () => {
    render(<CommentSection recordId="order-1" />);

    fireEvent.click(screen.getByRole('button', { name: /Gá»­i bÃ¬nh luáº­n|Gửi bình luận/ }));

    expect(screen.getByText(/2 bÃ¬nh luáº­n|2 bình luận/)).toBeInTheDocument();
    expect(screen.queryByText(/NgÆ°á»i dÃ¹ng hiá»‡n táº¡i|Người dùng hiện tại/)).not.toBeInTheDocument();
  });

  it('adds a new comment after the submit delay', () => {
    render(<CommentSection recordId="order-1" />);

    fireEvent.change(
      screen.getByLabelText(/Nháº­p bÃ¬nh luáº­n|Nhập bình luận/),
      { target: { value: 'Need quick approval' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /Gá»­i bÃ¬nh luáº­n|Gửi bình luận/ }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(/3 bÃ¬nh luáº­n|3 bình luận/)).toBeInTheDocument();
    expect(screen.getByText(/NgÆ°á»i dÃ¹ng hiá»‡n táº¡i|Người dùng hiện tại/)).toBeInTheDocument();
    expect(screen.getByText('Need quick approval')).toBeInTheDocument();
    expect(screen.getByText(/Vá»«a xong|Vừa xong/)).toBeInTheDocument();
  });
});
