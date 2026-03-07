import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Checkbox } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { login, setBiometricEnabled } from '../../store/slices/authSlice';
import { useBiometric } from '../../hooks/useBiometric';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, biometricEnabled } = useSelector((state: RootState) => state.auth);
  const {
    isAvailable: biometricAvailable,
    isEnabled: biometricConfigured,
    isEnrolled,
    authenticate,
    enableBiometric,
    getStoredCredentials,
    getBiometricTypeName,
  } = useBiometric();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Try biometric login on mount if enabled
    if (biometricConfigured && biometricAvailable && isEnrolled) {
      handleBiometricLogin();
    }
  }, [biometricConfigured, biometricAvailable, isEnrolled]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      await dispatch(login({ username, password })).unwrap();

      // If biometric is available and user wants to remember, offer to enable it
      if (biometricAvailable && isEnrolled && rememberMe && !biometricConfigured) {
        Alert.alert(
          'Enable Biometric Login',
          `Would you like to enable ${getBiometricTypeName()} for faster login?`,
          [
            { text: 'Skip', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                const success = await enableBiometric(username, password);
                if (success) {
                  dispatch(setBiometricEnabled(true));
                  Alert.alert('Success', 'Biometric login enabled');
                }
              },
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err || 'Invalid credentials');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const credentials = await getStoredCredentials();

      if (credentials) {
        // Login with stored credentials
        await dispatch(login(credentials)).unwrap();
      } else {
        Alert.alert(
          'Error',
          'No stored credentials found. Please login with username and password.',
        );
      }
    } catch (error) {
      console.error('Biometric login failed:', error);
      // Silently fail and let user login manually
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>SmartERP</Text>
          <Text style={styles.subtitle}>Mobile App</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
            />
            <Text style={styles.checkboxLabel}>Remember me</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          >
            Login
          </Button>

          {biometricAvailable && isEnrolled && biometricConfigured && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              style={styles.biometricButton}
              icon="fingerprint"
            >
              Login with {getBiometricTypeName()}
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  subtitle: {
    fontSize: 16,
    color: '#8c8c8c',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  errorText: {
    color: '#ff4d4f',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: 12,
    paddingVertical: 6,
  },
  biometricButton: {
    paddingVertical: 6,
  },
});

export default LoginScreen;
