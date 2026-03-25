import z from "zod";

export const candidateSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string(),
  phone: z.string(),
  isCurrentlyEmployed: z.boolean(),
  currentCompany: z.string(),
  currentModality: z.enum(["PRESENCIAL", "REMOTO", "HIBRIDO", ""]),
  currentCountryCode: z.string(),
  currentRegionCode: z.string(),
  workCity: z.string(),
  currentSalary: z.string(),
  salaryExpectation: z.string(),
  currentCommissions: z.string(),
  currentBenefits: z.string(),
  otherBenefits: z.string(),
  candidateCountryCode: z.string(),
  candidateRegionCode: z.string(),
  candidateCity: z.string(),
});
