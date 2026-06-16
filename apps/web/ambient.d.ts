// Ambient-deklarasjoner for side-effect-imports som ellers gir TS2882 under
// moduleResolution: "bundler" (global CSS og Payload sin CSS-bundle).
declare module "*.css";
declare module "@payloadcms/next/css";
