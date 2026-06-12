import express from "express";

const router = express.Router();

import {
  logInController,
  otpVerificationController,
  registerController,
  meController,
  logOutController,
} from "../controllers/authControllers.js";

router.post("/register", registerController);

router.post("/login", logInController);
router.post("/logout", logOutController);

router.post("/verify-otp", otpVerificationController);

router.get("/me", meController);

export default router;
