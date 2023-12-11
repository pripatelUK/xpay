# CrossPay


### Avax Fuji Deployments
AA Entrypoint: https://testnet.snowtrace.io/address/0x5e937Ddd1a84FA8550eBBEd361dD1D027BA2437B
WebAuthn256r1.sol: https://testnet.snowtrace.io/address/0x92bFea12cdd5e452eBED0546E4910Fd33061A166
Paymaster.sol: https://testnet.snowtrace.io/address/0xE6F5566256fC37e2c041350D6707Be244EC1B1E3
webAuthnAccountFactory: https://testnet.snowtrace.io/address/0xC26648F3D426843D99b6d43065D9855536E8A697
SEPASender.sol: https://testnet.snowtrace.io/address/0xf06Ac0AE86FFc31041F6D7BCb15BeA2Ec765653D

### Polygon zkEVM Deployments
AA Entrypoint: https://testnet-zkevm.polygonscan.com/address/0x5e937Ddd1a84FA8550eBBEd361dD1D027BA2437B
WebAuthn256r1.sol: https://testnet-zkevm.polygonscan.com/address/0x92bFea12cdd5e452eBED0546E4910Fd33061A166
Paymaster.sol: https://testnet-zkevm.polygonscan.com/address/0xE6F5566256fC37e2c041350D6707Be244EC1B1E3
webAuthnAccountFactory: https://testnet-zkevm.polygonscan.com/address/0xc26648f3d426843d99b6d43065d9855536e8a697

### Polygon Mumbai CCIP Deployments

SEPAReceiver.sol: 0x94C1555D5d28E1436B3920C0b880C5700b4793a4

## Inspiration

Merchants globally get charged through the roof for being able to accept Credit Card in their stores. 

Growing up my parents had convenience stores and I witnessed the amount they would be charged for allowing customers to pay using their Credit Card. Today merchants can be charged from anywhere near 1.5% - 3.5% of the payment with a minimum monthly fee.

These kind of charges can be crippling for smaller merchants that do not generate enough volume and unfortunately a lot of developing nation merchants are not able to accept Debit Card payments at all.

The experience of signing transactions today using hardware wallets & seed phrases will not take us to the next billion users. We need to be able to securely 

With the release of Passkeys, It can drastically change the UX of signing transactions. A large impactful solution would be to allow users to create "virtual" wallets with daily limits and being able to sign those transactions on the go using your fingerprint. Similar to how Apple or Google Pay handle transactions.

## What it does

The application allows customers & merchants to transact easily without the merchant knowing about crypto & without the customer having to stress about getting hacked.

Currently merchants are put off with accepting crypto so giving them the option to accept payment direct to fiat reduces the burden of increasing crypto use-cases.

Currently customers are not able to pay for goods in stores due to lack of pro-crypto merchants & wallet security being poor. The user can set a daily allowance for the smart contract wallet to be able to spend from their main wallet (ideally a multisig that has plenty of assets). 

### Biometric Account Abstraction
A smart contract wallet is created which will act as the "virtual card" with a daily allowance.
Transactions on this wallet can ONLY be signed using your fingerprint or face ID.

### Cross Chain
CCIP allows customers to pay on any CCIP enabled chain & the merchant is paid out using Monerium to handle the SEPA transfer on-chain.

### NFC (Arx Chips)
Arx's NFC chips have a ECDSA Private Key in them so that allows us to add a registry of merchants in the system.

## How we built it

- The mobile app was created using React Native. 

- CCIP was used to allow customers to pay merchants cross-chain

- Utilising Stackup's Userop & eth-infinitism's AA stack to create the transactions https://github.com/eth-infinitism/account-abstraction 

- A ERC4337 account signing schema was extended to work with passkeys (biometric signing) and paymaster implemented for improved UX

- A daily allowance module was added to the 4337 account to ensure stress fee daily payments

- Private communication channels are setup between the customer and merchant using Waku

- Arx chips are used to securely identify merchants, link redirecting and transferring payment information.

- WalletConnect was used to connect a users wallet to our app

- Monerium's SDK was used for crypto to fiat off-ramping in the payments flow

## Challenges we ran into
React Native applications come with a lot of baggage when trying to deal with current crypto packages that are suited towards web applications.

## Accomplishments that we're proud of

The ability to allow merchants to receive payment direct to their bank account, this means the merchant doesn't need to be crypto native to start accepting payments!!

## What we learned
I learnt a lot about CCIP & Chainlink Functions

## What's next for CrossPay

Continuing development and exploring avenues for product market fit.