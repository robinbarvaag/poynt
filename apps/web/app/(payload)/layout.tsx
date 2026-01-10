import config from "@payload-config";
import { RootLayout } from "@payloadcms/next/layouts";
import React from "react";

import "./custom.scss"; // Prepare for custom styles

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RootLayout config={config}>{children}</RootLayout>
);

export default Layout;
