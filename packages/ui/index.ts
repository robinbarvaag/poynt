import { Switch } from "./components/switch";

// Utils
export { cn } from "./lib/utils";

// Components
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./components/button";

export {
  Heading,
  headingVariants,
  Text,
  textVariants,
  Blockquote,
  blockquoteVariants,
  Code,
  codeVariants,
  List,
  listVariants,
  sizeVariants,
  colorVariants,
  weightVariants,
  alignVariants,
} from "./components/typography";

export {
  Card,
  cardVariants,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  CardSeparator,
} from "./components/card";

export {
  Container,
  containerVariants,
  Section,
  sectionVariants,
  type SectionProps,
  Stack,
  stackVariants,
  type StackProps,
  Grid,
  gridVariants,
  type GridProps,
  type ContainerProps,
  Panel,
  panelVariants,
  type PanelProps,
} from "./components/container";

export { BlockSection } from "./components/block-section";

export {
  SectionHeader,
  type SectionHeaderProps,
} from "./components/section-header";

export {
  CartDrawer,
  type CartDrawerProps,
  CartLineItem,
  type CartLineItemProps,
} from "./components/cart";

export {
  SiteHeader,
  type SiteHeaderProps,
  type SiteHeaderNavItem,
  type SiteHeaderSubItem,
  type SiteHeaderLink,
  type SiteHeaderLinkProps,
} from "./components/site-header";

export { Eyebrow } from "./components/eyebrow";

export {
  PageHeader,
  type PageHeaderProps,
} from "./components/page-header";

export { PageShell, type PageShellProps } from "./components/page-shell";

// Dashboard-primitiver (medlemsområde): tilstandsstyrt hero + guidet reise + verktøykasse
export {
  NextStepHero,
  type NextStepHeroProps,
} from "./components/dashboard/next-step-hero";
export {
  JourneyPath,
  type JourneyPathProps,
  type JourneyStage,
  type StageStatus,
  type StageSurface,
} from "./components/dashboard/journey-path";
export {
  ToolboxCard,
  type ToolboxCardProps,
} from "./components/dashboard/toolbox-card";

export {
  Breadcrumbs,
  type BreadcrumbsProps,
  type BreadcrumbItem,
} from "./components/breadcrumbs";

export {
  Badge,
  badgeVariants,
  type BadgeProps,
} from "./components/badge";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "./components/sheet";

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "./components/avatar";

export { Skeleton } from "./components/skeleton";
export { Separator } from "./components/separator";
export { Input, type InputProps } from "./components/form/input";
export {
  controlSizeVariants,
  CONTROL_HEIGHTS,
  type ControlSize,
} from "./components/form/control-size";
export { Textarea } from "./components/form/textarea";
export { Label } from "./components/form/label";
export { Progress } from "./components/progress";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/dropdown-menu";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  Field,
  type FieldProps,
  FormSuccess,
  type FormSuccessProps,
} from "./components/form";

export { Toaster, toast } from "./components/sonner";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./components/sidebar";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
} from "./components/tabs";

export {
  ListDetail,
  type ListDetailProps,
  ListDetailList,
  ListDetailListHeader,
  ListDetailListContent,
  ListDetailRow,
  type ListDetailRowProps,
  ListDetailDetail,
  type ListDetailDetailProps,
  ListDetailDetailHeader,
  ListDetailDetailContent,
  ListDetailEmpty,
  useListDetail,
} from "./components/list-detail";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./components/select";

export {
  RadioGroup,
  RadioGroupItem,
} from "./components/radio-group";

export { Checkbox, checkboxVariants } from "./components/checkbox";

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/accordion";

export {
  Icon,
  getIconComponent,
  isValidIconName,
  iconNames,
  type IconName,
  type IconProps,
} from "./icons";

export {
  FloatingShapes,
  Grain,
  GridPattern,
} from "./components/decorative";

