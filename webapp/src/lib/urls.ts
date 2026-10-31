/** Public URLs of the sibling parts of the loci monorepo (landing and docs are separate deployments). */
export const LANDING_URL = (process.env.LANDING_URL || "https://locicare.xyz").replace(/\/$/, "");
export const DOCS_URL = (process.env.DOCS_URL || "https://docs.locicare.xyz").replace(/\/$/, "");
