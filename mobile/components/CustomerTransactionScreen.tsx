import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Button, SafeAreaView, StyleSheet, TextInput } from 'react-native';
import { startNode, connectPeers, sendMessage, formatMessage } from '../waku/wakuConnect';
import { useAccount } from 'wagmi';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Picker } from '@react-native-picker/picker';

import {
    defaultPubsubTopic,
    onMessage,
} from '@waku/react-native';


export function CustomerTransactionScreen({ navigation }) {
    const { isConnected } = useAccount();
    const [customerTopic, setCustomerTopic] = React.useState('');
    const [status, setStatus] = React.useState('Connecting and processing...');
    const [isTopicSent, setTopicSent] = React.useState(false);
    const [isTxDataSent, setTxDataSent] = React.useState(false);
    const [isValueRecieved, setValueRecieved] = React.useState(false);

    const [amount, setAmount] = React.useState('');
    const [currency, setCurrency] = React.useState('EUR');
    const [requestingTransaction, setRequestingTransaction] = React.useState(false);


    const sendTopic = async () => {
        setTopicSent(true)
        setStatus("Opening Communication with Merchant...")
        const merchantTopic = await AsyncStorage.getItem('@merchantTopic')
        sendMessage(merchantTopic, "/customer/0x12345")
    }

    const sendTxData = async () => {
        setTxDataSent(true)
        setStatus("Sending Transaction Data...")
        sendMessage("/customer/0x12345", "txdata:blah")
        //@todo send the customer back home after they have paid
        // navigation.navigate('Home')
    }

    // send the customer topic
    React.useEffect(() => {
        (async () => {
            const customerAddr = "0x12345"
            setCustomerTopic(`/customer/${customerAddr}`)
            // console.log(result)
            await startNode();

            // listen on customer channel
            onMessage(async (event) => {
                // console.log(event)
                const customerAddr = "0x12345"
                if (event.wakuMessage.contentTopic !== `/customer/` + customerAddr) return;
                console.log(`/customer/` + customerAddr)
                // console.log(event.wakuMessage.payload)
                let payload = formatMessage(JSON.stringify(event.wakuMessage.payload));
                console.log("payload", payload)
                // console.log(payload.split())
                if (payload.includes("txvalue:")) {
                    setValueRecieved(true)
                    setStatus("Communication Opened")
                    console.log("txvalue found")
                }
            });

        })();

        defaultPubsubTopic().then(() => { });
    }, []);

    const formatCurrency = (value) => {
        // Format the input value to a currency format
        // Implement or use a library for currency formatting as needed
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    //@todo
    const handlePayment = () => {
        setRequestingTransaction(false)
        //@todo passkey auth
        setStatus("Executing Transaction")
        // send transaction
        // get transaction hash
        // send tx hash to merchant
        sendTxData()
    };

    if (requestingTransaction) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>{status}</Text>
                <Text style={styles.price}>{"15 EUR"}</Text>
                <View style={styles.inputRow}>
                    <Text style={styles.text}>{formatCurrency("1000")}</Text>
                    <Picker
                        itemStyle={{ height: 44 }}
                        selectedValue={currency}
                        style={styles.picker}
                        onValueChange={(itemValue) => setCurrency(itemValue)}
                    >
                        <Picker.Item label="GHO" value="GHO" />
                        <Picker.Item label="USDC" value="USDC" />
                        <Picker.Item label="sDAI" value="sDAI" />
                        {/* Add more currencies as needed */}
                    </Picker>
                </View>
                <Button title="Back" onPress={() => setRequestingTransaction(false)} />
                <Button title="Pay" onPress={handlePayment} />
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.title}>{status}</Text>
            <ActivityIndicator size="large" />
            <Button title="HOME" onPress={() => navigation.navigate('Home')} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    price: {
        fontSize: 32,
        marginBottom: 10,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '70%',
        marginBottom: 20,
    },
    text: {
        flex: 1,
        marginLeft: 40,
        fontSize: 32,
        // Additional text styling if needed
    },
    picker: {
        flex: 1,
        fontSize: 32,
        height: 60,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        padding: 20,
    },
    title: {
        fontSize: 22,
        marginBottom: 10,
    },
    // ... other styles
});