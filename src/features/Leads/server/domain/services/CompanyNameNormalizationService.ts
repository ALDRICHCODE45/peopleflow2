export class CompanyNameNormalizationService {
  static normalize(name: string): string {
    return (
      name
        // NFD decompose (separate accents from base characters)
        .normalize("NFD")
        // Remove diacritical marks
        .replace(/[\u0300-\u036f]/g, "")
        // Lowercase
        .toLowerCase()
        // Remove apostrophes and quotes
        .replace(/[''`"]/g, "")
        // Remove hyphens, dots, commas, colons
        .replace(/[-.,:\u2013\u2014]/g, "")
        // Remove all whitespace
        .replace(/\s+/g, "")
        // Remove remaining non-alphanumeric characters
        .replace(/[^a-z0-9]/g, "")
        .trim()
    );
  }
}
