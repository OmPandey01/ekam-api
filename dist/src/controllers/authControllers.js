import prisma from "../services/db_services.js";
import OTPService from "../services/otp_service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export async function registerController(req, res) {
    const { email, password, name } = req.body;
    console.log("👍 Registering user:", { email, name, password });
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser && !existingUser.isVerified) {
        console.log("Got existing user with id in register controller", existingUser.id);
        const otp = await OTPService.generateOTP(existingUser.id);
        return res.status(403).json({
            isVerified: false,
            error: "User not verified",
            userId: existingUser.id,
            needsVerification: true,
        });
    }
    if (existingUser && existingUser.isVerified) {
        return res.status(400).json({
            isVerified: true,
            error: "User already exists",
            userId: existingUser.id,
            user: existingUser,
            needsVerification: false,
        });
    }
    try {
        const user = await prisma.user.create({
            data: {
                email,
                password: bcrypt.hashSync(password, 10),
                name,
            },
        });
        const otp = await OTPService.generateOTP(user.id);
        // await OTPService.sendOTP(user.email, otp);
        res.status(201).json(user);
    }
    catch (error) {
        console.log("error registering ", error);
        res.status(500).json({ error: error.message });
    }
}
export async function logInController(req, res) {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
        });
        console.log("user", user);
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        if (!user.isVerified) {
            const otp = await OTPService.generateOTP(user.id);
            return res.status(403).json({
                error: "User not verified",
                user: user,
                isVerified: false,
            });
        }
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        //generate token
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            isVerified: user.isVerified,
            name: user.name,
        }, process.env.JWT_SECRET, { expiresIn: "5d" });
        //set http only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
        });
        const response = {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            isVerified: user.isVerified,
        };
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
// ✅ CORRECT VERSION
export async function logOutController(req, res) {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0), // This makes the cookie expire immediately
        path: "/", // Must match the path used when setting the cookie
        // domain: "localhost", // Uncomment if you used domain in login
        // secure: false,       // Match your login cookie settings
        // sameSite: "lax",     // Match your login cookie settings
    });
    res.status(200).json({ message: "Logged out successfully" });
}
export async function otpVerificationController(req, res) {
    const { userId, otp } = req.body;
    const result = await OTPService.verifyOTP(userId, otp);
    if (!result.valid) {
        console.log(result);
        return res.status(400).json({ error: result.message });
    }
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });
        res.status(200).json({ message: "OTP verified successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}
export async function passwordResetController(req, res) {
    const { email, newPassword } = req.body;
    try {
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export async function meController(req, res) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export async function resendOtpController(req, res) {
    const { id } = req.params;
    try {
        await OTPService.generateOTP(id);
        res.status(200).json({ message: "OTP resent successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
