import { z } from "zod";

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "El codigo debe tener 6 digitos")
    .regex(/^\d+$/, "El codigo solo puede contener numeros"),
});

export type OTPFormValues = z.infer<typeof otpSchema>;
