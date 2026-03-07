import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB } from 'react-native-paper';

const InventoryScreen: React.FC = () => {
  // Mock data
  const inventory = [
    { id: '1', product: 'Product A', warehouse: 'Main Warehouse', quantity: 150, status: 'normal' },
    { id: '2', product: 'Product B', warehouse: 'Main Warehouse', quantity: 15, status: 'low' },
    { id: '3', product: 'Product C', warehouse: 'Branch 1', quantity: 200, status: 'normal' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return '#ff4d4f';
      case 'normal':
        return '#52c41a';
      default:
        return '#8c8c8c';
    }
  };

  const renderInventoryItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>{item.product}</Title>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.chipText}
          >
            {item.quantity}
          </Chip>
        </View>
        <Paragraph>Warehouse: {item.warehouse}</Paragraph>
        <Paragraph style={styles.status}>
          Status: {item.status === 'low' ? 'Low Stock' : 'Normal'}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={inventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <FAB icon="barcode-scan" style={styles.fab} onPress={() => console.log('Scan barcode')} />
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
  },
  status: {
    marginTop: 4,
    color: '#8c8c8c',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1890ff',
  },
});

export default InventoryScreen;
