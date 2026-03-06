import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB } from 'react-native-paper';

const OrdersScreen: React.FC = () => {
  // Mock data
  const orders = [
    {
      id: '1',
      code: 'ORD001',
      customer: 'Customer A',
      date: '2024-01-15',
      status: 'pending',
      total: 250.0,
    },
    {
      id: '2',
      code: 'ORD002',
      customer: 'Customer B',
      date: '2024-01-15',
      status: 'confirmed',
      total: 450.5,
    },
    {
      id: '3',
      code: 'ORD003',
      customer: 'Customer C',
      date: '2024-01-14',
      status: 'completed',
      total: 180.0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#faad14';
      case 'confirmed':
        return '#1890ff';
      case 'completed':
        return '#52c41a';
      case 'cancelled':
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  const renderOrder = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>{item.code}</Title>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.status}
          </Chip>
        </View>
        <Paragraph>Customer: {item.customer}</Paragraph>
        <Paragraph>Date: {item.date}</Paragraph>
        <Paragraph style={styles.total}>Total: ${item.total.toFixed(2)}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => console.log('Create order')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  chip: {
    marginLeft: 8,
  },
  chipText: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  total: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1890ff',
  },
});

export default OrdersScreen;
