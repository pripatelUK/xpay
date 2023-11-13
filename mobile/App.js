import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { Passkey } from "react-native-passkey";
import { api } from "./api";
import { useState } from "react";
import { registrationOptionMapping } from "./utils";


const isBase64 = (str) => {
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
};

export default function App() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleRegister = async () => {
    try {
      // const res = await api.post("/register-options", {
      //   email,
      //   name,
      // });

      // let options = res.data;
      // console.log('options', options)
      // options.authenticatorSelection.residentKey = "required";
      // options.authenticatorSelection.requireResidentKey = true;
      // options.extensions = {
      //   credProps: true,
      // };

      // console.log(isBase64(options.challenge))

      // const optionsResponse = await Passkey.register(options);

      // const verifyRes = await api.post("/register-verify", {
      //   optionsResponse,
      //   email,
      // });
      if (verifyRes.status === 200) {
        Alert.alert("All good", "success!");
      }
    } catch (error) {
      Alert.alert("Error", "assasdas");
      console.log(error.error);
    }
  };

  return (
    <View style={styles.container}>
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
      <Button title="Register" onPress={handleRegister}></Button>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
