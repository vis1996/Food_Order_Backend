import { Request, Response, NextFunction } from "express";
import { CreateVandorInput } from "../dto";
import { Vandor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utility";

export const FindVandor = async (id: string | undefined, email?: string) => {
  if (email) {
    return await Vandor.findOne({ email: email });
  } else {
    return await Vandor.findById(id);
  }
};

export const CreateVandor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    address,
    pincode,
    foodType,
    email,
    password,
    ownerName,
    phone,
  } = <CreateVandorInput>req.body;

  const existingVandor = await FindVandor("", email);
  if (existingVandor !== null) {
    return res.json({
      message: "A vandor is already exist with this email ID",
    });
  }

  // generate the salt
  const salt = await GenerateSalt();
  // encrypt the password using the salt
  const userPassword = await GeneratePassword(password, salt);

  const createVandor = await Vandor.create({
    name: name,
    address: address,
    pincode: pincode,
    foodType: foodType,
    email: email,
    password: userPassword,
    salt: salt,
    ownerName: ownerName,
    phone: phone,
    rating: 0,
    serviceAvailable: false,
    coverImages: [],
    foods: []
  });

  return res.json(createVandor);
};

export const GetVandors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandors = await Vandor.find();
  if (vandors !== null) {
    return res.json(vandors);
  }
  return res.json({ message: "vandors data not available" });
};

export const GetVandorByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vandorId = req.params.id;
  const vandor = await FindVandor(vandorId);
  if (vandor !== null) {
    return res.json(vandor);
  }
  return res.json({ message: "vandor data not available" });
};
