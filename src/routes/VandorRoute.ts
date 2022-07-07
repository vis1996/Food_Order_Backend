import express, { Request, Response, NextFunction } from "express";
import {
  AddFood,
  GetCurrentOrders,
  GetFoods,
  GetOrderDetails,
  GetVandorProfile,
  ProcessOrder,
  UpdateVandorCoverImage,
  UpdateVandorProfile,
  UpdateVandorService,
  VandorLogin,
} from "../controllers";
import { Authenticate } from "../middlewares";
import multer from "multer";

const router = express.Router();

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "_" + file.originalname
    );
  },
});

const images = multer({ storage: imageStorage }).array("images", 10);

router.post("/login", VandorLogin);

router.use(Authenticate);
router.get("/profile", GetVandorProfile);
router.patch("/profile", UpdateVandorProfile);
router.patch("/coverimage", images, UpdateVandorCoverImage);
router.patch("/service", UpdateVandorService);

router.post("/food", images, AddFood);
router.get("/foods", GetFoods);

// orders
router.get('/orders', GetCurrentOrders)
router.put('/order/:id/process', ProcessOrder);
router.get('/order/:id', GetOrderDetails);


router.get("/", (req: Request, res: Response, next: NextFunction) => {
  return res.json("Hello from Vandor route!");
});

export { router as VandorRoute };
