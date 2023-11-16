import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Button, StyleSheet, Text, TextInput, SafeAreaView } from "react-native";
import { Passkey } from "react-native-passkey";
import { api } from "../api";
import { useState } from "react";
import { decode as atob, encode as btoa } from 'base-64'
import { Button as MyButton } from './Button';

import { Buffer } from "buffer";

const isBase64 = (str) => {
    try {
        return btoa(atob(str)) == str;
    } catch (err) {
        return false;
    }
};

export function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    const handleRegister = async () => {
        console.log("lol")
        try {
            // console.log(api)
            const res = await api.post("/register-options", {
                email,
                name,
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
                email,
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

    return (
        <SafeAreaView style={[styles.container, styles.dark]}>
            <Text>Register with webauthn on React Native!</Text>
            <Text>Email</Text>
            <TextInput
                onChangeText={setEmail}
                value={email}
                style={{
                    height: 40,
                    width: 300,
                    borderColor: "gray",
                    borderWidth: 1,
                }}
            />
            <Text>Name</Text>
            <TextInput
                onChangeText={setName}
                value={name}
                style={{
                    height: 40,
                    width: 300,
                    borderColor: "gray",
                    borderWidth: 1,
                }}
            />
            <Button onPress={handleRegister} title="Register"></Button>
            <MyButton
                onPress={async () => {
                    await AsyncStorage.removeItem('@session_token');
                    navigation.navigate('Home');
                }}>
                Log Out
            </MyButton>
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
});
