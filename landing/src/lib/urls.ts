/** Where the other standalone parts of loci live. Set per deployment. */
export const APP_URL = (process.env.APP_URL || "https://app.locicare.xyz").replace(/\/$/, "");
export const DOCS_URL = (process.env.DOCS_URL || "https://docs.locicare.xyz").replace(/\/$/, "");
export const app = (path: string) => `${APP_URL}${path}`;
export const docs = (path = "") => `${DOCS_URL}${path}`;
