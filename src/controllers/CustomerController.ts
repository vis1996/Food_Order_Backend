import { Request, Response, NextFunction } from "express";
import { plainToClass } from "class-transformer";
import {
  CreateCustomerInputs,
  UserLoginInputs,
  EditCustomerProfileInputs,
  OrderInputs,
} from "../dto";
import { validate } from "class-validator";
import {
  GenerateOtp,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  onRequestOTP,
  validatePassword,
} from "../utility";
import { Customer } from "../models/Customer";
import { Food, Order } from "../models";

export const CustomerSignUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customerInputs = plainToClass(CreateCustomerInputs, req.body);
  const inputErrors = await validate(customerInputs, {
    validationError: { target: true },
  });
  if (inputErrors.length > 0) {
    return res.status(400).json(inputErrors);
  }
  const { email, phone, password } = customerInputs;

  const salt = await GenerateSalt();
  const userPasword = await GeneratePassword(password, salt);

  const { otp, expiry } = GenerateOtp();

  const existCustomer = await Customer.findOne({ email: email });

  if (existCustomer !== null) {
    return res
      .status(400)
      .json({ mesage: "An User exists with provided email ID" });
  }

  const result = await Customer.create({
    email: email,
    password: userPasword,
    salt: salt,
    firstName: "",
    lastName: "",
    address: "",
    phone: phone,
    verified: false,
    otp: otp,
    otp_expiry: expiry,
    lat: 0,
    lng: 0,
    cart: [],
    orders: [],
  });
  if (result) {
    // send OTP to customer
    await onRequestOTP(otp, phone);

    // Generate the signature
    const signature = GenerateSignature({
      _id: result._id,
      email: result.email,
      verified: result.verified,
    });
    // send the result to client
    return res.status(201).json({
      signature: signature,
      verified: result.verified,
      email: result.email,
    });
  }
  return res.status(400).json({ message: "Error with Signup" });
};

export const CustomerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginInputs = plainToClass(UserLoginInputs, req.body);
  const loginErrors = await validate(loginInputs, {
    validationError: { target: false },
  });
  if (loginErrors.length > 0) {
    return res.status(400).json(loginErrors);
  }
  const { email, password } = loginInputs;
  const customer = await Customer.findOne({ email: email });
  if (customer) {
    const validation = await validatePassword(
      password,
      customer.password,
      customer.salt
    );
    if (validation) {
      // Generate the signature
      const signature = GenerateSignature({
        _id: customer._id,
        email: customer.email,
        verified: customer.verified,
      });
      // send the result to client
      return res.status(201).json({
        signature: signature,
        verified: customer.verified,
        email: customer.email,
      });
    } else {
      // password does not match
    }
  }
  return res.status(400).json({ message: "Login error" });
};

export const CustomerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { otp } = req.body;
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      console.log(profile.otp);
      console.log(profile.otp_expiry >= new Date());
      console.log(profile.otp === parseInt(otp));
      if (profile.otp === otp && profile.otp_expiry >= new Date()) {
        profile.verified = true;
        const updatedCustomerResponse = await profile.save();

        // Generate signature
        const signature = GenerateSignature({
          _id: updatedCustomerResponse._id,
          email: updatedCustomerResponse.email,
          verified: updatedCustomerResponse.verified,
        });
        // send the result to client
        return res.status(201).json({
          signature: signature,
          verified: updatedCustomerResponse.verified,
          email: updatedCustomerResponse.email,
        });
      }
    }
  }
  return res.status(400).json({ message: "Error with OTP Validation" });
};

export const RequestedOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      const { otp, expiry } = GenerateOtp();

      profile.otp = otp;
      profile.otp_expiry = expiry;

      await profile.save();
      await onRequestOTP(otp, profile.phone);
      res
        .status(200)
        .json({ message: "OTP sent to your registered phone number!" });
    }
  }
  return res.status(400).json({ message: "Error with Request OTP" });
};

export const GetCustomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      return res.status(200).json(profile);
    }
  }
  return res.status(400).json({ message: "Error with fetch Profile" });
};

