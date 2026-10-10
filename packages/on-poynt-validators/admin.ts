import { z } from "zod";

/**
 * User roles - synced with database
 */
export const userRoles = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const userRoleLabels: Record<UserRole, string> = {
  user: "Bruker",
  admin: "Administrator",
  super_admin: "Super Admin",
};

/**
 * Industry schemas
 */
export const industrySchema = z.object({
  id: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Kun små bokstaver, tall og bindestrek"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  promptHints: z.string().max(1000).optional(),
  relatedKeywords: z.array(z.string()).optional(),
});

export const createIndustrySchema = industrySchema;
export const updateIndustrySchema = industrySchema.partial().omit({ id: true });

export type Industry = z.infer<typeof industrySchema>;
export type CreateIndustryInput = z.infer<typeof createIndustrySchema>;
export type UpdateIndustryInput = z.infer<typeof updateIndustrySchema>;

/**
 * Prompt template schemas
 */
export const promptTemplateSchema = z.object({
  id: z.string().min(1).max(100),
  toolId: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  template: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  version: z.number().int().default(1),
});

export const createPromptTemplateSchema = promptTemplateSchema;
export const updatePromptTemplateSchema = promptTemplateSchema
  .partial()
  .omit({ id: true });

export type PromptTemplate = z.infer<typeof promptTemplateSchema>;
export type CreatePromptTemplateInput = z.infer<
  typeof createPromptTemplateSchema
>;
export type UpdatePromptTemplateInput = z.infer<
  typeof updatePromptTemplateSchema
>;

/**
 * Default industries - seeded on first run
 */
export const defaultIndustries: Industry[] = [
  {
    id: "retail",
    name: "Butikk/Detaljhandel",
    icon: "ShoppingBag",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "restaurant",
    name: "Restaurant/Servering",
    icon: "UtensilsCrossed",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "health",
    name: "Helse/Velvære",
    icon: "Heart",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "beauty",
    name: "Skjønnhet/Frisør",
    icon: "Sparkles",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "fitness",
    name: "Trening/Fitness",
    icon: "Dumbbell",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "consulting",
    name: "Konsulent/Rådgivning",
    icon: "Briefcase",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "tech",
    name: "IT/Teknologi",
    icon: "Laptop",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "marketing",
    name: "Markedsføring/Byrå",
    icon: "Megaphone",
    sortOrder: 8,
    isActive: true,
  },
  {
    id: "construction",
    name: "Bygg/Håndverk",
    icon: "Hammer",
    sortOrder: 9,
    isActive: true,
  },
  {
    id: "realestate",
    name: "Eiendom/Megling",
    icon: "Home",
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "finance",
    name: "Finans/Regnskap",
    icon: "Calculator",
    sortOrder: 11,
    isActive: true,
  },
  {
    id: "education",
    name: "Utdanning/Kurs",
    icon: "GraduationCap",
    sortOrder: 12,
    isActive: true,
  },
  {
    id: "creative",
    name: "Design/Kreativt",
    icon: "Palette",
    sortOrder: 13,
    isActive: true,
  },
  {
    id: "events",
    name: "Event/Underholdning",
    icon: "PartyPopper",
    sortOrder: 14,
    isActive: true,
  },
  {
    id: "travel",
    name: "Reise/Turisme",
    icon: "Plane",
    sortOrder: 15,
    isActive: true,
  },
  {
    id: "automotive",
    name: "Bil/Verksted",
    icon: "Car",
    sortOrder: 16,
    isActive: true,
  },
  {
    id: "pet",
    name: "Dyr/Kjæledyr",
    icon: "PawPrint",
    sortOrder: 17,
    isActive: true,
  },
  {
    id: "food",
    name: "Mat/Catering",
    icon: "ChefHat",
    sortOrder: 18,
    isActive: true,
  },
  {
    id: "nonprofit",
    name: "Frivillig/Ideell",
    icon: "HeartHandshake",
    sortOrder: 19,
    isActive: true,
  },
  {
    id: "other",
    name: "Annet",
    icon: "Building2",
    sortOrder: 99,
    isActive: true,
  },
];
