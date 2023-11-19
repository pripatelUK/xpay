import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Button, SafeAreaView, StyleSheet, TextInput, Alert } from 'react-native';
import { startNode, connectPeers, sendMessage, formatMessage } from '../waku/wakuConnect';
import { useAccount } from 'wagmi';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Picker } from '@react-native-picker/picker';

import {
    defaultPubsubTopic,
    onMessage,
} from '@waku/react-native';
import { IUserOperation, Presets, UserOperationBuilder } from 'userop';
import { api } from "../api";
import { getAddress, getGasLimits, getPaymasterData, sendUserOp, signUserOp, signUserOpWithCreate, userOpToSolidity } from "../utils/passkeyUtils";
import { Contract, ethers } from 'ethers';
import { provider } from '../utils/providers';
import { Passkey } from "react-native-passkey";
import keypassABI from '../abis/keypass.json';
import { entrypointContract, simpleAccountAbi, walletFactoryContract } from '../utils/contracts';
import { VITE_ENTRYPOINT } from '../utils/constants';


export function CustomerTransactionScreen({ navigation }) {
    const { isConnected, address } = useAccount();
    const [customerTopic, setCustomerTopic] = React.useState('');
    const [status, setStatus] = React.useState('Connecting and processing...');
    const [isTopicSent, setTopicSent] = React.useState(false);
    const [isTxDataSent, setTxDataSent] = React.useState(false);
    const [isValueRecieved, setValueRecieved] = React.useState(false);

    const [amount, setAmount] = React.useState('');
    const [currency, setCurrency] = React.useState('EUR');
    const [requestingTransaction, setRequestingTransaction] = React.useState(false);


    const handlePasskey = async () => {
        setRequestingTransaction(false)
        setStatus("Authenticating Passkey")
        console.log("lol")
        try {
            // console.log(api)
            const res = await api.post("/auth-options", {
                email: address,
                name: "1"
            });

            let options = res.data;
            console.log(options)
            // options.authenticatorSelection.residentKey = "required";
            // options.authenticatorSelection.requireResidentKey = true;
            // options.extensions = {
            //     credProps: true,
            // };

            console.log('options.challenge', options.challenge)
            // console.log(btoa(options.challenge))
            // options.challenge = btoa(options.challenge)

            const isSupported = Passkey.isSupported();
            console.log("isSupported", isSupported)
            const optionsResponse = await Passkey.authenticate(options);
            console.log("optionsResponse", optionsResponse)
            const verifyRes = await api.post("/auth-verify", {
                optionsResponse,
                email: address,
            });
            await handleSign(optionsResponse)
            if (verifyRes.status === 200) {
                // Alert.alert("All good", "success!");
                // //@todo approve
                // navigation.navigate('Home');
            }
        } catch (error) {
            // console.log("error")
            // Alert.alert("Error", "bad");

            // console.log(JSON.stringify(error));
            // console.log(error.stack);
        }
    };

    const [transactionHash, setTransactionHash] = React.useState('');
    const [transactionStatus, setTransactionStatus] = React.useState<'waiting' | 'confirmed' | 'error'>();
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    const handleSign = async (passkey: string) => {

        setTransactionStatus('waiting');
        console.log('yo login', address);

        // okay so this essentially just creates an address using the username
        const walletAddress = await getAddress((address as string));
        const keypassContract = new Contract(walletAddress, keypassABI.abi, provider);
        console.log('yo walletAddress', walletAddress);
        // const emails = ["t@t.com", "t@t.com1", "t@t.com3"]
        // const emailToAddr: any = []
        // for (let index = 0; index < emails.length; index++) {
        //     emailToAddr.push(await getAddress(emails[index]));
        // }
        // console.log("guardians:", emailToAddr)
        const userOpBuilder = new UserOperationBuilder()
            .useDefaults({
                sender: walletAddress,
            })
            .useMiddleware(Presets.Middleware.getGasPrice(provider))
            .setCallData(
                simpleAccountAbi.encodeFunctionData('executeBatch', [
                    [walletAddress], [0], [keypassContract.interface.encodeFunctionData('setDailyAllowance', ["0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", ethers.utils.parseEther('1000')])]
                ]),
            )
            .setNonce(await entrypointContract.getNonce(walletAddress, 0));

        const walletCode = await provider.getCode(walletAddress);
        console.log('yo walletCode', walletCode);
        const walletExists = walletCode !== '0x';
        console.log('yo walletExists', walletExists);
        console.log({ walletExists });

        if (!walletExists) {
            userOpBuilder.setInitCode(
                walletFactoryContract.address +
                walletFactoryContract.interface.encodeFunctionData('createAccount(string, uint256)', [address, 0]).slice(2),
            );
        }

        const { chainId } = await provider.getNetwork();
        const userOpToEstimateNoPaymaster = await userOpBuilder.buildOp(VITE_ENTRYPOINT, chainId);
        const paymasterAndData = await getPaymasterData(userOpToEstimateNoPaymaster);
        const userOpToEstimate = {
            ...userOpToEstimateNoPaymaster,
            paymasterAndData,
        };
        console.log({ userOpToEstimate });
        console.log('estimated userop', userOpToSolidity(userOpToEstimate));

        const [gasLimits, baseUserOp] = await Promise.all([
            getGasLimits(userOpToEstimate),
            userOpBuilder.buildOp(VITE_ENTRYPOINT, chainId),
        ]);
        console.log({
            gasLimits: Object.fromEntries(
                Object.entries(gasLimits).map(([key, value]) => [key, ethers.BigNumber.from(value).toString()]),
            ),
        });
        const userOp: IUserOperation = {
            ...baseUserOp,
            callGasLimit: gasLimits.callGasLimit,
            preVerificationGas: gasLimits.preVerificationGas,
            verificationGasLimit: gasLimits.verificationGasLimit,
            paymasterAndData,
        };

        console.log({ userOp });
        // console.log('to sign', userOpToSolidity(userOp));
        const userOpHash = await entrypointContract.getUserOpHash(userOp);
        // const userOpHash = "0x711a19f8418ca174fc7e215419af62c6097d8fa23bb8894cc55a090a1738d6d9";
        // console.log("guardian count:", await keypassContract.guardianCount())
        console.log('TO SIGN', { userOpHash });

        let loginPasskeyId = await AsyncStorage.getItem(`${address}_passkeyId`);
        // const signature = loginPasskeyId
        //     ? await signUserOp(userOpHash, loginPasskeyId, passkey)
        //     : await signUserOpWithCreate(userOpHash, (address as string), passkey);
        const signature = await signUserOp(userOpHash, loginPasskeyId, passkey)

        if (!signature) throw new Error('Signature failed');
        const signedUserOp: IUserOperation = {
            ...userOp,
            // paymasterAndData: await getPaymasterData(userOp),
            signature,
        };
        console.log({ signedUserOp });
        console.log('signed', userOpToSolidity(signedUserOp));
        // console.log("guardian count:", await keypassContract.guardianCount())

        sendUserOp(signedUserOp)
            .then(async (receipt: any) => {
                setStatus("Executing Transaction")
                await receipt.wait();
                setTransactionHash(receipt.hash);
                setTransactionStatus('confirmed');
                console.log({ receipt });
                sendTxData()
                //@todo approve
                navigation.navigate('Home');
            })
            .catch((e: any) => {
                setTransactionStatus('error');
                console.error(e);
            });
    }

    const sendTopic = async () => {
        setTopicSent(true)
        setStatus("Opening Communication with Merchant...")
        const merchantTopic = await AsyncStorage.getItem('@merchantTopic')
        sendMessage(merchantTopic, "/customer/0x12345")
    }

    const sendTxData = async () => {
        setTxDataSent(true)
        sendMessage("/customer/0x12345", "txdata:blah")
        setStatus("Sending Transaction Data...")
        //@todo send the customer back home after they have paid
        // navigation.navigate('Home')
    }

    // send the customer topic
    React.useEffect(() => {
        (async () => {
            const customerAddr = "0x12345"
            setCustomerTopic(`/customer/${customerAddr}`)
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

    // const [messages, setMessages] = useState([]);
    // const topic = '/merchant/0xcc0f309170261e186efd9504361b8a963d945338'; // The topic you want to subscribe to

    useEffect(() => {
        const ws = new WebSocket('ws://192.168.1.102:3010'); // Replace with your server's IP and port

        ws.onopen = async () => {
            // Subscribe to a topic when the connection is opened
            ws.send(JSON.stringify({ topic: "/customer/0x12345" }));
            sendTopic()
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.topic === "/customer/0x12345") {
                // setMessages((prevMessages) => [...prevMessages, data.message]);
                if (data.message.includes("txvalue:")) {
                    setValueRecieved(true)
                    setRequestingTransaction(true)
                    setStatus("Select Payment Method")
                    console.log("txvalue found")
                }
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            ws.close();
        };
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
                    <Text style={styles.text}>{formatCurrency("16.38")}</Text>
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
                <Button title="Pay" onPress={handlePasskey} />
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