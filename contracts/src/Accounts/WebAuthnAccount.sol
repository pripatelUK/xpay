// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

// import { Test } from "@forge-std/Test.sol";
// import { console } from "@forge-std/console.sol";
import { WebAuthn256r1 } from "../Lib/WebAuthn256r1.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { BaseAccount } from "@account-abstraction/contracts/core/BaseAccount.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import { UserOperation } from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import { TokenCallbackHandler } from "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";
import { AllowanceController } from "./AllowanceController.sol";
import { console2 } from "@forge-std/console2.sol";

/// @title Minimalist 4337 Account with WebAuthn support
/// @custom:experimental DO NOT USE IT IN PRODUCTION
contract WebAuthnAccount is BaseAccount, TokenCallbackHandler, UUPSUpgradeable, Initializable, AllowanceController {
    using ECDSA for bytes32;

    address public immutable webauthnVerifier;
    address public immutable loginService;
    address public immutable factory;

    string private _login;

    enum SignatureTypes {
        NONE,
        WEBAUTHN_UNPACKED,
        LOGIN_SERVICE,
        WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE
    }

    IEntryPoint private immutable _entryPoint;

    event WebAuthnAccountInitialized(IEntryPoint indexed entryPoint, string indexed login);
    event SignatureValidation(IEntryPoint entryPoint, UserOperation userOp, bytes32 userOpHash);

    modifier onlyFactory() {
        _onlyFactory();
        _;
    }

    function _onlyFactory() internal view {
        require(msg.sender == factory, "only factory");
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable { }

    constructor(IEntryPoint anEntryPoint, address _webauthnVerifier, address _loginService, address _factory) {
        _entryPoint = anEntryPoint;
        webauthnVerifier = _webauthnVerifier;
        loginService = _loginService;
        factory = _factory;
        _disableInitializers();
    }

    //custom
    function addFirstSigner(bytes calldata credId, uint256[2] calldata pubKeyCoordinates) external onlyFactory {
        require(_signersCount == 0, "first signer already set");
        _addSigner(credId, pubKeyCoordinates);
    }

    /**
     * execute a transaction (called directly from owner, or by entryPoint)
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transactions
     * @dev to reduce gas consumption for trivial case (no value), use a zero-length array to mean zero value
     */
    function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length && (value.length == 0 || value.length == func.length), "wrong array length");
        if (value.length == 0) {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], 0, func[i]);
            }
        } else {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], value[i], func[i]);
            }
        }
    }

    //custom
    function _addFirstSignerFromLoginService(
        bytes memory credId,
        uint256[2] memory pubKeyCoordinates,
        bytes memory serviceSignature,
        bool dryRun
    )
        internal
    {
        if (!dryRun) {
            require(_signersCount == 0, "First signer already set");
        }
        // console.log("dryrun:", dryRun);
        bytes32 payload =
            keccak256(abi.encode(bytes1(uint8(SignatureTypes.LOGIN_SERVICE)), _login, credId, pubKeyCoordinates));
        // console.log("-------------LOGIN SERVICE VERIFICATION---------------");
        // console.logBytes32(payload);
        // console.logBytes(serviceSignature);
        // console.logBytes32(payload.toEthSignedMessageHash());
        // console.log("loginService", loginService);
        // console.log("recovered", payload.toEthSignedMessageHash().recover(serviceSignature));
        // console.log("-------------/LOGIN SERVICE VERIFICATION---------------");
        address recoveredAddress = payload.toEthSignedMessageHash().recover(serviceSignature);

        if (!dryRun) {
            require(recoveredAddress == loginService, "incorrect login service signature");
        }

        _addSigner(credId, pubKeyCoordinates);
    }

    //custom
    function initialize(string calldata login) public virtual initializer {
        _initialize(login);
    }

    //custom
    function _initialize(string calldata login) internal virtual {
        _login = login;
        emit WebAuthnAccountInitialized(_entryPoint, _login);
    }

    // Require the function call went through EntryPoint or owner
    function _requireFromEntryPointOrOwner() internal view {
        require(msg.sender == address(entryPoint()) || msg.sender == address(this), "account: not Owner or EntryPoint");
    }

    //custom
    /// implement template method of BaseAccount
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    )
        internal
        virtual
        override
        returns (uint256 validationData)
    {
        SignatureTypes signatureType =
            SignatureTypes(userOp.signature.length > 0 ? uint256(uint8(userOp.signature[0])) : 0);

        if (signatureType == SignatureTypes.NONE) {
            // console.log("signatureType = 0");
            // console.logBytes32(userOpHash);
            bytes memory simulationSignature = WebAuthn256r1(webauthnVerifier).sig();
            return _validateWebAuthnWithLoginServiceSignature(simulationSignature, userOpHash, true);
        }

        if (signatureType == SignatureTypes.WEBAUTHN_UNPACKED) {
            // console.log("signatureType = 1");
            return _validateWebAuthnSignature(userOp.signature, userOpHash, false);
        }

        if (signatureType == SignatureTypes.LOGIN_SERVICE) {
            // console.log("signatureType = 2");
            return _validateLoginServiceOnlySignature(userOp.signature);
        }

        if (signatureType == SignatureTypes.WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE) {
            // console.log("signatureType = 3");
            return _validateWebAuthnWithLoginServiceSignature(userOp.signature, userOpHash, false);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{ value: value }(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    //custom
    function sliceBytes(bytes calldata toSlice, uint256 start, uint256 end) public pure returns (bytes memory) {
        return toSlice[start:end];
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{ value: msg.value }(address(this));
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public onlyOwner {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        isOwner(msg.sender);
    }

    //custom
    function _validateWebAuthnWithLoginServiceSignature(
        bytes memory signature,
        bytes32 userOpHash,
        bool dryRun
    )
        internal
        returns (uint256 validationData)
    {
        (
            ,
            bytes1 authenticatorDataFlagMask,
            bytes memory authenticatorData,
            bytes memory clientData,
            bytes memory clientChallenge,
            uint256 clientChallengeOffset,
            uint256 r,
            uint256 s,
            bytes memory loginServiceData
        ) = _parseWebauthnWithLoginServiceSignature(signature);

        {
            (
                ,
                string memory login,
                bytes memory newCredId,
                uint256[2] memory newPubKeyCoordinates,
                bytes memory serviceSignature
            ) = _parseLoginServiceData(loginServiceData);

            require(
                keccak256(abi.encodePacked(login)) == keccak256(abi.encodePacked(dryRun ? login : _login)),
                "incorrect login for sig"
            );

            // Stack too deep if using ternary operator...
            if (dryRun) {
                _addFirstSignerFromLoginService(newCredId, newPubKeyCoordinates, serviceSignature, true);
            } else {
                _addFirstSignerFromLoginService(newCredId, newPubKeyCoordinates, serviceSignature, false);
            }
        }

        require(
            bytes32(clientChallenge) == (dryRun ? bytes32(clientChallenge) : userOpHash),
            "challenge & userOpHash mismatch"
        );

        uint256 credIdLength = uint256(uint8(authenticatorData[54]));
        bytes memory credId = this.sliceBytes(abi.encodePacked(authenticatorData), 55, credIdLength + 55);
        uint256[2] memory pubKeyCoordinates = dryRun
            ? [
                0x46bfdfbddbc22d475a21be7fb6fb597a9e7aca90a4e76ba93a19b26985c87a15,
                0xa0e41b38419d2837cf8ea557f91b638c01c12a70230724ef06825f2393a76a70
            ]
            : _signers[credId];

        bool signatureVerified = WebAuthn256r1(webauthnVerifier).verify(
            authenticatorDataFlagMask,
            authenticatorData,
            clientData,
            clientChallenge,
            clientChallengeOffset,
            [r, s],
            [pubKeyCoordinates[0], pubKeyCoordinates[1]]
        );

        if (dryRun || !signatureVerified) {
            return SIG_VALIDATION_FAILED;
        }
        return 0;
    }

    //custom
    function _validateWebAuthnSignature(
        bytes memory signature,
        bytes32 userOpHash,
        bool dryRun
    )
        internal
        returns (uint256 validationData)
    {
        (
            ,
            bytes1 authenticatorDataFlagMask,
            bytes memory authenticatorData,
            bytes memory clientData,
            bytes memory clientChallenge,
            uint256 clientChallengeOffset,
            uint256 r,
            uint256 s,
            bytes memory credId
        ) = _parseWebauthnSignature(signature);

        require(
            bytes32(clientChallenge) == (dryRun ? bytes32(clientChallenge) : userOpHash),
            "challenge & userOpHash mismatch"
        );

        uint256[2] memory pubKeyCoordinates = dryRun
            ? [
                0x46bfdfbddbc22d475a21be7fb6fb597a9e7aca90a4e76ba93a19b26985c87a15,
                0xa0e41b38419d2837cf8ea557f91b638c01c12a70230724ef06825f2393a76a70
            ]
            : _signers[credId];

        bool signatureVerified = WebAuthn256r1(webauthnVerifier).verify(
            authenticatorDataFlagMask,
            authenticatorData,
            clientData,
            clientChallenge,
            clientChallengeOffset,
            [r, s],
            [pubKeyCoordinates[0], pubKeyCoordinates[1]]
        );

        if (dryRun || !signatureVerified) {
            return SIG_VALIDATION_FAILED;
        }
        return 0;
    }

    //custom
    function _validateLoginServiceOnlySignature(bytes memory signature) internal returns (uint256 validationData) {
        require(getNonce() == 0, "Can't use Login Service signature for anything else than the first transaction");

        (
            ,
            string memory login,
            bytes memory newCredId,
            uint256[2] memory newPubKeyCoordinates,
            bytes memory serviceSignature
        ) = _parseLoginServiceData(signature);
        require(keccak256(abi.encodePacked(login)) == keccak256(abi.encodePacked(_login)), "incorrect login for sig");

        _addFirstSignerFromLoginService(newCredId, newPubKeyCoordinates, serviceSignature, false);
        return 0;
    }

    //custom
    function _parseWebauthnWithLoginServiceSignature(bytes memory data)
        internal
        pure
        returns (
            bytes1 signatureType,
            bytes1 authenticatorDataFlagMask,
            bytes memory authenticatorData,
            bytes memory clientData,
            bytes memory clientChallenge,
            uint256 clientChallengeOffset,
            uint256 r,
            uint256 s,
            bytes memory loginServiceData
        )
    {
        return abi.decode(data, (bytes1, bytes1, bytes, bytes, bytes, uint256, uint256, uint256, bytes));
    }

    //custom
    function _parseWebauthnSignature(bytes memory data)
        internal
        pure
        returns (
            bytes1 signatureType,
            bytes1 authenticatorDataFlagMask,
            bytes memory authenticatorData,
            bytes memory clientData,
            bytes memory clientChallenge,
            uint256 clientChallengeOffset,
            uint256 r,
            uint256 s,
            bytes memory credId
        )
    {
        return abi.decode(data, (bytes1, bytes1, bytes, bytes, bytes, uint256, uint256, uint256, bytes));
    }

    //custom
    function _parseLoginServiceData(bytes memory loginServiceData)
        internal
        pure
        returns (
            bytes1 signatureType,
            string memory login,
            bytes memory credId,
            uint256[2] memory pubKeyCoordinates,
            bytes memory signature
        )
    {
        return abi.decode(loginServiceData, (bytes1, string, bytes, uint256[2], bytes));
    }
}
