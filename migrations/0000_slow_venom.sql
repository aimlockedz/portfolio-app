CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`thesis` text,
	`risks` text,
	`expected_upside` text,
	`review_date` integer,
	`decision_history` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `news_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`headline` text NOT NULL,
	`source` text NOT NULL,
	`published_date` integer NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`url` text
);
--> statement-breakpoint
CREATE TABLE `portfolio_holdings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`average_cost` integer NOT NULL,
	`total_quantity` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`preferred_currency` text DEFAULT 'USD' NOT NULL,
	`risk_profile` text DEFAULT 'Balanced' NOT NULL,
	`investment_style` text DEFAULT 'Growth' NOT NULL,
	`theme` text DEFAULT 'dark' NOT NULL,
	`bio` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`growth_score` integer NOT NULL,
	`valuation_score` integer NOT NULL,
	`momentum_score` integer NOT NULL,
	`risk_score` integer NOT NULL,
	`sentiment_score` integer NOT NULL,
	`total_score` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_scores_symbol_unique` ON `stock_scores` (`symbol`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`fx_rate` integer DEFAULT 1000000 NOT NULL,
	`date` integer NOT NULL,
	`broker_fee` integer DEFAULT 0 NOT NULL,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `watchlist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`conviction_level` integer DEFAULT 3 NOT NULL,
	`notes` text,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