export {
  BlogCard,
  type BlogCardProps,
  type BlogSurface,
  BlogGrid,
  type BlogGridItem,
  type BlogGridProps,
  ContentMedia,
  type ContentMediaProps,
  DecoBlob,
  type DecoBlobProps,
  hashSeed,
  Faq,
  type FaqItem,
  type FaqProps,
  type Feature,
  FeatureGrid,
  type FeatureGridProps,
  type FeatureLinkProps,
  Hero,
  type HeroPill,
  type HeroProps,
  type HeroStat,
  type Logo,
  LogoCloud,
  type LogoCloudProps,
  Newsletter,
  type NewsletterProps,
  PathCard,
  type PathCardProps,
  type PathCardItem,
  PathCards,
  type PathCardsProps,
  type PathSurface,
  PodcastCard,
  type PodcastCardProps,
  PodcastGrid,
  type PodcastGridItem,
  type PodcastGridProps,
  type ProductBadge,
  type ProductBadgeTone,
  ProductCard,
  type ProductCardProps,
  type ProductSurface,
  ProductGrid,
  type ProductGridItem,
  type ProductGridProps,
  Pricing,
  type PricingProps,
  type PricingTier,
  ServiceCard,
  type ServiceCardProps,
  ServiceShowcase,
  ServiceShowcaseGrid,
  type ServiceShowcaseGridProps,
  type ServiceShowcaseItem,
  type ServiceShowcaseLinkProps,
  ServiceShowcaseModal,
  type ServiceShowcaseModalProps,
  type ServiceShowcaseProps,
  ShowcaseModal,
  type ShowcaseModalProps,
  type Stat,
  StatsBand,
  type StatsBandProps,
  type Step,
  Steps,
  type StepsProps,
  TestimonialCard,
  type TestimonialCardProps,
  type TestimonialItem,
  Testimonials,
  type TestimonialsProps,
  type TestimonialSurface,
} from "./components/marketing";

export {
  StepContainer,
  OptionCard,
  PrefilledBadge,
} from "./components/tool-form";

export {
  BookmarkCard,
  type BookmarkCardProps,
  Callout,
  type CalloutProps,
  type CalloutTone,
  DeviceFrame,
  type DeviceFrameProps,
  type DeviceFrameVariant,
  ReadingProgress,
  type ReadingProgressProps,
  SectionRail,
  type SectionRailItem,
  type SectionRailProps,
  ReadingNav,
  type ReadingNavProps,
  ContentCard,
  type ContentCardProps,
  type ContentCardSurface,
  type ContentFormat,
  type ContentMetaItem,
  CONTENT_FORMATS,
  ContentRail,
  type ContentRailProps,
  ContentFeature,
  type ContentFeatureProps,
  type ContentFeatureSurface,
  LessonList,
  type LessonItem,
  type LessonListProps,
  type LessonType,
  StepBlock,
  type StepBlockProps,
  StepPager,
  type StepPagerLink,
  type StepPagerProps,
  CourseHero,
  type CourseHeroProps,
  type CourseHeroSurface,
  EmptyState,
  type EmptyStateProps,
  ContentFilterBar,
  type ContentFilterBarProps,
  type ContentFilterOption,
  ContentExplorer,
  type ContentExplorerContext,
  type ContentExplorerProps,
  AuthorByline,
  type AuthorBylineProps,
  ShareRow,
  type ShareAction,
  type ShareRowProps,
  RelatedContent,
  type RelatedContentProps,
  PullQuote,
  type PullQuoteAccent,
  type PullQuoteProps,
  ReadingMeta,
  type ReadingMetaItem,
  type ReadingMetaProps,
  ColumnsLayout,
  type ColumnsLayoutProps,
  DownloadCard,
  type DownloadCardProps,
  type DownloadKind,
  Gallery,
  type GalleryItem,
  type GalleryProps,
  ImagePlaceholder,
  type ImagePlaceholderProps,
  Lightbox,
  type LightboxProps,
  type LightboxTone,
  GuideCard,
  type GuideCardProps,
  type GuideCardSurface,
  GuideHero,
  type GuideHeroAccent,
  type GuideHeroProps,
  GuideToggle,
  type GuideToggleItem,
  type GuideToggleProps,
  toEmbedUrl,
  VideoEmbed,
  type VideoEmbedProps,
  VideoPlayer,
  type VideoPlayerProps,
} from "./components/guide";

// Merkevare-bok-primitiver (visuell identitet): farger, fonter, logo-header
export {
  BrandHeader,
  type BrandHeaderProps,
  type BrandHeaderSurface,
  ColorSwatch,
  type ColorSwatchProps,
  FontSpecimen,
  type FontSpecimenProps,
  SwatchGrid,
  type SwatchGridColor,
  type SwatchGridProps,
  useWebFont,
  useCustomFont,
} from "./components/brand";

export { Switch };

// Chat-primitiver (medlemsfellesskap) — shadcn radix-registeret
export {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
  BubbleGroup,
  Bubble,
  BubbleContent,
  BubbleReactions,
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "./components/chat";

export { useIsMobile } from "./hooks/use-mobile";
