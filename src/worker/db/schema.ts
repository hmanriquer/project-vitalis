import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamp = (name: string) => integer(name, { mode: 'timestamp' });

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    categoryId: text('category_id').references(() => categories.id),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('idx_products_category').on(table.categoryId),
    index('idx_products_slug').on(table.slug),
  ],
);

export const productPhotos = sqliteTable('product_photos', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id),
  url: text('url').notNull(),
  alt: text('alt'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at'),
});

export const variants = sqliteTable(
  'variants',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    name: text('name').notNull(),
    priceInCentavos: integer('price_in_centavos').notNull(),
    photoId: text('photo_id'),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    check(
      'variants_stock_invariants',
      sql`${table.onHand} >= 0 AND ${table.reserved} >= 0 AND ${table.onHand} >= ${table.reserved}`,
    ),
    index('idx_variants_product').on(table.productId),
    index('idx_variants_stock').on(table.onHand, table.reserved),
  ],
);

export const storeSettings = sqliteTable('store_settings', {
  id: text('id').primaryKey().default('default'),
  shippingFeeInCentavos: integer('shipping_fee_in_centavos').notNull().default(0),
  whatsappPhoneNumber: text('whatsapp_phone_number').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull(),
});

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    source: text('source', { enum: ['site', 'whatsapp'] }).notNull(),
    status: text('status', {
      enum: ['pending_payment', 'paid', 'shipped', 'cancelled', 'expired', 'needs_review'],
    }).notNull(),
    guestToken: text('guest_token').notNull().unique(),
    userId: text('user_id'),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email').notNull(),
    addressStreet: text('address_street').notNull(),
    addressExteriorNumber: text('address_exterior_number').notNull(),
    addressInteriorNumber: text('address_interior_number'),
    addressColonia: text('address_colonia').notNull(),
    addressCity: text('address_city').notNull(),
    addressState: text('address_state').notNull(),
    addressPostalCode: text('address_postal_code').notNull(),
    shippingFeeInCentavos: integer('shipping_fee_in_centavos').notNull(),
    totalInCentavos: integer('total_in_centavos').notNull(),
    paymentReference: text('payment_reference'),
    paidAt: timestamp('paid_at'),
    carrier: text('carrier'),
    trackingNumber: text('tracking_number'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [
    index('idx_orders_status').on(table.status),
    index('idx_orders_paid_at').on(table.paidAt),
    index('idx_orders_email').on(table.customerEmail),
    index('idx_orders_guest_token').on(table.guestToken),
  ],
);

export const orderLines = sqliteTable('order_lines', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  variantId: text('variant_id')
    .notNull()
    .references(() => variants.id),
  quantity: integer('quantity').notNull(),
  unitPriceInCentavos: integer('unit_price_in_centavos').notNull(),
  totalInCentavos: integer('total_in_centavos').notNull(),
  createdAt: timestamp('created_at'),
});

export const reservations = sqliteTable(
  'reservations',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    variantId: text('variant_id')
      .notNull()
      .references(() => variants.id),
    quantity: integer('quantity').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
  },
  (table) => [
    index('idx_reservations_expires_at').on(table.expiresAt),
    index('idx_reservations_order').on(table.orderId),
  ],
);

export const stockAuditLogs = sqliteTable('stock_audit_logs', {
  id: text('id').primaryKey(),
  variantId: text('variant_id')
    .notNull()
    .references(() => variants.id),
  previousOnHand: integer('previous_on_hand').notNull(),
  newOnHand: integer('new_on_hand').notNull(),
  reason: text('reason').notNull(),
  actorId: text('actor_id'),
  createdAt: timestamp('created_at').notNull(),
});
