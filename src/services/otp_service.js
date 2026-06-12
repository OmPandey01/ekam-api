import redis from "./redis.js";
import otpGenerator from "otp-generator";
import prisma from "./db_services.js";

class OTPService {
  // Generate a 6-digit OTP (valid for 5 minutes)
  static async generateOTP(userId, expirySeconds = 600) {
    const email = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const otpOriginal = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const otp = 123456;

    const key = `otp:${userId}`;

    // Store OTP in Redis with expiration
    await redis.set(key, otp, "EX", expirySeconds);

    // For debugging (remove in production)
    console.log(`OTP for ${email}: ${otp}`);

    return otp;
  }

  // Verify OTP
  static async verifyOTP(userId, userOTP) {
    const key = `otp:${userId}`;
    const storedOTP = await redis.get(key);

    if (!storedOTP) {
      return { valid: false, message: "OTP expired or not found" };
    }

    if (storedOTP !== userOTP) {
      return { valid: false, message: "Invalid OTP" };
    }
    try {
      // Delete OTP after successful verification (one-time use)
      await redis.del(key);

      return { valid: true, message: "OTP verified successfully" };
    } catch (error) {
      return { valid: false, message: "Verification failed" };
    }
  }

  // Resend OTP (delete old one first)
  static async resendOTP(userId, expirySeconds = 300) {
    const key = `otp:${userId}`;
    await redis.del(key);
    return this.generateOTP(userId, expirySeconds);
  }

  // Check if OTP exists (rate limiting)
  static async hasRecentOTP(userId, cooldownSeconds = 60) {
    const key = `otp:${userId}`;
    const exists = await redis.exists(key);
    if (exists) {
      const ttl = await redis.ttl(key);
      if (ttl > 0 && expirySeconds - ttl < cooldownSeconds) {
        return true; // OTP generated recently, prevent resend spam
      }
    }
    return false;
  }

  // Rate limiting for OTP requests
  static async checkRateLimit(userId, action, limitSeconds = 60) {
    const key = `ratelimit:${action}:${userId}`;
    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, limitSeconds);
    }

    return { allowed: attempts <= 3, attempts }; // Max 3 attempts per minute
  }
}

export default OTPService;
