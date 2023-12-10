import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CreditCard = ({ cardNumber, cardOwner }) => {
    return (
        <View style={styles.cardContainer}>
            <Text style={styles.cardNumber}>{cardNumber}</Text>
            <Text style={styles.cardOwner}>OWNER: {cardOwner}</Text>
            <Text style={styles.cardExp}>EXP: 02/29</Text>
            {/* Additional details like expiry date can be added here */}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#375bd2', // A typical credit card color
        borderRadius: 10,
        padding: 20,
        width: 320,
        height: 200,
        justifyContent: 'center',
        // alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        gap: 10,
    },
    cardNumber: {
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 16,
        letterSpacing: 3,
        marginBottom: 10, // Space between card number and owner's name
    },
    cardOwner: {
        // textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase', // Styling for the owner's name
    },
    cardExp: {
        color: '#FFFFFF',
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase', // Styling for the owner's name
    },
});

export default CreditCard;
