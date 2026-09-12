/**
 * Øvre grense for én opplasting til Media. Håndheves to steder:
 *  - `upload.limits.fileSize` i payload.config.ts (busboy, lokal lagring uten
 *    Blob-token)
 *  - `beforeOperation`-hooken i collections/media.ts (Vercel Blob med
 *    clientUploads, der fila aldri går gjennom multipart-parseren)
 *
 * 40 MB gir rom for rå kamerabilder, men holder sharp-pipelinen (alle
 * imageSizes genereres i minnet) godt innenfor en serverless-funksjon.
 */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = "40 MB";
