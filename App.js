import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, TouchableOpacity,
  StatusBar, Platform, Animated,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import {
  LayoutDashboard, TrendingUp, PieChart, Wallet, ClipboardList,
  Shield, LogOut, User, Activity,
} from 'lucide-react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MarketsScreen from './src/screens/MarketsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import WalletScreen from './src/screens/WalletScreen';
import TradeLogsScreen from './src/screens/TradeLogsScreen';
import KYCScreen from './src/screens/KYCScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { clearCredentials } from './src/services/api';

const TABS = [
  { key: 'DASHBOARD', label: 'Home',      Icon: LayoutDashboard },
  { key: 'MARKETS',   label: 'Markets',   Icon: TrendingUp },
  { key: 'PORTFOLIO', label: 'Portfolio', Icon: PieChart },
  { key: 'WALLET',    label: 'Wallet',    Icon: Wallet },
  { key: 'LOGS',      label: 'Logs',      Icon: ClipboardList },
  { key: 'PROFILE',   label: 'Profile',   Icon: User },
];

const TAB_LABELS = {
  DASHBOARD: 'Home', MARKETS: 'Markets', PORTFOLIO: 'Portfolio',
  WALLET: 'Wallet', LOGS: 'Logs', PROFILE: 'Profile',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isKYCOpen, setIsKYCOpen] = useState(false);

  // Animated values for screen transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loginFade = useRef(new Animated.Value(0)).current;
  const loginSlide = useRef(new Animated.Value(30)).current;

  // Load Inter font family
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Fade in login screen on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(loginFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(loginSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const switchTab = (key) => {
    if (key === activeTab) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setActiveTab(key);
  };

  const handleLogout = () => {
    clearCredentials();
    setIsAuthenticated(false);
    setActiveTab('DASHBOARD');
    setIsKYCOpen(false);
    // Reset login animation
    loginFade.setValue(0);
    loginSlide.setValue(30);
    Animated.parallel([
      Animated.timing(loginFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(loginSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  if (!fontsLoaded) {
    return <View style={styles.darkContainer} />;
  }

  if (!isAuthenticated) {
    return (
      <Animated.View style={[styles.darkContainer, { opacity: loginFade, transform: [{ translateY: loginSlide }] }]}>
        <ExpoStatusBar style="light" />
        <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
      </Animated.View>
    );
  }

  if (isKYCOpen) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <ExpoStatusBar style="light" />
        <KYCScreen
          onBack={() => setIsKYCOpen(false)}
          onVerifySuccess={() => setIsKYCOpen(false)}
        />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'DASHBOARD':  return <DashboardScreen onOpenKYC={() => setIsKYCOpen(true)} onSelectAsset={() => switchTab('MARKETS')} />;
      case 'MARKETS':    return <MarketsScreen />;
      case 'PORTFOLIO':  return <PortfolioScreen />;
      case 'WALLET':     return <WalletScreen />;
      case 'LOGS':       return <TradeLogsScreen />;
      case 'PROFILE':    return <ProfileScreen onLogout={handleLogout} />;
      default:           return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ExpoStatusBar style="light" />

      {/* Top Header */}
      <View style={styles.globalHeader}>
        <View style={styles.profileIndicator}>
          <View style={styles.avatarMock}>
            <User color="#10B981" size={16} />
          </View>
          <View>
            <Text style={styles.welcomeText}>SECUATRADE</Text>
            <Text style={styles.screenTitle}>{TAB_LABELS[activeTab]}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={styles.networkBadge}>
            <Activity color="#10B981" size={12} />
            <Text style={styles.networkText}>Live</Text>
          </View>
          <TouchableOpacity style={styles.kycBtn} onPress={() => setIsKYCOpen(true)}>
            <Shield color="#818CF8" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color="#EF4444" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Screen Content */}
      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={styles.tabItem}
              onPress={() => switchTab(key)}
            >
              <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                <Icon
                  size={20}
                  color={active ? '#10B981' : '#4B5563'}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#0B0E14',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#0B0E14',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  globalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0D1117',
  },
  profileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMock: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  welcomeText: {
    color: '#4B5563',
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 1.5,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_800ExtraBold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  networkText: {
    color: '#10B981', fontSize: 10, fontFamily: 'Inter_800ExtraBold',
  },
  kycBtn: {
    padding: 6, borderRadius: 8, backgroundColor: 'rgba(129,140,248,0.08)',
  },
  logoutBtn: {
    padding: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.07)',
  },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1, alignItems: 'center', gap: 3,
  },
  tabIconWrap: {
    width: 36, height: 28, justifyContent: 'center',
    alignItems: 'center', borderRadius: 8,
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#4B5563',
  },
  tabLabelActive: {
    color: '#10B981',
  },
});
