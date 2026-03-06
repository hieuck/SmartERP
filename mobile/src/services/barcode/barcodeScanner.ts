import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { Alert } from 'react-native';

export interface ScanResult {
  type: string;
  data: string;
}

export class BarcodeScannerService {
  /**
   * Request camera permissions for barcode scanning
   * Requirement 47.5: Barcode/QR scanning capability
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to scan barcodes and QR codes.',
          [{ text: 'OK' }],
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Check if camera permissions are granted
   */
  static async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  /**
   * Parse scanned barcode/QR code data
   * Requirement 47.5: Process scanned data for product lookup
   */
  static parseScanResult(result: BarCodeScannerResult): ScanResult {
    return {
      type: result.type,
      data: result.data,
    };
  }

  /**
   * Validate scanned barcode format
   */
  static isValidBarcode(data: string): boolean {
    // Basic validation - check if data is not empty and has reasonable length
    return data.length > 0 && data.length <= 100;
  }

  /**
   * Extract product SKU from barcode data
   * Supports various barcode formats
   */
  static extractProductSKU(data: string): string {
    // Remove any whitespace
    const cleaned = data.trim();

    // For now, return the cleaned data as SKU
    // Can be extended to support different barcode formats
    return cleaned;
  }
}
