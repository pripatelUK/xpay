

export const registrationOptionMapping = (serverOptions) => {


    return {
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
}