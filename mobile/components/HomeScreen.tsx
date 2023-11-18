import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { Button } from './Button';

// import { SendTransaction } from '../views/SendTransaction';
// import { SignMessage } from '../views/SignMessage';

import { W3mButton } from '@web3modal/wagmi-react-native'
import { FlexView, Text } from '@web3modal/ui-react-native';
import { useAccount, useDisconnect } from 'wagmi';
import { Linking } from 'react-native';
import { getAddress } from '../utils/passkeyUtils';

export function HomeScreen({ navigation }: any) {
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect()

    const [passkeyID, setPasskeyID] = React.useState('');
    const [walletAddr, setWalletAddr] = React.useState('');

    useEffect(() => {
        const checkPasskey = async () => {
            if (isConnected) {
                let loginPasskeyId = await AsyncStorage.getItem(`${address}_passkeyId`);
                // console.log(loginPasskeyId)
                let wallet = await getAddress((address as string));
                // console.log(wallet)
                setWalletAddr(wallet);
                if (loginPasskeyId) {
                    setPasskeyID(loginPasskeyId)
                }
            }
        };
        checkPasskey();
    }, [isConnected, address]);

    useEffect(() => {
        const handleDeepLink = async (event) => {
            console.log(event.url);
            //@todo ensure they have walletconnect added
            await AsyncStorage.setItem('@merchantTopic', "/merchant/0xcc0f309170261e186efd9504361b8a963d945338");
            navigation.navigate('CustomerTransaction');
            // Handle the deep link URL (e.g., navigate to a specific screen)
        };

        Linking.addEventListener('url', handleDeepLink);

        return () => {
            Linking.removeEventListener('url', handleDeepLink);
        };
    }, []);

    useEffect(() => {
        // Logic to retrieve and set the session token, e.g., from AsyncStorage
        const logOut = async () => {
            if (!isConnected) {
                await AsyncStorage.removeItem('@session_token');
                navigation.navigate('Login');
            }
        };
        logOut();
    }, [isConnected]);

    const logOut = async () => {
        await AsyncStorage.removeItem(passkeyID);
        await AsyncStorage.removeItem('@session_token');
        disconnect()
        navigation.navigate('Login');
    };


    if (passkeyID) {
        return (
            <SafeAreaView style={[styles.container]}>
                <Text style={styles.title}>
                    Account
                </Text>
                <FlexView style={styles.buttonContainer}>
                    <Text>{address}</Text>
                    <Text>Virtual Card: {walletAddr}</Text>
                    <Button
                        onPress={logOut}>
                        Logout
                    </Button>
                </FlexView>
            </SafeAreaView>
        )
    }
    return (
        <SafeAreaView style={[styles.container]}>
            <Text style={styles.title}>
                Account
            </Text>
            <FlexView style={styles.buttonContainer}>
                <Button
                    onPress={async () => {
                        navigation.navigate('CreateVirtual');
                    }}>
                    Create Virtual Card
                </Button>
            </FlexView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: '#FFFFFF',
    },
    buttonContainer: {
        gap: 4,
    },
    dark: {
        // backgroundColor: '#588C3C',
    },
    title: {
        marginBottom: 40,
        fontSize: 30,
    },
});
