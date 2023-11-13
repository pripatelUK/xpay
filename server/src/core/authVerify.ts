import { Request, Response } from "express";
import { verifyAuth } from "../helpers/verifyAuth";


export const authVerify = async (req: Request, res: Response) => {
    const result = await verifyAuth({
        req, res
    });
    if (result.verified) {
        return res.send({ ok: true });
    } else {
        return res.status(400).send({ ok: false });
    }
};
