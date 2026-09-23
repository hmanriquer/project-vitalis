CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `order_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_in_centavos` integer NOT NULL,
	`total_in_centavos` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`guest_token` text NOT NULL,
	`user_id` text,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text NOT NULL,
	`address_street` text NOT NULL,
	`address_exterior_number` text NOT NULL,
	`address_interior_number` text,
	`address_colonia` text NOT NULL,
	`address_city` text NOT NULL,
	`address_state` text NOT NULL,
	`address_postal_code` text NOT NULL,
	`shipping_fee_in_centavos` integer NOT NULL,
	`total_in_centavos` integer NOT NULL,
	`payment_reference` text,
	`paid_at` integer,
	`carrier` text,
	`tracking_number` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_guest_token_unique` ON `orders` (`guest_token`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_orders_paid_at` ON `orders` (`paid_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_email` ON `orders` (`customer_email`);--> statement-breakpoint
CREATE INDEX `idx_orders_guest_token` ON `orders` (`guest_token`);--> statement-breakpoint
CREATE TABLE `product_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`url` text NOT NULL,
	`alt` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reservations_expires_at` ON `reservations` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_reservations_order` ON `reservations` (`order_id`);--> statement-breakpoint
CREATE TABLE `stock_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`variant_id` text NOT NULL,
	`previous_on_hand` integer NOT NULL,
	`new_on_hand` integer NOT NULL,
	`reason` text NOT NULL,
	`actor_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`shipping_fee_in_centavos` integer DEFAULT 0 NOT NULL,
	`whatsapp_phone_number` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`price_in_centavos` integer NOT NULL,
	`photo_id` text,
	`on_hand` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "variants_stock_invariants" CHECK("variants"."on_hand" >= 0 AND "variants"."reserved" >= 0 AND "variants"."on_hand" >= "variants"."reserved")
);
--> statement-breakpoint
CREATE INDEX `idx_variants_product` ON `variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_variants_stock` ON `variants` (`on_hand`,`reserved`);