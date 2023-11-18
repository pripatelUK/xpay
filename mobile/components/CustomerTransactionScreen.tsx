import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { startNode, connectPeers, sendMessage, formatMessage } from '../waku/wakuConnect';
import { useAccount } from 'wagmi';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const [result, setResult] = React.useState();


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

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{status}</Text>
            <ActivityIndicator size="large" />
            <Button title="send topic" onPress={sendTopic} />
            <Button title="send value (TEST)" onPress={() => sendMessage("/customer/0x12345", "txvalue:1")} />
            <Button title="send tx data" onPress={sendTxData} />
            <Button title="HOME" onPress={() => navigation.navigate('Home')} />
        </View>
    );
};
