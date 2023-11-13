import base64url from "base64url";

import { VerifiedAuthenticationResponse, VerifyAuthenticationResponseOpts, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { Request, Response } from "express";
import { prisma } from "../clients/prisma";
import { origin, rpID } from "../constants";
import { base64ToBuffer } from "./base64ToBuffer";
import { AuthenticationResponseJSON } from "@simplewebauthn/typescript-types";
export async function verifyAuth({req, res}: {
    req: Request,
    res: Response
}) {

    const optionsResponse: AuthenticationResponseJSON = req.body.optionsResponse;
    
    
    const user = await prisma.user.findUnique({
        where: {
            email: req.body.email,
        },
    });

    const authenticators = await prisma.authenticator.findMany({
        where: {
            userId: user?.id,
        },
    });

    if (user==null) {
        console.log("user is null")
        console.log(user)
        return {
            verified: false,
        }
    } 
  
    const expectedChallenge = user.currentChallenge;
  
    if (!expectedChallenge) {
        console.log("expectedChallenge is falsy")
        console.log(expectedChallenge)
        return {
            verified: false,
        }
    }

    let dbAuthenticator;
    const bodyCredIDBuffer = base64url.toBuffer(optionsResponse.rawId);

    for (const device of authenticators) {
      const currentCredential = Buffer.from(device.credentialID, 'base64');
      if (bodyCredIDBuffer.equals(currentCredential)) {
        dbAuthenticator = device;
        break;
      }
    }

    if (!dbAuthenticator) {
      console.log("dbAuthenticator is falsy")
      console.log(dbAuthenticator)
      return {
        verified: false,
      }
    }
  
    let verification: VerifiedAuthenticationResponse;
    try {
      const options: VerifyAuthenticationResponseOpts  = {
        response: optionsResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          counter: dbAuthenticator.counter,
          credentialID: base64ToBuffer(dbAuthenticator.credentialID) as any,
          credentialPublicKey: base64ToBuffer(dbAuthenticator.credentialPublicKey) as any,
        },
      };
      verification = await verifyAuthenticationResponse(options);

    } catch (error) {
      console.log('something is wrong')
      console.error(error);
      return {
        verified: false,
      }
    }
    const { verified, authenticationInfo } = verification;
    if (verified) {
      await prisma.authenticator.update({
        where: {
          id: dbAuthenticator.id,
        },
        data: {
          counter: authenticationInfo.newCounter,
        },
      });
      
      await prisma.authentication.create({
        data: {
          authenticatorId: dbAuthenticator.id,
          userId: user.id,
          signature: optionsResponse.response.signature,
        }
      });

    }

    return {
        verified,
        authenticationInfo,
    }
}