export const EditCusomerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
  const profileErrors = await validate(profileInputs, {
    validationError: { target: false },
  });
  if (profileErrors.length > 0) {
    return res.status(400).json(profileErrors);
  }
  const { firstName, lastName, address } = profileInputs;
  if (customer) {
    const profile = await Customer.findById(customer._id);
    if (profile) {
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.address = address;

      const result = await profile.save();
      res.status(200).json(result);
    }
  }
  return res.status(400).json({ message: "Error with update Profile" });
};
/**--------------- Cart Section-------------------------**/
export const AddToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate('cart.food');
    let cartItems = Array();
    const { _id, unit } = <OrderInputs>req.body;
    const food = await Food.findById(_id);
    if (food) {
      if (profile != null) {
        // check for cart items
        cartItems = profile.cart;
        if (cartItems.length > 0) {
          // check and update unit
          let existFoodItem = cartItems.filter((item) => item.food._id.toString() == _id);
          if (existFoodItem.length > 0) {
            const index = cartItems.indexOf(existFoodItem[0]);
            if (unit > 0) {
               cartItems[index] = { food, unit };
            } else {
              cartItems.splice(index, 1);
            }
          } else {
            cartItems.push({ food, unit });
          }
        } else {
          // add new item to cart
          cartItems.push({ food, unit });
        }
        if (cartItems) {
          profile.cart = cartItems as any;
          const cartresult = await profile.save();
          return res.status(200).json(cartresult.cart);
        }
      }
    }
  }
    return res.status(400).json({ message: "Unable to create cart!" });
};

export const GetCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate('cart.food');
    if (profile) {
      return res.status(200).json(profile.cart)
    }
  }
  return res.status(400).json({ message: "Cart is empty!"});
};

export const DeleteCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate('cart.food');
    if (profile != null) {
      profile.cart = [] as any;
      const cartResult = await profile.save()
      return res.status(200).json(cartResult);
    }
  }
  return res.status(400).json({ message: "Cart is already empty!"});
};

/**--------------- Order Section-------------------------**/
export const CreateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //grab current login customer
  const customer = req.user;

  if (customer) {
    // create an order ID
    const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
    const profile = await Customer.findById(customer._id);

    const cart = <[OrderInputs]>req.body; // [{ id: xx, unit: yy }]

    let cartItems = Array();

    let netAmount = 0.0;
    let vandorId;
    // calculate order amount
    const foods = await Food.find()
      .where("_id")
      .in(cart.map((item) => item._id))
      .exec();
    foods.map((food) => {
      cart.map(({ _id, unit }) => {
        if (food._id == _id) {
          vandorId = food.vandorId;
          netAmount += food.price * unit;
          cartItems.push({ food, unit });
        }
      });
    });
    // create order with Item description
    if (cartItems) {
      // create order
      const currentOrder = await Order.create({
        orderId: orderId,
        vandorId:vandorId,
        items: cartItems,
        totalAmount: netAmount,
        orderDate: new Date(),
        paidThrough: "COD",
        paymentResponse: "",
        orderStatus: "Waiting",
        remarks: "",
        deliveryId: "",
        appliedOffer: false,
        offerId: null,
        readyTime: 45,
      });

      if (currentOrder) {
        profile.cart = [] as any;
        profile.orders.push(currentOrder);
        await profile.save();
        return res.status(200).json(currentOrder);
      }
    }
  }
  return res.status(400).json({ message: "Error with Create order!" });
};

export const GetOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const customer = req.user;
  if (customer) {
    const profile = await Customer.findById(customer._id).populate("orders");
    if (profile) {
      return res.status(200).json(profile.orders);
    }
  }
  return res.status(400).json({ message: "Error with Get orders!" });
};

export const GetOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;
  if (orderId) {
    const order = await Order.findById(orderId).populate("items.food");
    return res.status(200).json(order);
  }
  return res.status(400).json({ message: "Error with Get orders by id" });
};
