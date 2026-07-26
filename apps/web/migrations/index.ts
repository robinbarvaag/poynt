import * as migration_20260620_104354_initial_baseline from './20260620_104354_initial_baseline';
import * as migration_20260620_111743 from './20260620_111743';
import * as migration_20260620_172625 from './20260620_172625';
import * as migration_20260620_222718 from './20260620_222718';
import * as migration_20260621_154912_add_product_status_fields from './20260621_154912_add_product_status_fields';
import * as migration_20260621_161655_add_product_highlights from './20260621_161655_add_product_highlights';
import * as migration_20260621_164517_add_services_detail_cta from './20260621_164517_add_services_detail_cta';
import * as migration_20260621_170543_add_variants_and_quantity from './20260621_170543_add_variants_and_quantity';
import * as migration_20260621_193347_services_archive_selection from './20260621_193347_services_archive_selection';
import * as migration_20260621_195315_services_featured from './20260621_195315_services_featured';
import * as migration_20260621_211840_add_seo_faq_fields from './20260621_211840_add_seo_faq_fields';
import * as migration_20260621_221017_add_courses from './20260621_221017_add_courses';
import * as migration_20260623_203800 from './20260623_203800';
import * as migration_20260627_195306 from './20260627_195306';
import * as migration_20260628_173640_remove_product_benefits from './20260628_173640_remove_product_benefits';
import * as migration_20260628_205846_stock_media_fields from './20260628_205846_stock_media_fields';
import * as migration_20260629_184810_guide_toc_image_align from './20260629_184810_guide_toc_image_align';
import * as migration_20260629_195235_add_guide_block_headers from './20260629_195235_add_guide_block_headers';
import * as migration_20260629_201652_guide_quality_fields from './20260629_201652_guide_quality_fields';
import * as migration_20260629_224500_add_bookmark_og_status from './20260629_224500_add_bookmark_og_status';
import * as migration_20260629_225839_guide_columns_width from './20260629_225839_guide_columns_width';
import * as migration_20260721_231410_drop_podcasts from './20260721_231410_drop_podcasts';
import * as migration_20260721_232320_drop_header_search_login from './20260721_232320_drop_header_search_login';
import * as migration_20260721_232429 from './20260721_232429';
import * as migration_20260721_234521_seo_og_image_size from './20260721_234521_seo_og_image_size';
import * as migration_20260722_000820_remove_articles from './20260722_000820_remove_articles';
import * as migration_20260722_001638_og_share_card_settings from './20260722_001638_og_share_card_settings';
import * as migration_20260722_003828 from './20260722_003828';
import * as migration_20260722_010839_media_blur_data_url from './20260722_010839_media_blur_data_url';
import * as migration_20260722_095544 from './20260722_095544';
import * as migration_20260722_102057 from './20260722_102057';
import * as migration_20260725_105106_product_story_fields from './20260725_105106_product_story_fields';
import * as migration_20260725_113903_product_notice_title from './20260725_113903_product_notice_title';
import * as migration_20260725_115656 from './20260725_115656';
import * as migration_20260725_120900_bokmal_pdf_title from './20260725_120900_bokmal_pdf_title';
import * as migration_20260725_121855 from './20260725_121855';
import * as migration_20260725_131054 from './20260725_131054';
import * as migration_20260725_150105 from './20260725_150105';
import * as migration_20260725_161825 from './20260725_161825';
import * as migration_20260725_171250 from './20260725_171250';
import * as migration_20260725_203027_on_poynt_features from './20260725_203027_on_poynt_features';
import * as migration_20260726_101651_remove_pages_excerpt_published_at from './20260726_101651_remove_pages_excerpt_published_at';
import * as migration_20260726_112513 from './20260726_112513';
import * as migration_20260726_115311_product_quality_fields from './20260726_115311_product_quality_fields';

