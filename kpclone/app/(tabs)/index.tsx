import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedNumbers, setExtractedNumbers] = useState<string | null>(null);

  // Function to list available models
  const listAvailableModels = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      console.log('Available Models:', JSON.stringify(data, null, 2));
      
      // Extract model names
      if (data.models) {
        const modelNames = data.models.map((model: any) => model.name);
        console.log('Model Names:', modelNames);
        setExtractedNumbers(`Models: ${modelNames.join(', ')}`);
      }
    } catch (error) {
      console.error('Error listing models:', error);
    }
  };

  const geminiImageAnalyzer = async (base64Image: string) => {
    try {
      // Get API key - Expo automatically makes EXPO_PUBLIC_ vars available
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      console.log('API Key present:', !!apiKey);

      if (!apiKey) {
        Alert.alert('Configuration Error', 'Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.');
        setExtractedNumbers('API key not configured');
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "This is a photo of a product barcode. Please read the barcode number (UPC or EAN) from the image and return only the number. If you cannot find a barcode, reply with 'NO BARCODE'."
            }, {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }]
          }]
        })
      });
      
      const data = await response.json();
      console.log('Gemini API Response:', JSON.stringify(data, null, 2));
      
      const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No numbers found';
      setExtractedNumbers(extractedText.trim());
      console.log('Extracted barcode:', extractedText.trim());
    } catch (error) {
      console.error('Error analyzing image:', error);
      setExtractedNumbers('Error analyzing image');
      Alert.alert('Analysis Error', 'Failed to analyze the image. Please try again.');
    }
  };

  const pickImageAsync = async () => {
    //request permission to access the camera
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'You need to grant permission to access the camera');
      return;
    }

    //open the camera with base64 encoding
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: .8, //compress to be 1-2 mb or less 
      base64: true, // Request base64 encoded image for Gemini API
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      console.log('Image URI:', asset.uri);
      
      // Analyze the cropped image with Gemini using base64 data
      if (asset.base64) {
        console.log('Analyzing image with Gemini...');
        await geminiImageAnalyzer(asset.base64);
      } else {
        Alert.alert('Error', 'Failed to get base64 data from image');
      }
    }
  };



  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Camera App</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.cameraContainer}>
        <ThemedText type="subtitle">Camera Preview</ThemedText>
        
        {/* Image Preview Box */}
        <ThemedView style={styles.imagePreviewBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <ThemedText style={styles.placeholderText}>
              No image captured yet
            </ThemedText>
          )}
        </ThemedView>
        
        {/* Camera Button */}
        <TouchableOpacity style={styles.cameraButton} onPress={pickImageAsync}>
          <ThemedText style={styles.buttonText}>📷 Open Camera</ThemedText>
        </TouchableOpacity>
        
        {/* List Models Button */}
        <TouchableOpacity style={styles.cameraButton} onPress={listAvailableModels}>
          <ThemedText style={styles.buttonText}>🔍 List Available Models</ThemedText>
        </TouchableOpacity>
        
        {/* Extracted Numbers Display */}
        {extractedNumbers && (
          <ThemedView style={styles.numbersContainer}>
            <ThemedText type="subtitle">Extracted Numbers:</ThemedText>
            <ThemedText style={styles.numbersText}>{extractedNumbers}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraContainer: {
    gap: 16,
    marginBottom: 16,
    padding: 16,
  },
  imagePreviewBox: {
    height: 200,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  numbersContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  numbersText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
