import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { sharp } from "sharp";

import { Users } from "./src/collections/users";
import { Products } from "./src/collections/products";
import { Orders } from "./src/collections/orders";
import { CourseContent } from "./src/collections/course-content";
import { Pages } from "./src/collections/pages";
import { Media } from "./src/collections/media";

export default buildConfig({
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "development-secret",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  collections: [Users, Products, Orders, CourseContent, Pages, Media],
  admin: {
    user: "users",
  },
});
