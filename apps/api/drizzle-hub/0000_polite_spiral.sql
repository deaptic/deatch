CREATE TABLE `watch` (
	`socketId` text NOT NULL,
	`twitchId` text NOT NULL,
	PRIMARY KEY(`socketId`, `twitchId`)
);
