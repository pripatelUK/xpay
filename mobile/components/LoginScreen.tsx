import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { Button } from './Button';

import { Web3Modal, W3mButton } from '@web3modal/wagmi-react-native'
import { FlexView, Text } from '@web3modal/ui-react-native';
import { useAccount } from 'wagmi';

export function LoginScreen({ navigation }: any) {
    const { isConnected } = useAccount();
    useEffect(() => {
        // Logic to retrieve and set the session token, e.g., from AsyncStorage
        const goHome = async () => {
            if (isConnected) {
                navigation.navigate('Home');
            }
        };
        goHome();
    }, [isConnected]);
    return (
        <SafeAreaView style={[styles.container, styles.dark]}>
            <Text style={styles.title} variant="large-600">
                PePay
            </Text>
            <FlexView style={styles.buttonContainer}>
                <W3mButton balance="show" />
                {/* <SignMessage /> */}
                {/* <SendTransaction /> */}
                {/* <ReadContract /> */}
                <Button
                    onPress={async () => {
                        navigation.navigate('MerchantLogin');
                    }}>
                    Merchant Login
                </Button>
            </FlexView>
            <Web3Modal />
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    buttonContainer: {
        gap: 4,
    },
    dark: {
        backgroundColor: '#588C3C',
    },
    title: {
        marginBottom: 40,
        fontSize: 30,
    },
});
