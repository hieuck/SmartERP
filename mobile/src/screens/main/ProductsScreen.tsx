import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Card, Title, Paragraph, FAB, Snackbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchProducts, loadOfflineProducts } from '../../store/slices/productSlice';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { useOffline } from '../../hooks/useOffline';

interface Product {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
  purchasePrice: number;
}

const ProductsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { products, isLoading, error } = useSelector((state: RootState) => state.product);
  const { isOffline } = useOffline();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (error) {
      showSnackbar(error);
    }
  }, [error]);

  const loadProducts = async () => {
    if (isOffline) {
      // Load from offline storage
      dispatch(loadOfflineProducts());
    } else {
      // Fetch from server
      dispatch(fetchProducts());
    }
  };

  const handleRefresh = () => {
    loadProducts();
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const filteredProducts = products.filter(
    (product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>SKU: {item.sku}</Paragraph>
        <View style={styles.productDetails}>
          <Paragraph>Sale: ${item.salePrice?.toFixed(2) || '0.00'}</Paragraph>
          <Paragraph>Cost: ${item.purchasePrice?.toFixed(2) || '0.00'}</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => showSnackbar('Add product feature coming soon')}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1890ff',
  },
});

export default ProductsScreen;
