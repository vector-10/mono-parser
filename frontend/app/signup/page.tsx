"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import {
  signupSchema,
  type SignupFormData,
  verifyOtpSchema,
  type VerifyOtpFormData,
} from "@/lib/validations/auth";
import { useAuthStore } from "@/lib/store/auth";

const RESEND_COOLDOWN = 60;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [userEmail, setUserEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.actions.setAuth);

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const startCooldown = useCallback(() => {
    setResendCountdown(RESEND_COOLDOWN);
  }, []);

  const onSignup = async (data: SignupFormData) => {
    try {
      const response = await authApi.signup(data);

      setUserEmail(data.email);
      setStep("verify");
      startCooldown();
      toast.success(response.message);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Signup failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const onVerifyOtp = async (data: VerifyOtpFormData) => {
    try {
      const response = await authApi.verifyOtp({
        email: userEmail,
        otp: data.otp,
      });

      setAuth(response.user, response.access_token, response.refresh_token);

      toast.success("Email verified successfully!");
      router.push("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Invalid OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      const response = await authApi.resendOtp(userEmail);
      startCooldown();
      toast.success(response.message);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Failed to resend OTP.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Left Side - Blue Background */}
          <div className="md:w-[60%] bg-gradient-to-br from-[#0055ba] to-[#003d85] p-8 md:p-12 flex flex-col justify-center text-white">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-2xl font-bold"
              >
                <Shield className="h-8 w-8" />
                Mono-Parser
              </Link>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {step === "signup"
                ? "Start making better lending decisions today"
                : "Verify your email address"}
            </h1>

            <p className="text-lg md:text-xl text-white/90 mb-8">
              {step === "signup"
                ? "Join Nigerian fintechs using Mono-Parser to reduce default rates and approve more loans with confidence."
                : `We've sent a 6-digit code to ${userEmail}. Enter it below to verify your account.`}
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">30-second setup</h3>
                  <p className="text-sm text-white/80">
                    Get started in minutes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">No credit card required</h3>
                  <p className="text-sm text-white/80">
                    Start with our free tier
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Forms */}
          <div className="md:w-[40%] p-8 md:p-12 flex flex-col justify-center">
            {step === "signup" ? (
              <>
                {/* Signup Form */}
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Create account
                  </h2>
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-[#0055ba] font-semibold hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <form
                  onSubmit={handleSignupSubmit(onSignup)}
                  className="space-y-5"
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full name
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...registerSignup("name")}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent ${
                        signupErrors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="John Doe"
                    />
                    {signupErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {signupErrors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...registerSignup("email")}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent ${
                        signupErrors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="you@company.com"
                    />
                    {signupErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {signupErrors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Company Name */}
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Company name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      {...registerSignup("companyName")}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent ${
                        signupErrors.companyName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Your Company Ltd"
                    />
                    {signupErrors.companyName && (
                      <p className="mt-1 text-sm text-red-600">
                        {signupErrors.companyName.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        {...registerSignup("password")}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent pr-12 ${
                          signupErrors.password
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {signupErrors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {signupErrors.password.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters
                    </p>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-4 h-4 mt-1 text-[#0055ba] border-gray-300 rounded focus:ring-[#0055ba]"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="ml-2 text-sm text-gray-600"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-[#0055ba] hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href=""
                        className="text-[#0055ba] hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSignupSubmitting}
                    className="w-full bg-[#0055ba] text-white py-3 rounded-lg font-semibold hover:bg-[#004494] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSignupSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* OTP Verification Form */}
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Verify your email
                  </h2>
                  <p className="text-gray-600">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold">{userEmail}</span>
                  </p>
                </div>

                <form
                  onSubmit={handleOtpSubmit(onVerifyOtp)}
                  className="space-y-6"
                >
                  {/* OTP Input */}
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Verification code
                    </label>
                    <input
                      type="text"
                      id="otp"
                      {...registerOtp("otp")}
                      maxLength={6}
                      className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent ${
                        otpErrors.otp ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="000000"
                    />
                    {otpErrors.otp && (
                      <p className="mt-1 text-sm text-red-600">
                        {otpErrors.otp.message}
                      </p>
                    )}
                  </div>

                  {/* Resend OTP with countdown */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0}
                      className={`text-sm ${
                        resendCountdown > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-[#0055ba] hover:underline"
                      }`}
                    >
                      {resendCountdown > 0
                        ? `Resend code in ${resendCountdown}s`
                        : "Didn't receive the code? Resend"}
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isOtpSubmitting}
                    className="w-full bg-[#0055ba] text-white py-3 rounded-lg font-semibold hover:bg-[#004494] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOtpSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify email
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  {/* Back to signup */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("signup")}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back to signup
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
