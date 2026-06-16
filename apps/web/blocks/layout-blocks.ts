import type { Block } from "payload";
import { Content } from "./content";
import { ContentMedia } from "./content-media";
import { CtaSection } from "./cta-section";
import { Faq } from "./faq";
import { FeatureGrid } from "./feature-grid";
import { FormBlock } from "./form";
import { Hero } from "./hero";
import { LogoCloud } from "./logo-cloud";
import { MediaBlock } from "./media";
import { Newsletter } from "./newsletter";
import { PodcastArchive } from "./podcast-archive";
import { Pricing } from "./pricing";
import { ProductArchive } from "./product-archive";
import { ServicesArchive } from "./services-archive";
import { SpotifyEmbed } from "./spotify-embed";
import { StatsBand } from "./stats-band";
import { Steps } from "./steps";
import { Testimonials } from "./testimonials";

/**
 * Den ene, delte lista over sidelayout-blokker. Brukes av både Sider-
 * kolleksjonen og Forside-globalen, så en ny blokk legges til ÉTT sted.
 */
export const layoutBlocks: Block[] = [
  Hero,
  FeatureGrid,
  Steps,
  ContentMedia,
  StatsBand,
  Pricing,
  Faq,
  LogoCloud,
  Newsletter,
  Content,
  MediaBlock,
  Testimonials,
  CtaSection,
  ProductArchive,
  PodcastArchive,
  ServicesArchive,
  FormBlock,
  SpotifyEmbed,
];
