const { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  decimal, 
  integer, 
  boolean, 
  timestamp, 
  jsonb,
  unique,
  index
} = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Categories table
const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  nameIdx: index('idx_categories_name').on(table.name),
  activeIdx: index('idx_categories_active').on(table.isActive),
}));

// Products table
const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  imageUrl: varchar('image_url', { length: 500 }),
  images: jsonb('images').default('[]'),
  sku: varchar('sku', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  weight: decimal('weight', { precision: 8, scale: 2 }),
  dimensions: jsonb('dimensions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  skuUnique: unique('products_sku_unique').on(table.sku),
  categoryIdx: index('idx_products_category_id').on(table.categoryId),
  activeIdx: index('idx_products_active').on(table.isActive),
  skuIdx: index('idx_products_sku').on(table.sku),
  priceIdx: index('idx_products_price').on(table.price),
}));

// Profiles table (extends Supabase auth.users)
const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  email: varchar('email', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: jsonb('address'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: varchar('role', { length: 20 }).notNull().default('customer'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_profiles_email').on(table.email),
  roleIdx: index('idx_profiles_role').on(table.role),
}));

// Cart items table
const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userProductUnique: unique('cart_items_user_product_unique').on(table.userId, table.productId),
  userIdx: index('idx_cart_items_user_id').on(table.userId),
  productIdx: index('idx_cart_items_product_id').on(table.productId),
}));

// Orders table
const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  shippingAddress: jsonb('shipping_address').notNull(),
  billingAddress: jsonb('billing_address'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  orderNumberUnique: unique('orders_order_number_unique').on(table.orderNumber),
  userIdx: index('idx_orders_user_id').on(table.userId),
  statusIdx: index('idx_orders_status').on(table.status),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
}));

// Order items table
const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  productSku: varchar('product_sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  orderIdx: index('idx_order_items_order_id').on(table.orderId),
  productIdx: index('idx_order_items_product_id').on(table.productId),
}));

// Define relations
const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

const profilesRelations = relations(profiles, ({ many }) => ({
  cartItems: many(cartItems),
  orders: many(orders),
}));

const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(profiles, {
    fields: [cartItems.userId],
    references: [profiles.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id],
  }),
  items: many(orderItems),
}));

const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

module.exports = {
  categories,
  products,
  profiles,
  cartItems,
  orders,
  orderItems,
  // Relations
  categoriesRelations,
  productsRelations,
  profilesRelations,
  cartItemsRelations,
  ordersRelations,
  orderItemsRelations,
};