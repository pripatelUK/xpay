import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, TextInput, View, Button, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export function NewTransactionScreen({ navigation }) {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [requestingTransaction, setRequestingTransaction] = useState(false);
    const inputRef = useRef(null);

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
                <Text style={styles.title}>Requesting Transaction</Text>
                <Text>Please wait...</Text>
                <Text>Amount: {formatCurrency(amount)}</Text>
                <Text>Asset: {currency}</Text>
                <Button title="Back" onPress={() => setRequestingTransaction(false)} />
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
