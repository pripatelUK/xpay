import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';

interface Props {
    onPress: () => Promise<void> | void;
    style?: any;
    textStyle?: any;
    children: any;
}

export const Button = ({
    onPress,
    style = {},
    textStyle = {},
    children,
}: Props) => {
    const [loading, setLoading] = useState(false);

    return (
        <TouchableOpacity
            style={[styles.button, style]}
            disabled={loading}
            onPress={async () => {
                setLoading(true);

                await onPress();

                setLoading(false);
            }}>
            {loading ? (
                <ActivityIndicator color={'white'} />
            ) : (
                <Text style={[styles.buttonText, textStyle]}>{children}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#47a1ff',
        borderColor: `#000000`,
        borderStyle: 'solid',
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
        margin: 20,
        borderRadius: 20,
        // elevation: 3,
        // backgroundColor: '#007AFF',
    },
    buttonText: {
        fontSize: 16,
        lineHeight: 21,
        letterSpacing: 0.25,
        color: 'white',
        fontWeight: '500',
        // width: 160
    },
});