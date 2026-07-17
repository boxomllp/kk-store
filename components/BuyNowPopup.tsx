"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useStoreSettings } from "@/lib/hooks/useStoreSettings";
import { usePixel } from "@/lib/hooks/usePixel";
import { useFormConfig } from "@/lib/hooks/useFormConfig";
import { INDIAN_STATES } from "@/lib/types";
import DeliveryTimeline from "@/components/DeliveryTimeline";

type Step = "form" | "otp";

type Props = {
  productId: string;
  productName: string;
  price: number;
  variant: string | null;
  onClose: () => void;
};

type FormValues = {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
};

const EMPTY_VALUES: FormValues = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "",
};

export default function BuyNowPopup({ productId, productName, price, variant, onClose }: Props) {
  const { settings } = useStoreSettings();
  const { track } = usePixel();
  const { fields } = useFormConfig();
  const router = useRouter();
  const supabase = createClient();

  const stepRef = useRef<Step>("form");
  const [step, setStepState] = useState<Step>("form");
  const setStep = (s: Step) => {
    stepRef.current = s;
    setStepState(s);
  };

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const otpLength = parseInt(settings.otp_digit_length || "4", 10);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(otpLength).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(30);
  const [changingNumber, setChangingNumber] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // --- lock body scroll on mount ---
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.position = "fixed";
    document.documentElement.style.width = "100%";

    track("AddToCart", { value: price, currency: "INR", content_name: productName });

    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- intercept mobile back button while on OTP step ---
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (stepRef.current === "otp") {
        window.history.pushState(null, "", window.location.href);
        // OTP screen never auto-closes via back button
      } else {
        onClose();
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- resend countdown ---
  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendSeconds]);

  // --- pincode auto-fill ---
  useEffect(() => {
    if (values.pincode.length !== 6) return;
    fetch(`https://api.postalpincode.in/pincode/${values.pincode}`)
      .then((r) => r.json())
      .then((data) => {
        const po = data?.[0]?.PostOffice?.[0];
        if (po) {
          setValues((v) => ({ ...v, city: po.District || v.city, state: po.State || v.state }));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.pincode]);

  function fieldConfig(name: string) {
    return fields.find((f) => f.field_name === name);
  }

  function validateField(fieldName: string, val: string): string {
    const f = fieldConfig(fieldName);
    if (!f) return "";
    if (f.required && !val.trim()) return `${f.label} is required`;
    if (f.min_chars && val.trim().length > 0 && val.trim().length < f.min_chars) {
      return `${f.label} must be at least ${f.min_chars} characters`;
    }
    if (fieldName === "phone" && val && !/^[6-9]\d{9}$/.test(val)) {
      return "Enter a valid 10-digit phone number";
    }
    if (fieldName === "pincode" && val && !/^\d{6}$/.test(val)) {
      return "Enter a valid 6-digit pincode";
    }
    return "";
  }

  function handleFieldChange(fieldName: string, val: string) {
    setValues((v) => ({ ...v, [fieldName]: val }));
    // Re-validate live so the error clears as soon as the input becomes valid,
    // instead of only being cleared on next submit attempt.
    setErrors((prev) => {
      if (!(fieldName in prev)) return prev;
      const message = validateField(fieldName, val);
      const next = { ...prev };
      if (message) next[fieldName] = message;
      else delete next[fieldName];
      return next;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      const val = (values as any)[f.field_name] ?? "";
      const message = validateField(f.field_name, val);
      if (message) newErrors[f.field_name] = message;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleBuyNow() {
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");

    // Show OTP screen immediately, don't wait for API
    setStep("otp");
    setOtpDigits(Array(otpLength).fill(""));
    setResendSeconds(30);
    setSendingOtp(true);

    try {
      const { data: orderData, error: orderErr } = await supabase.functions.invoke("create-order", {
        body: {
          product_id: productId,
          product_name: productName,
          product_price: price,
          variant,
          customer_name: values.full_name,
          phone: values.phone,
          address_line1: values.address_line1,
          address_line2: values.address_line2,
          landmark: values.landmark,
          city: values.city,
          pincode: values.pincode,
          state: values.state,
        },
      });

      if (orderErr || !orderData?.success) {
        setApiError("Something went wrong creating your order. Please try resending OTP.");
      } else {
        setOrderId(orderData.order.id);
        setOrderNumber(orderData.order.order_number);
      }

      const { data: otpData, error: otpErr } = await supabase.functions.invoke("send-otp", {
        body: { phone: values.phone },
      });

      if (otpErr || !otpData?.success) {
        setApiError(otpData?.error || "Failed to send OTP. Tap Resend to try again.");
      } else {
        track("InitiateCheckout", { value: price, currency: "INR", content_name: productName });
      }
    } catch (err) {
      setApiError("Network error. Please tap Resend OTP.");
    } finally {
      setSubmitting(false);
      setSendingOtp(false);
    }
  }

  async function resendOtp(phone: string) {
    setApiError("");
    setOtpError("");
    setResendSeconds(30);
    setSendingOtp(true);
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { phone, order_id: orderId },
    });
    if (error || !data?.success) {
      setApiError(data?.error || "Failed to resend OTP");
    }
    setSendingOtp(false);
  }

  async function handleChangeNumber() {
    if (!/^[6-9]\d{9}$/.test(newPhone)) {
      setApiError("Enter a valid 10-digit phone number");
      return;
    }
    setValues((v) => ({ ...v, phone: newPhone }));
    // resendOtp passes order_id, so the edge function (running with the
    // service role key) updates the order's phone number server-side —
    // a direct client-side update here would silently fail under RLS
    // since customers aren't allowed to update orders directly.
    await resendOtp(newPhone);
    setChangingNumber(false);
  }

  function handleOtpChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    setOtpError("");

    if (val && idx < otpLength - 1) {
      otpInputRefs.current[idx + 1]?.focus();
    }
    if (val && idx === otpLength - 1 && next.every((d) => d !== "")) {
      submitOtp(next.join(""));
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  }

  async function submitOtp(code: string) {
    if (code.length !== otpLength) return;
    setVerifying(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: values.phone, otp: code, order_id: orderId },
      });

      if (error || !data?.success) {
        if (data?.error?.toLowerCase().includes("expired")) {
          setOtpError("OTP expired.");
        } else {
          setOtpError(data?.error || "Incorrect OTP. Please try again.");
        }
        setVerifying(false);
        return;
      }

      track("Purchase", { value: price, currency: "INR", content_name: productName });
      router.push(
        `/thank-you?order=${encodeURIComponent(orderNumber || "")}&name=${encodeURIComponent(
          values.full_name
        )}&product=${encodeURIComponent(productName)}${variant ? `&variant=${encodeURIComponent(variant)}` : ""}&price=${price}&address=${encodeURIComponent(
          [values.address_line1, values.address_line2, values.landmark, values.city, values.state, values.pincode]
            .filter(Boolean)
            .join(", ")
        )}`
      );
    } catch {
      setOtpError("Network error. Please try again.");
      setVerifying(false);
    }
  }

  const fullPhone = values.phone ? `+91 ${values.phone}` : "";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "white",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
      className="sm:flex sm:items-center sm:justify-center sm:bg-black/40 sm:backdrop-blur-sm"
    >
      <div className="sm:bg-white sm:rounded-2xl sm:max-w-md sm:w-full sm:max-h-[90vh] sm:overflow-y-auto sm:shadow-2xl">
        {step === "form" && (
          <div className="p-5 pb-28 sm:pb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-navy">{settings.popup_heading || "Complete Your Order"}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 mb-4 text-sm">
              <p className="font-medium">{productName}</p>
              {variant && <p className="text-gray-500">{variant}</p>}
              <p className="font-bold text-ctatext text-lg">₹{price}</p>
            </div>

            {settings.show_delivery_timeline_popup === "true" && (
              <div className="mb-4">
                <DeliveryTimeline compact />
              </div>
            )}

            <div className="space-y-3">
              {fields.map((f) => {
                if (f.field_name === "state") {
                  return (
                    <div key={f.id}>
                      <label className="text-sm font-medium">{f.label}</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 mt-1"
                        value={values.state}
                        onChange={(e) => handleFieldChange("state", e.target.value)}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                  );
                }
                return (
                  <div key={f.id}>
                    <label className="text-sm font-medium">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={f.field_type === "numeric" ? "tel" : "text"}
                      inputMode={f.field_type === "numeric" ? "numeric" : "text"}
                      placeholder={f.placeholder || ""}
                      maxLength={f.field_name === "phone" ? 10 : f.field_name === "pincode" ? 6 : undefined}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                      value={(values as any)[f.field_name] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = f.field_type === "numeric" ? raw.replace(/\D/g, "") : raw;
                        handleFieldChange(f.field_name, val);
                      }}
                    />
                    {errors[f.field_name] && (
                      <p className="text-red-500 text-xs mt-1">{errors[f.field_name]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {settings.show_cod_badge === "true" && (
              <div className="mt-4 bg-green-50 text-green-800 text-sm font-medium rounded-lg px-3 py-2 text-center">
                💵 {settings.cod_badge_text || "Cash on Delivery Available"}
              </div>
            )}

            {apiError && <p className="text-red-500 text-sm mt-3">{apiError}</p>}

            <div className="hidden sm:block mt-5">
              <BuyButton submitting={submitting} onClick={handleBuyNow} text={settings.otp_button_text} />
            </div>

            <div
              className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
            >
              <BuyButton submitting={submitting} onClick={handleBuyNow} text={settings.otp_button_text} />
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="p-5">
            <div className="text-center mb-2">
              <p className="text-2xl">📱</p>
              <h2 className="text-lg font-bold text-navy mt-2">Verify Your Number</h2>
              <p className="text-sm text-gray-500 mt-1">
                We've sent a {otpLength}-digit OTP to {fullPhone}
              </p>
            </div>

            <div className="flex justify-center gap-3 my-6">
              {sendingOtp ? (
                <div
                  className="flex items-center gap-2 text-gray-500 border-2 rounded-lg px-6"
                  style={{ height: 60 }}
                >
                  <span className="w-4 h-4 border-2 border-cta border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Sending OTP...</span>
                </div>
              ) : (
                otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputRefs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    style={{ width: 52, height: 60 }}
                    className="text-center text-2xl font-bold border-2 rounded-lg focus:border-cta outline-none"
                    autoFocus={i === 0}
                  />
                ))
              )}
            </div>

            {otpError && (
              <div className="text-center mb-3">
                <p className="text-red-500 text-sm">{otpError}</p>
                {otpError.toLowerCase().includes("expired") && (
                  <button
                    onClick={() => resendOtp(values.phone)}
                    className="text-ctatext text-sm font-medium underline mt-1"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            )}
            {apiError && <p className="text-red-500 text-sm text-center mb-3">{apiError}</p>}

            <div className="text-center mb-4">
              {resendSeconds > 0 ? (
                <p className="text-sm text-gray-400">Resend in {resendSeconds}s</p>
              ) : (
                <button onClick={() => resendOtp(values.phone)} className="text-ctatext text-sm font-medium underline">
                  Resend OTP
                </button>
              )}
            </div>

            {!changingNumber ? (
              <div className="text-center mb-4">
                <button
                  onClick={() => setChangingNumber(true)}
                  className="text-gray-500 text-sm underline"
                >
                  Change Number
                </button>
              </div>
            ) : (
              <div className="mb-4 flex gap-2">
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="New 10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleChangeNumber}
                  className="bg-navy text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Update & Resend OTP
                </button>
              </div>
            )}

            <button
              onClick={() => setStep("form")}
              className="block mx-auto text-sm text-gray-400 mb-4"
            >
              ← Back to form
            </button>

            <button
              disabled={sendingOtp || otpDigits.some((d) => !d) || verifying}
              onClick={() => submitOtp(otpDigits.join(""))}
              className="w-full bg-cta text-navy font-bold py-3 rounded-full disabled:opacity-40"
            >
              {verifying ? "Verifying..." : settings.confirm_button_text || "Confirm Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyButton({
  submitting,
  onClick,
  text,
}: {
  submitting: boolean;
  onClick: () => void;
  text?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={submitting}
      className="btn-pulse w-full bg-cta text-navy rounded-full disabled:opacity-60"
      style={{ padding: "20px 40px", fontSize: 22, fontWeight: 800 }}
    >
      {submitting ? "Please wait..." : text || "Buy It Now"}
    </button>
  );
}
