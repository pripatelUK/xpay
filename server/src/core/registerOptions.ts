import { generateRegistrationOptions } from "@simplewebauthn/server";
import { Request, Response } from "express";
import { prisma } from "../clients/prisma";
import { rpID, rpName } from "../constants";

export const registerOptions = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (user) {
    res.status(404).json({ message: "User already registered" });
  }

  const newUser = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
    },
  });

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: newUser.id,
    userName: newUser.email,
    attestationType: "none",
  });

  newUser.currentChallenge = options.challenge;

  await prisma.user.update({
    where: {
      id: newUser.id,
    },
    data: {
      currentChallenge: options.challenge,
    },
  });
  
  res.json(options);
};
