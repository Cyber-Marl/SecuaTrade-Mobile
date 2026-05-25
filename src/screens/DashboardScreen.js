import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Dimensions, Image 
} from 'react-native';
import { RefreshCcw, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, UserCheck } from 'lucide-react-native';
import api from '../services/api';
import useTradeStore from '../store/useTradeStore';
import MiniSparkline from '../components/MiniSparkline';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ onSelectAsset, onOpenBroker, onOpenKYC }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState({ ZWG: 0, USD: 0 });
  const [assets, setAssets] = useState([]);
  const [activeMarket, setActiveMarket] = useState('ZSE'); // ZSE (ZWG) or VFEX (USD)

  const { prices, connectWebSocket } = useTradeStore();

  const fetchDashboardData = async () => {
    try {
      const [assetsRes, ledgerRes] = await Promise.all([
        api.get('market/assets/'),
        api.get('accounts/ledger/')
      ]);
      
      setAssets(assetsRes.data || []);
      
      // Compute dual-currency balances from ledger response
      const ledgerData = ledgerRes.data || [];
      const zwgLedger = ledgerData.find(l => l.currency === 'ZWG');
      const usdLedger = ledgerData.find(l => l.currency === 'USD');
      
      setBalances({
        ZWG: zwgLedger ? parseFloat(zwgLedger.balance) : 0,
        USD: usdLedger ? parseFloat(usdLedger.balance) : 0
      });
    } catch (err) {
      console.error("Error fetching dashboard details", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    connectWebSocket();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const filteredAssets = assets.filter(a => a.market === activeMarket);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Fetching Live Market Feeds...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
      }
    >
      {/* Account Overview Header */}
      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>My Balances</Text>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.balanceScroll}>
          
          {/* ZWG Balance Card */}
          <View style={[styles.balanceCard, { marginRight: 16 }]}>
            <View style={styles.cardHeader}>
              <Wallet color="#10B981" size={24} />
              <Text style={styles.currencyTag}>Zimbabwe Gold (ZSE)</Text>
            </View>
            <Text style={styles.balanceValue}>
              ZWG {balances.ZWG.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Real-time Settlement Enabled</Text>
              <ArrowUpRight color="#10B981" size={20} />
            </View>
          </View>

          {/* USD Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.cardHeader}>
              <Wallet color="#3B82F6" size={24} />
              <Text style={styles.currencyTag}>US Dollar (VFEX)</Text>
            </View>
            <Text style={styles.balanceValue}>
              $ {balances.USD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Direct Foreign Investment Route</Text>
              <ArrowUpRight color="#3B82F6" size={20} />
            </View>
          </View>
          
        </ScrollView>
      </View>

      {/* KYC Warning Bar */}
      <TouchableOpacity style={styles.kycBar} onPress={onOpenKYC}>
        <UserCheck color="#10B981" size={20} />
        <Text style={styles.kycText}>Complete instant KYC / ID Verification</Text>
        <ArrowUpRight color="#10B981" size={16} />
      </TouchableOpacity>

      {/* Market Selector Tabs */}
      <View style={styles.marketTabsContainer}>
        <TouchableOpacity 
          style={[styles.marketTab, activeMarket === 'ZSE' && styles.activeMarketTab]}
          onPress={() => setActiveMarket('ZSE')}
        >
          <Text style={[styles.marketTabText, activeMarket === 'ZSE' && styles.activeMarketTabText]}>
            ZSE Equities (ZWG)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.marketTab, activeMarket === 'VFEX' && styles.activeMarketTab]}
          onPress={() => setActiveMarket('VFEX')}
        >
          <Text style={[styles.marketTabText, activeMarket === 'VFEX' && styles.activeMarketTabText]}>
            VFEX Equities (USD)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Equities Stock Feed */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Markets</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCcw color="#9CA3AF" size={16} />
        </TouchableOpacity>
      </View>

      {filteredAssets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active equities found for {activeMarket}.</Text>
        </View>
      ) : (
        <View style={styles.stockList}>
          {filteredAssets.map((asset) => {
            // Check if there is an active WebSocket real-time price update
            const livePrice = prices[asset.ticker] ? parseFloat(prices[asset.ticker]) : parseFloat(asset.current_price);
            const originalPrice = parseFloat(asset.current_price);
            
            // Compute real % change from open_price vs live price
            const openPrice = parseFloat(asset.open_price || asset.current_price || 0);
            const percentChange = openPrice > 0 ? ((livePrice - openPrice) / openPrice) * 100 : 0;
            const isNegative = percentChange < 0;
            
            return (
              <TouchableOpacity 
                key={asset.id} 
                style={styles.stockRow}
                onPress={() => onSelectAsset(asset)}
              >
                {/* Stock Info */}
                <View style={styles.stockDetails}>
                  <Text style={styles.stockTicker}>{asset.ticker}</Text>
                  <Text style={styles.stockName}>{asset.name}</Text>
                </View>

                {/* Micro Chart (High Aesthetics Sparkline) */}
                <View style={styles.sparklineContainer}>
                  <MiniSparkline isNegative={isNegative} />
                </View>

                {/* Stock Price Feed */}
                <View style={styles.stockPriceContainer}>
                  <Text style={styles.stockPrice}>
                    {activeMarket === 'ZSE' ? 'ZWG ' : '$'}
                    {livePrice.toFixed(activeMarket === 'ZSE' ? 2 : 4)}
                  </Text>
                  <View style={[styles.changeBadge, { backgroundColor: isNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    {isNegative ? <ArrowDownRight color="#EF4444" size={12} /> : <ArrowUpRight color="#10B981" size={12} />}
                    <Text style={[styles.changeText, { color: isNegative ? '#EF4444' : '#10B981' }]}>
                      {percentChange > 0 ? '+' : ''}{percentChange}%
                    </Text>
                  </View>
                </View>

              </TouchableOpacity>
            );
          })}
        </View>
      )}
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0E14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  overviewContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  balanceScroll: {
    flexDirection: 'row',
  },
  balanceCard: {
    width: width - 56,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currencyTag: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  cardFooterText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '500',
  },
  kycBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  kycText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  marketTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 4,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  marketTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeMarketTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  marketTabText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeMarketTabText: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  stockList: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  stockDetails: {
    width: '35%',
  },
  stockTicker: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stockName: {
    fontSize: 11,
    color: '#4B5563',
  },
  sparklineContainer: {
    width: '30%',
    alignItems: 'center',
  },
  stockPriceContainer: {
    width: '35%',
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

export default DashboardScreen;
