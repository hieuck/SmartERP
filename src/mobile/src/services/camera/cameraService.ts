import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Alert } from 'react-native';

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

/**
 * Camera Service
 * Requirement 47.8: Camera integration for product photos
 */
export class CameraService {
  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.', [
          { text: 'OK' },
        ]);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select photos.',
          [{ text: 'OK' }],
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Take a photo using camera
   * Requirement 47.8: Capture product photos
   */
  static async takePhoto(): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }

  /**
   * Pick an image from gallery
   * Requirement 47.8: Select photos from gallery
   */
  static async pickImage(): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName,
      };
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    }
  }

  /**
   * Pick multiple images from gallery
   */
  static async pickMultipleImages(): Promise<ImageResult[]> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return [];
      }

      return result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName,
      }));
    } catch (error) {
      console.error('Error picking multiple images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
      return [];
    }
  }

  /**
   * Show image picker options (camera or gallery)
   */
  static showImagePickerOptions(onCamera: () => void, onGallery: () => void): void {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: onCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: onGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }
}
