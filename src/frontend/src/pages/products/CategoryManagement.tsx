import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/inventory/productService';
import { useResponsive } from '@/hooks/useResponsive';

export default function CategoryManagement() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => productService.createCategory(values),
    onSuccess: () => {
      message.success('Tạo danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: () => {
      message.error('Tạo danh mục thất bại!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productService.updateCategory(id, data),
    onSuccess: () => {
      message.success('Cập nhật danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: () => {
      message.error('Cập nhật danh mục thất bại!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteCategory(id),
    onSuccess: () => {
      message.success('Xóa danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Xóa danh mục thất bại!';
      message.error(errorMessage);
    },
  });

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue(category);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = (values: any) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số sản phẩm',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 120,
      render: (count: number) => count || 0,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => {
        const hasProducts = record.productCount > 0;
        return (
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa danh mục"
              description={
                hasProducts
                  ? `Danh mục này có ${record.productCount} sản phẩm. Không thể xóa!`
                  : 'Bạn có chắc muốn xóa danh mục này?'
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={hasProducts}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                disabled={hasProducts}
                title={hasProducts ? 'Không thể xóa danh mục có sản phẩm' : ''}
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
          Quay Lại
        </Button>
      </div>
      <Card
        title="Quản lý danh mục sản phẩm"
        bordered={false}
        style={{ margin: 0 }}
        bodyStyle={{ padding: 0 }}
        headStyle={{ paddingLeft: 24, paddingRight: 24 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm danh mục
          </Button>
        }
      >
        <Table
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Ví dụ: Tấm thạch cao" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả danh mục" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={handleCloseModal}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
