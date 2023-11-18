import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, FlatList, Text, TouchableOpacity, Button, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockTransactions = [
    { id: '1', time: '10:00 AM', amount: '100', assetType: 'USDC', deliveryMethod: 'NFC' },
    { id: '2', time: '11:30 AM', amount: '50', assetType: 'ETH', deliveryMethod: 'QR' },
    // ... more transactions
];

export function MerchantHomeScreen({ navigation }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [transactions, setTransactions] = useState(mockTransactions);

    const logOut = async () => {
        await AsyncStorage.removeItem('@phone_number');
        await AsyncStorage.removeItem('@chipId');
        navigation.navigate('Login');
    };

    useEffect(() => {
        async function loadPhoneNumber() {
            const number = await AsyncStorage.getItem('@phone_number');
            if (number) {
                setPhoneNumber(number);
            }
        }

        loadPhoneNumber();
    }, []);

    const renderTransaction = ({ item }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => Alert.alert('Transaction Details', `Time: ${item.time}, Amount: ${item.amount}, Asset: ${item.assetType}, Delivery: ${item.deliveryMethod}`)}
        >
            <Text>{`Transaction ${item.id}`}</Text>
            <Text>{`Amount: ${item.amount} ${item.assetType}`}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.phoneNumber}>{`Merchant Number: ${phoneNumber}`}</Text>
            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
            />
            <Button
                title="New Transaction"
                onPress={() => navigation.navigate('NewTransaction')}
            />
            <Button
                title="Logout"
                onPress={logOut}
            />
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
    // Add more styles as needed
});