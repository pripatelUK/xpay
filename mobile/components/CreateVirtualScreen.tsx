import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { Alert, SafeAreaView, StyleSheet, TextInput, View, Text } from 'react-native';
import { Button } from './Button';
import { W3mButton } from '@web3modal/wagmi-react-native';
import { FlexView } from '@web3modal/ui-react-native';
import { useAccount } from 'wagmi';
import { Picker } from '@react-native-picker/picker';

import { api } from "../api";
import { Passkey } from "react-native-passkey";
import { decode as atob, encode as btoa } from 'base-64'

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
            console.log(btoa(options.challenge))
            // options.challenge = btoa(options.challenge)

            const isSupported = Passkey.isSupported();
            console.log("isSupported", isSupported)
            const optionsResponse = await Passkey.register(options);
            console.log("optionsResponse", optionsResponse)
            const verifyRes = await api.post("/register-verify", {
                optionsResponse,
                email: address,
            });
            if (verifyRes.status === 200) {
                Alert.alert("All good", "success!");
            }
        } catch (error) {
            // console.log("error")
            // Alert.alert("Error", "bad");

            // console.log(JSON.stringify(error));
            // console.log(error.stack);
        }
    };
    useEffect(() => {
        const logOut = async () => {
            if (!isConnected) {
                await AsyncStorage.removeItem('@session_token');
                navigation.navigate('Login');
            }
        };
        logOut();
    }, [isConnected]);

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
                <Text style={styles.label}>Total Value</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Total Value"
                    keyboardType="numeric"
                    value={totalValue}
                    onChangeText={setTotalValue}
                />
                <Text style={styles.label}>Allowance</Text>
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
                    Create
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
