import { ethers } from 'ethers';
import { VITE_NETWORK, VITE_BUNDLER, VITE_PAYMASTER } from './constants';

export const provider = new ethers.providers.StaticJsonRpcProvider(VITE_NETWORK);
export const bundler = new ethers.providers.StaticJsonRpcProvider(VITE_BUNDLER);
export const paymasterProvider = new ethers.providers.StaticJsonRpcProvider(VITE_PAYMASTER);
