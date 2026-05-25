import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform 
} from 'react-native';
import { X, ShieldCheck, HelpCircle } from 'lucide-react-native';
import api from '../services/api';
import useTradeStore from '../store/useTradeStore';

const { width } = Dimensions.get('window');

const TradeBottomSheet = ({ asset, onClose, onOrderExecuted }) => {
  const [side, setSide] = useState('BUY'); // BUY or SELL
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('FORM'); // FORM, SUCCESS

  const { orderBook, setActiveAsset, disconnectWebSocket } = useTradeStore();

  useEffect(() => {
    if (asset) {
      setActiveAsset(asset);
      setLimitPrice(asset.current_price ? parseFloat(asset.current_price).toString() : '');
    }
  }, [asset]);

  const livePrice = asset ? parseFloat(asset.current_price) : 0;
  const isZwg = asset?.market === 'ZSE';
  const currencyTag = isZwg ? 'ZWG' : 'USD';

  // Compute live order cost
  const qtyNum = parseFloat(quantity) || 0;
  const priceNum = orderType === 'MARKET' ? livePrice : (parseFloat(limitPrice) || 0);
  const estimatedCost = qtyNum * priceNum;

  const handlePlaceOrder = async () => {
    if (qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than zero.');
      return;
    }
    if (orderType === 'LIMIT' && priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid limit price.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        asset_id: asset.id,
        side: side,
        order_type: orderType,
        quantity: qtyNum,
        time_in_force: 'DAY'
      };

      if (orderType === 'LIMIT') {
        payload.price = priceNum;
      }

      const response = await api.post('trading/orders/', payload);

      if (response.status === 201 || response.status === 200) {
        setStatus('SUCCESS');
        setTimeout(() => {
          onOrderExecuted();
          onClose();
        }, 2200);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Order execution failed. Please verify balance.';
      Alert.alert('Order Failed', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.sheetOverlay}
    >
      <View style={styles.sheetContent}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetAssetTitle}>{asset?.ticker} — {side}</Text>
            <Text style={styles.sheetAssetSub}>{asset?.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>

        {status === 'FORM' ? (
          <View style={styles.formContainer}>
            {/* Side Toggle Selector */}
            <View style={styles.sideToggle}>
              <TouchableOpacity 
                style={[styles.sideBtn, side === 'BUY' && styles.buyActive]} 
                onPress={() => setSide('BUY')}
              >
                <Text style={[styles.sideText, side === 'BUY' && styles.activeText]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sideBtn, side === 'SELL' && styles.sellActive]} 
                onPress={() => setSide('SELL')}
              >
                <Text style={[styles.sideText, side === 'SELL' && styles.activeText]}>SELL</Text>
              </TouchableOpacity>
            </View>

            {/* Live Order Book Depth Bar */}
            <View style={styles.depthContainer}>
              <Text style={styles.depthLabel}>L2 Order Book Depth:</Text>
              <View style={styles.depthRow}>
                <Text style={styles.depthValueBuy}>
                  Top Bid: {orderBook.bids[0] ? `${currencyTag} ${orderBook.bids[0].price}` : 'No Bids'}
                </Text>
                <Text style={styles.depthValueSell}>
                  Top Ask: {orderBook.asks[0] ? `${currencyTag} ${orderBook.asks[0].price}` : 'No Asks'}
                </Text>
              </View>
            </View>

            {/* Order Type Toggle */}
            <View style={styles.orderTypeContainer}>
              <TouchableOpacity 
                style={[styles.typeTab, orderType === 'MARKET' && styles.activeTypeTab]}
                onPress={() => setOrderType('MARKET')}
              >
                <Text style={[styles.typeText, orderType === 'MARKET' && styles.activeTypeText]}>Market Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeTab, orderType === 'LIMIT' && styles.activeTypeTab]}
                onPress={() => setOrderType('LIMIT')}
              >
                <Text style={[styles.typeText, orderType === 'LIMIT' && styles.activeTypeText]}>Limit Order</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs Block */}
            <View style={styles.inputsBlock}>
              <View style={styles.inputItemRow}>
                <Text style={styles.inputLabel}>Shares / Quantity</Text>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#4B5563"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>

              {orderType === 'LIMIT' && (
                <View style={styles.inputItemRow}>
                  <Text style={styles.inputLabel}>Limit Price ({currencyTag})</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#4B5563"
                    value={limitPrice}
                    onChangeText={setLimitPrice}
                  />
                </View>
              )}
            </View>

            {/* Transaction Estimate Block */}
            <View style={styles.estimateBlock}>
              <Text style={styles.estimateLabel}>Estimated Cost</Text>
              <Text style={styles.estimateVal}>
                {isZwg ? 'ZWG ' : '$'}
                {estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Slide-to-Confirm Simulator Button */}
            <TouchableOpacity 
              style={[styles.confirmBtn, side === 'BUY' ? styles.btnBuyBg : styles.btnSellBg]}
              onPress={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>
                  Slide / Tap to Confirm {side}
                </Text>
              )}
            </TouchableOpacity>

          </View>
        ) : (
          <View style={styles.successBlock}>
            <ShieldCheck color="#10B981" size={72} style={{ marginBottom: 16 }} />
            <Text style={styles.successTitle}>Order Settled Successfully</Text>
            <Text style={styles.successDesc}>
              Double-entry balance locked. Stock transferred instantly to clearing ledger under SECZ.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 14, 20, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 24,
  },
  sheetContent: {
    padding: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 16,
  },
  sheetAssetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sheetAssetSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  formContainer: {},
  sideToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
  },
  sideBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  sideText: {
    color: '#6B7280',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buyActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  sellActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  activeText: {
    color: '#FFFFFF',
  },
  depthContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  depthLabel: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 6,
  },
  depthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  depthValueBuy: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  depthValueSell: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  orderTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeTab: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  activeTypeTab: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  typeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  activeTypeText: {
    color: '#FFFFFF',
  },
  inputsBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  inputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  inputField: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    width: 120,
    height: 40,
  },
  estimateBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  estimateLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  estimateVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmBtn: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  btnBuyBg: {
    backgroundColor: '#10B981',
  },
  btnSellBg: {
    backgroundColor: '#EF4444',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});

export default TradeBottomSheet;
