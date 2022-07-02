import express, { Request, Response, NextFunction } from "express";
import {
  CustomerLogin,
  CustomerSignUp,
  CustomerVerify,
  EditCusomerProfile,
  GetCustomerProfile,
  RequestedOtp,
} from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

/**-------Signup / Create Customer------------------ */
router.post("/signup", CustomerSignUp);

/**------- Login ------------------ */
router.post("/login", CustomerLogin);

// authentication
router.use(Authenticate);

/**------- Verify Customer Account ------------------ */
router.post("/verify", CustomerVerify);

/**------- OTP / Requesting OTP------------------ */
router.get("/otp", RequestedOtp);

/**------- Profile ------------------ */
router.get("/profile", GetCustomerProfile);

router.patch("/profile", EditCusomerProfile);

// Cart
// Order
// Payment

export { router as CustomerRoute };
