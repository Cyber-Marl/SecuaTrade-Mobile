# SecuaTrade Mobile 📱

Cross-platform mobile trading application for **SecuaTrade**, built with **React Native (Expo)**, **Zustand**, and **Biometric Authentication**. Designed for emerging markets to provide real-time equities trading, portfolio tracking, wallet management, and KYC verification on iOS and Android.

## ✨ Key Features

- **Biometric & JWT Authentication**: Secure sign-in with fingerprint/Face ID re-authentication (`expo-local-authentication`) and JWT bearer tokens.
- **Live Market Watch & Sparklines**: Browse equities with real-time price updates, 24h changes, and custom SVG mini-sparklines (`react-native-svg`).
- **Interactive Trade Execution**: Instant Buy/Sell order placement via an animated bottom sheet (`TradeBottomSheet`).
- **Portfolio & Analytics**: Track holdings, asset allocation, average buy prices, and unrealized P&L in real time.
- **Digital Wallet & Ledger**: Deposit/withdraw funds and inspect immutable transaction history.
- **Trade Logs**: Full audit trail of open, filled, and cancelled orders.
- **In-App KYC Verification**: Submit and track identity verification status directly from the mobile app.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (0.81) & [Expo SDK 54](https://expo.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Networking**: [Axios](https://axios-http.com/) (REST API) & WebSockets (live market feed)
- **UI & Icons**: [Lucide React Native](https://lucide.dev/), `react-native-svg`, `expo-blur`, `@expo-google-fonts/inter`
- **Security**: `expo-local-authentication`

## 📂 Project Structure

```text
SecuaTrade-Mobile/
├── App.js                        # Root navigation, animated transitions & bottom tab bar
├── app.json                      # Expo configuration
├── src/
│   ├── components/
│   │   ├── MiniSparkline.js      # SVG sparkline chart component
│   │   └── TradeBottomSheet.js   # Modal bottom sheet for Buy/Sell orders
│   ├── screens/
│   │   ├── DashboardScreen.js    # Home overview, quick actions & top movers
│   │   ├── KYCScreen.js          # Identity verification workflow
│   │   ├── LoginScreen.js        # Auth & biometric sign-in screen
│   │   ├── MarketsScreen.js      # Live market quotes & order triggers
│   │   ├── PortfolioScreen.js    # Holdings breakdown & performance metrics
│   │   ├── ProfileScreen.js      # User profile, security & account settings
│   │   ├── TradeLogsScreen.js    # Order execution & trade history
│   │   └── WalletScreen.js       # Cash balance, deposits & withdrawals
│   ├── services/
│   │   └── api.js                # Axios client & JWT token interceptor
│   └── store/
│       └── useTradeStore.js      # Global Zustand store for market & user state
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Expo Go** app on your iOS/Android device (or an Android Studio / Xcode emulator)
- Running instance of **SecuaTrade-Backend** (`http://<YOUR_LAN_IP>:8000`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Cyber-Marl/SecuaTrade-Mobile.git
   cd SecuaTrade-Mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory pointing to the LAN IP of your machine running the SecuaTrade backend:
   ```env
   EXPO_PUBLIC_API_IP=192.168.1.100
   ```

4. **Start the Expo development server:**
   ```bash
   npx expo start
   ```
   - Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).
   - Press `a` to open on an Android Emulator, or `w` for Web.

## 📄 License

This project is licensed under the MIT License.
