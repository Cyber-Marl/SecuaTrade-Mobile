import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, FlatList
} from 'react-native';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react-native';
import api from '../services/api';
import useTradeStore from '../store/useTradeStore';

const MarketsScreen = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('LIMIT');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { connectWebSocket, setActiveAsset, orderBook, isConnected } = useTradeStore();

  useEffect(() => {
    fetchAssets();
    connectWebSocket();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('market/assets/');
      setAssets(res.data);
      if (res.data.length > 0) {
        setSelectedAsset(res.data[0]);
        setActiveAsset(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setActiveAsset(asset);
    setPrice('');
    setQuantity('');
  };

  const handleSubmitOrder = async () => {
    if (!selectedAsset) return;
    if (!quantity || (orderType === 'LIMIT' && !price)) {
      Alert.alert('Validation', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('trading/orders/create/', {
        asset: selectedAsset.id,
        side,
        order_type: orderType,
        quantity: parseFloat(quantity),
        price: orderType === 'LIMIT' ? parseFloat(price) : null,
      });
      Alert.alert('✅ Order Placed', `${side} order for ${quantity} ${selectedAsset.ticker} submitted.`);
      setPrice('');
      setQuantity('');
    } catch (e) {
      Alert.alert('Order Failed', e.response?.data?.detail || 'Could not place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#10B981" size="large" /></View>
  );

  const currentPrice = orderBook.current_price;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Asset Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.assetRow}>
        {assets.map(a => (
          <TouchableOpacity
            key={a.id}
            style={[s.assetChip, selectedAsset?.id === a.id && s.assetChipActive]}
            onPress={() => handleSelectAsset(a)}
          >
            <Text style={[s.assetChipText, selectedAsset?.id === a.id && s.assetChipTextActive]}>
              {a.ticker}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Price Header */}
      {selectedAsset && (
        <View style={s.priceHeader}>
          <View>
            <Text style={s.assetName}>{selectedAsset.name || selectedAsset.ticker}</Text>
            <Text style={s.assetSub}>{selectedAsset.exchange || 'ZSE'} · {selectedAsset.currency || 'ZWG'}</Text>
          </View>
          <View style={s.priceRight}>
            <Text style={s.currentPrice}>{currentPrice ? `$${currentPrice.toFixed(4)}` : '---'}</Text>
            <View style={[s.liveBadge, { backgroundColor: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
              <Activity size={10} color={isConnected ? '#10B981' : '#EF4444'} />
              <Text style={[s.liveText, { color: isConnected ? '#10B981' : '#EF4444' }]}>
                {isConnected ? 'LIVE' : 'OFF'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Order Book */}
      <View style={s.card}>
        <Text style={s.cardTitle}>ORDER BOOK</Text>
        <View style={s.bookRow}>
          {/* Asks */}
          <View style={s.bookCol}>
            <Text style={s.bookHeader}>ASKS</Text>
            {(orderBook.asks || []).slice(0, 5).map((ask, i) => (
              <View key={i} style={s.bookEntry}>
                <Text style={s.askPrice}>{parseFloat(ask.price).toFixed(4)}</Text>
                <Text style={s.bookQty}>{ask.quantity}</Text>
              </View>
            ))}
            {(!orderBook.asks || orderBook.asks.length === 0) && (
              <Text style={s.emptyBook}>No asks</Text>
            )}
          </View>
          <View style={s.bookDivider} />
          {/* Bids */}
          <View style={s.bookCol}>
            <Text style={s.bookHeader}>BIDS</Text>
            {(orderBook.bids || []).slice(0, 5).map((bid, i) => (
              <View key={i} style={s.bookEntry}>
                <Text style={s.bidPrice}>{parseFloat(bid.price).toFixed(4)}</Text>
                <Text style={s.bookQty}>{bid.quantity}</Text>
              </View>
            ))}
            {(!orderBook.bids || orderBook.bids.length === 0) && (
              <Text style={s.emptyBook}>No bids</Text>
            )}
          </View>
        </View>
      </View>

      {/* Order Entry */}
      <View style={s.card}>
        <Text style={s.cardTitle}>PLACE ORDER</Text>

        {/* Buy / Sell Toggle */}
        <View style={s.toggleRow}>
          <TouchableOpacity style={[s.toggleBtn, side === 'BUY' && s.buyActive]} onPress={() => setSide('BUY')}>
            <TrendingUp size={14} color={side === 'BUY' ? '#fff' : '#6B7280'} />
            <Text style={[s.toggleText, side === 'BUY' && { color: '#fff' }]}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleBtn, side === 'SELL' && s.sellActive]} onPress={() => setSide('SELL')}>
            <TrendingDown size={14} color={side === 'SELL' ? '#fff' : '#6B7280'} />
            <Text style={[s.toggleText, side === 'SELL' && { color: '#fff' }]}>SELL</Text>
          </TouchableOpacity>
        </View>

        {/* Order Type */}
        <View style={s.toggleRow}>
          {['LIMIT', 'MARKET'].map(t => (
            <TouchableOpacity
              key={t}
              style={[s.typeBtn, orderType === t && s.typeBtnActive]}
              onPress={() => setOrderType(t)}
            >
              <Text style={[s.typeBtnText, orderType === t && s.typeBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {orderType === 'LIMIT' && (
          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>PRICE</Text>
            <TextInput
              style={s.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0.0000"
              placeholderTextColor="#4B5563"
            />
          </View>
        )}

        <View style={s.inputWrap}>
          <Text style={s.inputLabel}>QUANTITY</Text>
          <TextInput
            style={s.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#4B5563"
          />
        </View>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: side === 'BUY' ? '#10B981' : '#EF4444' }]}
          onPress={handleSubmitOrder}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>{side} {selectedAsset?.ticker || 'Asset'}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0E14' },
  assetRow: { paddingHorizontal: 16, paddingVertical: 12 },
  assetChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', marginRight: 8,
  },
  assetChipActive: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.4)' },
  assetChipText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  assetChipTextActive: { color: '#10B981' },
  priceHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  assetName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  assetSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  priceRight: { alignItems: 'flex-end' },
  currentPrice: { color: '#10B981', fontSize: 22, fontWeight: '900' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4,
  },
  liveText: { fontSize: 10, fontWeight: '800' },
  card: {
    marginHorizontal: 16, marginBottom: 16, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: { color: '#4B5563', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 14 },
  bookRow: { flexDirection: 'row' },
  bookCol: { flex: 1 },
  bookDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 12 },
  bookHeader: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  bookEntry: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  askPrice: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
  bidPrice: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  bookQty: { color: '#9CA3AF', fontSize: 12 },
  emptyBook: { color: '#4B5563', fontSize: 12, textAlign: 'center', paddingVertical: 12 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  buyActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)' },
  sellActive: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)' },
  toggleText: { color: '#6B7280', fontSize: 13, fontWeight: '800' },
  typeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  typeBtnActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)' },
  typeBtnText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  typeBtnTextActive: { color: '#818CF8' },
  inputWrap: { marginBottom: 12 },
  inputLabel: { color: '#4B5563', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, fontWeight: '700',
  },
  submitBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default MarketsScreen;
