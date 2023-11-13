import { Request, Response } from "express";
import { GenerateAuthenticationOptionsOpts, generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "../clients/prisma";
import { rpID } from "../constants";

export const authOptions = async (req: Request, res: Response) => {

    const userEmail = req.body.email;

    const user = await prisma.user.findUnique({
        where: {
            email: userEmail,
        },
    });

    if (!user) {
        res.status(404).json({ message: "Error" });
    }

    const options: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: [],
        userVerification: 'required',
        rpID,
    };
    const loginOpts = generateAuthenticationOptions(options);

    await prisma.user.update({
        where: {
            email: userEmail,
        },
        data: {
            currentChallenge: loginOpts.challenge,
        },
    });

    res.send(loginOpts);
};
