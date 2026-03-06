import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { refreshDashboard, fetchRevenueChart } from '../../store/slices/dashboardSlice';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  const {
    stats,
    revenueChart,
    topProductsChart,
    recentOrders,
    lowStockProducts,
    loading,
    error,
    lastUpdated,
  } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(refreshDashboard());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(refreshDashboard());
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setChartPeriod(period);
    dispatch(fetchRevenueChart(period));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#8c8c8c',
      confirmed: '#1890ff',
      preparing: '#faad14',
      shipping: '#722ed1',
      completed: '#52c41a',
      cancelled: '#ff4d4f',
    };
    return colors[status] || '#8c8c8c';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      {/* KPI Cards */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Key Metrics</Title>
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <View style={styles.kpiContent}>
                <MaterialCommunityIcons name="currency-usd" size={28} color="#52c41a" />
                <View style={styles.kpiText}>
                  <Text style={styles.kpiLabel}>Today's Revenue</Text>
                  <Title style={styles.kpiValue}>
                    {stats ? formatCurrency(stats.revenue.today) : '---'}
                  </Title>
                  <Text style={styles.kpiSubtext}>
                    Week: {stats ? formatCurrency(stats.revenue.week) : '---'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard}>
            <Card.Content>
              <View style={styles.kpiContent}>
                <MaterialCommunityIcons name="cart" size={28} color="#1890ff" />
                <View style={styles.kpiText}>
                  <Text style={styles.kpiLabel}>Orders Today</Text>
                  <Title style={styles.kpiValue}>{stats?.orders.today || 0}</Title>
                  <Text style={styles.kpiSubtext}>Pending: {stats?.orders.pending || 0}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard}>
            <Card.Content>
              <View style={styles.kpiContent}>
                <MaterialCommunityIcons name="warehouse" size={28} color="#faad14" />
                <View style={styles.kpiText}>
                  <Text style={styles.kpiLabel}>Stock Value</Text>
                  <Title style={styles.kpiValue}>
                    {stats ? formatCurrency(stats.inventory.totalValue) : '---'}
                  </Title>
                  <Text style={styles.kpiSubtext}>Low: {stats?.inventory.lowStockCount || 0}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.kpiCard}>
            <Card.Content>
              <View style={styles.kpiContent}>
                <MaterialCommunityIcons name="account-group" size={28} color="#722ed1" />
                <View style={styles.kpiText}>
                  <Text style={styles.kpiLabel}>Customers</Text>
                  <Title style={styles.kpiValue}>{stats?.customers.total || 0}</Title>
                  <Text style={styles.kpiSubtext}>New: {stats?.customers.new || 0}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Financial Summary</Title>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <MaterialCommunityIcons name="cash-plus" size={24} color="#52c41a" />
                <View style={styles.financialText}>
                  <Text style={styles.financialLabel}>Receivables</Text>
                  <Text style={styles.financialValue}>
                    {stats ? formatCurrency(stats.receivables) : '---'}
                  </Text>
                </View>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.financialItem}>
                <MaterialCommunityIcons name="cash-minus" size={24} color="#ff4d4f" />
                <View style={styles.financialText}>
                  <Text style={styles.financialLabel}>Payables</Text>
                  <Text style={styles.financialValue}>
                    {stats ? formatCurrency(stats.payables) : '---'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Revenue Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Revenue Trend</Title>
          <View style={styles.periodSelector}>
            <Chip
              selected={chartPeriod === 'week'}
              onPress={() => handlePeriodChange('week')}
              style={styles.periodChip}
            >
              Week
            </Chip>
            <Chip
              selected={chartPeriod === 'month'}
              onPress={() => handlePeriodChange('month')}
              style={styles.periodChip}
            >
              Month
            </Chip>
            <Chip
              selected={chartPeriod === 'year'}
              onPress={() => handlePeriodChange('year')}
              style={styles.periodChip}
            >
              Year
            </Chip>
          </View>
        </View>
        <Card style={styles.card}>
          <Card.Content>
            {revenueChart ? (
              <LineChart data={revenueChart} height={220} color="#1890ff" />
            ) : (
              <Text style={styles.noDataText}>Loading chart...</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Top Products Chart */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Top Selling Products</Title>
        <Card style={styles.card}>
          <Card.Content>
            {topProductsChart ? (
              <BarChart data={topProductsChart} height={220} color="#52c41a" />
            ) : (
              <Text style={styles.noDataText}>Loading chart...</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Recent Orders</Title>
          <Button mode="text" onPress={() => navigation.navigate('Orders' as never)}>
            View All
          </Button>
        </View>
        <Card style={styles.card}>
          <Card.Content>
            {recentOrders.length > 0 ? (
              recentOrders.map((order, index) => (
                <View key={order.id}>
                  <TouchableOpacity style={styles.orderItem}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderCode}>{order.code}</Text>
                      <Text style={styles.orderCustomer}>{order.customerName}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount)}</Text>
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: getStatusColor(order.status) },
                        ]}
                        textStyle={styles.statusChipText}
                      >
                        {order.status}
                      </Chip>
                    </View>
                  </TouchableOpacity>
                  {index < recentOrders.length - 1 && <Divider style={styles.orderDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No recent orders</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Low Stock Alert */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Low Stock Alert</Title>
          <Button mode="text" onPress={() => navigation.navigate('Inventory' as never)}>
            View All
          </Button>
        </View>
        <Card style={styles.card}>
          <Card.Content>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product, index) => (
                <View key={product.id}>
                  <View style={styles.stockItem}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#ff4d4f" />
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockName}>{product.name}</Text>
                      <Text style={styles.stockSku}>SKU: {product.sku}</Text>
                    </View>
                    <View style={styles.stockQuantity}>
                      <Text style={styles.stockCurrent}>{product.currentStock}</Text>
                      <Text style={styles.stockMin}>/ {product.minStock}</Text>
                    </View>
                  </View>
                  {index < lowStockProducts.length - 1 && <Divider style={styles.orderDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>All products are well stocked</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Quick Actions</Title>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('BarcodeScan' as never)}
          >
            <Card style={styles.actionCardInner}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="barcode-scan" size={40} color="#1890ff" />
                <Text style={styles.actionText}>Scan Barcode</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Products' as never)}
          >
            <Card style={styles.actionCardInner}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="package-variant" size={40} color="#52c41a" />
                <Text style={styles.actionText}>Products</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Orders' as never)}
          >
            <Card style={styles.actionCardInner}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="cart" size={40} color="#faad14" />
                <Text style={styles.actionText}>Orders</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Inventory' as never)}
          >
            <Card style={styles.actionCardInner}>
              <Card.Content style={styles.actionContent}>
                <MaterialCommunityIcons name="warehouse" size={40} color="#722ed1" />
                <Text style={styles.actionText}>Inventory</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>
      </View>

      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(lastUpdated).toLocaleTimeString('vi-VN')}
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#fff2f0',
  },
  errorText: {
    color: '#ff4d4f',
  },
  kpiGrid: {
    paddingHorizontal: 16,
  },
  kpiCard: {
    marginBottom: 12,
    elevation: 2,
  },
  kpiContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiText: {
    marginLeft: 16,
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  card: {
    marginHorizontal: 16,
    elevation: 2,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  financialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  financialText: {
    marginLeft: 12,
  },
  financialLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    height: 32,
  },
  noDataText: {
    textAlign: 'center',
    color: '#8c8c8c',
    paddingVertical: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 13,
    color: '#595959',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    color: '#fff',
  },
  orderDivider: {
    marginVertical: 4,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stockInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stockName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stockSku: {
    fontSize: 11,
    color: '#8c8c8c',
  },
  stockQuantity: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stockCurrent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  stockMin: {
    fontSize: 12,
    color: '#8c8c8c',
    marginLeft: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  actionCard: {
    width: '50%',
    padding: 4,
  },
  actionCardInner: {
    elevation: 2,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8c8c8c',
    paddingVertical: 16,
  },
});

export default DashboardScreen;
