
import '@walletconnect/react-native-compat';
import { WagmiConfig } from 'wagmi'
import {
  arbitrum,
  mainnet,
  polygon,
  avalanche,
  bsc,
  optimism,
  gnosis,
  zkSync,
  zora,
  base,
  celo,
  aurora,
} from 'wagmi/chains';
import { createWeb3Modal, defaultWagmiConfig, Web3Modal, W3mButton } from '@web3modal/wagmi-react-native'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { FlexView, Text } from '@web3modal/ui-react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';

import { HomeScreen } from './components/HomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { CreateVirtualScreen } from './components/CreateVirtualScreen';

const Stack = createStackNavigator();

// 1. Get projectId
const projectId = '49a082ffca38748d2ef8acceca12a92e'

// 2. Create config
const metadata = {
  name: 'PePay',
  description: 'PePay',
  url: 'https://pepay.io',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: {
    native: 'pepay://',
    // universal: 'YOUR_APP_UNIVERSAL_LINK.com'
  },
};


const chains = [
  mainnet,
  polygon,
  avalanche,
  arbitrum,
  bsc,
  optimism,
  gnosis,
  zkSync,
  zora,
  base,
  celo,
  aurora,
];

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({
  projectId,
  chains,
  wagmiConfig
})

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [initialized, setInitialized] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('@session_token');

      if (storedToken) {
        setSessionToken(storedToken);
      }

      setInitialized(true);
    })();
  }, []);

  if (!initialized) {
    return null;
  }



  return (
    <WagmiConfig config={wagmiConfig}>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'dark-content' : 'dark-content'} />
        <Stack.Navigator
          initialRouteName={sessionToken ? 'Home' : 'Login'}
          screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateVirtual" component={CreateVirtualScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </WagmiConfig >
  )
}