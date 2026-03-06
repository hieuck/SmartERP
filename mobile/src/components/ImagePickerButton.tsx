import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';
import { CameraService, ImageResult } from '../services/camera/cameraService';

interface ImagePickerButtonProps {
  onImageSelected: (image: ImageResult) => void;
  currentImage?: string;
  label?: string;
  multiple?: boolean;
}

/**
 * Image Picker Button Component
 * Requirement 47.8: Camera integration for product photos
 * Requirement 47.7: Touch-optimized UI
 */
export const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  onImageSelected,
  currentImage,
  label = 'Add Photo',
  multiple = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleImagePicker = () => {
    CameraService.showImagePickerOptions(handleTakePhoto, handlePickFromGallery);
  };

  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      const image = await CameraService.takePhoto();
      if (image) {
        onImageSelected(image);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    setLoading(true);
    try {
      if (multiple) {
        const images = await CameraService.pickMultipleImages();
        if (images.length > 0) {
          // For now, just use the first image
          // In a real app, you'd handle multiple images
          onImageSelected(images[0]);
        }
      } else {
        const image = await CameraService.pickImage();
        if (image) {
          onImageSelected(image);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleImagePicker} disabled={loading}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : currentImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImage }} style={styles.image} />
          <View style={styles.overlay}>
            <Text style={styles.changeText}>Change Photo</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  changeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});