export const migrations = [
  {
    up: migration_20260620_104354_initial_baseline.up,
    down: migration_20260620_104354_initial_baseline.down,
    name: '20260620_104354_initial_baseline',
  },
  {
    up: migration_20260620_111743.up,
    down: migration_20260620_111743.down,
    name: '20260620_111743',
  },
  {
    up: migration_20260620_172625.up,
    down: migration_20260620_172625.down,
    name: '20260620_172625',
  },
  {
    up: migration_20260620_222718.up,
    down: migration_20260620_222718.down,
    name: '20260620_222718',
  },
  {
    up: migration_20260621_154912_add_product_status_fields.up,
    down: migration_20260621_154912_add_product_status_fields.down,
    name: '20260621_154912_add_product_status_fields',
  },
  {
    up: migration_20260621_161655_add_product_highlights.up,
    down: migration_20260621_161655_add_product_highlights.down,
    name: '20260621_161655_add_product_highlights',
  },
  {
    up: migration_20260621_164517_add_services_detail_cta.up,
    down: migration_20260621_164517_add_services_detail_cta.down,
    name: '20260621_164517_add_services_detail_cta',
  },
  {
    up: migration_20260621_170543_add_variants_and_quantity.up,
    down: migration_20260621_170543_add_variants_and_quantity.down,
    name: '20260621_170543_add_variants_and_quantity',
  },
  {
    up: migration_20260621_193347_services_archive_selection.up,
    down: migration_20260621_193347_services_archive_selection.down,
    name: '20260621_193347_services_archive_selection',
  },
  {
    up: migration_20260621_195315_services_featured.up,
    down: migration_20260621_195315_services_featured.down,
    name: '20260621_195315_services_featured',
  },
  {
    up: migration_20260621_211840_add_seo_faq_fields.up,
    down: migration_20260621_211840_add_seo_faq_fields.down,
    name: '20260621_211840_add_seo_faq_fields',
  },
  {
    up: migration_20260621_221017_add_courses.up,
    down: migration_20260621_221017_add_courses.down,
    name: '20260621_221017_add_courses',
  },
  {
    up: migration_20260623_203800.up,
    down: migration_20260623_203800.down,
    name: '20260623_203800',
  },
  {
    up: migration_20260627_195306.up,
    down: migration_20260627_195306.down,
    name: '20260627_195306',
  },
  {
    up: migration_20260628_173640_remove_product_benefits.up,
    down: migration_20260628_173640_remove_product_benefits.down,
    name: '20260628_173640_remove_product_benefits',
  },
  {
    up: migration_20260628_205846_stock_media_fields.up,
    down: migration_20260628_205846_stock_media_fields.down,
    name: '20260628_205846_stock_media_fields',
  },
  {
    up: migration_20260629_184810_guide_toc_image_align.up,
    down: migration_20260629_184810_guide_toc_image_align.down,
    name: '20260629_184810_guide_toc_image_align',
  },
  {
    up: migration_20260629_195235_add_guide_block_headers.up,
    down: migration_20260629_195235_add_guide_block_headers.down,
    name: '20260629_195235_add_guide_block_headers',
  },
  {
    up: migration_20260629_201652_guide_quality_fields.up,
    down: migration_20260629_201652_guide_quality_fields.down,
    name: '20260629_201652_guide_quality_fields',
  },
  {
    up: migration_20260629_224500_add_bookmark_og_status.up,
    down: migration_20260629_224500_add_bookmark_og_status.down,
    name: '20260629_224500_add_bookmark_og_status',
  },
  {
    up: migration_20260629_225839_guide_columns_width.up,
    down: migration_20260629_225839_guide_columns_width.down,
    name: '20260629_225839_guide_columns_width',
  },
  {
    up: migration_20260721_231410_drop_podcasts.up,
    down: migration_20260721_231410_drop_podcasts.down,
    name: '20260721_231410_drop_podcasts',
  },
  {
    up: migration_20260721_232320_drop_header_search_login.up,
    down: migration_20260721_232320_drop_header_search_login.down,
    name: '20260721_232320_drop_header_search_login',
  },
  {
    up: migration_20260721_232429.up,
    down: migration_20260721_232429.down,
    name: '20260721_232429',
  },
  {
    up: migration_20260721_234521_seo_og_image_size.up,
    down: migration_20260721_234521_seo_og_image_size.down,
    name: '20260721_234521_seo_og_image_size',
  },
  {
    up: migration_20260722_000820_remove_articles.up,
    down: migration_20260722_000820_remove_articles.down,
    name: '20260722_000820_remove_articles',
  },
  {
    up: migration_20260722_001638_og_share_card_settings.up,
    down: migration_20260722_001638_og_share_card_settings.down,
    name: '20260722_001638_og_share_card_settings',
  },
  {
    up: migration_20260722_003828.up,
    down: migration_20260722_003828.down,
    name: '20260722_003828',
  },
  {
    up: migration_20260722_010839_media_blur_data_url.up,
    down: migration_20260722_010839_media_blur_data_url.down,
    name: '20260722_010839_media_blur_data_url',
  },
  {
    up: migration_20260722_095544.up,
    down: migration_20260722_095544.down,
    name: '20260722_095544',
  },
  {
    up: migration_20260722_102057.up,
    down: migration_20260722_102057.down,
    name: '20260722_102057',
  },
  {
    up: migration_20260725_105106_product_story_fields.up,
    down: migration_20260725_105106_product_story_fields.down,
    name: '20260725_105106_product_story_fields',
  },
  {
    up: migration_20260725_113903_product_notice_title.up,
    down: migration_20260725_113903_product_notice_title.down,
    name: '20260725_113903_product_notice_title',
  },
  {
    up: migration_20260725_115656.up,
    down: migration_20260725_115656.down,
    name: '20260725_115656',
  },
  {
    up: migration_20260725_120900_bokmal_pdf_title.up,
    down: migration_20260725_120900_bokmal_pdf_title.down,
    name: '20260725_120900_bokmal_pdf_title',
  },
  {
    up: migration_20260725_121855.up,
    down: migration_20260725_121855.down,
    name: '20260725_121855',
  },
  {
    up: migration_20260725_131054.up,
    down: migration_20260725_131054.down,
    name: '20260725_131054',
  },
  {
    up: migration_20260725_150105.up,
    down: migration_20260725_150105.down,
    name: '20260725_150105',
  },
  {
    up: migration_20260725_161825.up,
    down: migration_20260725_161825.down,
    name: '20260725_161825',
  },
  {
    up: migration_20260725_171250.up,
    down: migration_20260725_171250.down,
    name: '20260725_171250',
  },
  {
    up: migration_20260725_203027_on_poynt_features.up,
    down: migration_20260725_203027_on_poynt_features.down,
    name: '20260725_203027_on_poynt_features',
  },
  {
    up: migration_20260726_101651_remove_pages_excerpt_published_at.up,
    down: migration_20260726_101651_remove_pages_excerpt_published_at.down,
    name: '20260726_101651_remove_pages_excerpt_published_at',
  },
  {
    up: migration_20260726_112513.up,
    down: migration_20260726_112513.down,
    name: '20260726_112513',
  },
  {
    up: migration_20260726_115311_product_quality_fields.up,
    down: migration_20260726_115311_product_quality_fields.down,
    name: '20260726_115311_product_quality_fields'
  },
];
