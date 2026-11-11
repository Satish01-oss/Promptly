CREATE TABLE `admin_history` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL,
	`snapshot` text
);
--> statement-breakpoint
CREATE TABLE `request_limits` (
	`id` text NOT NULL,
	`minute` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`id`, `minute`)
);
--> statement-breakpoint
CREATE TABLE `app_secrets` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_usage` (
	`day` text PRIMARY KEY NOT NULL,
	`requests` integer NOT NULL,
	`successes` integer NOT NULL,
	`errors` integer NOT NULL,
	`latency_ms` integer NOT NULL,
	`input_characters` integer NOT NULL,
	`output_characters` integer NOT NULL
);
