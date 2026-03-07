import React, { useState, useEffect, useCallback } from 'react';
import { Input, AutoComplete, Spin, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import searchService, { SearchResult } from '../../services/searchService';
import { debounce } from 'lodash';

const { Search } = Input;

interface SearchOption {
  value: string;
  label: React.ReactNode;
  type: string;
  id: string;
}

const GlobalSearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const result: SearchResult = await searchService.globalSearch(query, 0, 10);

      const searchOptions: SearchOption[] = result.hits.hits.map((hit) => {
        const source = hit._source;
        const type = hit._index;

        let label: React.ReactNode;
        let route = '';

        switch (type) {
          case 'products':
            label = (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {source.name} ({source.sku})
                </span>
                <Tag color="blue">Product</Tag>
              </div>
            );
            route = `/products/${hit._id}`;
            break;
          case 'customers':
            label = (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {source.name} ({source.code})
                </span>
                <Tag color="green">Customer</Tag>
              </div>
            );
            route = `/customers/${hit._id}`;
            break;
          case 'suppliers':
            label = (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  {source.name} ({source.code})
                </span>
                <Tag color="orange">Supplier</Tag>
              </div>
            );
            route = `/suppliers/${hit._id}`;
            break;
          case 'orders':
            label = (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Order {source.code}</span>
                <Tag color="purple">{source.type === 'sales' ? 'Sales' : 'Purchase'}</Tag>
              </div>
            );
            route =
              source.type === 'sales' ? `/orders/sales/${hit._id}` : `/orders/purchases/${hit._id}`;
            break;
          default:
            label = <span>{JSON.stringify(source)}</span>;
        }

        return {
          value: `${type}-${hit._id}`,
          label,
          type,
          id: hit._id,
        };
      });

      setOptions(searchOptions);
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid too many requests
  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), 300),
    [],
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleSelect = (value: string, option: SearchOption) => {
    // Navigate to the selected item
    const route = getRouteForItem(option.type, option.id);
    if (route) {
      navigate(route);
      setSearchQuery('');
      setOptions([]);
    }
  };

  const getRouteForItem = (type: string, id: string): string => {
    switch (type) {
      case 'products':
        return `/products/${id}`;
      case 'customers':
        return `/customers/${id}`;
      case 'suppliers':
        return `/suppliers/${id}`;
      case 'orders':
        return `/orders/${id}`;
      default:
        return '';
    }
  };

  const handleSearch = (value: string) => {
    if (value) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
      setSearchQuery('');
      setOptions([]);
    }
  };

  return (
    <AutoComplete
      style={{ width: '100%', maxWidth: 500 }}
      options={options}
      onSelect={handleSelect}
      onSearch={setSearchQuery}
      value={searchQuery}
      notFoundContent={
        loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : searchQuery.length >= 2 ? (
          <Empty description="No results found" />
        ) : null
      }
    >
      <Search
        placeholder="Search products, customers, orders..."
        prefix={<SearchOutlined />}
        onSearch={handleSearch}
        loading={loading}
        allowClear
      />
    </AutoComplete>
  );
};

export default GlobalSearchBar;
