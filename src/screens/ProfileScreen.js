import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Animated, Switch,
} from 'react-native';
import {
  User, Mail, Shield, ChevronRight, LogOut,
  Bell, Lock, CreditCard, HelpCircle, Star,
  CheckCircle, AlertCircle,
} from 'lucide-react-native';
import api from '../services/api';
import { clearCredentials } from '../services/api';

const ProfileScreen = ({ onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('accounts/profile/');
      setProfile(res.data);
    } catch (e) {
      // Fallback to a minimal profile on error
      setProfile({ username: 'Trader', email: '', kyc_status: 'PENDING' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of SecuaTrade?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            clearCredentials();
            onLogout();
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'A password reset link will be sent to your registered email.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    );
  }

  const kycVerified = profile?.kyc_status === 'VERIFIED' || profile?.kyc_status === 'APPROVED';
  const initials = (profile?.username || 'T').substring(0, 2).toUpperCase();

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

        {/* Avatar + Name */}
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.username}>{profile?.username || 'Trader'}</Text>
          {profile?.email ? (
            <View style={styles.emailRow}>
              <Mail color="#6B7280" size={13} />
              <Text style={styles.emailText}>{profile.email}</Text>
            </View>
          ) : null}

          {/* KYC Badge */}
          <View style={[styles.kycBadge, { backgroundColor: kycVerified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }]}>
            {kycVerified
              ? <CheckCircle color="#10B981" size={14} />
              : <AlertCircle color="#F59E0B" size={14} />}
            <Text style={[styles.kycBadgeText, { color: kycVerified ? '#10B981' : '#F59E0B' }]}>
              {kycVerified ? 'KYC Verified' : 'KYC Pending'}
            </Text>
          </View>
        </View>

        {/* Account Tier */}
        <View style={styles.tierCard}>
          <Star color="#F59E0B" size={20} />
          <View style={styles.tierInfo}>
            <Text style={styles.tierLabel}>Account Tier</Text>
            <Text style={styles.tierValue}>Standard Investor</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>ACTIVE</Text>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={<User color="#818CF8" size={18} />} label="Edit Profile" onPress={() => Alert.alert('Edit Profile', 'Coming soon.')} />
          <MenuItem icon={<Lock color="#818CF8" size={18} />} label="Change Password" onPress={handleChangePassword} />
          <MenuItem icon={<Shield color="#10B981" size={18} />} label="KYC Verification" onPress={() => Alert.alert('KYC', 'Please use the KYC button in the top header.')} last />
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Bell color="#818CF8" size={18} />
              </View>
              <Text style={styles.menuLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.4)' }}
              thumbColor={notificationsEnabled ? '#10B981' : '#6B7280'}
            />
          </View>
          <MenuItem icon={<CreditCard color="#818CF8" size={18} />} label="Payment Methods" onPress={() => Alert.alert('Payments', 'Coming soon.')} last />
        </View>

        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={<HelpCircle color="#818CF8" size={18} />} label="Help & Support" onPress={() => Alert.alert('Support', 'Contact support@secuatrade.com')} last />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#EF4444" size={18} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SecuaTrade v1.0.0 · ZSE & VFEX Markets</Text>
        <View style={{ height: 40 }} />
      </Animated.View>
    </Animated.ScrollView>
  );
};

const MenuItem = ({ icon, label, onPress, last }) => (
  <TouchableOpacity style={[styles.menuRow, !last && styles.menuRowBorder]} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={styles.menuIconWrap}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <ChevronRight color="#4B5563" size={16} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0E14' },

  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 2, borderColor: 'rgba(16,185,129,0.4)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#10B981', fontSize: 28, fontWeight: '800' },
  username: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  emailText: { color: '#6B7280', fontSize: 13 },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  kycBadgeText: { fontSize: 12, fontWeight: '700' },

  tierCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 24, padding: 16,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  tierInfo: { flex: 1 },
  tierLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  tierValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 2 },
  tierBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  tierBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  sectionLabel: {
    color: '#4B5563', fontSize: 10, fontWeight: '800',
    letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 8, marginTop: 4,
  },
  menuCard: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(129,140,248,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 16, paddingVertical: 14,
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },

  versionText: { color: '#374151', fontSize: 11, textAlign: 'center', marginBottom: 8 },
});

export default ProfileScreen;
