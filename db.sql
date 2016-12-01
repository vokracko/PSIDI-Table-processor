-- Adminer 3.7.1 MySQL dump

SET NAMES utf8;
SET foreign_key_checks = 0;
SET time_zone = '+01:00';
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP TABLE IF EXISTS `cell`;
CREATE TABLE `cell` (
  `dataset_id` int(11) NOT NULL,
  `row` int(11) NOT NULL,
  `col` int(11) NOT NULL,
  `data` decimal(10,4) NOT NULL,
  KEY `dataset_id` (`dataset_id`),
  CONSTRAINT `cell_ibfk_2` FOREIGN KEY (`dataset_id`) REFERENCES `dataset` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `cell` (`dataset_id`, `row`, `col`, `data`) VALUES
(1,	0,	0,	3.0000),
(1,	0,	1,	16.7520),
(1,	1,	0,	9.0000),
(1,	1,	1,	3.0000),
(1,	2,	0,	53.8700),
(1,	2,	1,	6549.0000);

DROP TABLE IF EXISTS `dataset`;
CREATE TABLE `dataset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dataset_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `dataset` (`id`, `user_id`, `name`) VALUES
(1,	1,	'First');

DROP TABLE IF EXISTS `macro`;
CREATE TABLE `macro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `macro_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


DROP TABLE IF EXISTS `operation`;
CREATE TABLE `operation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `macro_id` int(11) NOT NULL,
  `url` varchar(255) NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `macro_id` (`macro_id`),
  CONSTRAINT `operation_ibfk_2` FOREIGN KEY (`macro_id`) REFERENCES `macro` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `user` (`id`, `email`, `password`) VALUES
(1,	'lukas@vokracko.cz',	'65adda4326914576405c9e3a62f4904d96573863');

-- 2016-12-01 15:40:39
