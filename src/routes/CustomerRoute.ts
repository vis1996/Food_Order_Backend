import express, { Request, Response, NextFunction } from "express";
import {
  AddToCart,
  CreateOrder,
  CustomerLogin,
  CustomerSignUp,
  CustomerVerify,
  DeleteCart,
  EditCusomerProfile,
  GetCart,
  GetCustomerProfile,
  GetOrderById,
  GetOrders,
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
router.post('/cart', AddToCart);
router.get('/cart', GetCart);
router.delete('/cart', DeleteCart);

// Payment

// Order
router.post('/create-order', CreateOrder);
router.get('/orders', GetOrders);
router.get('/order/:id', GetOrderById);

export { router as CustomerRoute };
