import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { TrendingUp, TrendingDown, PieChart, DollarSign, BarChart2 } from 'lucide-react-native';
import api from '../services/api';

const PortfolioScreen = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPortfolio(); }, []);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await api.get('trading/portfolio/');
      setPortfolio(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#10B981" size="large" /></View>
  );

  const zwgHoldings = portfolio?.ZWG || [];
  const usdHoldings = portfolio?.USD || [];
  const totalZWG = zwgHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalUSD = usdHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);

  const renderHolding = (holding, currency) => {
    const pnl = holding.unrealized_pnl || 0;
    const isPos = pnl >= 0;
    return (
      <View key={holding.ticker} style={s.holdingRow}>
        <View style={s.holdingLeft}>
          <View style={[s.tickerBadge, { backgroundColor: currency === 'ZWG' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)' }]}>
            <Text style={[s.tickerText, { color: currency === 'ZWG' ? '#10B981' : '#818CF8' }]}>{holding.ticker}</Text>
          </View>
          <View>
            <Text style={s.holdingName}>{holding.name || holding.ticker}</Text>
            <Text style={s.holdingQty}>{holding.quantity} shares @ {holding.avg_price?.toFixed(4)}</Text>
          </View>
        </View>
        <View style={s.holdingRight}>
          <Text style={s.holdingValue}>{currency === 'ZWG' ? 'ZWG' : '$'}{holding.current_value?.toFixed(2)}</Text>
          <View style={s.pnlRow}>
            {isPos ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />}
            <Text style={[s.pnlText, { color: isPos ? '#10B981' : '#EF4444' }]}>
              {isPos ? '+' : ''}{pnl.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderColor: 'rgba(16,185,129,0.2)' }]}>
          <View style={[s.iconBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <BarChart2 size={18} color="#10B981" />
          </View>
          <Text style={s.summaryLabel}>ZSE (ZWG)</Text>
          <Text style={s.summaryValue}>ZWG {totalZWG.toFixed(2)}</Text>
          <Text style={s.summaryCount}>{zwgHoldings.length} positions</Text>
        </View>
        <View style={[s.summaryCard, { borderColor: 'rgba(99,102,241,0.2)' }]}>
          <View style={[s.iconBox, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
            <DollarSign size={18} color="#818CF8" />
          </View>
          <Text style={s.summaryLabel}>VFEX (USD)</Text>
          <Text style={s.summaryValue}>${totalUSD.toFixed(2)}</Text>
          <Text style={s.summaryCount}>{usdHoldings.length} positions</Text>
        </View>
      </View>

      <TouchableOpacity style={s.refreshBtn} onPress={fetchPortfolio}>
        <Text style={s.refreshText}>↻ Refresh</Text>
      </TouchableOpacity>

      {/* ZSE Holdings */}
      {zwgHoldings.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.marketPill}>
              <Text style={[s.marketPillText, { color: '#10B981' }]}>ZSE · ZWG</Text>
            </View>
            <Text style={s.cardTotal}>ZWG {totalZWG.toFixed(2)}</Text>
          </View>
          {zwgHoldings.map(h => renderHolding(h, 'ZWG'))}
        </View>
      )}

      {/* VFEX Holdings */}
      {usdHoldings.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={[s.marketPill, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }]}>
              <Text style={[s.marketPillText, { color: '#818CF8' }]}>VFEX · USD</Text>
            </View>
            <Text style={s.cardTotal}>${totalUSD.toFixed(2)}</Text>
          </View>
          {usdHoldings.map(h => renderHolding(h, 'USD'))}
        </View>
      )}

      {zwgHoldings.length === 0 && usdHoldings.length === 0 && (
        <View style={s.emptyState}>
          <PieChart size={48} color="#374151" />
          <Text style={s.emptyTitle}>No Holdings Yet</Text>
          <Text style={s.emptyText}>Place your first trade in the Markets tab to build your portfolio.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0E14' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  summaryCount: { color: '#4B5563', fontSize: 11, marginTop: 2 },
  refreshBtn: { alignSelf: 'flex-end', marginBottom: 12 },
  refreshText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16, overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  marketPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  marketPillText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  cardTotal: { color: '#fff', fontSize: 16, fontWeight: '800' },
  holdingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tickerBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tickerText: { fontSize: 12, fontWeight: '900' },
  holdingName: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  holdingQty: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: '#fff', fontSize: 14, fontWeight: '800' },
  pnlRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  pnlText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { color: '#9CA3AF', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#4B5563', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

export default PortfolioScreen;
