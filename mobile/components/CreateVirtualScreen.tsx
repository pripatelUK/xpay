import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, TextInput, View } from 'react-native';
import { Button } from './Button';
import { W3mButton } from '@web3modal/wagmi-react-native';
import { FlexView, Text } from '@web3modal/ui-react-native';
import { useAccount } from 'wagmi';
import { Picker } from '@react-native-picker/picker';

export function CreateVirtualScreen({ navigation }) {
    const { isConnected } = useAccount();
    const [allowance, setAllowance] = useState('');
    const [asset, setAsset] = useState('USDC'); // Default value

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
                <TextInput
                    style={styles.input}
                    placeholder="Allowance"
                    keyboardType="numeric"
                    value={allowance}
                    onChangeText={setAllowance}
                />
                <Picker
                    selectedValue={asset}
                    style={styles.picker}
                    onValueChange={(itemValue) => setAsset(itemValue)}
                >
                    <Picker.Item label="USDC" value="USDC" />
                    <Picker.Item label="GHO" value="GHO" />
                    <Picker.Item label="sDAI" value="sDAI" />
                </Picker>
            </FlexView>
            <FlexView style={styles.buttonContainer}>
                <Button onPress={() => navigation.navigate('CreateVirtual')}>
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
});
