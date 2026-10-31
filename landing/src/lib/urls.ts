/** Where the other standalone parts of loci live. Set per deployment. */
export const APP_URL = (process.env.APP_URL || "https://app.locicare.xyz").replace(/\/$/, "");
export const DOCS_URL = (process.env.DOCS_URL || "https://docs.locicare.xyz").replace(/\/$/, "");
/** The web app's sign-in page, with sign-up, redeem a code and the clinician workspace linked from it. Every "Open the app" and "Sign in" goes here. */
export const SIGNIN_URL = (process.env.SIGNIN_URL || `${APP_URL}/app/signin`).replace(/\/$/, "");
export const GITHUB_URL = "https://github.com/xElvolution/loci";
export const app = (path: string) => `${APP_URL}${path}`;
export const docs = (path = "") => `${DOCS_URL}${path}`;
