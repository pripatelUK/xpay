import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Alert, FlatList } from 'react-native';

import { Button } from './Button';

// import { SendTransaction } from '../views/SendTransaction';
// import { SignMessage } from '../views/SignMessage';

import { W3mButton } from '@web3modal/wagmi-react-native'
import { FlexView } from '@web3modal/ui-react-native';
import { useAccount, useDisconnect } from 'wagmi';
import { Linking } from 'react-native';
import { getAddress } from '../utils/passkeyUtils';

const mockTransactions = [
    { id: '1', time: '10:00 AM', amount: '100', assetType: 'USDC', deliveryMethod: 'NFC' },
    { id: '2', time: '11:30 AM', amount: '50', assetType: 'ETH', deliveryMethod: 'QR' },
    // ... more transactions
];

export function HomeScreen({ navigation }: any) {
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect()
    const [transactions, setTransactions] = React.useState(mockTransactions);

    const [passkeyID, setPasskeyID] = React.useState('');
    const [walletAddr, setWalletAddr] = React.useState('');

    useEffect(() => {
        const checkPasskey = async () => {
            if (isConnected) {
                let loginPasskeyId = await AsyncStorage.getItem(`${address}_passkeyId`);
                console.log(loginPasskeyId)
                let wallet = await getAddress((address as string));
                // console.log(wallet)
                setWalletAddr(wallet);
                if (loginPasskeyId) {
                    setPasskeyID(loginPasskeyId)
                }
            }
        };
        checkPasskey();
    }, [isConnected, address, passkeyID]);

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
        await AsyncStorage.removeItem(`0x00429a9D2e1102456a90f9110aaA43Fa042cea04_passkeyId`);
        await AsyncStorage.removeItem(passkeyID);
        await AsyncStorage.removeItem('@session_token');
        disconnect()
        navigation.navigate('Login');
    };

    const renderTransaction = ({ item }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => Alert.alert('Transaction Details', `Time: ${item.time}, Amount: ${item.amount}, Asset: ${item.assetType}, Delivery: ${item.deliveryMethod}`)}
        >
            <Text>{`Transaction ${item.id}`}</Text>
            <Text>{`Amount: ${item.amount} ${item.assetType}`}</Text>
        </TouchableOpacity>
    );


    if (passkeyID) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.phoneNumber}>{`Account`}</Text>
                <Text>Owner: {address}</Text>
                <Text>Virtual Card: {walletAddr}</Text>
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={item => item.id}
                />
                <Button
                    onPress={logOut}
                >
                    Log Out
                </Button>
            </SafeAreaView>
        )
    }
    return (
        <SafeAreaView>
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
        marginTop: 20,
    },
    phoneNumber: {
        fontSize: 20,
        textAlign: 'center',
        marginVertical: 10,
    },
    transactionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    title: {
        marginBottom: 40,
        fontSize: 30,
    },
    buttonContainer: {
        gap: 4,
    },
    // Add more styles as needed
});