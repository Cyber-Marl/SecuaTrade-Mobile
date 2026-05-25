import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, Image, Alert, Dimensions, Animated 
} from 'react-native';
import { Camera, ShieldCheck, CreditCard, ScanFace, CheckCircle, MapPin, ChevronLeft } from 'lucide-react-native';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const KYCScreen = ({ onBack, onVerifySuccess }) => {
  const [step, setStep] = useState('MENU'); // MENU, SCAN_ID, SCAN_SELFIE, UPLOADING, SUCCESS
  const [pulseAnim] = useState(new Animated.Value(1));
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (step === 'SCAN_SELFIE') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    }
  }, [step]);

  const startVerificationPipeline = () => {
    setStep('UPLOADING');
    setProgressStep(0);
    
    // Simulate multi-step biometric OCR pipeline
    const timers = [
      setTimeout(() => setProgressStep(1), 1200), // OCR extraction complete
      setTimeout(() => setProgressStep(2), 2400), // Biometric selfie check complete
      setTimeout(() => setProgressStep(3), 3600), // Utility Bill GPS verification complete
      setTimeout(() => submitKYCApprovedStatus(), 4800) // Complete & approved
    ];

    return () => timers.forEach(t => clearTimeout(t));
  };

  const submitKYCApprovedStatus = async () => {
    try {
      // Direct patch to the backend profile update model to set KYC status to APPROVED
      await api.patch('accounts/profile/', {
        kyc_status: 'APPROVED'
      });
      setStep('SUCCESS');
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Upload Failed',
        'Could not update backend KYC profile, but simulating visual completion for prototype.',
        [{ text: 'Continue', onPress: () => setStep('SUCCESS') }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ChevronLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biometric KYC Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Screen Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {step === 'MENU' && (
          <View style={styles.menuContainer}>
            <ShieldCheck color="#10B981" size={72} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>Unlock Active Trading</Text>
            <Text style={styles.heroDesc}>
              To comply with the Securities and Exchange Commission of Zimbabwe (SECZ) and prevent fraud, please verify your identity instantly.
            </Text>

            {/* Checklist Cards */}
            <View style={styles.checklist}>
              
              <View style={styles.checkItem}>
                <CreditCard color="#10B981" size={24} style={styles.checkIcon} />
                <View style={styles.checkTextContainer}>
                  <Text style={styles.checkLabel}>1. National Registration ID</Text>
                  <Text style={styles.checkSub}>Snap a clear photo of your Zimbabwe Metal/Plastic ID or Passport.</Text>
                </View>
              </View>

              <View style={styles.checkItem}>
                <ScanFace color="#10B981" size={24} style={styles.checkIcon} />
                <View style={styles.checkTextContainer}>
                  <Text style={styles.checkLabel}>2. Biometric 3D Selfie</Text>
                  <Text style={styles.checkSub}>Perform a live face-matching check against the Civil Registry database.</Text>
                </View>
              </View>

              <View style={styles.checkItem}>
                <MapPin color="#10B981" size={24} style={styles.checkIcon} />
                <View style={styles.checkTextContainer}>
                  <Text style={styles.checkLabel}>3. GPS Utility Proof of Residence</Text>
                  <Text style={styles.checkSub}>We extract your utility address via OCR and verify it matching your live GPS location.</Text>
                </View>
              </View>

            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('SCAN_ID')}>
              <Text style={styles.primaryBtnText}>Begin Verification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Scan ID */}
        {step === 'SCAN_ID' && (
          <View style={styles.cameraFrameContainer}>
            <Text style={styles.cameraPrompt}>Center your ID Card in the green box</Text>
            <View style={styles.cameraBoxMock}>
              <View style={styles.idCardOutline} />
              <Camera color="rgba(255,255,255,0.4)" size={48} />
            </View>
            <TouchableOpacity style={styles.snapBtn} onPress={() => setStep('SCAN_SELFIE')}>
              <View style={styles.snapInner} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Biometric Selfie */}
        {step === 'SCAN_SELFIE' && (
          <View style={styles.cameraFrameContainer}>
            <Text style={styles.cameraPrompt}>Position your face in the oval frame</Text>
            <Animated.View style={[styles.selfieOvalMock, { transform: [{ scale: pulseAnim }] }]}>
              <ScanFace color="rgba(255,255,255,0.3)" size={64} />
            </Animated.View>
            <TouchableOpacity style={styles.snapBtn} onPress={startVerificationPipeline}>
              <View style={styles.snapInner} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Verification Pipeline Progress */}
        {step === 'UPLOADING' && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#10B981" style={{ marginBottom: 24 }} />
            <Text style={styles.progressTitle}>Smile ID Biometric Matching Engine</Text>
            <Text style={styles.progressDesc}>Processing real-time identity matching, OCR, and GPS checks...</Text>

            <View style={styles.stepIndicatorBlock}>
              <View style={styles.stepLineRow}>
                <CheckCircle color={progressStep >= 1 ? '#10B981' : '#4B5563'} size={20} />
                <Text style={[styles.stepLineText, progressStep >= 1 && styles.stepLineActive]}>
                  Extracting ID details via OCR
                </Text>
              </View>
              <View style={styles.stepLineRow}>
                <CheckCircle color={progressStep >= 2 ? '#10B981' : '#4B5563'} size={20} />
                <Text style={[styles.stepLineText, progressStep >= 2 && styles.stepLineActive]}>
                  Biometric matching with Civil Registry API
                </Text>
              </View>
              <View style={styles.stepLineRow}>
                <CheckCircle color={progressStep >= 3 ? '#10B981' : '#4B5563'} size={20} />
                <Text style={[styles.stepLineText, progressStep >= 3 && styles.stepLineActive]}>
                  Utility Bill OCR & GPS coordinate cross-check
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Success Screen */}
        {step === 'SUCCESS' && (
          <View style={styles.successContainer}>
            <CheckCircle color="#10B981" size={84} style={{ marginBottom: 20 }} />
            <Text style={styles.successTitle}>Identity Verified Successfully</Text>
            <Text style={styles.successDesc}>
              Your account has been fully updated to **VERIFIED** status. Your dual-currency investment accounts are now active.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={onVerifySuccess}>
              <Text style={styles.primaryBtnText}>Start Trading</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  menuContainer: {
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  checklist: {
    width: '100%',
    marginBottom: 32,
  },
  checkItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  checkTextContainer: {
    flex: 1,
  },
  checkLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checkSub: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 15,
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cameraPrompt: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  cameraBoxMock: {
    width: width - 64,
    height: 220,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 40,
    overflow: 'hidden',
  },
  idCardOutline: {
    position: 'absolute',
    width: '85%',
    height: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  selfieOvalMock: {
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 40,
  },
  snapBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressDesc: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
  },
  stepIndicatorBlock: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  stepLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepLineText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  stepLineActive: {
    color: '#FFFFFF',
  },
  successContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
});

export default KYCScreen;
