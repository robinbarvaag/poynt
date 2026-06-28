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
    name: '20260628_205846_stock_media_fields'
  },
];
