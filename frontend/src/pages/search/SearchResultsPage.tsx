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
import searchService, { SearchResult } from '../../services/searchService';
import AdvancedFilterPanel from '../../components/search/AdvancedFilterPanel';

const { Search } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

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
      console.error('Search error:', error);
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

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    if (query) {
      performSearch(query);
    }
  };

  const handleItemClick = (type: string, id: string) => {
    switch (type) {
      case 'products':
        navigate(`/products/${id}`);
        break;
      case 'customers':
        navigate(`/customers/${id}`);
        break;
      case 'suppliers':
        navigate(`/suppliers/${id}`);
        break;
      case 'orders':
        navigate(`/orders/${id}`);
        break;
    }
  };

  const renderResultItem = (hit: any) => {
    const source = hit._source;
    const type = hit._index;

    let icon, title, description, tags;

    switch (type) {
      case 'products':
        icon = <ShoppingOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
        title = source.name;
        description = `SKU: ${source.sku} | Price: ${source.salePrice?.toLocaleString()} VND`;
        tags = [
          <Tag color="blue" key="type">
            Product
          </Tag>,
          <Tag key="status">{source.status}</Tag>,
        ];
        break;
      case 'customers':
        icon = <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
        title = source.name;
        description = `Code: ${source.code} | Type: ${source.type}`;
        tags = [
          <Tag color="green" key="type">
            Customer
          </Tag>,
          <Tag key="status">{source.status}</Tag>,
        ];
        break;
      case 'suppliers':
        icon = <TeamOutlined style={{ fontSize: 24, color: '#fa8c16' }} />;
        title = source.name;
        description = `Code: ${source.code} | Rating: ${source.rating || 'N/A'}`;
        tags = [
          <Tag color="orange" key="type">
            Supplier
          </Tag>,
          <Tag key="status">{source.status}</Tag>,
        ];
        break;
      case 'orders':
        icon = <ShoppingCartOutlined style={{ fontSize: 24, color: '#722ed1' }} />;
        title = `Order ${source.code}`;
        description = `Total: ${source.totalAmount?.toLocaleString()} VND | Date: ${source.orderDate}`;
        tags = [
          <Tag color="purple" key="type">
            {source.type === 'sales' ? 'Sales' : 'Purchase'}
          </Tag>,
          <Tag key="status">{source.status}</Tag>,
        ];
        break;
      default:
        icon = <SearchOutlined style={{ fontSize: 24 }} />;
        title = 'Unknown';
        description = '';
        tags = [];
    }

    return (
      <List.Item
        key={hit._id}
        onClick={() => handleItemClick(type, hit._id)}
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
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder="Search..."
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
                  Filters
                </Button>
              </Col>
            )}
          </Row>

          {results && (
            <div>
              <Text type="secondary">
                Found {results.hits.total.value} results for "{query}"
              </Text>
            </div>
          )}

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="All" key="all" />
            <TabPane tab="Products" key="products" />
            <TabPane tab="Customers" key="customers" />
            <TabPane tab="Suppliers" key="suppliers" />
            <TabPane tab="Orders" key="orders" />
          </Tabs>

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
                showTotal: (total) => `Total ${total} items`,
              }}
            />
          ) : query ? (
            <Empty description="No results found" />
          ) : (
            <Empty description="Enter a search query to begin" />
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
