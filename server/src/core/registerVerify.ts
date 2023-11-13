import {
  VerifiedRegistrationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Request, Response } from "express";
import { prisma } from "../clients/prisma";
import { origin, rpID } from "../constants";

export const registerVerify = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });
  const expectedChallenge = user?.currentChallenge;

  if (!expectedChallenge) {
    return res.status(400).send({ error: "Challenge not found" });
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response: req.body.optionsResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ error: "something is wrong" });
  }

  const { verified } = verification;
  const { registrationInfo } = verification;
  const credentialPublicKey = registrationInfo?.credentialPublicKey
  const credentialID = registrationInfo?.credentialID
  const counter = registrationInfo?.counter

  
  if (!credentialPublicKey || !credentialID || counter === undefined) {
    console.error("credentialPublicKey, credentialID, or counter is missing");
    return res.status(400).send({ error: "something is wrong" });
  }

  await prisma.authenticator.create({
    data: {
      credentialID: Buffer.from(credentialID).toString("base64"),
      credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      credentialBackedUp: false,
      credentialDeviceType: "unknown",
      userId: user?.id,
    },
  });

  res.json({ verified, registrationInfo });
};
