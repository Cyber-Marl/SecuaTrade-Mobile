import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import api, { setAuthToken, storeCredentials, getStoredCredentials } from '../services/api';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (userVal = username, passVal = password) => {
    const finalUser = userVal.trim();
    const finalPass = passVal.trim();

    if (!finalUser || !finalPass) {
      Alert.alert('Validation Error', 'Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      // Backend uses djangorestframework-simplejwt token obtain pair
      const response = await api.post('accounts/login/', {
        username: finalUser,
        password: finalPass
      });

      if (response.data && response.data.access) {
        setAuthToken(response.data.access);
        // Store credentials securely for biometric re-auth
        storeCredentials(finalUser, finalPass);
        onLoginSuccess();
      } else {
        Alert.alert('Login Failed', 'Invalid server response structure.');
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Please check your connection and credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Supported', 'Biometric scanner hardware not detected on this device.');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Not Configured', 'Please set up FaceID or Fingerprint scanner in your device settings.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to SecuaTrade Securely',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const creds = getStoredCredentials();
        if (creds) {
          handleLogin(creds.username, creds.password);
        } else {
          Alert.alert(
            'No Saved Session',
            'Please log in with your username and password first to enable biometric login.',
          );
        }
      } else {
      Alert.alert('Biometric Cancelled', 'Authentication failed or was dismissed.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Biometric Error', 'Could not initiate biometric authentication.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Shield color="#10B981" size={56} style={styles.logoIcon} />
          <Text style={styles.title}>SecuaTrade</Text>
          <Text style={styles.subtitle}>Emerging Market Dual-Currency Trading</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Secure Login</Text>

          {/* Username Field */}
          <View style={styles.inputContainer}>
            <User color="#9CA3AF" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#6B7280"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Lock color="#9CA3AF" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOff color="#9CA3AF" size={20} /> : <Eye color="#9CA3AF" size={20} />}
            </TouchableOpacity>
          </View>

          {/* Regular Login Button */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.divider}>OR</Text>

          {/* Biometric Login Button */}
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
            <Shield color="#10B981" size={24} style={styles.btnIcon} />
            <Text style={styles.biometricButtonText}>Sign in with Biometrics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Supporting ZWG (ZSE) and USD (VFEX)</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    color: '#4B5563',
    textAlign: 'center',
    marginVertical: 18,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  biometricButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 10,
  },
  biometricButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 36,
  },
  footerText: {
    color: '#4B5563',
    fontSize: 12,
  },
});

export default LoginScreen;
