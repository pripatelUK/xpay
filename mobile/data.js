const options = {
    challenge: 'string',
    rp: {
        id: 'string',
        name: 'string',
    },
    user: {
        id: 'string',
        name: 'string',
        displayName: 'string',
    },
    pubKeyCredParams: [{
        type: 'string',
        alg: 0,
    }],
    timeout: 0,
    attestation: 'string',
    authenticatorSelection: {
        authenticatorAttachment: 'string',
        requireResidentKey: true,
        residentKey: 'string',
        userVerification: 'string',
    },
}

const fromServer = {
    "challenge": "gnbxvLDBbI7nrUL9cwV8UxS15knM71XsJZtV987a2u0",
    "rp": {
        "name": "SimpleWebAuthn Example",
        "id": "pripateluk.github.io"
    },
    "user": {
        "id": "35ab3720-d033-495b-afdf-8c506120abb6",
        "name": "asdfasdf",
        "displayName": "asdfasdf"
    },
    "pubKeyCredParams": [
        {
            "alg": -8,
            "type": "public-key"
        },
        {
            "alg": -7,
            "type": "public-key"
        },
        {
            "alg": -257,
            "type": "public-key"
        }
    ],
    "timeout": 60000,
    "attestation": "none",
    "excludeCredentials": [],
    "authenticatorSelection": {
        "residentKey": "preferred",
        "userVerification": "preferred",
        "requireResidentKey": false
    },
    "extensions": {
        "credProps": true
    }
}