import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, TextInput, View, Button, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import {
    defaultPubsubTopic,
    onMessage,
} from '@waku/react-native';

import { connectPeers, formatMessage, sendMessage, startNode } from '../waku/wakuConnect';
import AsyncStorage from '@react-native-async-storage/async-storage';


export function NewTransactionScreen({ navigation }) {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [requestingTransaction, setRequestingTransaction] = useState(false);
    const inputRef = useRef(null);
    const [result, setResult] = React.useState();
    const [isTopicRecieved, setTopicRecieved] = React.useState(false);
    const [isTxDataRecieved, setTxDataRecieved] = React.useState(false);
    const [isValueDataSent, setValueDataSent] = React.useState(false);
    const [status, setStatus] = React.useState('Requesting Transaction...');

    const sendValueData = async () => {
        setValueDataSent(true)
        setStatus("Sending Customer Price...")
        sendMessage("/customer/0x12345", "txvalue:1")
    }

    //@todo remove this is for customer only
    const sendTopic = async () => {
        const chipId = await AsyncStorage.getItem('@chipId')
        sendMessage('/merchant/' + chipId, "/customer/0x12345")
    }


    React.useEffect(() => {
        (async () => {

            await startNode();

            onMessage(async (event) => {
                // console.log(event)
                let chipId = await AsyncStorage.getItem('@chipId');
                console.log(event.wakuMessage)
                console.log(event.wakuMessage.contentTopic, `/merchant/` + chipId)
                if (event.wakuMessage.contentTopic !== `/merchant/` + chipId) return;

                let payload = formatMessage(JSON.stringify(event.wakuMessage.payload));
                console.log("payload", payload)
                // console.log(payload.split())
                if (payload.includes("/customer/")) {
                    setTopicRecieved(true)
                    setStatus("Opening Communication with Customer...")
                    console.log("topic found")
                }
            });

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
                if (payload.includes("txdata:")) {
                    setTxDataRecieved(true)
                    setStatus("Recieved Transaction Data")
                    console.log("txdata found")
                }
            });

        })();

        defaultPubsubTopic().then(() => { });
    }, []);

    useEffect(() => {
        inputRef.current.focus();
    }, []);

    const formatCurrency = (value) => {
        // Format the input value to a currency format
        // Implement or use a library for currency formatting as needed
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleStart = () => {
        setRequestingTransaction(true);
    };

    if (requestingTransaction) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>{status}</Text>
                <Text>Please wait...</Text>
                <Text>Amount: {formatCurrency(amount)}</Text>
                <Text>Asset: {currency}</Text>
                <Button title="Back" onPress={() => setRequestingTransaction(false)} />
                <Button title="send topic (test)" onPress={sendTopic} />
                <Button title="send Value" onPress={sendValueData} />
                <Button title="send tx data (test)" onPress={() => sendMessage("/customer/0x12345", "txdata:blah")} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Picker
                selectedValue={currency}
                style={styles.picker}
                onValueChange={(itemValue) => setCurrency(itemValue)}
            >
                <Picker.Item label="EUR" value="EUR" />
                <Picker.Item label="CUSD" value="CUSD" />
            </Picker>
            <TextInput
                ref={inputRef}
                style={styles.input}
                keyboardType="numeric"
                value={amount}
                onChangeText={text => setAmount(formatCurrency(text))}
                placeholder="Enter Amount"
            />
            <View style={styles.buttonContainer}>
                <Button title="Back" onPress={() => navigation.goBack()} />
                <Button title="Start" onPress={handleStart} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        fontSize: 24,
        borderBottomWidth: 1,
        width: '80%',
        textAlign: 'center',
        padding: 10,
        marginVertical: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        padding: 20,
    },
    picker: {
        width: 150,
        height: 44,
    },
    title: {
        fontSize: 22,
        marginBottom: 10,
    },
    // ... other styles
});

export default NewTransactionScreen;
