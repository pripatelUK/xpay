import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TextInput, View, Alert, Image } from 'react-native';

import { Button } from './Button';
import { Web3Modal, W3mButton } from '@web3modal/wagmi-react-native';
import { FlexView, Text } from '@web3modal/ui-react-native';

export function MerchantLoginScreen({ navigation }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handlePhoneNumberSubmit = async () => {
        // Simulate sending a pin code
        // For now, just switch to the pin verification view
        setIsVerifying(true);
    };

    const verifyPinCode = async () => {
        if (pinCode === '7890') {
            // Pin code is correct
            await AsyncStorage.setItem('@phone_number', phoneNumber);
            // Alert.alert("Pin Verified", "Phone number stored successfully.");
            //@todo check if the phone number is in the registry contract
            // if the phone number is present, redirect to merchant home
            // if the phone number isn't redirect to the arx login
            navigation.navigate('ArxRegister');
        } else {
            Alert.alert("Invalid Pin", "The pin code you entered is incorrect.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, styles.dark]}>
            {/* <Image
                source={require('../assets/pepe.png')} // Replace with your image path
                style={styles.image}
            /> */}
            <Text style={styles.title} variant="large-600">
                CrossPay
            </Text>
            <FlexView style={styles.inputContainer}>
                {!isVerifying ? (
                    <>

                        <Text style={styles.label}>Enter Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="07847392019"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                        <Button onPress={handlePhoneNumberSubmit}>
                            Get Code
                        </Button>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Enter Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="1234"
                            value={pinCode}
                            onChangeText={setPinCode}
                            keyboardType="number-pad"
                        />
                        <Button onPress={verifyPinCode}>
                            Verify Code
                        </Button>
                    </>
                )}
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
    inputContainer: {
        width: '80%',
        marginBottom: 20,
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
    buttonContainer: {
        gap: 4,
    },
    dark: {
        backgroundColor: '#375bd2',
    },
    image: {
        width: '100%', // Adjust width as needed
        height: 200,    // Adjust height as needed
        resizeMode: 'contain' // or 'cover', based on your requirement
    },
    title: {
        marginBottom: 40,
        fontSize: 30,
    },
});
