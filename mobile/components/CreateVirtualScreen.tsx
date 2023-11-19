import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { Alert, SafeAreaView, StyleSheet, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { Button } from './Button';
import { W3mButton } from '@web3modal/wagmi-react-native';
import { FlexView } from '@web3modal/ui-react-native';
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { Picker } from '@react-native-picker/picker';

import { IUserOperation, Presets, UserOperationBuilder } from 'userop';
import { api } from "../api";
import { getAddress, getGasLimits, getPaymasterData, sendUserOp, signUserOp, signUserOpWithCreate, userOpToSolidity } from "../utils/passkeyUtils";
import { Contract, ethers } from 'ethers';
import { provider } from '../utils/providers';
import { Passkey } from "react-native-passkey";
import keypassABI from '../abis/keypass.json';
import { entrypointContract, simpleAccountAbi, walletFactoryContract } from '../utils/contracts';
import { VITE_ENTRYPOINT } from '../utils/constants';
// import { Approve } from '../views/Approve';

export function CreateVirtualScreen({ navigation }) {
    const { isConnected, address } = useAccount();
    const [totalValue, setTotalValue] = useState(''); // State for total value
    const [allowance, setAllowance] = useState('');
    const [asset, setAsset] = useState('USDC'); // Default value

    const handleCreate = async () => {
        console.log("lol")
        try {
            // console.log(api)
            const res = await api.post("/register-options", {
                email: address,
                name: "1"
            });

            let options = res.data;
            console.log(options)
            options.authenticatorSelection.residentKey = "required";
            options.authenticatorSelection.requireResidentKey = true;
            options.extensions = {
                credProps: true,
            };

            console.log('options.challenge', options.challenge)
            // console.log(btoa(options.challenge))
            // options.challenge = btoa(options.challenge)

            const isSupported = Passkey.isSupported();
            console.log("isSupported", isSupported)
            const optionsResponse = await Passkey.register(options);
            console.log("optionsResponse", optionsResponse)
            const verifyRes = await api.post("/register-verify", {
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

    const [transactionHash, setTransactionHash] = useState('');
    const [transactionStatus, setTransactionStatus] = useState<'waiting' | 'confirmed' | 'error'>();
    const [isSubmitted, setIsSubmitted] = useState(false);

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
                    [walletAddress], [0], [keypassContract.interface.encodeFunctionData('setDailyAllowance', ["0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", ethers.utils.parseEther('100')])]
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
        const signature = loginPasskeyId
            ? await signUserOp(userOpHash, loginPasskeyId, passkey)
            : await signUserOpWithCreate(userOpHash, (address as string), passkey);

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
                await receipt.wait();
                setTransactionHash(receipt.hash);
                setTransactionStatus('confirmed');
                console.log({ receipt });
                //@todo approve
                navigation.navigate('Home');
            })
            .catch((e: any) => {
                setTransactionStatus('error');
                console.error(e);
            });
    }


    useEffect(() => {
        const logOut = async () => {
            if (!isConnected) {
                await AsyncStorage.removeItem('@session_token');
                navigation.navigate('Login');
            }
        };
        logOut();
    }, [isConnected]);

    if (transactionStatus == "waiting") {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Creating Virtual Card...</Text>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.container, styles.dark]}>
            <Text style={styles.title} variant="large-600">
                Create Virtual Card
            </Text>
            <W3mButton balance="show" />
            <FlexView style={styles.inputContainer}>
                <Picker
                    selectedValue={asset}
                    style={styles.picker}
                    onValueChange={(itemValue) => setAsset(itemValue)}
                >
                    <Picker.Item label="USDC" value="USDC" />
                    <Picker.Item label="GHO" value="GHO" />
                    <Picker.Item label="sDAI" value="sDAI" />
                </Picker>
                <Text style={styles.label}>Total Allowance</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Total Value"
                    keyboardType="numeric"
                    value={totalValue}
                    onChangeText={setTotalValue}
                />
                <Text style={styles.label}>Daily Allowance</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Allowance"
                    keyboardType="numeric"
                    value={allowance}
                    onChangeText={setAllowance}
                />
            </FlexView>
            <FlexView style={styles.buttonContainer}>
                <Button onPress={handleCreate}>
                    Create Wallet
                </Button>
                {/* <Approve navigation={navigation} /> */}
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
    inputContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10,
        marginBottom: 20,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
});
