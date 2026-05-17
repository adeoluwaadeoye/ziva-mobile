<div align="center">

<!-- Replace this with your actual banner/screenshot -->
<img src="./assets/icon.jpg" alt="ZIVA Logo" width="90" style="border-radius:16px" />

<h1>ZIVA — Mobile App</h1>

<p>Premium Nigerian fashion, designed in Lagos.<br/>Shop Ankara, Aso-Oke, Agbada, Kaftan, Adire and more — delivered worldwide.</p>

[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-black?style=flat-square)](https://expo.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

[Web Version](https://github.com/adeoluwaadeoye/ziva) · [Live Site](https://zivaclothings.vercel.app)

</div>

---

## Screenshots

> Add screenshots here after building the app. Use 3–4 portrait images side by side for best results on GitHub.


<div align="center">
  <img src="./screenshots/home.png" width="23%" />
  <img src="./screenshots/products.png" width="23%" />
  <img src="./screenshots/product-detail.png" width="23%" />
  <img src="./screenshots/orders.png" width="23%" />
</div>


---

## Features

- **Browse & Filter** — Shop by category, gender, and collection (Ankara, Aso-Oke, Agbada, Kaftan, Adire, and more)
- **Product Detail** — Image gallery, size & colour picker, related products
- **Cart** — Persistent cart with quantity controls
- **Wishlist** — Save favourites across sessions
- **Authentication** — Register, sign in, and manage your profile
- **Checkout & Payment** — Seamless Paystack integration with live payment status
- **Order History** — View all past orders with status tracking
- **Invoice Download** — Download a PDF invoice for any order
- **Dark Mode** — Automatic system-level dark/light theme
- **Haptic Feedback** — Tactile responses on key interactions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 (New Architecture) |
| Navigation | [Expo Router](https://expo.github.io/router) — file-based routing |
| Language | TypeScript |
| Styling | React Native StyleSheet |
| Images | [expo-image](https://docs.expo.dev/versions/latest/sdk/image/) |
| Storage | [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| Payments | [Paystack](https://paystack.com) via WebView |
| File System | [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) |
| Sharing | [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) |
| Icons | [@expo/vector-icons](https://docs.expo.dev/guides/icons/) — Ionicons |
| Backend | ZIVA Web API (Next.js on Vercel) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo Go](https://expo.dev/go) on your phone, or an Android/iOS emulator

### Installation

```bash
# Clone the repo
git clone https://github.com/adeoluwaadeoye/ziva-mobile.git
cd ziva-mobile

# Install dependencies
npm install
```

### Configuration

Open `lib/config.ts` and set the API base URL to your deployed web app:

```ts
// lib/config.ts
export const API_BASE_URL = 'https://zivaclothings.vercel.app';
// For local dev: use your machine's local IP, e.g. 'http://192.168.1.10:3000'
```

Also add your Paystack public key in `lib/api.ts` (or wherever it is referenced):

```ts
const PAYSTACK_KEY = 'pk_live_xxxxxxxxxxxxxxxxxxxx';
```

### Run

```bash
# Start the dev server
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

Scan the QR code with **Expo Go** on your device, or press `a` / `i` to open an emulator.

---

## Project Structure

```
app/                  # Screens (file-based routing via Expo Router)
  (tabs)/             # Tab navigator screens
    index.tsx         # Home / product feed
    cart.tsx          # Shopping cart
    wishlist.tsx      # Saved items
  orders.tsx          # Order history
  product/[id].tsx    # Product detail
  auth.tsx            # Login / register
  checkout.tsx        # Checkout flow
  payment.tsx         # Paystack WebView
lib/
  api.ts              # All API calls to the ZIVA backend
  config.ts           # API_BASE_URL and environment config
  AuthContext.tsx     # Authentication state
  CartContext.tsx     # Cart state
  OrderContext.tsx    # Order fetching and placement
  WishlistContext.tsx # Wishlist state
  theme.ts            # Colours, spacing, typography
assets/               # Icons, splash screen, fonts
```

---

## Building for Production

This project uses [EAS (Expo Application Services)](https://expo.dev/eas) for builds and submissions.

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure EAS (generates eas.json)
eas build:configure

# Build for Android (.apk / .aab)
eas build --platform android

# Build for iOS (.ipa)
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## Related

| | |
|---|---|
| **Web App** | [github.com/adeoluwaadeoye/ziva](https://github.com/adeoluwaadeoye/ziva) |
| **Live Site** | [zivaclothings.vercel.app](https://zivaclothings.vercel.app) |

---

## Setting Up the GitHub Link Preview Card

When you share either GitHub repo link (on WhatsApp, Twitter, iMessage etc.), GitHub generates a preview card automatically. To make it show a **custom image** instead of the default grey card:

1. Go to your GitHub repository page
2. Click **Settings** (top right of the repo, not your account settings)
3. Scroll down to **Social preview**
4. Click **Edit** → upload a **1280 × 640 px** image (landscape)
5. Save — the card will now show your image when the link is shared

> Do this for **both** the mobile repo and the web repo. A good social preview is a screenshot of the app/site with the ZIVA logo and a short tagline overlaid.

---

<div align="center">
  <sub>Designed in Lagos · Crafted with care · Delivered worldwide</sub>
</div>
