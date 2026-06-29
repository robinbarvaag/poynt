"use client";

import { generateSlug } from "@/lib/generate-slug";
import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  type JSXConvertersFunction,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import React from "react";

function extractText(children: DefaultNodeTypes[]): string {
  return children
    .map((child) => {
      if ("text" in child && typeof child.text === "string") {
        return child.text;
      }
      if ("children" in child && Array.isArray(child.children)) {
        return extractText(child.children as DefaultNodeTypes[]);
      }
      return "";
    })
    .join("");
}

const jsxConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const children = nodesToJSX({
      nodes: node.children as DefaultNodeTypes[],
    });
    const text = extractText(node.children as DefaultNodeTypes[]);
    const id =
      node.tag === "h2" || node.tag === "h3" ? generateSlug(text) : undefined;
    return (
      <Tag id={id} key={text}>
        {children}
      </Tag>
    );
  },
});

interface ArticleRichTextProps {
  data: SerializedEditorState;
}

export function ArticleRichText({ data }: ArticleRichTextProps) {
  // disableContainer fjerner Payloads <div class="payload-richtext">-wrapper, så
  // avsnittene blir direkte barn av .prose. Ellers treffer Tailwinds
  // `.prose > :first-child { margin-top: 0 }` wrapperen i stedet for første <p>,
  // og toppmarginen blir stående.
  return <RichText converters={jsxConverters} data={data} disableContainer />;
}
