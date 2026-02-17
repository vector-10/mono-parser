"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import {
  requestResetSchema,
  type RequestResetFormData,
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [userEmail, setUserEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors, isSubmitting: isRequestSubmitting },
  } = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
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

  const onRequestReset = async (data: RequestResetFormData) => {
    try {
      const response = await authApi.requestPasswordReset(data.email);
      setUserEmail(data.email);
      setStep("reset");
      startCooldown();
      toast.success(response.message);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Failed to send reset code.";
      toast.error(errorMessage);
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    try {
      const response = await authApi.resetPassword({
        email: userEmail,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success(response.message);
      router.push("/login");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Password reset failed.";
      toast.error(errorMessage);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    try {
      const response = await authApi.requestPasswordReset(userEmail);
      startCooldown();
      toast.success(response.message);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Failed to resend code.";
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
              {step === "request"
                ? "Reset your password"
                : "Enter your new password"}
            </h1>

            <p className="text-lg md:text-xl text-white/90 mb-8">
              {step === "request"
                ? "Enter your email address and we'll send you a verification code to reset your password."
                : `We've sent a 6-digit code to ${userEmail}. Enter it below along with your new password.`}
            </p>
          </div>

          {/* Right Side - Forms */}
          <div className="md:w-[40%] p-8 md:p-12 flex flex-col justify-center">
            {step === "request" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Forgot password
                  </h2>
                  <p className="text-gray-600">
                    Remember your password?{" "}
                    <Link
                      href="/login"
                      className="text-[#0055ba] font-semibold hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <form
                  onSubmit={handleRequestSubmit(onRequestReset)}
                  className="space-y-6"
                >
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
                      {...registerRequest("email")}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent ${
                        requestErrors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="you@company.com"
                    />
                    {requestErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {requestErrors.email.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestSubmitting}
                    className="w-full bg-[#0055ba] text-white py-3 rounded-lg font-semibold hover:bg-[#004494] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequestSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send reset code
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Reset password
                  </h2>
                  <p className="text-gray-600">
                    Enter the code sent to{" "}
                    <span className="font-semibold">{userEmail}</span>
                  </p>
                </div>

                <form
                  onSubmit={handleResetSubmit(onResetPassword)}
                  className="space-y-5"
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
                      {...registerReset("otp")}
                      maxLength={6}
                      className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent ${
                        resetErrors.otp ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="000000"
                    />
                    {resetErrors.otp && (
                      <p className="mt-1 text-sm text-red-600">
                        {resetErrors.otp.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        {...registerReset("newPassword")}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0055ba] focus:border-transparent pr-12 ${
                          resetErrors.newPassword
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
                    {resetErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {resetErrors.newPassword.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters
                    </p>
                  </div>

                  {/* Resend Code */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
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

                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="w-full bg-[#0055ba] text-white py-3 rounded-lg font-semibold hover:bg-[#004494] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("request")}
                      className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Use a different email
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
