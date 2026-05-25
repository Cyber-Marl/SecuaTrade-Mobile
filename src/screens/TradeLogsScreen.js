import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { CheckCircle, Clock, XCircle, AlertCircle, ClipboardList, RefreshCw } from 'lucide-react-native';
import api from '../services/api';

const STATUS_META = {
  FILLED:           { color: '#10B981', icon: (s) => <CheckCircle size={14} color="#10B981" />, label: 'Filled' },
  OPEN:             { color: '#FACC15', icon: (s) => <Clock size={14} color="#FACC15" />,       label: 'Open' },
  PARTIALLY_FILLED: { color: '#FACC15', icon: (s) => <Clock size={14} color="#FACC15" />,       label: 'Partial' },
  CANCELLED:        { color: '#6B7280', icon: (s) => <XCircle size={14} color="#6B7280" />,     label: 'Cancelled' },
  FAILED:           { color: '#EF4444', icon: (s) => <AlertCircle size={14} color="#EF4444" />, label: 'Failed' },
};

const TradeLogsScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('trading/orders/');
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const renderOrder = ({ item: o }) => {
    const meta = STATUS_META[o.status] || { color: '#9CA3AF', icon: () => null, label: o.status };
    return (
      <View style={s.row}>
        <View style={s.rowLeft}>
          <View style={[s.sideTag, { backgroundColor: o.side === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <Text style={[s.sideText, { color: o.side === 'BUY' ? '#10B981' : '#EF4444' }]}>{o.side}</Text>
          </View>
          <View>
            <Text style={s.ticker}>{o.asset_ticker || o.asset}</Text>
            <Text style={s.orderMeta}>{o.order_type} · {new Date(o.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={s.rowRight}>
          <View style={s.statusRow}>
            {meta.icon()}
            <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={s.qtyText}>{o.filled_quantity || 0}/{o.quantity} @ {o.price ? parseFloat(o.price).toFixed(4) : 'MKT'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Filter Chips */}
      <View style={s.filterRow}>
        {['ALL', 'OPEN', 'FILLED', 'CANCELLED'].map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.tableHeader}>
        <Text style={s.tableTitle}>EXECUTION HISTORY</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Text style={s.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#10B981" /></View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <ClipboardList size={48} color="#374151" />
          <Text style={s.emptyTitle}>No Orders Found</Text>
          <Text style={s.emptyText}>Your trade history will appear here after placing orders.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.id || i}`}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  filterChipActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  filterText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#10B981' },
  tableHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  tableTitle: { color: '#4B5563', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  refreshText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sideTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sideText: { fontSize: 11, fontWeight: '900' },
  ticker: { color: '#E2E8F0', fontSize: 15, fontWeight: '800' },
  orderMeta: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  qtyText: { color: '#9CA3AF', fontSize: 11, marginTop: 3 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyTitle: { color: '#9CA3AF', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#4B5563', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

export default TradeLogsScreen;
