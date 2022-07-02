import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { APP_JWT_SECRET } from "../config";
import { VandorPayload } from "../dto";
import { AuthPayload } from "../dto/Auth.dto";
import { Request } from "express";

export const GenerateSalt = async () => {
  return await bcrypt.genSalt();
};

export const GeneratePassword = async (password: string, salt: string) => {
  return bcrypt.hash(password, salt);
};

export const validatePassword = async (
  enteredPassword: string,
  savedPassword: string,
  salt: string
) => {
  return (await GeneratePassword(enteredPassword, salt)) === savedPassword;
};

export const GenerateSignature = (payload: AuthPayload) => {
  return jwt.sign(payload, APP_JWT_SECRET, { expiresIn: "1d" });
};

export const ValidateSignature = async (req: Request) => {
  const signature = req.get("Authorization");
  if(signature) {
    const payload = await jwt.verify(signature.split(' ')[1], APP_JWT_SECRET) as AuthPayload;
    req.user = payload;
    return true;
  }
  return false;
};
