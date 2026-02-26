/**
 * Pure functions for building storage keys.
 * Each key is unique — uses crypto.randomUUID() to avoid collisions.
 */
export const StorageKeys = {
  vacancyJobDescription: (vacancyId: string, ext: string) =>
    `vacancies/${vacancyId}/job-description/${crypto.randomUUID()}.${ext}`,

  vacancyPerfilMuestra: (vacancyId: string, ext: string) =>
    `vacancies/${vacancyId}/perfil-muestra/${crypto.randomUUID()}.${ext}`,

  candidateCV: (vacancyId: string, candidateId: string, ext: string) =>
    `vacancies/${vacancyId}/candidates/${candidateId}/cv/${crypto.randomUUID()}.${ext}`,
};
