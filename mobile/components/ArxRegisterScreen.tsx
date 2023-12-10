
import AsyncStorage from '@react-native-async-storage/async-storage'; import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, TextInput, View, Alert } from 'react-native';

import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { execHaloCmdRN } from '@arx-research/libhalo/api/react-native.js';
import { Button } from './Button';
import { FlexView, Text } from '@web3modal/ui-react-native';

export function ArxRegisterScreen({ navigation }) {
    const [iban, setIban] = useState('');
    const [isNfcReady, setIsNfcReady] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        // Retrieve the phone number when the component mounts
        async function loadPhoneNumber() {
            const storedPhoneNumber = await AsyncStorage.getItem('@phone_number');
            if (storedPhoneNumber) {
                setPhoneNumber(storedPhoneNumber);
            } else {
                console.warn("Phone number not found in AsyncStorage.");
                // Handle the case where the phone number is not set
            }
        }

        loadPhoneNumber();
    }, []);

    async function readNdef() {
        try {
            await NfcManager.requestTechnology(NfcTech.IsoDep);
            const tag = await NfcManager.getTag();
            // Use the phoneNumber state instead of the hardcoded value
            const message = iban ? `${phoneNumber},${iban}` : `${phoneNumber},IBAN12313123123`;
            const signature = await execHaloCmdRN(NfcManager, {
                name: "sign",
                message: message,
                keyNo: 1,
                format: "text"
            });
            console.log(signature);
            await AsyncStorage.setItem('@chipId', signature.etherAddress.toLowerCase());
        } catch (ex) {
            console.warn("Oops!", ex);
        } finally {
            NfcManager.cancelTechnologyRequest();
            navigation.navigate('MerchantHome');
        }
    }

    const handleIbanSubmit = () => {
        setIsNfcReady(true);
        readNdef();
    };

    const handleSkip = () => {
        setIsNfcReady(true);
        readNdef();
    };

    return (
        <SafeAreaView style={[styles.container, styles.dark]}>
            {!isNfcReady ? (
                <>
                    <FlexView style={styles.inputContainer}>
                        <Text style={styles.title} variant="large-600">
                            Accept Bank Transfers
                        </Text>
                        <Text style={styles.label}>Enter IBAN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="IBAN 1234 4567..."
                            value={iban}
                            onChangeText={setIban}
                        />
                        <Button onPress={handleIbanSubmit}>
                            Next
                        </Button>
                        {/* <Button title="Skip" onPress={handleSkip} /> */}

                    </FlexView>
                </>
            ) : (
                <>
                    <Text style={styles.title} variant="large-600">
                        Register NFC
                    </Text>
                    <Text style={styles.title} variant="large-600">
                        SCAN NOW
                    </Text>
                </>
            )}
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
    input: {
        height: 40,
        borderColor: '#47a1ff', // Changed to blue
        borderWidth: 1,
        padding: 10,
        marginBottom: 20,
        color: '#fff',
        borderRadius: 5, // Added to slightly round the edges
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 40,
        fontSize: 30,
    },
    dark: {
        backgroundColor: '#375bd2',
    },
    inputContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // ... other styles if needed
});
