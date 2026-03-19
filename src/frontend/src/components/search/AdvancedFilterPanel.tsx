import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Divider,
  App,
  Popconfirm,
  List,
} from 'antd';
import { FilterOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import searchService, { SavedFilter } from '@/services/utils/searchService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

type FilterValue = string | number | boolean | dayjs.Dayjs[] | null | undefined;
type FilterMap = Record<string, FilterValue>;

interface AdvancedFilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterMap) => void;
  module: 'products' | 'customers' | 'suppliers' | 'orders';
  initialFilters?: FilterMap;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  visible,
  onClose,
  onApplyFilters,
  module,
  initialFilters = {},
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    loadSavedFilters();
  }, [module]);

  useEffect(() => {
    if (initialFilters) {
      form.setFieldsValue(initialFilters);
    }
  }, [initialFilters, form]);

  const loadSavedFilters = () => {
    const filters = searchService.getSavedFilters(module);
    setSavedFilters(filters);
  };

  const handleApply = () => {
    const values = form.getFieldsValue();

    // Clean up empty values
    const filters: FilterMap = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        filters[key] = values[key];
      }
    });

    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    onApplyFilters({});
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      message.error('Please enter a filter name');
      return;
    }

    const values = form.getFieldsValue();
    const filters: FilterMap = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        filters[key] = values[key];
      }
    });

    if (Object.keys(filters).length === 0) {
      message.error('Please set at least one filter');
      return;
    }

    searchService.saveFilter(filterName, module, filters);
    message.success('Filter saved successfully');
    setFilterName('');
    setShowSaveDialog(false);
    loadSavedFilters();
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    form.setFieldsValue(filter.filters);
    message.success(`Filter "${filter.name}" loaded`);
  };

  const handleDeleteFilter = (id: string) => {
    searchService.deleteFilter(id);
    message.success('Filter deleted');
    loadSavedFilters();
  };

  const renderFilterFields = () => {
    switch (module) {
      case 'products':
        return (
          <>
            <Form.Item name="category" label="Category">
              <Input placeholder="Enter category" />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status" allowClear>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="discontinued">Discontinued</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Price Range">
              <Space>
                <Form.Item name="minPrice" noStyle>
                  <InputNumber placeholder="Min" style={{ width: 120 }} />
                </Form.Item>
                <span>-</span>
                <Form.Item name="maxPrice" noStyle>
                  <InputNumber placeholder="Max" style={{ width: 120 }} />
                </Form.Item>
              </Space>
            </Form.Item>
          </>
        );

      case 'customers':
        return (
          <>
            <Form.Item name="type" label="Customer Type">
              <Select placeholder="Select type" allowClear>
                <Option value="individual">Individual</Option>
                <Option value="business">Business</Option>
                <Option value="reseller">Reseller</Option>
                <Option value="vip">VIP</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status" allowClear>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="blocked">Blocked</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'suppliers':
        return (
          <>
            <Form.Item name="minRating" label="Minimum Rating">
              <InputNumber min={0} max={5} step={0.5} placeholder="0-5" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status" allowClear>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="blocked">Blocked</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'orders':
        return (
          <>
            <Form.Item name="type" label="Order Type">
              <Select placeholder="Select type" allowClear>
                <Option value="sales">Sales Order</Option>
                <Option value="purchase">Purchase Order</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status" allowClear>
                <Option value="draft">Draft</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="preparing">Preparing</Option>
                <Option value="shipping">Shipping</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label="Date Range">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <FilterOutlined />
          <span>Advanced Filters</span>
        </Space>
      }
      placement="right"
      width={400}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={handleReset}>Reset</Button>
          <Space>
            <Button onClick={() => setShowSaveDialog(!showSaveDialog)}>
              <SaveOutlined /> Save Filter
            </Button>
            <Button type="primary" onClick={handleApply}>
              Apply Filters
            </Button>
          </Space>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {renderFilterFields()}
      </Form>

      {showSaveDialog && (
        <>
          <Divider />
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Enter filter name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onPressEnter={handleSaveFilter}
            />
            <Button type="primary" block onClick={handleSaveFilter}>
              Save Current Filters
            </Button>
          </Space>
        </>
      )}

      {savedFilters.length > 0 && (
        <>
          <Divider>Saved Filters</Divider>
          <List
            size="small"
            dataSource={savedFilters}
            renderItem={(filter) => (
              <List.Item
                actions={[
                  <Button type="link" size="small" onClick={() => handleLoadFilter(filter)}>
                    Load
                  </Button>,
                  <Popconfirm
                    title="Delete this filter?"
                    onConfirm={() => handleDeleteFilter(filter.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={filter.name}
                  description={`Created: ${dayjs(filter.createdAt).format('YYYY-MM-DD HH:mm')}`}
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Drawer>
  );
};

export default AdvancedFilterPanel;
