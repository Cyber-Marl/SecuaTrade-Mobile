import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Modal
} from 'react-native';
import { Wallet, ArrowDownCircle, ArrowUpCircle, History, X, Building, Smartphone } from 'lucide-react-native';
import api from '../services/api';

const TABS = ['Overview', 'Transactions', 'Payment Methods'];

const WalletScreen = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [ledger, setLedger] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null); // 'DEPOSIT_SELECT' | 'BANK' | 'ECOCASH' | 'WITHDRAW'
  const [amount, setAmount] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [institution, setInstitution] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ledgerRes, accountsRes] = await Promise.all([
        api.get('accounts/ledger/'),
        api.get('accounts/payment-methods/'),
      ]);
      setLedger(ledgerRes.data);
      setLinkedAccounts(accountsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const zwgBalance = ledger.filter(t => t.currency === 'ZWG').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const usdBalance = ledger.filter(t => t.currency === 'USD').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const handleLinkAccount = async (methodType) => {
    try {
      await api.post('accounts/payment-methods/', {
        method_type: methodType,
        account_identifier: identifier,
        institution_name: institution || methodType,
      });
      setShowModal(null);
      setIdentifier('');
      setInstitution('');
      fetchAll();
      Alert.alert('✅ Linked', 'Payment method added successfully.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Could not link account.');
    }
  };

  const txTypeColor = (type) => {
    if (!type) return '#9CA3AF';
    if (type.includes('DEPOSIT') || type.includes('BUY')) return '#10B981';
    return '#EF4444';
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#10B981" size="large" /></View>
  );

  return (
    <View style={s.container}>
      {/* Balance Cards */}
      <View style={s.balanceRow}>
        <View style={[s.balanceCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
          <Text style={s.balanceLabel}>ZSE Balance</Text>
          <Text style={s.balanceValue}>ZWG {Math.abs(zwgBalance).toFixed(2)}</Text>
          <Text style={s.balanceSub}>Zimbabwe Dollar</Text>
        </View>
        <View style={[s.balanceCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
          <Text style={s.balanceLabel}>VFEX Balance</Text>
          <Text style={[s.balanceValue, { color: '#818CF8' }]}>${Math.abs(usdBalance).toFixed(2)}</Text>
          <Text style={s.balanceSub}>US Dollar</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity style={s.actionBtn} onPress={() => setShowModal('DEPOSIT_SELECT')}>
          <ArrowDownCircle size={20} color="#10B981" />
          <Text style={s.actionText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => setShowModal('WITHDRAW')}>
          <ArrowUpCircle size={20} color="#EF4444" />
          <Text style={[s.actionText, { color: '#EF4444' }]}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'Overview' && (
          <View style={s.overviewContent}>
            <View style={s.infoCard}>
              <Wallet size={24} color="#10B981" />
              <Text style={s.infoTitle}>Dual-Currency Wallet</Text>
              <Text style={s.infoText}>Your SecuaTrade wallet holds both ZWG (Zimbabwe Gold) for ZSE trades and USD for VFEX trades. Funds are kept separate per exchange regulation.</Text>
            </View>
          </View>
        )}

        {activeTab === 'Transactions' && (
          <View>
            {ledger.length === 0
              ? <Text style={s.emptyText}>No transactions yet.</Text>
              : ledger.map((tx, i) => (
                <View key={i} style={s.txRow}>
                  <View>
                    <Text style={s.txType}>{tx.transaction_type || 'TRANSACTION'}</Text>
                    <Text style={s.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[s.txAmount, { color: txTypeColor(tx.transaction_type) }]}>
                    {tx.currency === 'USD' ? '$' : 'ZWG '}{parseFloat(tx.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            }
          </View>
        )}

        {activeTab === 'Payment Methods' && (
          <View>
            <TouchableOpacity style={s.addMethodBtn} onPress={() => setShowModal('DEPOSIT_SELECT')}>
              <Text style={s.addMethodText}>+ Add Payment Method</Text>
            </TouchableOpacity>
            {linkedAccounts.length === 0
              ? <Text style={s.emptyText}>No payment methods linked.</Text>
              : linkedAccounts.map((acc, i) => (
                <View key={i} style={s.methodRow}>
                  {acc.method_type === 'BANK' ? <Building size={18} color="#818CF8" /> : <Smartphone size={18} color="#10B981" />}
                  <View style={{ marginLeft: 12 }}>
                    <Text style={s.methodName}>{acc.institution_name}</Text>
                    <Text style={s.methodId}>{acc.account_identifier}</Text>
                  </View>
                </View>
              ))
            }
          </View>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={showModal === 'DEPOSIT_SELECT'} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Funds via</Text>
              <TouchableOpacity onPress={() => setShowModal(null)}><X size={20} color="#6B7280" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={s.methodOption} onPress={() => setShowModal('BANK')}>
              <Building size={22} color="#818CF8" />
              <View style={{ marginLeft: 14 }}>
                <Text style={s.methodOptionTitle}>Bank Transfer</Text>
                <Text style={s.methodOptionSub}>ZWG or USD via RTGS</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.methodOption} onPress={() => setShowModal('ECOCASH')}>
              <Smartphone size={22} color="#10B981" />
              <View style={{ marginLeft: 14 }}>
                <Text style={s.methodOptionTitle}>EcoCash</Text>
                <Text style={s.methodOptionSub}>Mobile money (ZWG)</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.methodOption} onPress={() => setShowModal('INNBUCKS')}>
              <Smartphone size={22} color="#F59E0B" />
              <View style={{ marginLeft: 14 }}>
                <Text style={s.methodOptionTitle}>InnBucks</Text>
                <Text style={s.methodOptionSub}>Mobile money (USD)</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bank / EcoCash / InnBucks Link Modal */}
      {['BANK', 'ECOCASH', 'INNBUCKS', 'WITHDRAW'].includes(showModal) && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{showModal === 'WITHDRAW' ? 'Withdraw Funds' : `Link ${showModal}`}</Text>
                <TouchableOpacity onPress={() => setShowModal(null)}><X size={20} color="#6B7280" /></TouchableOpacity>
              </View>
              <TextInput
                style={s.modalInput}
                placeholder={showModal === 'BANK' ? 'Account number' : 'Phone number'}
                placeholderTextColor="#4B5563"
                value={identifier}
                onChangeText={setIdentifier}
              />
              {showModal === 'BANK' && (
                <TextInput
                  style={s.modalInput}
                  placeholder="Bank name"
                  placeholderTextColor="#4B5563"
                  value={institution}
                  onChangeText={setInstitution}
                />
              )}
              <TextInput
                style={s.modalInput}
                placeholder="Amount"
                placeholderTextColor="#4B5563"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={s.modalSubmit}
                onPress={() => handleLinkAccount(showModal)}
              >
                <Text style={s.modalSubmitText}>
                  {showModal === 'WITHDRAW' ? 'Request Withdrawal' : 'Link & Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0E14' },
  balanceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  balanceCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  balanceLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  balanceValue: { color: '#10B981', fontSize: 20, fontWeight: '900' },
  balanceSub: { color: '#4B5563', fontSize: 11, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  actionText: { color: '#10B981', fontSize: 14, fontWeight: '700' },
  tabRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  tabText: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#10B981' },
  overviewContent: { paddingBottom: 20 },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 20, alignItems: 'center', gap: 12,
  },
  infoTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  infoText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  txType: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  txDate: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  emptyText: { color: '#4B5563', textAlign: 'center', paddingVertical: 40, fontSize: 14 },
  addMethodBtn: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    paddingVertical: 12, alignItems: 'center', marginBottom: 12,
  },
  addMethodText: { color: '#10B981', fontWeight: '700' },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  methodName: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  methodId: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  methodOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  methodOptionTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  methodOptionSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 14, color: '#fff', fontSize: 14, marginBottom: 12,
  },
  modalSubmit: {
    backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default WalletScreen;
