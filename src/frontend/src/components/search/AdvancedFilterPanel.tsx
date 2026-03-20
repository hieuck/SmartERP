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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('search');
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
      message.error(t('advancedFilters.messages.enterName'));
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
      message.error(t('advancedFilters.messages.atLeastOne'));
      return;
    }

    searchService.saveFilter(filterName, module, filters);
    message.success(t('advancedFilters.messages.saved'));
    setFilterName('');
    setShowSaveDialog(false);
    loadSavedFilters();
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    form.setFieldsValue(filter.filters);
    message.success(t('advancedFilters.messages.loaded', { name: filter.name }));
  };

  const handleDeleteFilter = (id: string) => {
    searchService.deleteFilter(id);
    message.success(t('advancedFilters.messages.deleted'));
    loadSavedFilters();
  };

  const renderFilterFields = () => {
    switch (module) {
      case 'products':
        return (
          <>
            <Form.Item name="category" label={t('advancedFilters.fields.category')}>
              <Input placeholder={t('advancedFilters.placeholders.enterCategory')} />
            </Form.Item>
            <Form.Item name="status" label={t('advancedFilters.fields.status')}>
              <Select placeholder={t('advancedFilters.placeholders.selectStatus')} allowClear>
                <Option value="active">{t('advancedFilters.options.active')}</Option>
                <Option value="inactive">{t('advancedFilters.options.inactive')}</Option>
                <Option value="discontinued">{t('advancedFilters.options.discontinued')}</Option>
              </Select>
            </Form.Item>
            <Form.Item label={t('advancedFilters.fields.priceRange')}>
              <Space>
                <Form.Item name="minPrice" noStyle>
                  <InputNumber placeholder={t('advancedFilters.placeholders.min')} style={{ width: 120 }} />
                </Form.Item>
                <span>-</span>
                <Form.Item name="maxPrice" noStyle>
                  <InputNumber placeholder={t('advancedFilters.placeholders.max')} style={{ width: 120 }} />
                </Form.Item>
              </Space>
            </Form.Item>
          </>
        );

      case 'customers':
        return (
          <>
            <Form.Item name="type" label={t('advancedFilters.fields.customerType')}>
              <Select placeholder={t('advancedFilters.placeholders.selectType')} allowClear>
                <Option value="individual">{t('advancedFilters.options.individual')}</Option>
                <Option value="business">{t('advancedFilters.options.business')}</Option>
                <Option value="reseller">{t('advancedFilters.options.reseller')}</Option>
                <Option value="vip">{t('advancedFilters.options.vip')}</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label={t('advancedFilters.fields.status')}>
              <Select placeholder={t('advancedFilters.placeholders.selectStatus')} allowClear>
                <Option value="active">{t('advancedFilters.options.active')}</Option>
                <Option value="inactive">{t('advancedFilters.options.inactive')}</Option>
                <Option value="blocked">{t('advancedFilters.options.blocked')}</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'suppliers':
        return (
          <>
            <Form.Item name="minRating" label={t('advancedFilters.fields.minRating')}>
              <InputNumber
                min={0}
                max={5}
                step={0.5}
                placeholder={t('advancedFilters.placeholders.rating')}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="status" label={t('advancedFilters.fields.status')}>
              <Select placeholder={t('advancedFilters.placeholders.selectStatus')} allowClear>
                <Option value="active">{t('advancedFilters.options.active')}</Option>
                <Option value="inactive">{t('advancedFilters.options.inactive')}</Option>
                <Option value="blocked">{t('advancedFilters.options.blocked')}</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'orders':
        return (
          <>
            <Form.Item name="type" label={t('advancedFilters.fields.orderType')}>
              <Select placeholder={t('advancedFilters.placeholders.selectType')} allowClear>
                <Option value="sales">{t('advancedFilters.options.salesOrder')}</Option>
                <Option value="purchase">{t('advancedFilters.options.purchaseOrder')}</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label={t('advancedFilters.fields.status')}>
              <Select placeholder={t('advancedFilters.placeholders.selectStatus')} allowClear>
                <Option value="draft">{t('advancedFilters.options.draft')}</Option>
                <Option value="confirmed">{t('advancedFilters.options.confirmed')}</Option>
                <Option value="preparing">{t('advancedFilters.options.preparing')}</Option>
                <Option value="shipping">{t('advancedFilters.options.shipping')}</Option>
                <Option value="completed">{t('advancedFilters.options.completed')}</Option>
                <Option value="cancelled">{t('advancedFilters.options.cancelled')}</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label={t('advancedFilters.fields.dateRange')}>
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
          <span>{t('advancedFilters.title')}</span>
        </Space>
      }
      placement="right"
      width={400}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={handleReset}>{t('advancedFilters.actions.reset')}</Button>
          <Space>
            <Button onClick={() => setShowSaveDialog(!showSaveDialog)}>
              <SaveOutlined /> {t('advancedFilters.actions.saveFilter')}
            </Button>
            <Button type="primary" onClick={handleApply}>
              {t('advancedFilters.actions.apply')}
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
              placeholder={t('advancedFilters.placeholders.filterName')}
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onPressEnter={handleSaveFilter}
            />
            <Button type="primary" block onClick={handleSaveFilter}>
              {t('advancedFilters.actions.saveCurrent')}
            </Button>
          </Space>
        </>
      )}

      {savedFilters.length > 0 && (
        <>
          <Divider>{t('advancedFilters.savedFilters')}</Divider>
          <List
            size="small"
            dataSource={savedFilters}
            renderItem={(filter) => (
              <List.Item
                actions={[
                  <Button type="link" size="small" onClick={() => handleLoadFilter(filter)}>
                    {t('advancedFilters.actions.load')}
                  </Button>,
                  <Popconfirm
                    title={t('advancedFilters.deleteConfirm')}
                    onConfirm={() => handleDeleteFilter(filter.id)}
                    okText={t('advancedFilters.actions.confirm')}
                    cancelText={t('advancedFilters.actions.cancel')}
                  >
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={filter.name}
                  description={t('advancedFilters.createdAt', {
                    date: dayjs(filter.createdAt).format('YYYY-MM-DD HH:mm'),
                  })}
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
