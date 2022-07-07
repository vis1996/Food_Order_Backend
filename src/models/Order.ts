import mongoose, { Schema, Document } from "mongoose";

export interface OrderDoc extends Document {
  orderId: string; // 128678
  vandorId: string;
  items: [any]; //[{ food, unit: 1 }]
  totalAmount: number; /// 678
  orderDate: Date;
  paidThrough: string; // COD, Credit card, wallet
  paymentResponse: string; // { status: true, response: some bank response }
  orderStatus: string; // To determine the current status // waiting // failed // ACCEPT // REJECT // UDER-PROCESS // READY
  remarks: string;
  deliveryId: string;
  appliedOffers: boolean;
  offerId: string;
  readyTime: number; // max 60 minutes
}

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true },
    vandorId: { type: String, required: true },
    items: [
      {
        food: { type: Schema.Types.ObjectId, ref: "food", required: true },
        unit: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date, required: true },
    paidThrough: { type: String },
    paymentResponse: { type: String },
    orderStatus: { type: String },
    remarks: { type: String },
    deliveryId: { type: String },
    appliedOffers: { type: Boolean },
    offerId: { type: String },
    readyTime: { type: Number },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v, delete ret.cretedAt, delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);

const Order = mongoose.model<OrderDoc>("order", OrderSchema);

export { Order };
