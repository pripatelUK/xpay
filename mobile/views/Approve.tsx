import React from 'react';
import { View } from 'react-native';
import { Button } from '@web3modal/ui-react-native';
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { ethers } from 'ethers'; // Make sure ethers is imported

export function Approve({ navigation }) { // Assuming navigation is passed as a prop
    const { isConnected } = useAccount();

    const erc20Abi = [
        "function approve(address spender, uint256 amount) returns (bool)"
    ];
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const spenderAddress = "0x232E3478AF682f2971a942128593FC27D663934a"; // Replace with the spender's address
    const { config } = usePrepareContractWrite({
        addressOrName: tokenAddress,
        contractInterface: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, ethers.utils.parseUnits('100', 18)],
    });
    console.log(config, isConnected)
    const { write, isLoading: isApproveLoading, data } = useContractWrite(config);
    const { waitForTransaction } = useWaitForTransaction({ hash: data?.hash });

    const handleApprove = async () => {
        console.log(write)
        if (write) {
            try {
                const tx = await write();
                await waitForTransaction({ hash: tx.hash });
                console.log('Transaction successful:', tx);
                if (navigation) {
                    navigation.navigate('Home');
                }
            } catch (error) {
                console.error('Transaction failed:', error);
            }
        }
    };

    return isConnected ? (
        <View>
            <Button disabled={isApproveLoading} onPress={handleApprove}>
                Approve
            </Button>
        </View>
    ) : null;
}
