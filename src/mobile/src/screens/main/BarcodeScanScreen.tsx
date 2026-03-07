import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { BarcodeScannerComponent } from '../../components/BarcodeScanner';
import { ScanResult } from '../../services/barcode/barcodeScanner';
import { BarcodeScannerService } from '../../services/barcode/barcodeScanner';

/**
 * Barcode Scan Screen
 * Requirement 47.5: Barcode/QR scanning for product lookup
 * Requirement 47.7: Touch-optimized UI
 */
export const BarcodeScanScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  const handleScan = (result: ScanResult) => {
    setLastScan(result);
    setScanning(false);

    // Extract product SKU from barcode
    const sku = BarcodeScannerService.extractProductSKU(result.data);

    // Show result
    Alert.alert('Barcode Scanned', `Type: ${result.type}\nData: ${result.data}\nSKU: ${sku}`, [
      {
        text: 'Scan Again',
        onPress: () => setScanning(true),
      },
      {
        text: 'OK',
      },
    ]);

    // TODO: Look up product by SKU and navigate to product details
    // navigation.navigate('ProductDetails', { sku });
  };

  const handleClose = () => {
    setScanning(false);
  };

  const startScanning = () => {
    setScanning(true);
  };

  if (scanning) {
    return <BarcodeScannerComponent onScan={handleScan} onClose={handleClose} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Barcode Scanner</Text>
        <Text style={styles.description}>
          Scan product barcodes or QR codes to quickly look up product information
        </Text>

        {lastScan && (
          <View style={styles.lastScanContainer}>
            <Text style={styles.lastScanTitle}>Last Scan:</Text>
            <Text style={styles.lastScanText}>Type: {lastScan.type}</Text>
            <Text style={styles.lastScanText}>Data: {lastScan.data}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  lastScanContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastScanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  lastScanText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
