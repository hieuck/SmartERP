import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WorkflowBuilder } from '../components/workflow/WorkflowBuilder';
import { DashboardBuilder } from '../components/bi/DashboardBuilder';
import { CommentSection } from '../components/collaboration/CommentSection';
import { FormBuilder } from '../components/custom-fields/FormBuilder';
import { DocumentBrowser } from '../components/documents/DocumentBrowser';
import { WarehouseMap } from '../components/warehouse/WarehouseMap';

describe('Enterprise Features Integration Tests', () => {
  describe('Workflow Builder', () => {
    it('should add a new workflow step', async () => {
      const onSave = vi.fn();
      render(<WorkflowBuilder onSave={onSave} />);

      const addButton = screen.getByText('Thêm bước');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Bước 1')).toBeInTheDocument();
      });
    });

    it('should remove a workflow step', async () => {
      const onSave = vi.fn();
      render(<WorkflowBuilder onSave={onSave} />);

      // Add a step first
      const addButton = screen.getByText('Thêm bước');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Bước 1')).toBeInTheDocument();
      });

      // Remove the step
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => btn.querySelector('.anticon-delete'));
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Bước 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Builder', () => {
    it('should display existing widgets', () => {
      render(<DashboardBuilder />);

      expect(screen.getByText('Doanh thu tháng')).toBeInTheDocument();
      expect(screen.getByText('Xu hướng bán hàng')).toBeInTheDocument();
      expect(screen.getByText('Top sản phẩm')).toBeInTheDocument();
    });

    it('should open add widget modal', async () => {
      render(<DashboardBuilder />);

      const addButton = screen.getByRole('button', { name: /thêm widget/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should delete a widget', async () => {
      render(<DashboardBuilder />);

      const deleteButtons = screen.getAllByRole('button');
      const firstDeleteButton = deleteButtons.find((btn) => btn.querySelector('.anticon-delete'));

      if (firstDeleteButton) {
        fireEvent.click(firstDeleteButton);

        await waitFor(() => {
          // Widget should be removed
          const widgets = screen.queryAllByText(/Doanh thu tháng|Xu hướng bán hàng|Top sản phẩm/);
          expect(widgets.length).toBeLessThan(3);
        });
      }
    });
  });

  describe('Collaboration Features', () => {
    it('should display existing comments', () => {
      render(<CommentSection recordId="test-1" />);

      expect(screen.getByText('Đơn hàng này cần xử lý gấp')).toBeInTheDocument();
      expect(screen.getByText(/Đã xác nhận/)).toBeInTheDocument();
    });

    it('should add a new comment', async () => {
      render(<CommentSection recordId="test-1" />);

      const textarea = screen.getByPlaceholderText(/Nhập bình luận/);
      fireEvent.change(textarea, { target: { value: 'Test comment' } });

      const submitButton = screen.getByText('Gửi bình luận');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test comment')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Fields', () => {
    it('should display add field button', () => {
      render(<FormBuilder />);

      expect(screen.getByText('Thêm trường')).toBeInTheDocument();
    });

    it('should show form when adding field', async () => {
      render(<FormBuilder />);

      const addButton = screen.getByText('Thêm trường');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Thêm trường mới')).toBeInTheDocument();
        expect(screen.getByLabelText('Tên trường')).toBeInTheDocument();
      });
    });
  });

  describe('Document Management', () => {
    it('should display document list', () => {
      render(<DocumentBrowser />);

      expect(screen.getByText('Hợp đồng mua bán.pdf')).toBeInTheDocument();
      expect(screen.getByText('Báo giá sản phẩm.xlsx')).toBeInTheDocument();
    });

    it('should have upload button', () => {
      render(<DocumentBrowser />);

      expect(screen.getByText('Tải lên tài liệu')).toBeInTheDocument();
    });
  });

  describe('Warehouse Map', () => {
    it('should display warehouse locations', () => {
      render(<WarehouseMap />);

      expect(screen.getByText(/Sơ đồ kho/)).toBeInTheDocument();
      expect(screen.getByText('A-01-R1-B1')).toBeInTheDocument();
    });

    it('should allow zone selection', async () => {
      render(<WarehouseMap />);

      const select = screen.getByRole('combobox');
      fireEvent.mouseDown(select);

      await waitFor(() => {
        const options = screen.getAllByText(/Khu [ABC]/);
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });
});
