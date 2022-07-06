// Email

import { ACCOUNT_SID, AUTH_TOKEN } from "../config";

// Notification

// OTP
export const GenerateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  let expiry = new Date();
  expiry.setTime(new Date().getTime() + 30 * 60 * 1000);
  return { otp, expiry };
};

export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
  const accountSid = ACCOUNT_SID;
  const authToken = AUTH_TOKEN;

  const client = require("twilio")(accountSid, authToken);
  const response = await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: "+18123622919",
    to: `+91${toPhoneNumber}`,
  });
  return response;
};

// payment notifications or emails
