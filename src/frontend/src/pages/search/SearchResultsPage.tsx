import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Tabs,
  List,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ShoppingOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import searchService, {
  SearchHit,
  SearchResult,
} from '@/services/utils/searchService';
import AdvancedFilterPanel from '@/components/search/AdvancedFilterPanel';
import { buildSearchRoute } from '@/components/search/searchRoutes';
import { logger } from '@/lib/logger/logger.service';

const { Search } = Input;
const { Text } = Typography;

type FilterValue = string | number | boolean | Dayjs[] | null | undefined;
type FilterMap = Record<string, FilterValue>;

function getStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getDisplayValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

const SearchResultsPage: React.FC = () => {
  const { t } = useTranslation('search');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterMap>({});

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery) return;

    setLoading(true);
    try {
      let result: SearchResult;

      switch (activeTab) {
        case 'products':
          result = await searchService.searchProducts(searchQuery, filters);
          break;
        case 'customers':
          result = await searchService.searchCustomers(searchQuery, filters);
          break;
        case 'suppliers':
          result = await searchService.searchSuppliers(searchQuery, filters);
          break;
        case 'orders':
          result = await searchService.searchOrders(searchQuery, filters);
          break;
        default:
          result = await searchService.globalSearch(searchQuery);
      }

      setResults(result);
    } catch (error) {
      logger.error('SearchResultsPage', 'Search error', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setSearchParams({ q: value });
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (query) {
      performSearch(query);
    }
  };

  const handleApplyFilters = (newFilters: FilterMap) => {
    setFilters(newFilters);
    if (query) {
      performSearch(query);
    }
  };

  const handleItemClick = (type: string, id: string, source: Record<string, unknown>) => {
    const route = buildSearchRoute(type, id, source);
    if (route) {
      navigate(route);
    }
  };

  const renderResultItem = (hit: SearchHit) => {
    const source = hit._source;
    const type = hit._index;

    let icon: React.ReactNode;
    let title: string;
    let description: string;
    let tags: React.ReactNode[] = [];

    switch (type) {
      case 'products':
        icon = <ShoppingOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
        title = getStringValue(source.name, t('types.unknown'));
        description = `${t('fields.sku')}: ${getDisplayValue(source.sku)} | ${t('fields.price')}: ${getDisplayValue(source.salePrice)} VND`;
        tags = [
          <Tag color="blue" key="type">
            {t('types.product')}
          </Tag>,
          <Tag key="status">{getDisplayValue(source.status)}</Tag>,
        ];
        break;
      case 'customers':
        icon = <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
        title = getStringValue(source.name, t('types.unknown'));
        description = `${t('fields.code')}: ${getDisplayValue(source.code)} | ${t('fields.type')}: ${getDisplayValue(source.type)}`;
        tags = [
          <Tag color="green" key="type">
            {t('types.customer')}
          </Tag>,
          <Tag key="status">{getDisplayValue(source.status)}</Tag>,
        ];
        break;
      case 'suppliers':
        icon = <TeamOutlined style={{ fontSize: 24, color: '#fa8c16' }} />;
        title = getStringValue(source.name, t('types.unknown'));
        description = `${t('fields.code')}: ${getDisplayValue(source.code)} | ${t('fields.rating')}: ${getDisplayValue(source.rating, t('fields.na'))}`;
        tags = [
          <Tag color="orange" key="type">
            {t('types.supplier')}
          </Tag>,
          <Tag key="status">{getDisplayValue(source.status)}</Tag>,
        ];
        break;
      case 'orders':
        icon = <ShoppingCartOutlined style={{ fontSize: 24, color: '#722ed1' }} />;
        title = `${t('fields.order')} ${getDisplayValue(source.code)}`;
        description = `${t('fields.total')}: ${getDisplayValue(source.totalAmount)} VND | ${t('fields.date')}: ${getDisplayValue(source.orderDate)}`;
        tags = [
          <Tag color="purple" key="type">
            {source.type === 'sales' ? t('types.sales') : t('types.purchase')}
          </Tag>,
          <Tag key="status">{getDisplayValue(source.status)}</Tag>,
        ];
        break;
      default:
        icon = <SearchOutlined style={{ fontSize: 24 }} />;
        title = t('types.unknown');
        description = '';
        tags = [];
    }

    return (
      <List.Item
        key={hit._id}
        onClick={() => handleItemClick(type, hit._id, source)}
        style={{ cursor: 'pointer' }}
      >
        <List.Item.Meta avatar={icon} title={<a>{title}</a>} description={description} />
        <Space>{tags}</Space>
      </List.Item>
    );
  };

  const getTabModule = (): 'products' | 'customers' | 'suppliers' | 'orders' => {
    switch (activeTab) {
      case 'products':
        return 'products';
      case 'customers':
        return 'customers';
      case 'suppliers':
        return 'suppliers';
      case 'orders':
        return 'orders';
      default:
        return 'products';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder={t('search.placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onSearch={handleSearch}
                size="large"
                enterButton
                allowClear
              />
            </Col>
            {activeTab !== 'all' && (
              <Col>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterVisible(true)}
                  size="large"
                >
                  {t('search.filters')}
                </Button>
              </Col>
            )}
          </Row>

          {results && (
            <div>
              <Text type="secondary">
                {t('search.resultsFound', { count: results.hits.total.value, query })}
              </Text>
            </div>
          )}

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              { key: 'all', label: t('tabs.all') },
              { key: 'products', label: t('tabs.products') },
              { key: 'customers', label: t('tabs.customers') },
              { key: 'suppliers', label: t('tabs.suppliers') },
              { key: 'orders', label: t('tabs.orders') },
            ]}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : results && results.hits.hits.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={results.hits.hits}
              renderItem={renderResultItem}
              pagination={{
                pageSize: 20,
                total: results.hits.total.value,
                showSizeChanger: true,
                showTotal: (total) => t('search.totalItems', { total }),
              }}
            />
          ) : query ? (
            <Empty description={t('search.noResults')} />
          ) : (
            <Empty description={t('search.enterQuery')} />
          )}
        </Space>
      </Card>

      {activeTab !== 'all' && (
        <AdvancedFilterPanel
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onApplyFilters={handleApplyFilters}
          module={getTabModule()}
          initialFilters={filters}
        />
      )}
    </div>
  );
};

export default SearchResultsPage;
