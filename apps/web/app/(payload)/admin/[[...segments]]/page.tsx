/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({
  params,
  searchParams,
}: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

// Med cacheComponents prøver Next å prerendre admin-ruten, men Payloads
// auth-oppsett (initReq → executeAuthStrategies) leser `new Date()` og
// request-headers. `await connection()` FØR RootPage utsetter hele treet til
// request-tid – og Suspense-grensen rundt gjør det lovlig under prerender.
const DynamicRootPage = async ({ params, searchParams }: Args) => {
  await connection();
  return RootPage({ config, importMap, params, searchParams });
};

const Page = ({ params, searchParams }: Args) => (
  <Suspense>
    <DynamicRootPage params={params} searchParams={searchParams} />
  </Suspense>
);

// instant=false i (payload)/layout.tsx dekkjer ikkje side-segmentet — 16.3
// validerer «dropped segments» per side, og Payloads generatePageMetadata les
// params/searchParams (upstream). Admin treng uansett ikkje instant navigation.
export const instant = false;

export default Page;
