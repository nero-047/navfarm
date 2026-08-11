-- MySQL dump 10.13  Distrib 9.7.1, for macos26.4 (arm64)
--
-- Host: localhost    Database: navfarm_master
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '520fc2f0-7b72-11f1-88ab-c368c0896e8a:1-729';

--
-- Current Database: `navfarm_master`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `navfarm_master` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `navfarm_master`;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'c32890d497a2d85abce759e15ff87661fadbbdfee683047baa0dab500b0ea1c5',1783337221953),(2,'4e4eea1dd4cdd4bb897f67772456773f7cf28aa6a16e86d5b9b0926b70199b19',1784632896737);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`audit_id`),
  KEY `audit_log_tenant_id_tenant_master_tenant_id_fk` (`tenant_id`),
  CONSTRAINT `audit_log_tenant_id_tenant_master_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master` (`tenant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES ('2cde69fa-83c9-4865-b36a-d480af221b1b','00000000-0000-0000-0000-000000000000',NULL,NULL,'CHANGE_PLAN','tenant_master','00000000-0000-0000-0000-000000000000','{\"plan_id\": \"SYSTEM_PLAN\", \"max_users\": 5, \"subscription\": {\"sub_id\": \"d0b8bd73-c663-4a1a-9135-1b303862cdfb\", \"is_active\": true, \"plan_code\": \"SYSTEM_PLAN\", \"tenant_id\": \"00000000-0000-0000-0000-000000000000\", \"renewal_auto\": true, \"support_tier\": \"PREMIUM\", \"feature_flags\": null, \"payment_method\": null, \"sla_uptime_pct\": \"99.90\", \"storage_limit_gb\": \"1000.00\"}, \"billing_cycle\": null, \"max_companies\": 1}','{\"plan_id\": \"PLAN_ENTERPRISE\", \"max_users\": 100, \"subscription\": {\"sub_id\": \"d0b8bd73-c663-4a1a-9135-1b303862cdfb\", \"is_active\": true, \"plan_code\": \"PLAN_ENTERPRISE\", \"tenant_id\": \"00000000-0000-0000-0000-000000000000\", \"renewal_auto\": true, \"support_tier\": \"PREMIUM\", \"feature_flags\": {\"api_access\": true, \"qr_traceability\": true}, \"payment_method\": null, \"sla_uptime_pct\": \"99.90\", \"storage_limit_gb\": \"100.00\"}, \"billing_cycle\": \"MONTHLY\", \"max_companies\": 10}',NULL,NULL,'2026-07-09 08:47:57'),('55987d20-aef3-4029-a541-be104adf1fae','e6e465fc-b76b-4fbc-9a27-626696c6c607',NULL,NULL,'UPDATE','tenant_master','e6e465fc-b76b-4fbc-9a27-626696c6c607','{\"db_host\": \"localhost\", \"db_name\": \"tenant_goon\", \"db_port\": 3306, \"db_user\": \"root\", \"plan_id\": \"PLAN_ENTERPRISE\", \"is_trial\": false, \"is_active\": true, \"max_users\": 1000, \"tenant_id\": \"e6e465fc-b76b-4fbc-9a27-626696c6c607\", \"created_at\": \"2026-07-23 11:23:04\", \"db_password\": \"\", \"tenant_code\": \"goon\", \"tenant_name\": \"gooner\", \"tenant_type\": \"SME\", \"subscription\": {\"sub_id\": \"5e5cc3a6-e418-410e-af3a-840c6e27a51d\", \"is_active\": true, \"plan_code\": \"PLAN_ENTERPRISE\", \"tenant_id\": \"e6e465fc-b76b-4fbc-9a27-626696c6c607\", \"renewal_auto\": true, \"support_tier\": \"PREMIUM\", \"feature_flags\": {\"enterprise\": true, \"onboarding\": true, \"operations\": true}, \"payment_method\": null, \"sla_uptime_pct\": \"99.90\", \"storage_limit_gb\": \"500.00\"}, \"billing_cycle\": \"ANNUAL\", \"billing_email\": \"admin@goon.com\", \"max_companies\": 100, \"plan_end_date\": null, \"api_rate_limit\": 5000, \"trial_end_date\": null, \"allowed_lob_ids\": null, \"allowed_nob_ids\": null, \"plan_start_date\": \"2026-07-23\", \"billing_currency_id\": null, \"max_batches_per_month\": null}','{\"db_host\": \"localhost\", \"db_name\": \"tenant_goon\", \"db_port\": 3306, \"db_user\": \"root\", \"plan_id\": \"PLAN_ENTERPRISE\", \"is_trial\": false, \"is_active\": true, \"max_users\": 1000, \"tenant_id\": \"e6e465fc-b76b-4fbc-9a27-626696c6c607\", \"created_at\": \"2026-07-23 11:23:04\", \"db_password\": \"\", \"tenant_code\": \"goon\", \"tenant_name\": \"gooner\", \"tenant_type\": \"SME\", \"billing_cycle\": \"ANNUAL\", \"billing_email\": \"admin@goon.com\", \"max_companies\": 100, \"plan_end_date\": null, \"api_rate_limit\": 5000, \"trial_end_date\": null, \"allowed_lob_ids\": [\"6666f388-5a7e-481f-8dc8-08ebdced12a0\", \"07b2de20-a304-4b53-b4eb-0e41123a91db\", \"9f858f70-44bc-4503-8153-9d9c3bbc0ac1\", \"34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d\", \"528eb1ac-461d-428c-910f-f48eccd30bbc\", \"7a763d80-da73-4c38-a5be-1868c6ce611c\", \"ecb38d4e-5de8-42ed-8c5d-7f3555aee967\", \"2a362ff0-798c-4727-97b8-d6e8abb9788d\", \"3533f9ef-57dc-41ce-8cce-37285867c675\", \"60000000-6000-6000-6000-000000000008\", \"4ef5479e-e5cd-4307-b60c-fb5c5ea5faca\", \"e8f2e5ef-0522-4639-8ab5-a23d172dfcce\", \"86b60d9b-504d-4ed5-b83b-52a2da8e7491\", \"9a576d2b-5063-43f6-8e74-1f13cd15cbc8\"], \"allowed_nob_ids\": [\"11111111-1111-1111-1111-111111111111\", \"22222222-2222-2222-2222-222222222222\", \"33333333-3333-3333-3333-333333333333\"], \"plan_start_date\": \"2026-07-23\", \"billing_currency_id\": null, \"max_batches_per_month\": null}',NULL,NULL,'2026-07-23 07:38:54'),('a5116396-884b-46ee-9b8b-44f09af9e913','3e6adab1-c6c5-4114-be76-9d1239e481d6',NULL,NULL,'CREATE','tenant_master','3e6adab1-c6c5-4114-be76-9d1239e481d6',NULL,'{\"db_host\": \"localhost\", \"db_name\": \"tenant_geern\", \"db_port\": 3306, \"db_user\": \"root\", \"plan_id\": \"PLAN_ENTERPRISE\", \"is_trial\": false, \"is_active\": true, \"max_users\": 100, \"tenant_id\": \"3e6adab1-c6c5-4114-be76-9d1239e481d6\", \"created_at\": \"2026-07-09 14:21:51\", \"db_password\": \"\", \"tenant_code\": \"geern\", \"tenant_name\": \"blue\", \"tenant_type\": \"SME\", \"billing_cycle\": \"MONTHLY\", \"billing_email\": \"risgur00@gmail.com\", \"max_companies\": 10, \"plan_end_date\": null, \"api_rate_limit\": 5000, \"trial_end_date\": null, \"plan_start_date\": \"2026-07-09\", \"billing_currency_id\": null, \"max_batches_per_month\": null}',NULL,NULL,'2026-07-09 08:51:51'),('ac0bed1b-7b32-4498-9fab-80633a3fe70a','3e6adab1-c6c5-4114-be76-9d1239e481d6',NULL,NULL,'UPDATE','tenant_master','3e6adab1-c6c5-4114-be76-9d1239e481d6','{\"db_host\": \"localhost\", \"db_name\": \"tenant_geern\", \"db_port\": 3306, \"db_user\": \"root\", \"plan_id\": \"PLAN_ENTERPRISE\", \"is_trial\": false, \"is_active\": true, \"max_users\": 100, \"tenant_id\": \"3e6adab1-c6c5-4114-be76-9d1239e481d6\", \"created_at\": \"2026-07-09 14:21:51\", \"db_password\": \"\", \"tenant_code\": \"green\", \"tenant_name\": \"blue\", \"tenant_type\": \"SME\", \"subscription\": {\"sub_id\": \"63b3e829-25d1-4a3e-bf36-68387c39608f\", \"is_active\": true, \"plan_code\": \"PLAN_ENTERPRISE\", \"tenant_id\": \"3e6adab1-c6c5-4114-be76-9d1239e481d6\", \"renewal_auto\": true, \"support_tier\": \"PREMIUM\", \"feature_flags\": {\"api_access\": true, \"qr_traceability\": true}, \"payment_method\": null, \"sla_uptime_pct\": \"99.90\", \"storage_limit_gb\": \"100.00\"}, \"billing_cycle\": \"MONTHLY\", \"billing_email\": \"risgur00@gmail.com\", \"max_companies\": 10, \"plan_end_date\": null, \"api_rate_limit\": 5000, \"trial_end_date\": null, \"allowed_lob_ids\": null, \"allowed_nob_ids\": null, \"plan_start_date\": \"2026-07-09\", \"billing_currency_id\": null, \"max_batches_per_month\": null}','{\"db_host\": \"localhost\", \"db_name\": \"tenant_geern\", \"db_port\": 3306, \"db_user\": \"root\", \"plan_id\": \"PLAN_ENTERPRISE\", \"is_trial\": false, \"is_active\": true, \"max_users\": 100, \"tenant_id\": \"3e6adab1-c6c5-4114-be76-9d1239e481d6\", \"created_at\": \"2026-07-09 14:21:51\", \"db_password\": \"\", \"tenant_code\": \"green\", \"tenant_name\": \"blue\", \"tenant_type\": \"SME\", \"billing_cycle\": \"MONTHLY\", \"billing_email\": \"risgur00@gmail.com\", \"max_companies\": 10, \"plan_end_date\": null, \"api_rate_limit\": 5000, \"trial_end_date\": null, \"allowed_lob_ids\": [\"6666f388-5a7e-481f-8dc8-08ebdced12a0\", \"07b2de20-a304-4b53-b4eb-0e41123a91db\", \"9f858f70-44bc-4503-8153-9d9c3bbc0ac1\", \"34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d\", \"528eb1ac-461d-428c-910f-f48eccd30bbc\"], \"allowed_nob_ids\": [\"11111111-1111-1111-1111-111111111111\"], \"plan_start_date\": \"2026-07-09\", \"billing_currency_id\": null, \"max_batches_per_month\": null}',NULL,NULL,'2026-07-23 06:39:52'),('bdf8c3c4-7755-4d2c-b76c-de5bf1af123d','e6e465fc-b76b-4fbc-9a27-626696c6c607',NULL,NULL,'CREATE','tenant_master','e6e465fc-b76b-4fbc-9a27-626696c6c607',NULL,'{\"db_host\": \"localhost\", \"db_name\": \"tenant_goon\", \"db_port\": 3306, \"db_user\": \"root\", \"plan_id\": \"PLAN_ENTERPRISE\", \"is_trial\": false, \"is_active\": true, \"max_users\": 1000, \"tenant_id\": \"e6e465fc-b76b-4fbc-9a27-626696c6c607\", \"created_at\": \"2026-07-23 11:23:04\", \"db_password\": \"\", \"tenant_code\": \"goon\", \"tenant_name\": \"gooner\", \"tenant_type\": \"SME\", \"billing_cycle\": \"ANNUAL\", \"billing_email\": \"admin@goon.com\", \"max_companies\": 100, \"plan_end_date\": null, \"api_rate_limit\": 5000, \"trial_end_date\": null, \"allowed_lob_ids\": null, \"allowed_nob_ids\": null, \"plan_start_date\": \"2026-07-23\", \"billing_currency_id\": null, \"max_batches_per_month\": null}',NULL,NULL,'2026-07-23 05:53:04');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_master`
--

DROP TABLE IF EXISTS `currency_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_master` (
  `currency_id` varchar(36) NOT NULL,
  `iso_code` char(3) NOT NULL,
  `currency_name` varchar(100) NOT NULL,
  `symbol` varchar(5) NOT NULL,
  `symbol_position` varchar(10) NOT NULL DEFAULT 'PREFIX',
  `decimal_places` int NOT NULL DEFAULT '2',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `currency_master_iso_code_unique` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_master`
--

LOCK TABLES `currency_master` WRITE;
/*!40000 ALTER TABLE `currency_master` DISABLE KEYS */;
INSERT INTO `currency_master` VALUES ('20000000-2000-2000-2000-200000000001','INR','Indian Rupee','₹','PREFIX',2,1,1),('20000000-2000-2000-2000-200000000002','USD','US Dollar','$','PREFIX',2,0,1),('20000000-2000-2000-2000-200000000003','EUR','Euro','€','PREFIX',2,0,1);
/*!40000 ALTER TABLE `currency_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_master`
--

DROP TABLE IF EXISTS `language_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_master` (
  `lang_id` varchar(36) NOT NULL,
  `lang_code` varchar(10) NOT NULL,
  `lang_name_english` varchar(100) NOT NULL,
  `lang_name_native` varchar(100) NOT NULL,
  `script` varchar(30) NOT NULL,
  `is_rtl` tinyint(1) NOT NULL DEFAULT '0',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `translation_coverage_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `date_format` varchar(30) NOT NULL DEFAULT 'DD/MM/YYYY',
  `number_format` varchar(20) NOT NULL DEFAULT 'IN',
  `decimal_separator` char(1) NOT NULL DEFAULT '.',
  `thousands_separator` char(1) NOT NULL DEFAULT ',',
  `flag_emoji` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`lang_id`),
  UNIQUE KEY `language_master_lang_code_unique` (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_master`
--

LOCK TABLES `language_master` WRITE;
/*!40000 ALTER TABLE `language_master` DISABLE KEYS */;
INSERT INTO `language_master` VALUES ('10000000-1000-1000-1000-100000000001','en','English','English','Latin',0,1,1,100.00,'DD/MM/YYYY','IN','.',',','🇬🇧'),('10000000-1000-1000-1000-100000000002','hi','Hindi','हिन्दी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',','🇮🇳'),('10000000-1000-1000-1000-100000000003','mr','Marathi','मराठी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000004','es','Spanish','Español','Latin',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000005','fr','French','Français','Latin',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000006','bn','Bengali','বাংলা','Bengali',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000007','te','Telugu','తెలుగు','Telugu',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000008','ta','Tamil','தமிழ்','Tamil',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL);
/*!40000 ALTER TABLE `language_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lob_master`
--

DROP TABLE IF EXISTS `lob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lob_master` (
  `lob_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_code` varchar(50) NOT NULL,
  `lob_name` varchar(100) NOT NULL,
  `costing_method_allowed` varchar(100) NOT NULL,
  `qc_required` varchar(10) NOT NULL DEFAULT 'NO',
  `qr_required` varchar(10) NOT NULL DEFAULT 'NO',
  `batch_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `scheduler_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `traceability_required` varchar(10) NOT NULL DEFAULT 'YES',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`lob_id`),
  UNIQUE KEY `lob_master_lob_code_unique` (`lob_code`),
  KEY `lob_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  CONSTRAINT `lob_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lob_master`
--

LOCK TABLES `lob_master` WRITE;
/*!40000 ALTER TABLE `lob_master` DISABLE KEYS */;
INSERT INTO `lob_master` VALUES ('07b2de20-a304-4b53-b4eb-0e41123a91db','11111111-1111-1111-1111-111111111111','PLT_LAYING','Laying','STANDARD,FIFO','YES','YES','YES','YES','YES','Laying hens producing eggs',2,1,1,NULL,NULL,NULL),('2a362ff0-798c-4727-97b8-d6e8abb9788d','22222222-2222-2222-2222-222222222222','LVS_PIGGERY','Piggery','BIO_ASSET,STANDARD','YES','YES','YES','YES','YES','Piggery rearing and growout',7,1,1,NULL,NULL,NULL),('2ad69bb6-b984-4728-8a89-3424f116670a','55555555-5555-5555-5555-555555555555','INS_BEE','Bee Keeping','STANDARD','YES','YES','YES','YES','YES','Honey apiaries',14,1,1,NULL,NULL,NULL),('2dfab306-9ab7-47c4-867a-0c0d2cbcdcee','44444444-4444-4444-4444-444444444444','AQA_SLAUGHTER','Aquaculture Slaughter','STANDARD','YES','YES','YES','YES','YES','Aqua filleting and processing',13,1,1,NULL,NULL,NULL),('34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d','11111111-1111-1111-1111-111111111111','PLT_CB','Commercial Broiler Farming','STANDARD','YES','YES','YES','YES','YES','Commercial broiler batch growout',4,1,1,NULL,NULL,NULL),('3533f9ef-57dc-41ce-8cce-37285867c675','22222222-2222-2222-2222-222222222222','LVS_SLAUGHTER','Livestock Slaughtering','STANDARD,FIFO,AVG','YES','YES','YES','YES','YES','Slaughter line',8,1,1,NULL,NULL,NULL),('43b11b0b-b76d-4bf0-a21f-b5ebadbd4c2e','66666666-6666-6666-6666-666666666666','FEED_PROD','Feed Production','STANDARD','YES','YES','YES','YES','YES','Feed Mill compounding',16,1,1,NULL,NULL,NULL),('4ef5479e-e5cd-4307-b60c-fb5c5ea5faca','33333333-3333-3333-3333-333333333333','AGRI_FRUIT','Fruit Farming','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Bearer plants orchard management',9,1,1,NULL,NULL,NULL),('528eb1ac-461d-428c-910f-f48eccd30bbc','11111111-1111-1111-1111-111111111111','PLT_SLAUGHTER','Poultry Slaughter','STANDARD','YES','YES','YES','YES','YES','Processing line and joint cost splits',5,1,1,NULL,NULL,NULL),('60000000-6000-6000-6000-000000000008','22222222-2222-2222-2222-222222222222','LVS_GOAT_SHEEP','Goat & Sheep','BIO_ASSET','YES','YES','NO','NO','YES',NULL,8,1,1,NULL,NULL,NULL),('60000000-6000-6000-6000-000000000015','55555555-5555-5555-5555-555555555555','BSF','Black Soldier Fly','STANDARD','YES','YES','NO','NO','YES',NULL,15,1,1,NULL,NULL,NULL),('6666f388-5a7e-481f-8dc8-08ebdced12a0','11111111-1111-1111-1111-111111111111','PLT_REARING','Rearing & Breeding','STANDARD,FIFO','NO','NO','YES','YES','YES','Rearing and breeding layer/breeder parent flocks',1,1,1,NULL,NULL,NULL),('7a763d80-da73-4c38-a5be-1868c6ce611c','22222222-2222-2222-2222-222222222222','LVS_MILKING','Dairy','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Milking operations',6,1,1,NULL,NULL,NULL),('86b60d9b-504d-4ed5-b83b-52a2da8e7491','33333333-3333-3333-3333-333333333333','AGRI_SEEDS','Seed Processing','STANDARD','YES','YES','YES','YES','YES','Seeds processing',11,1,1,NULL,NULL,NULL),('9a576d2b-5063-43f6-8e74-1f13cd15cbc8','33333333-3333-3333-3333-333333333333','AGRI_FLOWER','Flower Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Flower harvest stems',12,1,1,NULL,NULL,NULL),('9f858f70-44bc-4503-8153-9d9c3bbc0ac1','11111111-1111-1111-1111-111111111111','PLT_HATCHING','Hatching','STANDARD,FIFO','YES','YES','YES','YES','YES','Incubator & hatching operations',3,1,1,NULL,NULL,NULL),('d6ff6308-ea1b-4ee8-b036-d513779a366d','44444444-4444-4444-4444-444444444444','AQA_FISH','Fish Farming','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Fish ponds growout',12,1,1,NULL,NULL,NULL),('e8f2e5ef-0522-4639-8ab5-a23d172dfcce','33333333-3333-3333-3333-333333333333','AGRI_CROP','Crop Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Seasonal grain / crop batch',10,1,1,NULL,NULL,NULL),('ecb38d4e-5de8-42ed-8c5d-7f3555aee967','22222222-2222-2222-2222-222222222222','LVS_BREEDING','Livestock Breeding','STANDARD,FIFO,BIO_ASSET,AVG','YES','NO','YES','YES','YES','Breeding livestock herds',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `lob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_master`
--

DROP TABLE IF EXISTS `nob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_master` (
  `nob_id` varchar(36) NOT NULL,
  `nob_code` varchar(50) NOT NULL,
  `nob_name` varchar(100) NOT NULL,
  `default_costing_method` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`nob_id`),
  UNIQUE KEY `nob_master_nob_code_unique` (`nob_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_master`
--

LOCK TABLES `nob_master` WRITE;
/*!40000 ALTER TABLE `nob_master` DISABLE KEYS */;
INSERT INTO `nob_master` VALUES ('11111111-1111-1111-1111-111111111111','POULTRY','Poultry','STANDARD','Birds - broiler, layer, breeder, hatchery',1,1,1,NULL,NULL,NULL),('22222222-2222-2222-2222-222222222222','LIVESTOCK','Livestock','BIO_ASSET','Animals - cattle, piggery, goat, sheep',2,1,1,NULL,NULL,NULL),('33333333-3333-3333-3333-333333333333','AGRI','Agriculture','STANDARD','Crops, fruits, flowers, seeds',3,1,1,NULL,NULL,NULL),('44444444-4444-4444-4444-444444444444','AQUA','Aquaculture','BIO_ASSET','Fish, shrimp, other aquatic',4,1,1,NULL,NULL,NULL),('55555555-5555-5555-5555-555555555555','INSECT','Insect Farming','STANDARD','Bee keeping, black soldier fly',5,1,1,NULL,NULL,NULL),('66666666-6666-6666-6666-666666666666','PRODUCTION','Feed & Processing','STANDARD','Feed mill, processing plant',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `nob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan_master`
--

DROP TABLE IF EXISTS `plan_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_master` (
  `plan_id` varchar(30) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `billing_cycle` varchar(20) NOT NULL DEFAULT 'MONTHLY',
  `max_companies` int NOT NULL DEFAULT '1',
  `max_users` int NOT NULL DEFAULT '5',
  `storage_limit_gb` decimal(8,2) NOT NULL DEFAULT '5.00',
  `feature_flags` json NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_master`
--

LOCK TABLES `plan_master` WRITE;
/*!40000 ALTER TABLE `plan_master` DISABLE KEYS */;
INSERT INTO `plan_master` VALUES ('PLAN_BASIC','Basic',0.00,'MONTHLY',1,5,5.00,'{\"onboarding\": true, \"operations\": false}',1,'2026-07-09 08:44:28'),('PLAN_ENTERPRISE','Enterprise',0.00,'ANNUAL',100,1000,500.00,'{\"enterprise\": true, \"onboarding\": true, \"operations\": true}',1,'2026-07-09 08:44:28'),('PLAN_PRO','Professional',0.00,'MONTHLY',5,75,50.00,'{\"onboarding\": true, \"operations\": true}',1,'2026-07-09 08:44:28'),('SYSTEM_PLAN','Platform Admin Plan',0.00,'MONTHLY',99,999,1000.00,'{}',1,'2026-07-09 08:44:28');
/*!40000 ALTER TABLE `plan_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_step_master`
--

DROP TABLE IF EXISTS `setup_step_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_step_master` (
  `step_id` varchar(36) NOT NULL,
  `step_code` varchar(50) NOT NULL,
  `step_name` varchar(100) NOT NULL,
  `step_description` text,
  `step_order` int NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `step_category` varchar(30) NOT NULL,
  `estimated_minutes` int DEFAULT NULL,
  `help_url` varchar(300) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `setup_step_master_step_code_unique` (`step_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_step_master`
--

LOCK TABLES `setup_step_master` WRITE;
/*!40000 ALTER TABLE `setup_step_master` DISABLE KEYS */;
INSERT INTO `setup_step_master` VALUES ('30000000-3000-3000-3000-000000000001','COMPANY_PROFILE','Company profile',NULL,1,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000002','ADDRESS','Address & farm location',NULL,2,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000003','KEY_CONTACTS','Primary contacts',NULL,3,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000004','DEFAULT_LANGUAGE','Language',NULL,4,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000005','BASE_CURRENCY','Base currency',NULL,5,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000006','TIMEZONE','Timezone & region',NULL,6,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000007','FISCAL_YEAR','Fiscal & accounting',NULL,7,1,'FINANCE',NULL,NULL,1),('30000000-3000-3000-3000-000000000008','ENABLE_MODULES','Enable modules',NULL,8,1,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000009','ADMIN_USER','Administrator account',NULL,9,1,'SECURITY',NULL,NULL,1),('30000000-3000-3000-3000-000000000010','TEAM_MEMBERS','Users & roles',NULL,10,0,'SECURITY',NULL,NULL,1),('30000000-3000-3000-3000-000000000011','CHART_OF_ACCOUNTS','GL mapping',NULL,11,0,'FINANCE',NULL,NULL,1),('30000000-3000-3000-3000-000000000012','NOB_LOB_CONFIG','NOB & LOB configuration',NULL,12,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000013','MASTER_DATA_LOAD','Master data',NULL,13,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000014','NOTIFICATION_SETTINGS','Notifications',NULL,14,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000015','SETUP_COMPLETE','Setup complete',NULL,15,0,'CONFIGURATION',NULL,NULL,1);
/*!40000 ALTER TABLE `setup_step_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_master`
--

DROP TABLE IF EXISTS `tenant_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_master` (
  `tenant_id` varchar(36) NOT NULL,
  `tenant_code` varchar(20) NOT NULL,
  `tenant_name` varchar(200) NOT NULL,
  `tenant_type` varchar(20) DEFAULT NULL,
  `plan_id` varchar(30) DEFAULT NULL,
  `plan_start_date` date NOT NULL,
  `plan_end_date` date DEFAULT NULL,
  `billing_cycle` varchar(20) DEFAULT NULL,
  `billing_email` varchar(200) NOT NULL,
  `billing_currency_id` varchar(36) DEFAULT NULL,
  `max_companies` int NOT NULL DEFAULT '1',
  `max_users` int NOT NULL DEFAULT '5',
  `max_batches_per_month` int DEFAULT NULL,
  `api_rate_limit` int NOT NULL DEFAULT '1000',
  `is_trial` tinyint(1) NOT NULL DEFAULT '0',
  `trial_end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `db_host` varchar(100) NOT NULL DEFAULT 'localhost',
  `db_port` int NOT NULL DEFAULT '3306',
  `db_name` varchar(100) NOT NULL,
  `db_user` varchar(100) NOT NULL DEFAULT 'root',
  `db_password` varchar(200) NOT NULL DEFAULT '',
  `allowed_nob_ids` json DEFAULT NULL,
  `allowed_lob_ids` json DEFAULT NULL,
  PRIMARY KEY (`tenant_id`),
  UNIQUE KEY `tenant_master_tenant_code_unique` (`tenant_code`),
  KEY `tenant_master_plan_id_plan_master_plan_id_fk` (`plan_id`),
  CONSTRAINT `tenant_master_plan_id_plan_master_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan_master` (`plan_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_master`
--

LOCK TABLES `tenant_master` WRITE;
/*!40000 ALTER TABLE `tenant_master` DISABLE KEYS */;
INSERT INTO `tenant_master` VALUES ('00000000-0000-0000-0000-000000000000','system','NAVFarm Platform Administration','ENTERPRISE','PLAN_ENTERPRISE','2026-01-01',NULL,'MONTHLY','admin@navfarm.local',NULL,10,100,NULL,5000,0,NULL,1,'2026-07-09 08:44:29','localhost',3306,'tenant_system','root','',NULL,NULL),('3e6adab1-c6c5-4114-be76-9d1239e481d6','green','blue','SME','PLAN_ENTERPRISE','2026-07-09',NULL,'MONTHLY','risgur00@gmail.com',NULL,10,100,NULL,5000,0,NULL,1,'2026-07-09 08:51:51','localhost',3306,'tenant_geern','root','','[\"11111111-1111-1111-1111-111111111111\"]','[\"6666f388-5a7e-481f-8dc8-08ebdced12a0\", \"07b2de20-a304-4b53-b4eb-0e41123a91db\", \"9f858f70-44bc-4503-8153-9d9c3bbc0ac1\", \"34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d\", \"528eb1ac-461d-428c-910f-f48eccd30bbc\"]'),('e6e465fc-b76b-4fbc-9a27-626696c6c607','goon','gooner','SME','PLAN_ENTERPRISE','2026-07-23',NULL,'ANNUAL','admin@goon.com',NULL,100,1000,NULL,5000,0,NULL,1,'2026-07-23 05:53:04','localhost',3306,'tenant_goon','root','','[\"11111111-1111-1111-1111-111111111111\", \"22222222-2222-2222-2222-222222222222\", \"33333333-3333-3333-3333-333333333333\"]','[\"6666f388-5a7e-481f-8dc8-08ebdced12a0\", \"07b2de20-a304-4b53-b4eb-0e41123a91db\", \"9f858f70-44bc-4503-8153-9d9c3bbc0ac1\", \"34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d\", \"528eb1ac-461d-428c-910f-f48eccd30bbc\", \"7a763d80-da73-4c38-a5be-1868c6ce611c\", \"ecb38d4e-5de8-42ed-8c5d-7f3555aee967\", \"2a362ff0-798c-4727-97b8-d6e8abb9788d\", \"3533f9ef-57dc-41ce-8cce-37285867c675\", \"60000000-6000-6000-6000-000000000008\", \"4ef5479e-e5cd-4307-b60c-fb5c5ea5faca\", \"e8f2e5ef-0522-4639-8ab5-a23d172dfcce\", \"86b60d9b-504d-4ed5-b83b-52a2da8e7491\", \"9a576d2b-5063-43f6-8e74-1f13cd15cbc8\"]');
/*!40000 ALTER TABLE `tenant_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_subscription`
--

DROP TABLE IF EXISTS `tenant_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_subscription` (
  `sub_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `plan_code` varchar(30) NOT NULL,
  `feature_flags` json DEFAULT NULL,
  `storage_limit_gb` decimal(8,2) NOT NULL DEFAULT '5.00',
  `support_tier` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `sla_uptime_pct` decimal(5,2) NOT NULL DEFAULT '99.50',
  `renewal_auto` tinyint(1) NOT NULL DEFAULT '1',
  `payment_method` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`sub_id`),
  UNIQUE KEY `tenant_subscription_tenant_id_unique` (`tenant_id`),
  KEY `tenant_subscription_plan_code_plan_master_plan_id_fk` (`plan_code`),
  CONSTRAINT `tenant_subscription_plan_code_plan_master_plan_id_fk` FOREIGN KEY (`plan_code`) REFERENCES `plan_master` (`plan_id`) ON DELETE RESTRICT,
  CONSTRAINT `tenant_subscription_tenant_id_tenant_master_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master` (`tenant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_subscription`
--

LOCK TABLES `tenant_subscription` WRITE;
/*!40000 ALTER TABLE `tenant_subscription` DISABLE KEYS */;
INSERT INTO `tenant_subscription` VALUES ('5e5cc3a6-e418-410e-af3a-840c6e27a51d','e6e465fc-b76b-4fbc-9a27-626696c6c607','PLAN_ENTERPRISE','{\"enterprise\": true, \"onboarding\": true, \"operations\": true}',500.00,'PREMIUM',99.90,1,NULL,1),('63b3e829-25d1-4a3e-bf36-68387c39608f','3e6adab1-c6c5-4114-be76-9d1239e481d6','PLAN_ENTERPRISE','{\"api_access\": true, \"qr_traceability\": true}',100.00,'PREMIUM',99.90,1,NULL,1),('d0b8bd73-c663-4a1a-9135-1b303862cdfb','00000000-0000-0000-0000-000000000000','PLAN_ENTERPRISE','{\"api_access\": true, \"qr_traceability\": true}',100.00,'PREMIUM',99.90,1,NULL,1);
/*!40000 ALTER TABLE `tenant_subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `tenant_system`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `tenant_system` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `tenant_system`;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'4bf53d05ae92af32b6ff5f5b7c733dca1ac38d47cf1657b0035baadf39d0349e',1783337224502),(2,'353a24da9a4f2ffdce6d575c3190183482f3048451a16e5e562ebfe8f4698260',1784632896759),(3,'fccfd3e081ad3f7b33ed8023e5684ecf5e46254fb1c4155f1fe2285bd15575c6',1784632922781);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`audit_id`),
  KEY `audit_log_company_id_company_master_company_id_fk` (`company_id`),
  KEY `audit_log_user_id_user_master_user_id_fk` (`user_id`),
  CONSTRAINT `audit_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `audit_log_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES ('0095e6d3-1047-4b13-ad0d-5548163f00d9','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:25:38'),('03f9b73b-1c44-4fed-b449-e28083a47ca2','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:32:07'),('0f77e56d-0393-485a-9035-c36a1fe4c72e','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:32:21'),('1c3f657d-c73c-4593-be0d-cb78cafe510b','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-23 07:38:34'),('233f4839-5a60-4294-ad2d-617a4e83368f','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:12:48'),('2d8d076a-02ac-443e-9032-dd433eccddc1','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-09 08:46:26'),('36c44bbe-44e8-4e81-a807-71e5ebee6d56','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 12:00:07'),('59c13d3f-b727-46ae-82a9-ab46886c84f5','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:15:41'),('5ba37069-d6bf-4eaa-94eb-8b7e7d13a417','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-09 08:58:05'),('633f9cc1-1f7e-488b-b5d1-cfb714caa864','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-09 08:49:05'),('66063e75-0267-4c1d-b820-86f8e73eb2f2','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:15:16'),('6818ffea-968c-4063-b815-e07d49cb8347','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:15:16'),('6981b0f8-894f-482a-8451-55445cb6fdcc','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-09 08:46:17'),('7af0a84a-abec-453a-97db-d836aa61aef8','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:26:26'),('7d8ab3bf-20e1-4d96-8878-060f8bae74ed','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 11:35:23'),('89e883ee-ca47-4b64-b030-667ab24aafaf','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 06:43:31'),('9f8ca7e5-2b38-464b-bd4c-2e0edd58c154','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-23 05:50:48'),('a0dab791-9d36-4a71-98a8-e43672aca388','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-09 08:48:38'),('a957a4a4-5f1b-4333-8e72-ad23531cd9e9','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-23 06:39:21'),('ad0225f4-e405-4d77-9358-e383a0e86d0e','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:34:31'),('af45fa74-a365-48ec-8184-4e502515291e','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-09 09:03:16'),('b25d6899-3b29-4448-80f5-e611e4a4f59b','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:27:56'),('d1c35aef-3d22-496c-9e3e-503441c99770','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:44:32'),('d935c45e-3bb1-4502-b265-e73541ffbb18','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','LOGIN','USER','00000000-0000-0000-0000-000000000001',NULL,NULL,NULL,NULL,'2026-07-20 07:29:47'),('f6572d94-d25e-4fa0-a980-181a00915b7e','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 06:43:11'),('f8727c8e-badd-4329-8b96-62e465aa513d','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 11:34:06'),('fbfb430d-b7b6-4937-9d51-987bd072a86a','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 11:49:31'),('ff9764f0-8c21-46e3-8548-daaf778e7e4f','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','a636ee78-76dc-494f-871c-ad0a1352a9b6','LOGIN','USER','a636ee78-76dc-494f-871c-ad0a1352a9b6',NULL,NULL,NULL,NULL,'2026-07-21 11:30:37');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `breed_master`
--

DROP TABLE IF EXISTS `breed_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `breed_master` (
  `breed_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `breed_code` varchar(50) NOT NULL,
  `breed_name` varchar(100) NOT NULL,
  `species` varchar(100) NOT NULL,
  `breed_type` varchar(50) NOT NULL,
  `avg_growth_rate_g_day` decimal(10,4) DEFAULT NULL,
  `avg_fcr` decimal(8,4) DEFAULT NULL,
  `avg_mortality_pct` decimal(6,2) DEFAULT NULL,
  `avg_lay_rate_pct` decimal(6,2) DEFAULT NULL,
  `incubation_days` int DEFAULT NULL,
  `gestation_days` int DEFAULT NULL,
  `avg_litter_size` decimal(6,2) DEFAULT NULL,
  `mature_age_months` int DEFAULT NULL,
  `productive_life_months` int DEFAULT NULL,
  `premature_years` decimal(5,2) DEFAULT NULL,
  `avg_yield_per_unit` decimal(10,4) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`breed_id`),
  KEY `breed_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `breed_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `breed_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `breed_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `breed_master`
--

LOCK TABLES `breed_master` WRITE;
/*!40000 ALTER TABLE `breed_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `breed_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_address`
--

DROP TABLE IF EXISTS `company_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_address` (
  `address_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `address_type` varchar(30) NOT NULL DEFAULT 'REGISTERED',
  `address_label` varchar(100) DEFAULT NULL,
  `line1` varchar(200) NOT NULL,
  `line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state_id` varchar(36) NOT NULL,
  `country_id` varchar(36) NOT NULL,
  `pincode` varchar(20) NOT NULL,
  `gps_latitude` decimal(10,6) DEFAULT NULL,
  `gps_longitude` decimal(10,6) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`address_id`),
  KEY `company_address_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_address_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_address`
--

LOCK TABLES `company_address` WRITE;
/*!40000 ALTER TABLE `company_address` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_contacts`
--

DROP TABLE IF EXISTS `company_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_contacts` (
  `contact_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `contact_type` varchar(30) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `phone_primary` varchar(30) DEFAULT NULL,
  `phone_secondary` varchar(30) DEFAULT NULL,
  `receives_alerts` tinyint(1) NOT NULL DEFAULT '0',
  `receives_reports` tinyint(1) NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`contact_id`),
  KEY `company_contacts_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_contacts_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_contacts`
--

LOCK TABLES `company_contacts` WRITE;
/*!40000 ALTER TABLE `company_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_currency_config`
--

DROP TABLE IF EXISTS `company_currency_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_currency_config` (
  `curr_config_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `currency_id` varchar(36) NOT NULL,
  `is_base` tinyint(1) NOT NULL DEFAULT '0',
  `is_reporting` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`curr_config_id`),
  KEY `company_currency_config_company_id_company_master_company_id_fk` (`company_id`),
  KEY `comp_curr_config_curr_id_fk` (`currency_id`),
  CONSTRAINT `comp_curr_config_curr_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE RESTRICT,
  CONSTRAINT `company_currency_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_currency_config`
--

LOCK TABLES `company_currency_config` WRITE;
/*!40000 ALTER TABLE `company_currency_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_currency_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_fiscal`
--

DROP TABLE IF EXISTS `company_fiscal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_fiscal` (
  `fiscal_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `fiscal_year_format` varchar(20) NOT NULL DEFAULT 'FY APR MAR',
  `fiscal_start_month` int NOT NULL DEFAULT '4',
  `fiscal_start_day` int NOT NULL DEFAULT '1',
  `current_fiscal_year` varchar(20) NOT NULL,
  `period_type` varchar(20) NOT NULL DEFAULT 'MONTHLY',
  `accounting_standard` varchar(20) NOT NULL DEFAULT 'IND AS',
  `depreciation_method` varchar(30) NOT NULL DEFAULT 'SLM',
  `inventory_valuation` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `gst_filing_frequency` varchar(20) DEFAULT NULL,
  `tax_audit_applicable` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `fiscal_end_day` int NOT NULL DEFAULT '31',
  `decimal_places` int NOT NULL DEFAULT '2',
  PRIMARY KEY (`fiscal_id`),
  UNIQUE KEY `company_fiscal_company_id_unique` (`company_id`),
  CONSTRAINT `company_fiscal_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_fiscal`
--

LOCK TABLES `company_fiscal` WRITE;
/*!40000 ALTER TABLE `company_fiscal` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_fiscal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_language_config`
--

DROP TABLE IF EXISTS `company_language_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_language_config` (
  `config_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `set_by` varchar(36) DEFAULT NULL,
  `set_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`config_id`),
  KEY `company_language_config_company_id_company_master_company_id_fk` (`company_id`),
  KEY `company_language_config_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `company_language_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `company_language_config_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_language_config`
--

LOCK TABLES `company_language_config` WRITE;
/*!40000 ALTER TABLE `company_language_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_language_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_master`
--

DROP TABLE IF EXISTS `company_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_master` (
  `company_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_code` varchar(20) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `company_display_name` varchar(100) DEFAULT NULL,
  `company_type` varchar(30) NOT NULL,
  `industry_type` varchar(30) NOT NULL,
  `registration_no` varchar(100) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `tax_regime` varchar(20) DEFAULT 'STANDARD',
  `incorporation_date` date DEFAULT NULL,
  `financial_year_start` int NOT NULL DEFAULT '4',
  `base_currency_id` varchar(36) NOT NULL,
  `default_language_id` varchar(36) NOT NULL,
  `default_timezone_id` varchar(100) NOT NULL,
  `country_id` varchar(36) NOT NULL,
  `company_logo_url` varchar(500) DEFAULT NULL,
  `company_logo_dark_url` varchar(500) DEFAULT NULL,
  `primary_color_hex` varchar(7) NOT NULL DEFAULT '#1F4E79',
  `website` varchar(300) DEFAULT NULL,
  `email_domain` varchar(100) DEFAULT NULL,
  `support_email` varchar(200) DEFAULT NULL,
  `phone_primary` varchar(30) DEFAULT NULL,
  `is_multi_farm` tinyint(1) NOT NULL DEFAULT '0',
  `max_farm_locations` int NOT NULL DEFAULT '1',
  `onboarding_status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `created_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_master`
--

LOCK TABLES `company_master` WRITE;
/*!40000 ALTER TABLE `company_master` DISABLE KEYS */;
INSERT INTO `company_master` VALUES ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','NAV_SYSTEM','NAVFarm Platform Administration',NULL,'Pvt Ltd','Platform Admin',NULL,NULL,'STANDARD',NULL,4,'20000000-2000-2000-2000-200000000001','10000000-1000-1000-1000-100000000001','UTC','40000000-4000-4000-4000-400000000001',NULL,NULL,'#1F4E79',NULL,NULL,NULL,NULL,0,1,'COMPLETED',1,'2026-07-09 08:44:29',NULL,'2026-07-09 08:44:29',NULL);
/*!40000 ALTER TABLE `company_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_modules`
--

DROP TABLE IF EXISTS `company_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_modules` (
  `module_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `activated_on` date DEFAULT NULL,
  `activated_by` varchar(36) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `config_json` json DEFAULT NULL,
  PRIMARY KEY (`module_id`),
  KEY `company_modules_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_modules_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_modules`
--

LOCK TABLES `company_modules` WRITE;
/*!40000 ALTER TABLE `company_modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_master`
--

DROP TABLE IF EXISTS `currency_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_master` (
  `currency_id` varchar(36) NOT NULL,
  `iso_code` char(3) NOT NULL,
  `currency_name` varchar(100) NOT NULL,
  `symbol` varchar(5) NOT NULL,
  `symbol_position` varchar(10) NOT NULL DEFAULT 'PREFIX',
  `decimal_places` int NOT NULL DEFAULT '2',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `currency_master_iso_code_unique` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_master`
--

LOCK TABLES `currency_master` WRITE;
/*!40000 ALTER TABLE `currency_master` DISABLE KEYS */;
INSERT INTO `currency_master` VALUES ('20000000-2000-2000-2000-200000000001','INR','Indian Rupee','₹','PREFIX',2,1,1),('20000000-2000-2000-2000-200000000002','USD','US Dollar','$','PREFIX',2,0,1),('20000000-2000-2000-2000-200000000003','EUR','Euro','€','PREFIX',2,0,1);
/*!40000 ALTER TABLE `currency_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rate`
--

DROP TABLE IF EXISTS `exchange_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_rate` (
  `rate_id` varchar(36) NOT NULL,
  `from_currency_id` varchar(36) NOT NULL,
  `to_currency_id` varchar(36) NOT NULL,
  `rate` decimal(18,6) NOT NULL,
  `rate_date` date NOT NULL,
  `rate_source` varchar(30) NOT NULL DEFAULT 'MANUAL',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`rate_id`),
  KEY `exchange_rate_from_currency_id_currency_master_currency_id_fk` (`from_currency_id`),
  KEY `exchange_rate_to_currency_id_currency_master_currency_id_fk` (`to_currency_id`),
  CONSTRAINT `exchange_rate_from_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`from_currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE CASCADE,
  CONSTRAINT `exchange_rate_to_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`to_currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rate`
--

LOCK TABLES `exchange_rate` WRITE;
/*!40000 ALTER TABLE `exchange_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_attribute_master`
--

DROP TABLE IF EXISTS `item_attribute_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_attribute_master` (
  `attribute_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `attribute_code` varchar(50) NOT NULL,
  `attribute_name` varchar(100) NOT NULL,
  `data_type` varchar(20) NOT NULL,
  `list_values` json DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `affects_costing` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_variant` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`attribute_id`),
  KEY `item_attribute_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `item_attribute_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `item_attribute_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE CASCADE,
  CONSTRAINT `item_attribute_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_attribute_master`
--

LOCK TABLES `item_attribute_master` WRITE;
/*!40000 ALTER TABLE `item_attribute_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_attribute_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_attribute_values`
--

DROP TABLE IF EXISTS `item_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_attribute_values` (
  `value_id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `attribute_id` varchar(36) NOT NULL,
  `attribute_value` text NOT NULL,
  PRIMARY KEY (`value_id`),
  KEY `item_attribute_values_item_id_item_master_item_id_fk` (`item_id`),
  KEY `item_attr_vals_attr_id_fk` (`attribute_id`),
  CONSTRAINT `item_attr_vals_attr_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `item_attribute_master` (`attribute_id`) ON DELETE RESTRICT,
  CONSTRAINT `item_attribute_values_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_attribute_values`
--

LOCK TABLES `item_attribute_values` WRITE;
/*!40000 ALTER TABLE `item_attribute_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_master`
--

DROP TABLE IF EXISTS `item_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_master` (
  `item_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `item_type` varchar(30) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `uom_primary` varchar(20) NOT NULL,
  `uom_secondary` varchar(20) DEFAULT NULL,
  `uom_conversion_factor` decimal(18,6) DEFAULT NULL,
  `valuation_method` varchar(20) DEFAULT NULL,
  `standard_cost` decimal(18,6) DEFAULT NULL,
  `is_lot_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `is_serial_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `is_biological_asset` tinyint(1) NOT NULL DEFAULT '0',
  `is_biological_costing_method` varchar(30) DEFAULT NULL,
  `is_inventoriable` tinyint(1) NOT NULL DEFAULT '1',
  `min_stock_level` decimal(18,4) DEFAULT NULL,
  `max_stock_level` decimal(18,4) DEFAULT NULL,
  `reorder_level` decimal(18,4) DEFAULT NULL,
  `shelf_life_days` int DEFAULT NULL,
  `storage_temp_min` decimal(6,2) DEFAULT NULL,
  `storage_temp_max` decimal(6,2) DEFAULT NULL,
  `is_qr_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `qr_trigger_event` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`item_id`),
  KEY `item_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `item_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `item_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `item_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_master`
--

LOCK TABLES `item_master` WRITE;
/*!40000 ALTER TABLE `item_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_master`
--

DROP TABLE IF EXISTS `language_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_master` (
  `lang_id` varchar(36) NOT NULL,
  `lang_code` varchar(10) NOT NULL,
  `lang_name_english` varchar(100) NOT NULL,
  `lang_name_native` varchar(100) NOT NULL,
  `script` varchar(30) NOT NULL,
  `is_rtl` tinyint(1) NOT NULL DEFAULT '0',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `translation_coverage_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `date_format` varchar(30) NOT NULL DEFAULT 'DD/MM/YYYY',
  `number_format` varchar(20) NOT NULL DEFAULT 'IN',
  `decimal_separator` char(1) NOT NULL DEFAULT '.',
  `thousands_separator` char(1) NOT NULL DEFAULT ',',
  `flag_emoji` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`lang_id`),
  UNIQUE KEY `language_master_lang_code_unique` (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_master`
--

LOCK TABLES `language_master` WRITE;
/*!40000 ALTER TABLE `language_master` DISABLE KEYS */;
INSERT INTO `language_master` VALUES ('10000000-1000-1000-1000-100000000001','en','English','English','Latin',0,1,1,100.00,'DD/MM/YYYY','IN','.',',','🇬🇧'),('10000000-1000-1000-1000-100000000002','hi','Hindi','हिन्दी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',','🇮🇳'),('10000000-1000-1000-1000-100000000003','mr','Marathi','मराठी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000004','es','Spanish','Español','Latin',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000005','fr','French','Français','Latin',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000006','bn','Bengali','বাংলা','Bengali',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000007','te','Telugu','తెలుగు','Telugu',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000008','ta','Tamil','தமிழ்','Tamil',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL);
/*!40000 ALTER TABLE `language_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_translations`
--

DROP TABLE IF EXISTS `language_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_translations` (
  `trans_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `translation_key` varchar(200) NOT NULL,
  `translation_value` text NOT NULL,
  `is_html` tinyint(1) NOT NULL DEFAULT '0',
  `is_auto_translated` tinyint(1) NOT NULL DEFAULT '0',
  `verified_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`trans_id`),
  KEY `language_translations_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `language_translations_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_translations`
--

LOCK TABLES `language_translations` WRITE;
/*!40000 ALTER TABLE `language_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `language_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lob_master`
--

DROP TABLE IF EXISTS `lob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lob_master` (
  `lob_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_code` varchar(50) NOT NULL,
  `lob_name` varchar(100) NOT NULL,
  `costing_method_allowed` varchar(100) NOT NULL,
  `qc_required` varchar(10) NOT NULL DEFAULT 'NO',
  `qr_required` varchar(10) NOT NULL DEFAULT 'NO',
  `batch_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `scheduler_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `traceability_required` varchar(10) NOT NULL DEFAULT 'YES',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`lob_id`),
  UNIQUE KEY `lob_master_lob_code_unique` (`lob_code`),
  KEY `lob_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  CONSTRAINT `lob_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lob_master`
--

LOCK TABLES `lob_master` WRITE;
/*!40000 ALTER TABLE `lob_master` DISABLE KEYS */;
INSERT INTO `lob_master` VALUES ('07b2de20-a304-4b53-b4eb-0e41123a91db','11111111-1111-1111-1111-111111111111','PLT_LAYING','Laying','STANDARD,FIFO','YES','YES','YES','YES','YES','Laying hens producing eggs',2,1,1,NULL,NULL,NULL),('2a362ff0-798c-4727-97b8-d6e8abb9788d','22222222-2222-2222-2222-222222222222','LVS_PIGGERY','Piggery','BIO_ASSET,STANDARD','YES','YES','YES','YES','YES','Piggery rearing and growout',7,1,1,NULL,NULL,NULL),('2ad69bb6-b984-4728-8a89-3424f116670a','55555555-5555-5555-5555-555555555555','INS_BEE','Bee Keeping','STANDARD','YES','YES','YES','YES','YES','Honey apiaries',14,1,1,NULL,NULL,NULL),('2dfab306-9ab7-47c4-867a-0c0d2cbcdcee','44444444-4444-4444-4444-444444444444','AQA_SLAUGHTER','Aquaculture Slaughter','STANDARD','YES','YES','YES','YES','YES','Aqua filleting and processing',13,1,1,NULL,NULL,NULL),('34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d','11111111-1111-1111-1111-111111111111','PLT_CB','Commercial Broiler Farming','STANDARD','YES','YES','YES','YES','YES','Commercial broiler batch growout',4,1,1,NULL,NULL,NULL),('3533f9ef-57dc-41ce-8cce-37285867c675','22222222-2222-2222-2222-222222222222','LVS_SLAUGHTER','Livestock Slaughtering','STANDARD,FIFO,AVG','YES','YES','YES','YES','YES','Slaughter line',8,1,1,NULL,NULL,NULL),('43b11b0b-b76d-4bf0-a21f-b5ebadbd4c2e','66666666-6666-6666-6666-666666666666','FEED_PROD','Feed Production','STANDARD','YES','YES','YES','YES','YES','Feed Mill compounding',16,1,1,NULL,NULL,NULL),('4ef5479e-e5cd-4307-b60c-fb5c5ea5faca','33333333-3333-3333-3333-333333333333','AGRI_FRUIT','Fruit Farming','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Bearer plants orchard management',9,1,1,NULL,NULL,NULL),('528eb1ac-461d-428c-910f-f48eccd30bbc','11111111-1111-1111-1111-111111111111','PLT_SLAUGHTER','Poultry Slaughter','STANDARD','YES','YES','YES','YES','YES','Processing line and joint cost splits',5,1,1,NULL,NULL,NULL),('60000000-6000-6000-6000-000000000008','22222222-2222-2222-2222-222222222222','LVS_GOAT_SHEEP','Goat & Sheep','BIO_ASSET','YES','YES','NO','NO','YES',NULL,8,1,1,NULL,NULL,NULL),('60000000-6000-6000-6000-000000000015','55555555-5555-5555-5555-555555555555','BSF','Black Soldier Fly','STANDARD','YES','YES','NO','NO','YES',NULL,15,1,1,NULL,NULL,NULL),('6666f388-5a7e-481f-8dc8-08ebdced12a0','11111111-1111-1111-1111-111111111111','PLT_REARING','Rearing & Breeding','STANDARD,FIFO','NO','NO','YES','YES','YES','Rearing and breeding layer/breeder parent flocks',1,1,1,NULL,NULL,NULL),('7a763d80-da73-4c38-a5be-1868c6ce611c','22222222-2222-2222-2222-222222222222','LVS_MILKING','Dairy','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Milking operations',6,1,1,NULL,NULL,NULL),('86b60d9b-504d-4ed5-b83b-52a2da8e7491','33333333-3333-3333-3333-333333333333','AGRI_SEEDS','Seed Processing','STANDARD','YES','YES','YES','YES','YES','Seeds processing',11,1,1,NULL,NULL,NULL),('9a576d2b-5063-43f6-8e74-1f13cd15cbc8','33333333-3333-3333-3333-333333333333','AGRI_FLOWER','Flower Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Flower harvest stems',12,1,1,NULL,NULL,NULL),('9f858f70-44bc-4503-8153-9d9c3bbc0ac1','11111111-1111-1111-1111-111111111111','PLT_HATCHING','Hatching','STANDARD,FIFO','YES','YES','YES','YES','YES','Incubator & hatching operations',3,1,1,NULL,NULL,NULL),('d6ff6308-ea1b-4ee8-b036-d513779a366d','44444444-4444-4444-4444-444444444444','AQA_FISH','Fish Farming','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Fish ponds growout',12,1,1,NULL,NULL,NULL),('e8f2e5ef-0522-4639-8ab5-a23d172dfcce','33333333-3333-3333-3333-333333333333','AGRI_CROP','Crop Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Seasonal grain / crop batch',10,1,1,NULL,NULL,NULL),('ecb38d4e-5de8-42ed-8c5d-7f3555aee967','22222222-2222-2222-2222-222222222222','LVS_BREEDING','Livestock Breeding','STANDARD,FIFO,BIO_ASSET,AVG','YES','NO','YES','YES','YES','Breeding livestock herds',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `lob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_master`
--

DROP TABLE IF EXISTS `location_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_master` (
  `location_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `location_code` varchar(50) NOT NULL,
  `location_name` varchar(200) NOT NULL,
  `location_level` int NOT NULL,
  `location_type` varchar(50) NOT NULL,
  `parent_location_id` varchar(36) DEFAULT NULL,
  `area_size` decimal(18,4) DEFAULT NULL,
  `area_unit` varchar(10) DEFAULT NULL,
  `max_capacity` decimal(18,4) DEFAULT NULL,
  `capacity_uom` varchar(20) DEFAULT NULL,
  `current_count` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `gps_latitude` decimal(10,8) DEFAULT NULL,
  `gps_longitude` decimal(11,8) DEFAULT NULL,
  `storage_type` varchar(30) DEFAULT NULL,
  `is_quarantine_zone` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `location_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `location_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  KEY `loc_master_parent_loc_id_fk` (`parent_location_id`),
  CONSTRAINT `loc_master_parent_loc_id_fk` FOREIGN KEY (`parent_location_id`) REFERENCES `location_master` (`location_id`) ON DELETE RESTRICT,
  CONSTRAINT `location_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `location_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_master`
--

LOCK TABLES `location_master` WRITE;
/*!40000 ALTER TABLE `location_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `location_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_lob_extension_config`
--

DROP TABLE IF EXISTS `nob_lob_extension_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_lob_extension_config` (
  `config_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` varchar(200) NOT NULL,
  `data_type` varchar(30) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`config_id`),
  KEY `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE CASCADE,
  CONSTRAINT `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_lob_extension_config`
--

LOCK TABLES `nob_lob_extension_config` WRITE;
/*!40000 ALTER TABLE `nob_lob_extension_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `nob_lob_extension_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_master`
--

DROP TABLE IF EXISTS `nob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_master` (
  `nob_id` varchar(36) NOT NULL,
  `nob_code` varchar(50) NOT NULL,
  `nob_name` varchar(100) NOT NULL,
  `default_costing_method` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`nob_id`),
  UNIQUE KEY `nob_master_nob_code_unique` (`nob_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_master`
--

LOCK TABLES `nob_master` WRITE;
/*!40000 ALTER TABLE `nob_master` DISABLE KEYS */;
INSERT INTO `nob_master` VALUES ('11111111-1111-1111-1111-111111111111','POULTRY','Poultry','STANDARD','Birds - broiler, layer, breeder, hatchery',1,1,1,NULL,NULL,NULL),('22222222-2222-2222-2222-222222222222','LIVESTOCK','Livestock','BIO_ASSET','Animals - cattle, piggery, goat, sheep',2,1,1,NULL,NULL,NULL),('33333333-3333-3333-3333-333333333333','AGRI','Agriculture','STANDARD','Crops, fruits, flowers, seeds',3,1,1,NULL,NULL,NULL),('44444444-4444-4444-4444-444444444444','AQUA','Aquaculture','BIO_ASSET','Fish, shrimp, other aquatic',4,1,1,NULL,NULL,NULL),('55555555-5555-5555-5555-555555555555','INSECT','Insect Farming','STANDARD','Bee keeping, black soldier fly',5,1,1,NULL,NULL,NULL),('66666666-6666-6666-6666-666666666666','PRODUCTION','Feed & Processing','STANDARD','Feed mill, processing plant',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `nob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_config`
--

DROP TABLE IF EXISTS `notification_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_config` (
  `notif_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `channel` varchar(20) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `smtp_host` varchar(200) DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_user` varchar(200) DEFAULT NULL,
  `smtp_password_enc` text,
  `from_email` varchar(200) DEFAULT NULL,
  `from_name` varchar(100) DEFAULT NULL,
  `sms_provider` varchar(30) DEFAULT NULL,
  `sms_api_key_enc` text,
  `sms_sender_id` varchar(20) DEFAULT NULL,
  `push_fcm_key_enc` text,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_secret_enc` text,
  `test_sent_at` timestamp NULL DEFAULT NULL,
  `test_status` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`notif_id`),
  KEY `notification_config_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `notification_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_config`
--

LOCK TABLES `notification_config` WRITE;
/*!40000 ALTER TABLE `notification_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_log`
--

DROP TABLE IF EXISTS `notification_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_log` (
  `log_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `channel` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `error_message` text,
  `sent_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`log_id`),
  KEY `notification_log_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `notification_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_log`
--

LOCK TABLES `notification_log` WRITE;
/*!40000 ALTER TABLE `notification_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_master`
--

DROP TABLE IF EXISTS `role_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_master` (
  `role_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `role_description` text,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`role_id`),
  KEY `role_master_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `role_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_master`
--

LOCK TABLES `role_master` WRITE;
/*!40000 ALTER TABLE `role_master` DISABLE KEYS */;
INSERT INTO `role_master` VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','SYSTEM_SUPER_ADMIN','System Super Administrator',NULL,1,1);
/*!40000 ALTER TABLE `role_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `perm_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT '0',
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_edit` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  `can_approve` tinyint(1) NOT NULL DEFAULT '0',
  `can_export` tinyint(1) NOT NULL DEFAULT '0',
  `can_print` tinyint(1) NOT NULL DEFAULT '0',
  `field_restrictions` json DEFAULT NULL,
  PRIMARY KEY (`perm_id`),
  KEY `role_permissions_role_id_role_master_role_id_fk` (`role_id`),
  CONSTRAINT `role_permissions_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`role_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('3c478c63-5052-4fc7-9726-c1dd4d2a1ea2','00000000-0000-0000-0000-000000000002','ALL','ALL',1,1,1,1,1,1,1,NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_step_master`
--

DROP TABLE IF EXISTS `setup_step_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_step_master` (
  `step_id` varchar(36) NOT NULL,
  `step_code` varchar(50) NOT NULL,
  `step_name` varchar(100) NOT NULL,
  `step_description` text,
  `step_order` int NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `step_category` varchar(30) NOT NULL,
  `estimated_minutes` int DEFAULT NULL,
  `help_url` varchar(300) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `setup_step_master_step_code_unique` (`step_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_step_master`
--

LOCK TABLES `setup_step_master` WRITE;
/*!40000 ALTER TABLE `setup_step_master` DISABLE KEYS */;
INSERT INTO `setup_step_master` VALUES ('30000000-3000-3000-3000-000000000001','COMPANY_PROFILE','Company profile',NULL,1,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000002','ADDRESS','Address & farm location',NULL,2,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000003','KEY_CONTACTS','Primary contacts',NULL,3,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000004','DEFAULT_LANGUAGE','Language',NULL,4,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000005','BASE_CURRENCY','Base currency',NULL,5,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000006','TIMEZONE','Timezone & region',NULL,6,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000007','FISCAL_YEAR','Fiscal & accounting',NULL,7,1,'FINANCE',NULL,NULL,1),('30000000-3000-3000-3000-000000000008','ENABLE_MODULES','Enable modules',NULL,8,1,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000009','ADMIN_USER','Administrator account',NULL,9,1,'SECURITY',NULL,NULL,1),('30000000-3000-3000-3000-000000000010','TEAM_MEMBERS','Users & roles',NULL,10,0,'SECURITY',NULL,NULL,1),('30000000-3000-3000-3000-000000000011','CHART_OF_ACCOUNTS','GL mapping',NULL,11,0,'FINANCE',NULL,NULL,1),('30000000-3000-3000-3000-000000000012','NOB_LOB_CONFIG','NOB & LOB configuration',NULL,12,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000013','MASTER_DATA_LOAD','Master data',NULL,13,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000014','NOTIFICATION_SETTINGS','Notifications',NULL,14,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000015','SETUP_COMPLETE','Setup complete',NULL,15,0,'CONFIGURATION',NULL,NULL,1);
/*!40000 ALTER TABLE `setup_step_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_wizard_log`
--

DROP TABLE IF EXISTS `setup_wizard_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_wizard_log` (
  `log_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed_by` varchar(36) DEFAULT NULL,
  `attempt_count` int NOT NULL DEFAULT '0',
  `data_snapshot` json DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`log_id`),
  KEY `setup_wizard_log_company_id_company_master_company_id_fk` (`company_id`),
  KEY `setup_wizard_log_step_id_setup_step_master_step_id_fk` (`step_id`),
  CONSTRAINT `setup_wizard_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `setup_wizard_log_step_id_setup_step_master_step_id_fk` FOREIGN KEY (`step_id`) REFERENCES `setup_step_master` (`step_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_wizard_log`
--

LOCK TABLES `setup_wizard_log` WRITE;
/*!40000 ALTER TABLE `setup_wizard_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `setup_wizard_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom_conversion_master`
--

DROP TABLE IF EXISTS `uom_conversion_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom_conversion_master` (
  `conversion_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `item_id` varchar(36) DEFAULT NULL,
  `from_uom` varchar(20) NOT NULL,
  `to_uom` varchar(20) NOT NULL,
  `conversion_factor` decimal(18,8) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`conversion_id`),
  KEY `uom_conversion_master_item_id_item_master_item_id_fk` (`item_id`),
  CONSTRAINT `uom_conversion_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom_conversion_master`
--

LOCK TABLES `uom_conversion_master` WRITE;
/*!40000 ALTER TABLE `uom_conversion_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `uom_conversion_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom_master`
--

DROP TABLE IF EXISTS `uom_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom_master` (
  `uom_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `uom_code` varchar(20) NOT NULL,
  `uom_name` varchar(100) NOT NULL,
  `uom_type` varchar(20) NOT NULL,
  `decimal_places` int NOT NULL DEFAULT '0',
  `is_base_uom` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`uom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom_master`
--

LOCK TABLES `uom_master` WRITE;
/*!40000 ALTER TABLE `uom_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `uom_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_company_assignments`
--

DROP TABLE IF EXISTS `user_company_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_company_assignments` (
  `assign_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` varchar(36) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`assign_id`),
  UNIQUE KEY `uq_user_company` (`user_id`,`company_id`),
  KEY `user_company_assignments_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `user_company_assignments_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `user_company_assignments_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_company_assignments`
--

LOCK TABLES `user_company_assignments` WRITE;
/*!40000 ALTER TABLE `user_company_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_company_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_language_pref`
--

DROP TABLE IF EXISTS `user_language_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_language_pref` (
  `pref_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `date_format_override` varchar(30) DEFAULT NULL,
  `number_format_override` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`pref_id`),
  KEY `user_language_pref_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `user_language_pref_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_language_pref`
--

LOCK TABLES `user_language_pref` WRITE;
/*!40000 ALTER TABLE `user_language_pref` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_language_pref` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_master`
--

DROP TABLE IF EXISTS `user_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_master` (
  `user_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(200) NOT NULL,
  `auth_provider` varchar(20) NOT NULL DEFAULT 'EMAIL',
  `auth_provider_id` varchar(200) DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `mfa_method` varchar(20) DEFAULT NULL,
  `mfa_secret` varchar(100) DEFAULT NULL,
  `user_type` varchar(20) NOT NULL DEFAULT 'STAFF',
  `employee_id` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `profile_photo_url` varchar(500) DEFAULT NULL,
  `lang_pref_id` varchar(36) DEFAULT NULL,
  `timezone_pref_id` varchar(100) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(50) DEFAULT NULL,
  `failed_login_count` int NOT NULL DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `invited_by` varchar(36) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_master_email_unique` (`email`),
  KEY `user_master_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `user_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_master`
--

LOCK TABLES `user_master` WRITE;
/*!40000 ALTER TABLE `user_master` DISABLE KEYS */;
INSERT INTO `user_master` VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','NAVFarm System Administrator','admin@navfarm.com',NULL,'$2b$10$pn3irgz3xZjy/zgnQAJFyeWnM/6hCwNBtYH7zakaM9z/WwZKh26Ce','EMAIL',NULL,0,NULL,NULL,'SYSTEM_ADMIN',NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-23 02:08:34',NULL,0,NULL,1,'2026-07-09 08:44:29',NULL,NULL,NULL),('a636ee78-76dc-494f-871c-ad0a1352a9b6','00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000','NAVFarm System Administrator','admin@navfarm.local',NULL,'$2b$12$s2yAv9kV0WC3KzoGLF2Coen0gprHxfkKalD9HEZGZJSTTODxD/FV6','EMAIL',NULL,0,NULL,NULL,'SYSTEM_ADMIN',NULL,NULL,NULL,NULL,NULL,'Asia/Kolkata','2026-07-21 06:30:06',NULL,0,NULL,1,'2026-07-21 06:42:01',NULL,NULL,NULL);
/*!40000 ALTER TABLE `user_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role_assignment`
--

DROP TABLE IF EXISTS `user_role_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role_assignment` (
  `assign_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `assigned_by` varchar(36) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT (now()),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`assign_id`),
  KEY `user_role_assignment_user_id_user_master_user_id_fk` (`user_id`),
  KEY `user_role_assignment_role_id_role_master_role_id_fk` (`role_id`),
  CONSTRAINT `user_role_assignment_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`role_id`) ON DELETE RESTRICT,
  CONSTRAINT `user_role_assignment_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role_assignment`
--

LOCK TABLES `user_role_assignment` WRITE;
/*!40000 ALTER TABLE `user_role_assignment` DISABLE KEYS */;
INSERT INTO `user_role_assignment` VALUES ('5db56e95-a7a3-4afe-ab93-eb540445cd5a','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','2026-07-09 08:44:29',NULL,1);
/*!40000 ALTER TABLE `user_role_assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `tenant_goon`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `tenant_goon` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `tenant_goon`;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'baa462c11a1b85362d01ede5ef992ef14e726b4a568c2f3a51c25c01e443ff1c',1783337224502),(2,'353a24da9a4f2ffdce6d575c3190183482f3048451a16e5e562ebfe8f4698260',1784632896759),(3,'fccfd3e081ad3f7b33ed8023e5684ecf5e46254fb1c4155f1fe2285bd15575c6',1784632922781);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`audit_id`),
  KEY `audit_log_company_id_company_master_company_id_fk` (`company_id`),
  KEY `audit_log_user_id_user_master_user_id_fk` (`user_id`),
  CONSTRAINT `audit_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `audit_log_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES ('12fddeb3-d340-4879-be38-3bce9ad194ee','e6e465fc-b76b-4fbc-9a27-626696c6c607','00000000-0000-0000-0000-000000000000','533d0f92-9b35-4888-a051-674ec420d558','LOGIN','USER','533d0f92-9b35-4888-a051-674ec420d558',NULL,NULL,NULL,NULL,'2026-07-23 06:38:50'),('18c9bd76-09c0-4339-9454-69981b8d431a','e6e465fc-b76b-4fbc-9a27-626696c6c607','446ecb6f-1d02-450a-a9f9-e9740f65f311',NULL,'UPDATE_COMPANY','COMPANY','446ecb6f-1d02-450a-a9f9-e9740f65f311',NULL,'{\"tax_id\": \"7621584512\", \"website\": \"\", \"tenant_id\": \"e6e465fc-b76b-4fbc-9a27-626696c6c607\", \"company_id\": \"446ecb6f-1d02-450a-a9f9-e9740f65f311\", \"tax_regime\": \"STANDARD\", \"company_code\": \"MANISH\", \"company_name\": \"Manish private limited\", \"company_type\": \"NGO\", \"email_domain\": \"\", \"industry_type\": \"Poultry Farming\", \"phone_primary\": \"\", \"support_email\": \"\", \"registration_no\": \"86876816412\", \"company_logo_url\": \"/uploads/company-logo-1784803381081-232830259.jpeg\", \"primary_color_hex\": \"#1F4E79\", \"incorporation_date\": \"2017-01-31\", \"company_display_name\": \"Manish private limited\"}',NULL,NULL,'2026-07-23 10:43:32'),('570f8b61-9bd9-41d7-b4c6-ff38179114e8','e6e465fc-b76b-4fbc-9a27-626696c6c607','00000000-0000-0000-0000-000000000000','533d0f92-9b35-4888-a051-674ec420d558','LOGIN','USER','533d0f92-9b35-4888-a051-674ec420d558',NULL,NULL,NULL,NULL,'2026-07-23 07:31:28'),('62a2ce29-f068-4ba6-b0df-2508c720ab99','e6e465fc-b76b-4fbc-9a27-626696c6c607','00000000-0000-0000-0000-000000000000',NULL,'UPDATE_COMPANY','COMPANY','00000000-0000-0000-0000-000000000000',NULL,'{\"tax_id\": \"7575765657\", \"website\": \"\", \"tenant_id\": \"e6e465fc-b76b-4fbc-9a27-626696c6c607\", \"tax_regime\": \"STANDARD\", \"company_code\": \"GOO\", \"company_name\": \"Gooner Ltd\", \"company_type\": \"Pvt Ltd\", \"email_domain\": \"\", \"industry_type\": \"Poultry Farming\", \"phone_primary\": \"\", \"support_email\": \"\", \"registration_no\": \"5476547547664\", \"company_logo_url\": \"/uploads/company-logo-1784791912731-552293673.png\", \"primary_color_hex\": \"#1F4E79\", \"incorporation_date\": \"2006-01-30\", \"company_display_name\": \"Goon\"}',NULL,NULL,'2026-07-23 07:35:46'),('a8ab5b59-174f-4319-95fc-42b4533f0fee','e6e465fc-b76b-4fbc-9a27-626696c6c607','00000000-0000-0000-0000-000000000000','533d0f92-9b35-4888-a051-674ec420d558','LOGIN','USER','533d0f92-9b35-4888-a051-674ec420d558',NULL,NULL,NULL,NULL,'2026-07-23 05:53:18'),('cee2e74b-a84e-493a-b714-29fb43377577','e6e465fc-b76b-4fbc-9a27-626696c6c607','00000000-0000-0000-0000-000000000000','533d0f92-9b35-4888-a051-674ec420d558','LOGIN','USER','533d0f92-9b35-4888-a051-674ec420d558',NULL,NULL,NULL,NULL,'2026-07-23 07:39:17');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `breed_master`
--

DROP TABLE IF EXISTS `breed_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `breed_master` (
  `breed_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `breed_code` varchar(50) NOT NULL,
  `breed_name` varchar(100) NOT NULL,
  `species` varchar(100) NOT NULL,
  `breed_type` varchar(50) NOT NULL,
  `avg_growth_rate_g_day` decimal(10,4) DEFAULT NULL,
  `avg_fcr` decimal(8,4) DEFAULT NULL,
  `avg_mortality_pct` decimal(6,2) DEFAULT NULL,
  `avg_lay_rate_pct` decimal(6,2) DEFAULT NULL,
  `incubation_days` int DEFAULT NULL,
  `gestation_days` int DEFAULT NULL,
  `avg_litter_size` decimal(6,2) DEFAULT NULL,
  `mature_age_months` int DEFAULT NULL,
  `productive_life_months` int DEFAULT NULL,
  `premature_years` decimal(5,2) DEFAULT NULL,
  `avg_yield_per_unit` decimal(10,4) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`breed_id`),
  KEY `breed_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `breed_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `breed_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `breed_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `breed_master`
--

LOCK TABLES `breed_master` WRITE;
/*!40000 ALTER TABLE `breed_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `breed_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_address`
--

DROP TABLE IF EXISTS `company_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_address` (
  `address_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `address_type` varchar(30) NOT NULL DEFAULT 'REGISTERED',
  `address_label` varchar(100) DEFAULT NULL,
  `line1` varchar(200) NOT NULL,
  `line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state_id` varchar(36) NOT NULL,
  `country_id` varchar(36) NOT NULL,
  `pincode` varchar(20) NOT NULL,
  `gps_latitude` decimal(10,6) DEFAULT NULL,
  `gps_longitude` decimal(10,6) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`address_id`),
  KEY `company_address_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_address_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_address`
--

LOCK TABLES `company_address` WRITE;
/*!40000 ALTER TABLE `company_address` DISABLE KEYS */;
INSERT INTO `company_address` VALUES ('1d33765f-1908-4695-ba19-7d7997dca32a','00000000-0000-0000-0000-000000000000','FARM','gfhfghggfhgfgh','hhjfhjfjhfjh','lkljklkjk','tytyutuyty','cchhccggc','India','567609',28.704100,77.102500,1,1),('a0b49937-670b-411f-bb7f-e86bbbc9846a','20f4314a-3b1e-4e9a-a37d-3d5720c33842','REGISTERED','Registered Office','Primary Office Block','wrvwrt','Mumbai','40000000-4000-4000-4000-400000000001','IND','400001',28.704100,77.102500,0,1),('d738b90d-dbda-45e8-9766-e696415087f2','446ecb6f-1d02-450a-a9f9-e9740f65f311','REGISTERED','Registered Office','Primary Office Block',NULL,'Mumbai','40000000-4000-4000-4000-400000000001','IND','400001',NULL,NULL,0,1);
/*!40000 ALTER TABLE `company_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_contacts`
--

DROP TABLE IF EXISTS `company_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_contacts` (
  `contact_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `contact_type` varchar(30) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `phone_primary` varchar(30) DEFAULT NULL,
  `phone_secondary` varchar(30) DEFAULT NULL,
  `receives_alerts` tinyint(1) NOT NULL DEFAULT '0',
  `receives_reports` tinyint(1) NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`contact_id`),
  KEY `company_contacts_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_contacts_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_contacts`
--

LOCK TABLES `company_contacts` WRITE;
/*!40000 ALTER TABLE `company_contacts` DISABLE KEYS */;
INSERT INTO `company_contacts` VALUES ('83a30c45-f6ff-4741-825e-978ae3856160','446ecb6f-1d02-450a-a9f9-e9740f65f311','PRIMARY','gooner',NULL,'admin@goon.com','+919999999999',NULL,1,1,1,1),('b04e0b9f-5d55-42c6-9818-88788441220d','00000000-0000-0000-0000-000000000000','PRIMARY','sonam','CEO','sonam@gmail.com','987987986786','978878788',1,1,1,1),('fcdd5a56-8119-4240-a6e6-b1933fb17196','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PRIMARY','gooner','CEO','admin@goon.com','+919999999999','',1,1,1,1);
/*!40000 ALTER TABLE `company_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_currency_config`
--

DROP TABLE IF EXISTS `company_currency_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_currency_config` (
  `curr_config_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `currency_id` varchar(36) NOT NULL,
  `is_base` tinyint(1) NOT NULL DEFAULT '0',
  `is_reporting` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`curr_config_id`),
  KEY `company_currency_config_company_id_company_master_company_id_fk` (`company_id`),
  KEY `comp_curr_config_curr_id_fk` (`currency_id`),
  CONSTRAINT `comp_curr_config_curr_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE RESTRICT,
  CONSTRAINT `company_currency_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_currency_config`
--

LOCK TABLES `company_currency_config` WRITE;
/*!40000 ALTER TABLE `company_currency_config` DISABLE KEYS */;
INSERT INTO `company_currency_config` VALUES ('c1ee789b-6759-4c89-bd1e-1b684a29d93a','20f4314a-3b1e-4e9a-a37d-3d5720c33842','20000000-2000-2000-2000-200000000001',1,1,1),('cc6829e7-1147-41c1-9fce-025ee0157c79','446ecb6f-1d02-450a-a9f9-e9740f65f311','20000000-2000-2000-2000-200000000001',1,1,1);
/*!40000 ALTER TABLE `company_currency_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_fiscal`
--

DROP TABLE IF EXISTS `company_fiscal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_fiscal` (
  `fiscal_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `fiscal_year_format` varchar(20) NOT NULL DEFAULT 'FY APR MAR',
  `fiscal_start_month` int NOT NULL DEFAULT '4',
  `fiscal_start_day` int NOT NULL DEFAULT '1',
  `current_fiscal_year` varchar(20) NOT NULL,
  `period_type` varchar(20) NOT NULL DEFAULT 'MONTHLY',
  `accounting_standard` varchar(20) NOT NULL DEFAULT 'IND AS',
  `depreciation_method` varchar(30) NOT NULL DEFAULT 'SLM',
  `inventory_valuation` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `gst_filing_frequency` varchar(20) DEFAULT NULL,
  `tax_audit_applicable` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `fiscal_end_day` int NOT NULL DEFAULT '31',
  `decimal_places` int NOT NULL DEFAULT '2',
  PRIMARY KEY (`fiscal_id`),
  UNIQUE KEY `company_fiscal_company_id_unique` (`company_id`),
  CONSTRAINT `company_fiscal_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_fiscal`
--

LOCK TABLES `company_fiscal` WRITE;
/*!40000 ALTER TABLE `company_fiscal` DISABLE KEYS */;
INSERT INTO `company_fiscal` VALUES ('a6cfe7cb-6e5e-493e-8da8-f8d832e4f35b','00000000-0000-0000-0000-000000000000','FY APR-MAR',4,1,'2026-27','MONTHLY','Local GAAP','SLM','FIFO','MONTHLY',0,1,31,2),('d4350930-09f1-4737-8393-1de5a6465d3f','446ecb6f-1d02-450a-a9f9-e9740f65f311','FY APR MAR',4,1,'FY 2026-27','MONTHLY','IND AS','SLM','STANDARD',NULL,0,1,31,2),('ebddf6ca-3bc7-4977-b91a-f9d04465c05f','20f4314a-3b1e-4e9a-a37d-3d5720c33842','FY APR-MAR',4,1,'2026-27','MONTHLY','Local GAAP','SLM','STANDARD COSTING','MONTHLY',0,1,31,2);
/*!40000 ALTER TABLE `company_fiscal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_language_config`
--

DROP TABLE IF EXISTS `company_language_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_language_config` (
  `config_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `set_by` varchar(36) DEFAULT NULL,
  `set_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`config_id`),
  KEY `company_language_config_company_id_company_master_company_id_fk` (`company_id`),
  KEY `company_language_config_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `company_language_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `company_language_config_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_language_config`
--

LOCK TABLES `company_language_config` WRITE;
/*!40000 ALTER TABLE `company_language_config` DISABLE KEYS */;
INSERT INTO `company_language_config` VALUES ('123a0161-5104-4b0a-b5df-9d5c63f18072','446ecb6f-1d02-450a-a9f9-e9740f65f311','10000000-1000-1000-1000-100000000001',1,1,'533d0f92-9b35-4888-a051-674ec420d558','2026-07-23 10:42:18'),('ea9fb7cc-23e9-47d9-8dd6-8203119326c2','20f4314a-3b1e-4e9a-a37d-3d5720c33842','10000000-1000-1000-1000-100000000001',1,1,'533d0f92-9b35-4888-a051-674ec420d558','2026-07-23 11:22:38');
/*!40000 ALTER TABLE `company_language_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_master`
--

DROP TABLE IF EXISTS `company_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_master` (
  `company_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_code` varchar(20) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `company_display_name` varchar(100) DEFAULT NULL,
  `company_type` varchar(30) NOT NULL,
  `industry_type` varchar(30) NOT NULL,
  `registration_no` varchar(100) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `tax_regime` varchar(20) DEFAULT 'STANDARD',
  `incorporation_date` date DEFAULT NULL,
  `financial_year_start` int NOT NULL DEFAULT '4',
  `base_currency_id` varchar(36) NOT NULL,
  `default_language_id` varchar(36) NOT NULL,
  `default_timezone_id` varchar(100) NOT NULL,
  `country_id` varchar(36) NOT NULL,
  `company_logo_url` varchar(500) DEFAULT NULL,
  `company_logo_dark_url` varchar(500) DEFAULT NULL,
  `primary_color_hex` varchar(7) NOT NULL DEFAULT '#1F4E79',
  `website` varchar(300) DEFAULT NULL,
  `email_domain` varchar(100) DEFAULT NULL,
  `support_email` varchar(200) DEFAULT NULL,
  `phone_primary` varchar(30) DEFAULT NULL,
  `is_multi_farm` tinyint(1) NOT NULL DEFAULT '0',
  `max_farm_locations` int NOT NULL DEFAULT '1',
  `onboarding_status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `created_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_master`
--

LOCK TABLES `company_master` WRITE;
/*!40000 ALTER TABLE `company_master` DISABLE KEYS */;
INSERT INTO `company_master` VALUES ('00000000-0000-0000-0000-000000000000','e6e465fc-b76b-4fbc-9a27-626696c6c607','GOO','Gooner Ltd','Goon','Pvt Ltd','Poultry Farming','5476547547664','7575765657','STANDARD','2006-01-30',4,'20000000-2000-2000-2000-200000000001','10000000-1000-1000-1000-100000000001','Asia/Kolkata','IND','/uploads/company-logo-1784791912731-552293673.png',NULL,'#1F4E79','','','','',0,1,'COMPLETED',1,'2026-07-23 05:53:04',NULL,'2026-07-23 05:53:04',NULL),('20f4314a-3b1e-4e9a-a37d-3d5720c33842','e6e465fc-b76b-4fbc-9a27-626696c6c607','WE','fqref','adfar','Pvt Ltd','Poultry Farming','24v52565g63g','afe76q4rq4242463526g5','STANDARD',NULL,4,'20000000-2000-2000-2000-200000000002','10000000-1000-1000-1000-100000000006','Asia/Kolkata','IND',NULL,NULL,'#1F4E79',NULL,NULL,NULL,NULL,0,1,'COMPLETED',1,'2026-07-23 11:22:38',NULL,'2026-07-23 11:22:38',NULL),('446ecb6f-1d02-450a-a9f9-e9740f65f311','e6e465fc-b76b-4fbc-9a27-626696c6c607','MANISH','Manish private limited','Manish private limited','NGO','Poultry Farming','86876816412','7621584512','STANDARD','2017-01-31',4,'20000000-2000-2000-2000-200000000001','10000000-1000-1000-1000-100000000001','Asia/Kolkata','IND','/uploads/company-logo-1784803381081-232830259.jpeg',NULL,'#1F4E79','','','','',0,1,'COMPLETED',1,'2026-07-23 10:42:18',NULL,'2026-07-23 10:42:18',NULL);
/*!40000 ALTER TABLE `company_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_modules`
--

DROP TABLE IF EXISTS `company_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_modules` (
  `module_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `activated_on` date DEFAULT NULL,
  `activated_by` varchar(36) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `config_json` json DEFAULT NULL,
  PRIMARY KEY (`module_id`),
  KEY `company_modules_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_modules_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_modules`
--

LOCK TABLES `company_modules` WRITE;
/*!40000 ALTER TABLE `company_modules` DISABLE KEYS */;
INSERT INTO `company_modules` VALUES ('07a601d5-608a-46bb-8aca-af80445879ae','446ecb6f-1d02-450a-a9f9-e9740f65f311','PROCUREMENT',1,'2026-07-23',NULL,NULL,NULL),('117cdd17-effc-400c-b2de-99cb7d49b8cb','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PLT_REARING',1,'2026-07-23',NULL,NULL,NULL),('1a170f21-1137-4e73-8728-921ec6fae297','00000000-0000-0000-0000-000000000000','POULTRY',1,'2026-07-23',NULL,NULL,NULL),('1c771405-8556-4ad3-bd30-b569eff1a60e','20f4314a-3b1e-4e9a-a37d-3d5720c33842','HRMS',1,'2026-07-23',NULL,NULL,NULL),('20d1c256-c47f-449b-a9e4-4fcbb8e8a417','20f4314a-3b1e-4e9a-a37d-3d5720c33842','LVS_PIGGERY',1,'2026-07-23',NULL,NULL,NULL),('238d5949-9471-42df-a4f4-8dd9a439c72b','20f4314a-3b1e-4e9a-a37d-3d5720c33842','SALES',1,'2026-07-23',NULL,NULL,NULL),('25b5360f-e8c5-4547-9472-d3316497a3b8','446ecb6f-1d02-450a-a9f9-e9740f65f311','INVENTORY',1,'2026-07-23',NULL,NULL,NULL),('2b0ecdc1-d0ad-44c0-b285-fd08d3dac7f4','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PLT_HATCHING',1,'2026-07-23',NULL,NULL,NULL),('321fbb5b-6174-4db5-bd49-063c1ba28f93','20f4314a-3b1e-4e9a-a37d-3d5720c33842','INVENTORY',1,'2026-07-23',NULL,NULL,NULL),('4e284a05-7a47-4450-8c78-11cbaac40f40','446ecb6f-1d02-450a-a9f9-e9740f65f311','FARM',1,'2026-07-23',NULL,NULL,NULL),('523b650a-a898-4107-a142-45813c2d2af4','20f4314a-3b1e-4e9a-a37d-3d5720c33842','LIVESTOCK',1,'2026-07-23',NULL,NULL,NULL),('56d91450-b847-4b18-9391-e4c7b986bcdc','20f4314a-3b1e-4e9a-a37d-3d5720c33842','FARM',1,'2026-07-23',NULL,NULL,NULL),('5e60f9d9-87ef-41fb-9e3c-32d70c86ca3b','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PLT_LAYING',1,'2026-07-23',NULL,NULL,NULL),('61d84c43-2bb2-4c89-847b-a6bd14aec177','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PLT_SLAUGHTER',1,'2026-07-23',NULL,NULL,NULL),('79d10fc3-cf4e-4e28-8312-5ffd9cb2e1a6','00000000-0000-0000-0000-000000000000','AGRI',1,'2026-07-23',NULL,NULL,NULL),('7c94bc8e-ba0e-46c5-82d1-0da91599eae4','446ecb6f-1d02-450a-a9f9-e9740f65f311','FINANCE',1,'2026-07-23',NULL,NULL,NULL),('813a338f-2dfb-48f2-85e1-cda02845313e','20f4314a-3b1e-4e9a-a37d-3d5720c33842','POULTRY',1,'2026-07-23',NULL,NULL,NULL),('8cf93e04-f9fc-4205-bf7b-590ef57e27c3','00000000-0000-0000-0000-000000000000','LIVESTOCK',1,'2026-07-23',NULL,NULL,NULL),('a3fb02ad-71fd-42ea-a1a3-a9527d28af8d','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PROCUREMENT',1,'2026-07-23',NULL,NULL,NULL),('b690a67a-2586-4d03-9e19-fb4cb94d54aa','00000000-0000-0000-0000-000000000000','PLT_REARING',1,'2026-07-23',NULL,NULL,NULL),('b86cc0b5-35b6-4c6b-8fbe-94fb121ab57a','00000000-0000-0000-0000-000000000000','PLT_LAYING',1,'2026-07-23',NULL,NULL,NULL),('b873c564-1b23-4706-a6fc-fb852adb556e','00000000-0000-0000-0000-000000000000','PLT_HATCHING',1,'2026-07-23',NULL,NULL,NULL),('ba04fab2-717c-4998-b2a3-cb3e3ada6177','446ecb6f-1d02-450a-a9f9-e9740f65f311','SALES',1,'2026-07-23',NULL,NULL,NULL),('d1965052-9a11-487a-aedc-05942f7bd390','20f4314a-3b1e-4e9a-a37d-3d5720c33842','LVS_MILKING',1,'2026-07-23',NULL,NULL,NULL),('de03f253-21b5-4874-9b2f-a4a5c65c5918','446ecb6f-1d02-450a-a9f9-e9740f65f311','HRMS',1,'2026-07-23',NULL,NULL,NULL),('e8aa7a14-e487-46d0-b3c7-ccc347952526','20f4314a-3b1e-4e9a-a37d-3d5720c33842','LVS_BREEDING',1,'2026-07-23',NULL,NULL,NULL),('f0548a3b-c51d-4acf-aac3-567cb48b1158','20f4314a-3b1e-4e9a-a37d-3d5720c33842','LVS_SLAUGHTER',1,'2026-07-23',NULL,NULL,NULL),('f0b203ea-79f2-4bc7-a2b7-6ba40b0786fd','20f4314a-3b1e-4e9a-a37d-3d5720c33842','PLT_CB',1,'2026-07-23',NULL,NULL,NULL),('f48f3992-4066-4af8-9a43-43b545d49b8f','20f4314a-3b1e-4e9a-a37d-3d5720c33842','FINANCE',1,'2026-07-23',NULL,NULL,NULL),('f9a330da-22ad-43ad-b2af-1cd203978414','20f4314a-3b1e-4e9a-a37d-3d5720c33842','LVS_GOAT_SHEEP',1,'2026-07-23',NULL,NULL,NULL);
/*!40000 ALTER TABLE `company_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_master`
--

DROP TABLE IF EXISTS `currency_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_master` (
  `currency_id` varchar(36) NOT NULL,
  `iso_code` char(3) NOT NULL,
  `currency_name` varchar(100) NOT NULL,
  `symbol` varchar(5) NOT NULL,
  `symbol_position` varchar(10) NOT NULL DEFAULT 'PREFIX',
  `decimal_places` int NOT NULL DEFAULT '2',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `currency_master_iso_code_unique` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_master`
--

LOCK TABLES `currency_master` WRITE;
/*!40000 ALTER TABLE `currency_master` DISABLE KEYS */;
INSERT INTO `currency_master` VALUES ('20000000-2000-2000-2000-200000000001','INR','Indian Rupee','₹','PREFIX',2,1,1),('20000000-2000-2000-2000-200000000002','USD','US Dollar','$','PREFIX',2,0,1),('20000000-2000-2000-2000-200000000003','EUR','Euro','€','PREFIX',2,0,1);
/*!40000 ALTER TABLE `currency_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rate`
--

DROP TABLE IF EXISTS `exchange_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_rate` (
  `rate_id` varchar(36) NOT NULL,
  `from_currency_id` varchar(36) NOT NULL,
  `to_currency_id` varchar(36) NOT NULL,
  `rate` decimal(18,6) NOT NULL,
  `rate_date` date NOT NULL,
  `rate_source` varchar(30) NOT NULL DEFAULT 'MANUAL',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`rate_id`),
  KEY `exchange_rate_from_currency_id_currency_master_currency_id_fk` (`from_currency_id`),
  KEY `exchange_rate_to_currency_id_currency_master_currency_id_fk` (`to_currency_id`),
  CONSTRAINT `exchange_rate_from_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`from_currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE CASCADE,
  CONSTRAINT `exchange_rate_to_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`to_currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rate`
--

LOCK TABLES `exchange_rate` WRITE;
/*!40000 ALTER TABLE `exchange_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_attribute_master`
--

DROP TABLE IF EXISTS `item_attribute_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_attribute_master` (
  `attribute_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `attribute_code` varchar(50) NOT NULL,
  `attribute_name` varchar(100) NOT NULL,
  `data_type` varchar(20) NOT NULL,
  `list_values` json DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `affects_costing` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_variant` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`attribute_id`),
  KEY `item_attribute_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `item_attribute_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `item_attribute_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE CASCADE,
  CONSTRAINT `item_attribute_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_attribute_master`
--

LOCK TABLES `item_attribute_master` WRITE;
/*!40000 ALTER TABLE `item_attribute_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_attribute_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_attribute_values`
--

DROP TABLE IF EXISTS `item_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_attribute_values` (
  `value_id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `attribute_id` varchar(36) NOT NULL,
  `attribute_value` text NOT NULL,
  PRIMARY KEY (`value_id`),
  KEY `item_attribute_values_item_id_item_master_item_id_fk` (`item_id`),
  KEY `item_attr_vals_attr_id_fk` (`attribute_id`),
  CONSTRAINT `item_attr_vals_attr_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `item_attribute_master` (`attribute_id`) ON DELETE RESTRICT,
  CONSTRAINT `item_attribute_values_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_attribute_values`
--

LOCK TABLES `item_attribute_values` WRITE;
/*!40000 ALTER TABLE `item_attribute_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_master`
--

DROP TABLE IF EXISTS `item_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_master` (
  `item_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `item_type` varchar(30) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `uom_primary` varchar(20) NOT NULL,
  `uom_secondary` varchar(20) DEFAULT NULL,
  `uom_conversion_factor` decimal(18,6) DEFAULT NULL,
  `valuation_method` varchar(20) DEFAULT NULL,
  `standard_cost` decimal(18,6) DEFAULT NULL,
  `is_lot_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `is_serial_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `is_biological_asset` tinyint(1) NOT NULL DEFAULT '0',
  `is_biological_costing_method` varchar(30) DEFAULT NULL,
  `is_inventoriable` tinyint(1) NOT NULL DEFAULT '1',
  `min_stock_level` decimal(18,4) DEFAULT NULL,
  `max_stock_level` decimal(18,4) DEFAULT NULL,
  `reorder_level` decimal(18,4) DEFAULT NULL,
  `shelf_life_days` int DEFAULT NULL,
  `storage_temp_min` decimal(6,2) DEFAULT NULL,
  `storage_temp_max` decimal(6,2) DEFAULT NULL,
  `is_qr_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `qr_trigger_event` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`item_id`),
  KEY `item_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `item_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `item_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `item_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_master`
--

LOCK TABLES `item_master` WRITE;
/*!40000 ALTER TABLE `item_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_master`
--

DROP TABLE IF EXISTS `language_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_master` (
  `lang_id` varchar(36) NOT NULL,
  `lang_code` varchar(10) NOT NULL,
  `lang_name_english` varchar(100) NOT NULL,
  `lang_name_native` varchar(100) NOT NULL,
  `script` varchar(30) NOT NULL,
  `is_rtl` tinyint(1) NOT NULL DEFAULT '0',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `translation_coverage_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `date_format` varchar(30) NOT NULL DEFAULT 'DD/MM/YYYY',
  `number_format` varchar(20) NOT NULL DEFAULT 'IN',
  `decimal_separator` char(1) NOT NULL DEFAULT '.',
  `thousands_separator` char(1) NOT NULL DEFAULT ',',
  `flag_emoji` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`lang_id`),
  UNIQUE KEY `language_master_lang_code_unique` (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_master`
--

LOCK TABLES `language_master` WRITE;
/*!40000 ALTER TABLE `language_master` DISABLE KEYS */;
INSERT INTO `language_master` VALUES ('10000000-1000-1000-1000-100000000001','en','English','English','Latin',0,1,1,100.00,'DD/MM/YYYY','IN','.',',','🇬🇧'),('10000000-1000-1000-1000-100000000002','hi','Hindi','हिन्दी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',','🇮🇳'),('10000000-1000-1000-1000-100000000003','mr','Marathi','मराठी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000004','es','Spanish','Español','Latin',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000005','fr','French','Français','Latin',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000006','bn','Bengali','বাংলা','Bengali',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000007','te','Telugu','తెలుగు','Telugu',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000008','ta','Tamil','தமிழ்','Tamil',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL);
/*!40000 ALTER TABLE `language_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_translations`
--

DROP TABLE IF EXISTS `language_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_translations` (
  `trans_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `translation_key` varchar(200) NOT NULL,
  `translation_value` text NOT NULL,
  `is_html` tinyint(1) NOT NULL DEFAULT '0',
  `is_auto_translated` tinyint(1) NOT NULL DEFAULT '0',
  `verified_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`trans_id`),
  KEY `language_translations_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `language_translations_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_translations`
--

LOCK TABLES `language_translations` WRITE;
/*!40000 ALTER TABLE `language_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `language_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lob_master`
--

DROP TABLE IF EXISTS `lob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lob_master` (
  `lob_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_code` varchar(50) NOT NULL,
  `lob_name` varchar(100) NOT NULL,
  `costing_method_allowed` varchar(100) NOT NULL,
  `qc_required` varchar(10) NOT NULL DEFAULT 'NO',
  `qr_required` varchar(10) NOT NULL DEFAULT 'NO',
  `batch_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `scheduler_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `traceability_required` varchar(10) NOT NULL DEFAULT 'YES',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`lob_id`),
  UNIQUE KEY `lob_master_lob_code_unique` (`lob_code`),
  KEY `lob_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  CONSTRAINT `lob_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lob_master`
--

LOCK TABLES `lob_master` WRITE;
/*!40000 ALTER TABLE `lob_master` DISABLE KEYS */;
INSERT INTO `lob_master` VALUES ('07b2de20-a304-4b53-b4eb-0e41123a91db','11111111-1111-1111-1111-111111111111','PLT_LAYING','Laying','STANDARD,FIFO','YES','YES','YES','YES','YES','Laying hens producing eggs',2,1,1,NULL,NULL,NULL),('2a362ff0-798c-4727-97b8-d6e8abb9788d','22222222-2222-2222-2222-222222222222','LVS_PIGGERY','Piggery','BIO_ASSET,STANDARD','YES','YES','YES','YES','YES','Piggery rearing and growout',7,1,1,NULL,NULL,NULL),('2ad69bb6-b984-4728-8a89-3424f116670a','55555555-5555-5555-5555-555555555555','INS_BEE','Bee Keeping','STANDARD','YES','YES','YES','YES','YES','Honey apiaries',14,1,1,NULL,NULL,NULL),('2dfab306-9ab7-47c4-867a-0c0d2cbcdcee','44444444-4444-4444-4444-444444444444','AQA_SLAUGHTER','Aquaculture Slaughter','STANDARD','YES','YES','YES','YES','YES','Aqua filleting and processing',13,1,1,NULL,NULL,NULL),('34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d','11111111-1111-1111-1111-111111111111','PLT_CB','Commercial Broiler Farming','STANDARD','YES','YES','YES','YES','YES','Commercial broiler batch growout',4,1,1,NULL,NULL,NULL),('3533f9ef-57dc-41ce-8cce-37285867c675','22222222-2222-2222-2222-222222222222','LVS_SLAUGHTER','Livestock Slaughtering','STANDARD,FIFO,AVG','YES','YES','YES','YES','YES','Slaughter line',8,1,1,NULL,NULL,NULL),('43b11b0b-b76d-4bf0-a21f-b5ebadbd4c2e','66666666-6666-6666-6666-666666666666','FEED_PROD','Feed Production','STANDARD','YES','YES','YES','YES','YES','Feed Mill compounding',16,1,1,NULL,NULL,NULL),('4ef5479e-e5cd-4307-b60c-fb5c5ea5faca','33333333-3333-3333-3333-333333333333','AGRI_FRUIT','Fruit Farming','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Bearer plants orchard management',9,1,1,NULL,NULL,NULL),('528eb1ac-461d-428c-910f-f48eccd30bbc','11111111-1111-1111-1111-111111111111','PLT_SLAUGHTER','Poultry Slaughter','STANDARD','YES','YES','YES','YES','YES','Processing line and joint cost splits',5,1,1,NULL,NULL,NULL),('60000000-6000-6000-6000-000000000008','22222222-2222-2222-2222-222222222222','LVS_GOAT_SHEEP','Goat & Sheep','BIO_ASSET','YES','YES','NO','NO','YES',NULL,8,1,1,NULL,NULL,NULL),('60000000-6000-6000-6000-000000000015','55555555-5555-5555-5555-555555555555','BSF','Black Soldier Fly','STANDARD','YES','YES','NO','NO','YES',NULL,15,1,1,NULL,NULL,NULL),('6666f388-5a7e-481f-8dc8-08ebdced12a0','11111111-1111-1111-1111-111111111111','PLT_REARING','Rearing & Breeding','STANDARD,FIFO','NO','NO','YES','YES','YES','Rearing and breeding layer/breeder parent flocks',1,1,1,NULL,NULL,NULL),('7a763d80-da73-4c38-a5be-1868c6ce611c','22222222-2222-2222-2222-222222222222','LVS_MILKING','Dairy','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Milking operations',6,1,1,NULL,NULL,NULL),('86b60d9b-504d-4ed5-b83b-52a2da8e7491','33333333-3333-3333-3333-333333333333','AGRI_SEEDS','Seed Processing','STANDARD','YES','YES','YES','YES','YES','Seeds processing',11,1,1,NULL,NULL,NULL),('9a576d2b-5063-43f6-8e74-1f13cd15cbc8','33333333-3333-3333-3333-333333333333','AGRI_FLOWER','Flower Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Flower harvest stems',12,1,1,NULL,NULL,NULL),('9f858f70-44bc-4503-8153-9d9c3bbc0ac1','11111111-1111-1111-1111-111111111111','PLT_HATCHING','Hatching','STANDARD,FIFO','YES','YES','YES','YES','YES','Incubator & hatching operations',3,1,1,NULL,NULL,NULL),('d6ff6308-ea1b-4ee8-b036-d513779a366d','44444444-4444-4444-4444-444444444444','AQA_FISH','Fish Farming','BIO_ASSET,FIFO','YES','YES','YES','YES','YES','Fish ponds growout',12,1,1,NULL,NULL,NULL),('e8f2e5ef-0522-4639-8ab5-a23d172dfcce','33333333-3333-3333-3333-333333333333','AGRI_CROP','Crop Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Seasonal grain / crop batch',10,1,1,NULL,NULL,NULL),('ecb38d4e-5de8-42ed-8c5d-7f3555aee967','22222222-2222-2222-2222-222222222222','LVS_BREEDING','Livestock Breeding','STANDARD,FIFO,BIO_ASSET,AVG','YES','NO','YES','YES','YES','Breeding livestock herds',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `lob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_master`
--

DROP TABLE IF EXISTS `location_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_master` (
  `location_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `location_code` varchar(50) NOT NULL,
  `location_name` varchar(200) NOT NULL,
  `location_level` int NOT NULL,
  `location_type` varchar(50) NOT NULL,
  `parent_location_id` varchar(36) DEFAULT NULL,
  `area_size` decimal(18,4) DEFAULT NULL,
  `area_unit` varchar(10) DEFAULT NULL,
  `max_capacity` decimal(18,4) DEFAULT NULL,
  `capacity_uom` varchar(20) DEFAULT NULL,
  `current_count` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `gps_latitude` decimal(10,8) DEFAULT NULL,
  `gps_longitude` decimal(11,8) DEFAULT NULL,
  `storage_type` varchar(30) DEFAULT NULL,
  `is_quarantine_zone` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `location_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `location_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  KEY `loc_master_parent_loc_id_fk` (`parent_location_id`),
  CONSTRAINT `loc_master_parent_loc_id_fk` FOREIGN KEY (`parent_location_id`) REFERENCES `location_master` (`location_id`) ON DELETE RESTRICT,
  CONSTRAINT `location_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `location_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_master`
--

LOCK TABLES `location_master` WRITE;
/*!40000 ALTER TABLE `location_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `location_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_lob_extension_config`
--

DROP TABLE IF EXISTS `nob_lob_extension_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_lob_extension_config` (
  `config_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` varchar(200) NOT NULL,
  `data_type` varchar(30) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`config_id`),
  KEY `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE CASCADE,
  CONSTRAINT `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_lob_extension_config`
--

LOCK TABLES `nob_lob_extension_config` WRITE;
/*!40000 ALTER TABLE `nob_lob_extension_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `nob_lob_extension_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_master`
--

DROP TABLE IF EXISTS `nob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_master` (
  `nob_id` varchar(36) NOT NULL,
  `nob_code` varchar(50) NOT NULL,
  `nob_name` varchar(100) NOT NULL,
  `default_costing_method` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`nob_id`),
  UNIQUE KEY `nob_master_nob_code_unique` (`nob_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_master`
--

LOCK TABLES `nob_master` WRITE;
/*!40000 ALTER TABLE `nob_master` DISABLE KEYS */;
INSERT INTO `nob_master` VALUES ('11111111-1111-1111-1111-111111111111','POULTRY','Poultry','STANDARD','Birds - broiler, layer, breeder, hatchery',1,1,1,NULL,NULL,NULL),('22222222-2222-2222-2222-222222222222','LIVESTOCK','Livestock','BIO_ASSET','Animals - cattle, piggery, goat, sheep',2,1,1,NULL,NULL,NULL),('33333333-3333-3333-3333-333333333333','AGRI','Agriculture','STANDARD','Crops, fruits, flowers, seeds',3,1,1,NULL,NULL,NULL),('44444444-4444-4444-4444-444444444444','AQUA','Aquaculture','BIO_ASSET','Fish, shrimp, other aquatic',4,1,1,NULL,NULL,NULL),('55555555-5555-5555-5555-555555555555','INSECT','Insect Farming','STANDARD','Bee keeping, black soldier fly',5,1,1,NULL,NULL,NULL),('66666666-6666-6666-6666-666666666666','PRODUCTION','Feed & Processing','STANDARD','Feed mill, processing plant',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `nob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_config`
--

DROP TABLE IF EXISTS `notification_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_config` (
  `notif_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `channel` varchar(20) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `smtp_host` varchar(200) DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_user` varchar(200) DEFAULT NULL,
  `smtp_password_enc` text,
  `from_email` varchar(200) DEFAULT NULL,
  `from_name` varchar(100) DEFAULT NULL,
  `sms_provider` varchar(30) DEFAULT NULL,
  `sms_api_key_enc` text,
  `sms_sender_id` varchar(20) DEFAULT NULL,
  `push_fcm_key_enc` text,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_secret_enc` text,
  `test_sent_at` timestamp NULL DEFAULT NULL,
  `test_status` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`notif_id`),
  KEY `notification_config_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `notification_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_config`
--

LOCK TABLES `notification_config` WRITE;
/*!40000 ALTER TABLE `notification_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_log`
--

DROP TABLE IF EXISTS `notification_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_log` (
  `log_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `channel` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `error_message` text,
  `sent_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`log_id`),
  KEY `notification_log_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `notification_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_log`
--

LOCK TABLES `notification_log` WRITE;
/*!40000 ALTER TABLE `notification_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_master`
--

DROP TABLE IF EXISTS `role_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_master` (
  `role_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `role_description` text,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`role_id`),
  KEY `role_master_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `role_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_master`
--

LOCK TABLES `role_master` WRITE;
/*!40000 ALTER TABLE `role_master` DISABLE KEYS */;
INSERT INTO `role_master` VALUES ('0d56d220-6229-41b7-9b5d-954968da5f7c','20f4314a-3b1e-4e9a-a37d-3d5720c33842','SUPER_ADMIN','Super Administrator','Full administrative control over all company scopes',1,1),('5d644f13-baa9-4b7a-ba75-75ec9357c233','446ecb6f-1d02-450a-a9f9-e9740f65f311','OPERATOR','Operator','Daily operational tasks and farming log entry submissions',0,1),('660be598-bee5-45bc-ba2c-82f393e219e1','20f4314a-3b1e-4e9a-a37d-3d5720c33842','MANAGER','Manager','General operational management and supervisor permissions',0,1),('8a213742-8c60-4fd3-bcb2-10f152cb7168','446ecb6f-1d02-450a-a9f9-e9740f65f311','MANAGER','Manager','General operational management and supervisor permissions',0,1),('b0f5127e-e51f-472b-a090-ebfcd4a0e494','446ecb6f-1d02-450a-a9f9-e9740f65f311','ACCOUNTANT','Accountant','Accounting, ledgers, and financial valuation reports',0,1),('bf8a8186-63e9-4466-9e19-667691304443','20f4314a-3b1e-4e9a-a37d-3d5720c33842','ACCOUNTANT','Accountant','Accounting, ledgers, and financial valuation reports',0,1),('df04b024-60b9-4ff4-8602-ebd108a76aff','20f4314a-3b1e-4e9a-a37d-3d5720c33842','OPERATOR','Operator','Daily operational tasks and farming log entry submissions',0,1),('f5314bfe-dbcf-456b-933a-4db283434d58','446ecb6f-1d02-450a-a9f9-e9740f65f311','SUPER_ADMIN','Super Administrator','Full administrative control over all company scopes',1,1);
/*!40000 ALTER TABLE `role_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `perm_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT '0',
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_edit` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  `can_approve` tinyint(1) NOT NULL DEFAULT '0',
  `can_export` tinyint(1) NOT NULL DEFAULT '0',
  `can_print` tinyint(1) NOT NULL DEFAULT '0',
  `field_restrictions` json DEFAULT NULL,
  PRIMARY KEY (`perm_id`),
  KEY `role_permissions_role_id_role_master_role_id_fk` (`role_id`),
  CONSTRAINT `role_permissions_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`role_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('11b42ec2-29b8-4651-94ce-02cccc2228da','f5314bfe-dbcf-456b-933a-4db283434d58','ALL','ALL',1,1,1,1,1,1,1,NULL),('15de60e0-e431-456a-952b-1a131173a8c4','5d644f13-baa9-4b7a-ba75-75ec9357c233','POULTRY','BATCH_CONTROL',1,0,0,0,0,1,1,NULL),('249a6abf-8a8d-4232-aa1d-953b2a51ffff','0d56d220-6229-41b7-9b5d-954968da5f7c','ALL','ALL',1,1,1,1,1,1,1,NULL),('289c07d8-f57a-4d5f-b4b0-80490f3549b8','660be598-bee5-45bc-ba2c-82f393e219e1','ACCOUNTING','LEDGER',1,1,1,0,0,1,1,NULL),('306855e3-bea0-49ce-a982-06538f64db4b','df04b024-60b9-4ff4-8602-ebd108a76aff','POULTRY','BATCH_CONTROL',1,0,0,0,0,1,1,NULL),('31d97d59-41ae-416c-b3d8-9e8489b4f33e','660be598-bee5-45bc-ba2c-82f393e219e1','POULTRY','BATCH_CONTROL',1,1,1,0,1,1,1,NULL),('4c40b58f-0045-41e0-b05d-6452c20c5039','8a213742-8c60-4fd3-bcb2-10f152cb7168','FINANCE','VALUATION',1,1,1,0,0,1,1,NULL),('6364da9f-5570-464b-a67c-6823e95e158c','8a213742-8c60-4fd3-bcb2-10f152cb7168','POULTRY','BATCH_CONTROL',1,1,1,0,1,1,1,NULL),('720e7058-ac65-40f0-b962-c0ada3f76ff8','b0f5127e-e51f-472b-a090-ebfcd4a0e494','ACCOUNTING','LEDGER',1,1,1,1,1,1,1,NULL),('732c1460-fd30-4c06-b7cc-428fb31adbbe','8a213742-8c60-4fd3-bcb2-10f152cb7168','COMPANY','SETTINGS',1,0,0,0,0,0,0,NULL),('755fdf6c-47ae-4174-a544-e901f11ef839','df04b024-60b9-4ff4-8602-ebd108a76aff','POULTRY','FEED_LOGS',1,1,0,0,0,1,1,NULL),('8117b751-8460-4bf9-8ba2-6b953e8e5e85','660be598-bee5-45bc-ba2c-82f393e219e1','COMPANY','SETTINGS',1,0,0,0,0,0,0,NULL),('9cb76691-afc4-4fbc-a6fe-5ca530063741','5d644f13-baa9-4b7a-ba75-75ec9357c233','POULTRY','FEED_LOGS',1,1,0,0,0,1,1,NULL),('a6d3cf03-7af9-43ae-89aa-d69d82612ddf','660be598-bee5-45bc-ba2c-82f393e219e1','POULTRY','FEED_LOGS',1,1,1,0,1,1,1,NULL),('ae0a23cf-55a8-47df-8b71-79f08058fffe','8a213742-8c60-4fd3-bcb2-10f152cb7168','POULTRY','FEED_LOGS',1,1,1,0,1,1,1,NULL),('afcb9b5e-e1a3-44d3-beca-00897a8502e8','8a213742-8c60-4fd3-bcb2-10f152cb7168','ACCOUNTING','LEDGER',1,1,1,0,0,1,1,NULL),('b6c018aa-a972-43fe-a320-9daaeb98cb17','660be598-bee5-45bc-ba2c-82f393e219e1','FINANCE','VALUATION',1,1,1,0,0,1,1,NULL),('c87e4ac0-df01-46f2-a253-216f9aa933ae','bf8a8186-63e9-4466-9e19-667691304443','ACCOUNTING','LEDGER',1,1,1,1,1,1,1,NULL),('f28ff449-943d-42af-be31-7404d42c7db6','bf8a8186-63e9-4466-9e19-667691304443','FINANCE','VALUATION',1,1,1,0,1,1,1,NULL),('f3ae68c6-a65c-4c75-a44c-9848aa6080fe','b0f5127e-e51f-472b-a090-ebfcd4a0e494','FINANCE','VALUATION',1,1,1,0,1,1,1,NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_step_master`
--

DROP TABLE IF EXISTS `setup_step_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_step_master` (
  `step_id` varchar(36) NOT NULL,
  `step_code` varchar(50) NOT NULL,
  `step_name` varchar(100) NOT NULL,
  `step_description` text,
  `step_order` int NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `step_category` varchar(30) NOT NULL,
  `estimated_minutes` int DEFAULT NULL,
  `help_url` varchar(300) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `setup_step_master_step_code_unique` (`step_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_step_master`
--

LOCK TABLES `setup_step_master` WRITE;
/*!40000 ALTER TABLE `setup_step_master` DISABLE KEYS */;
INSERT INTO `setup_step_master` VALUES ('30000000-3000-3000-3000-000000000001','COMPANY_PROFILE','Company profile',NULL,1,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000002','ADDRESS','Address & farm location',NULL,2,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000003','KEY_CONTACTS','Primary contacts',NULL,3,1,'GENERAL',NULL,NULL,1),('30000000-3000-3000-3000-000000000004','DEFAULT_LANGUAGE','Language',NULL,4,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000005','BASE_CURRENCY','Base currency',NULL,5,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000006','TIMEZONE','Timezone & region',NULL,6,1,'LOCALIZATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000007','FISCAL_YEAR','Fiscal & accounting',NULL,7,1,'FINANCE',NULL,NULL,1),('30000000-3000-3000-3000-000000000008','ENABLE_MODULES','Enable modules',NULL,8,1,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000009','ADMIN_USER','Administrator account',NULL,9,1,'SECURITY',NULL,NULL,1),('30000000-3000-3000-3000-000000000010','TEAM_MEMBERS','Users & roles',NULL,10,0,'SECURITY',NULL,NULL,1),('30000000-3000-3000-3000-000000000011','CHART_OF_ACCOUNTS','GL mapping',NULL,11,0,'FINANCE',NULL,NULL,1),('30000000-3000-3000-3000-000000000012','NOB_LOB_CONFIG','NOB & LOB configuration',NULL,12,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000013','MASTER_DATA_LOAD','Master data',NULL,13,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000014','NOTIFICATION_SETTINGS','Notifications',NULL,14,0,'CONFIGURATION',NULL,NULL,1),('30000000-3000-3000-3000-000000000015','SETUP_COMPLETE','Setup complete',NULL,15,0,'CONFIGURATION',NULL,NULL,1);
/*!40000 ALTER TABLE `setup_step_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_wizard_log`
--

DROP TABLE IF EXISTS `setup_wizard_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_wizard_log` (
  `log_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed_by` varchar(36) DEFAULT NULL,
  `attempt_count` int NOT NULL DEFAULT '0',
  `data_snapshot` json DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`log_id`),
  KEY `setup_wizard_log_company_id_company_master_company_id_fk` (`company_id`),
  KEY `setup_wizard_log_step_id_setup_step_master_step_id_fk` (`step_id`),
  CONSTRAINT `setup_wizard_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `setup_wizard_log_step_id_setup_step_master_step_id_fk` FOREIGN KEY (`step_id`) REFERENCES `setup_step_master` (`step_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_wizard_log`
--

LOCK TABLES `setup_wizard_log` WRITE;
/*!40000 ALTER TABLE `setup_wizard_log` DISABLE KEYS */;
INSERT INTO `setup_wizard_log` VALUES ('0577f0a4-61e9-4b7f-801c-923336dbcaeb','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000002','COMPLETED','2026-07-23 05:53:28',NULL,0,NULL,NULL),('0c6ba53f-d1c8-42f6-bd6a-29fc4ba4392d','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000003','COMPLETED','2026-07-23 02:07:08',NULL,0,NULL,NULL),('20b16780-5dd2-4946-9296-9986b4fa659f','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000003','COMPLETED','2026-07-23 05:53:32',NULL,0,NULL,NULL),('2245c702-be97-4942-b976-bdef33eb1f75','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000011','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('252d6b29-7048-4901-b1d0-ce68ed0a6fca','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000001','COMPLETED','2026-07-23 05:52:38','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('2ace3ecf-4339-455c-bb02-207a8e7f17fb','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000015','COMPLETED','2026-07-23 02:09:57',NULL,0,NULL,NULL),('301f6b3e-56e3-428c-8779-ddba802fd93f','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000001','COMPLETED','2026-07-23 02:05:46',NULL,0,NULL,NULL),('37014631-db26-46b0-836f-29cbc972012e','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000006','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('3e1c0c20-1182-49fc-8a67-d6d0b9c6c67d','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000003','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('44b17fc0-abc3-4dc7-81b7-962e9b53fb54','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000007','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('52c969a4-802d-405f-bf90-085364de5c13','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000009','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('557b781e-2aa7-4e5c-849f-9f5690c699ab','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000007','COMPLETED','2026-07-23 02:09:22',NULL,0,NULL,NULL),('56d0b812-4598-48f2-8203-b50414291809','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000008','COMPLETED','2026-07-23 05:04:36',NULL,0,NULL,NULL),('584e4da9-6c77-4042-bdb1-76d8a129e3a5','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000015','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('60054f89-270f-4489-8fed-a454ed7de30c','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000005','COMPLETED','2026-07-23 02:07:11',NULL,0,NULL,NULL),('6823cdce-d027-43f4-a877-906c48dda1f6','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000004','COMPLETED','2026-07-23 02:07:11',NULL,0,NULL,NULL),('6976c0b4-4258-4253-8bee-c7bc3b90483a','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000004','COMPLETED','2026-07-23 05:53:37',NULL,0,NULL,NULL),('74b9944a-5f94-47ae-b760-8e519704aac0','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000015','COMPLETED','2026-07-23 05:53:53',NULL,0,NULL,NULL),('80d315f7-8df3-4ffc-8d2f-9e4514a47649','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000004','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('89db2e1d-79ae-4d9c-959f-90160bf881a5','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000006','COMPLETED','2026-07-23 05:53:44',NULL,0,NULL,NULL),('8f7b1383-d3eb-4319-9bb5-f2eb3fe4961c','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000005','COMPLETED','2026-07-23 05:53:42',NULL,0,NULL,NULL),('9785b2b3-b6fb-4b73-a5e2-a0b6ba6a4eb2','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000002','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('9b3d0bf6-56ed-4eac-ba0f-3956e0abfee3','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000010','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('a23d5756-18f1-43ea-9aa1-f1cdf55b8f27','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000007','COMPLETED','2026-07-23 05:53:47',NULL,0,NULL,NULL),('a915b0a0-f02f-42aa-92a1-bf87f7c18c0c','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000006','COMPLETED','2026-07-23 02:07:14',NULL,0,NULL,NULL),('b1dc99d6-51ff-4cd5-913c-621707fd975c','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000008','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('bc3f2a12-97f1-4557-a6d7-418b2936f9a6','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000005','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('cb3e55a3-4145-4b12-9b6b-6c8c08c1700b','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000013','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('cfa9e02e-a3d9-4210-a3d1-f74dbdc3eb26','00000000-0000-0000-0000-000000000000','30000000-3000-3000-3000-000000000002','COMPLETED','2026-07-23 02:06:26',NULL,0,NULL,NULL),('df6ffd3f-87a7-4526-aaa2-a117e2827ff4','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000014','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('e449d188-0e20-4853-b0db-6eac1a5d0b1b','20f4314a-3b1e-4e9a-a37d-3d5720c33842','30000000-3000-3000-3000-000000000008','COMPLETED','2026-07-23 05:54:10',NULL,0,NULL,NULL),('e93af1a5-9d39-4365-bd61-f9f41a39ad97','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000012','COMPLETED','2026-07-23 05:12:18','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL),('ec2e3839-359a-43d8-b197-50d02ab57068','446ecb6f-1d02-450a-a9f9-e9740f65f311','30000000-3000-3000-3000-000000000001','COMPLETED','2026-07-23 05:13:32','533d0f92-9b35-4888-a051-674ec420d558',0,NULL,NULL);
/*!40000 ALTER TABLE `setup_wizard_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom_conversion_master`
--

DROP TABLE IF EXISTS `uom_conversion_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom_conversion_master` (
  `conversion_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `item_id` varchar(36) DEFAULT NULL,
  `from_uom` varchar(20) NOT NULL,
  `to_uom` varchar(20) NOT NULL,
  `conversion_factor` decimal(18,8) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`conversion_id`),
  KEY `uom_conversion_master_item_id_item_master_item_id_fk` (`item_id`),
  CONSTRAINT `uom_conversion_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom_conversion_master`
--

LOCK TABLES `uom_conversion_master` WRITE;
/*!40000 ALTER TABLE `uom_conversion_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `uom_conversion_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom_master`
--

DROP TABLE IF EXISTS `uom_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom_master` (
  `uom_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `uom_code` varchar(20) NOT NULL,
  `uom_name` varchar(100) NOT NULL,
  `uom_type` varchar(20) NOT NULL,
  `decimal_places` int NOT NULL DEFAULT '0',
  `is_base_uom` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`uom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom_master`
--

LOCK TABLES `uom_master` WRITE;
/*!40000 ALTER TABLE `uom_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `uom_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_company_assignments`
--

DROP TABLE IF EXISTS `user_company_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_company_assignments` (
  `assign_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` varchar(36) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`assign_id`),
  UNIQUE KEY `uq_user_company` (`user_id`,`company_id`),
  KEY `user_company_assignments_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `user_company_assignments_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `user_company_assignments_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_company_assignments`
--

LOCK TABLES `user_company_assignments` WRITE;
/*!40000 ALTER TABLE `user_company_assignments` DISABLE KEYS */;
INSERT INTO `user_company_assignments` VALUES ('33d91eb9-fc1a-4894-bbf6-de2d95e46dff','533d0f92-9b35-4888-a051-674ec420d558','20f4314a-3b1e-4e9a-a37d-3d5720c33842',0,1,'533d0f92-9b35-4888-a051-674ec420d558','2026-07-23 11:22:38'),('b772c134-6686-46bd-866b-0c4582219a34','533d0f92-9b35-4888-a051-674ec420d558','446ecb6f-1d02-450a-a9f9-e9740f65f311',1,1,'533d0f92-9b35-4888-a051-674ec420d558','2026-07-23 10:42:18');
/*!40000 ALTER TABLE `user_company_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_language_pref`
--

DROP TABLE IF EXISTS `user_language_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_language_pref` (
  `pref_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `date_format_override` varchar(30) DEFAULT NULL,
  `number_format_override` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`pref_id`),
  KEY `user_language_pref_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `user_language_pref_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_language_pref`
--

LOCK TABLES `user_language_pref` WRITE;
/*!40000 ALTER TABLE `user_language_pref` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_language_pref` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_master`
--

DROP TABLE IF EXISTS `user_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_master` (
  `user_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(200) NOT NULL,
  `auth_provider` varchar(20) NOT NULL DEFAULT 'EMAIL',
  `auth_provider_id` varchar(200) DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `mfa_method` varchar(20) DEFAULT NULL,
  `mfa_secret` varchar(100) DEFAULT NULL,
  `user_type` varchar(20) NOT NULL DEFAULT 'STAFF',
  `employee_id` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `profile_photo_url` varchar(500) DEFAULT NULL,
  `lang_pref_id` varchar(36) DEFAULT NULL,
  `timezone_pref_id` varchar(100) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(50) DEFAULT NULL,
  `failed_login_count` int NOT NULL DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `invited_by` varchar(36) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_master_email_unique` (`email`),
  KEY `user_master_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `user_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_master`
--

LOCK TABLES `user_master` WRITE;
/*!40000 ALTER TABLE `user_master` DISABLE KEYS */;
INSERT INTO `user_master` VALUES ('533d0f92-9b35-4888-a051-674ec420d558','446ecb6f-1d02-450a-a9f9-e9740f65f311','e6e465fc-b76b-4fbc-9a27-626696c6c607','gooner','admin@goon.com','','$2b$10$dLKE/MUxFjaQMidEmElrVOf.dyHBM7VHPmiUAr9rxzvVrfuQdSHMW','EMAIL',NULL,0,NULL,NULL,'TENANT_ADMIN',NULL,NULL,NULL,NULL,NULL,'Asia/Kolkata','2026-07-23 02:09:17',NULL,0,NULL,1,'2026-07-23 05:53:04',NULL,NULL,NULL);
/*!40000 ALTER TABLE `user_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role_assignment`
--

DROP TABLE IF EXISTS `user_role_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role_assignment` (
  `assign_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `assigned_by` varchar(36) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT (now()),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`assign_id`),
  KEY `user_role_assignment_user_id_user_master_user_id_fk` (`user_id`),
  KEY `user_role_assignment_role_id_role_master_role_id_fk` (`role_id`),
  CONSTRAINT `user_role_assignment_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`role_id`) ON DELETE RESTRICT,
  CONSTRAINT `user_role_assignment_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role_assignment`
--

LOCK TABLES `user_role_assignment` WRITE;
/*!40000 ALTER TABLE `user_role_assignment` DISABLE KEYS */;
INSERT INTO `user_role_assignment` VALUES ('1a27c927-863b-4689-9e89-be03738ed7e8','533d0f92-9b35-4888-a051-674ec420d558','f5314bfe-dbcf-456b-933a-4db283434d58','533d0f92-9b35-4888-a051-674ec420d558','2026-07-23 10:42:18',NULL,1),('2a5d295c-d675-4bb8-96ed-f23c15aa51ee','533d0f92-9b35-4888-a051-674ec420d558','0d56d220-6229-41b7-9b5d-954968da5f7c','533d0f92-9b35-4888-a051-674ec420d558','2026-07-23 11:22:38',NULL,1);
/*!40000 ALTER TABLE `user_role_assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `tenant_geern`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `tenant_geern` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `tenant_geern`;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'4bf53d05ae92af32b6ff5f5b7c733dca1ac38d47cf1657b0035baadf39d0349e',1783337224502);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `audit_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_name` varchar(100) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`audit_id`),
  KEY `audit_log_company_id_company_master_company_id_fk` (`company_id`),
  KEY `audit_log_user_id_user_master_user_id_fk` (`user_id`),
  CONSTRAINT `audit_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `audit_log_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES ('24879002-d400-4c9f-b682-7f45a27a5e52','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','f53dcccc-7b74-11f1-b68b-a243673cf829','LOGIN','USER','f53dcccc-7b74-11f1-b68b-a243673cf829',NULL,NULL,NULL,NULL,'2026-07-23 07:31:02'),('277b7046-368e-44cb-bff0-4ca582986302','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-20 07:57:32'),('41bfd2de-9cf8-4964-95c7-13311dfacc6c','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000',NULL,'UPDATE_COMPANY','COMPANY','00000000-0000-0000-0000-000000000000',NULL,'{\"tax_id\": \"512513515315\", \"tenant_id\": \"3e6adab1-c6c5-4114-be76-9d1239e481d6\", \"company_id\": \"00000000-0000-0000-0000-000000000000\", \"company_code\": \"HIMA\", \"company_name\": \"Placeholder Company\", \"company_type\": \"Pvt Ltd\", \"industry_type\": \"Poultry Farming\", \"registration_no\": \"768765712512\", \"primary_color_hex\": \"#1F4E79\", \"company_display_name\": \"HIMA\"}',NULL,NULL,'2026-07-20 08:00:33'),('5ecc03f7-1745-4e96-9b56-c408ff023418','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-09 09:08:13'),('62205b26-b36a-451c-b696-d00d9ccea853','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-09 09:04:55'),('67dbc887-d605-4171-a29f-04bd0e04d04b','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-20 09:09:29'),('7afa0b79-51fb-43cb-9ef8-75c18a7a1c88','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-22 09:27:38'),('9101a743-03d2-49ef-97c5-85fc24d43d18','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','d78e3670-c753-4c56-a7ed-a8fec8af1fdf','LOGIN','USER','d78e3670-c753-4c56-a7ed-a8fec8af1fdf',NULL,NULL,NULL,NULL,'2026-07-20 09:04:52'),('9daffc03-7b4e-4b8e-82c7-eadd3a0f42af','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','d78e3670-c753-4c56-a7ed-a8fec8af1fdf','LOGIN','USER','d78e3670-c753-4c56-a7ed-a8fec8af1fdf',NULL,NULL,NULL,NULL,'2026-07-20 09:11:04'),('acfbf3d6-42b6-4189-b19f-626d7b6fc48e','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-09 09:03:00'),('b6f44a7f-84c2-4ff7-9c79-2dd968eef506','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','f53dcccc-7b74-11f1-b68b-a243673cf829','LOGIN','USER','f53dcccc-7b74-11f1-b68b-a243673cf829',NULL,NULL,NULL,NULL,'2026-07-09 09:08:09'),('bdda1240-5ed0-4a6c-95ae-f740accd32d3','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000',NULL,'CREATE_ROLE','ROLE','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d',NULL,'{\"roleCode\": \"SUPERVISOR\", \"roleName\": \"Supervisor\", \"description\": \"manager of workers\"}',NULL,NULL,'2026-07-20 09:06:43'),('be34267c-285a-452b-9d74-9f61b29d4e02','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-08-10 10:06:16'),('c57e20f4-40a4-48cf-bd74-2223f25b0644','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','f53dcccc-7b74-11f1-b68b-a243673cf829','LOGIN','USER','f53dcccc-7b74-11f1-b68b-a243673cf829',NULL,NULL,NULL,NULL,'2026-07-09 09:03:00'),('c681db90-3e65-4c9f-9259-9d0b769cd9db','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','f53dcccc-7b74-11f1-b68b-a243673cf829','LOGIN','USER','f53dcccc-7b74-11f1-b68b-a243673cf829',NULL,NULL,NULL,NULL,'2026-07-22 09:28:16'),('d7344153-d146-4257-aad7-0b481590ec56','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','f53dcccc-7b74-11f1-b68b-a243673cf829','LOGIN','USER','f53dcccc-7b74-11f1-b68b-a243673cf829',NULL,NULL,NULL,NULL,'2026-07-23 05:37:43'),('da3581d5-a27b-4b15-8514-bffa16cc9bb8','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-09 09:08:09'),('dc757a1e-e26d-44ee-bcc9-bdc4654eb073','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000',NULL,'UPDATE_PERMISSIONS','ROLE','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d',NULL,'{\"permissionsCount\": 8}',NULL,NULL,'2026-07-20 09:07:38'),('f925faa7-d0cd-4521-9ccc-3637e45f2acd','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','f53dcccc-7b74-11f1-b68b-a243673cf829','LOGIN','USER','f53dcccc-7b74-11f1-b68b-a243673cf829',NULL,NULL,NULL,NULL,'2026-07-22 09:27:55'),('fa107a74-79c5-4ce0-822a-289af9432b6e','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-23 07:30:54'),('fe71cc6d-a0f7-404c-9a51-44a7bb3fbdee','3e6adab1-c6c5-4114-be76-9d1239e481d6','00000000-0000-0000-0000-000000000000','dcbd9a39-202b-4be4-9417-9ac256619a79','LOGIN','USER','dcbd9a39-202b-4be4-9417-9ac256619a79',NULL,NULL,NULL,NULL,'2026-07-09 09:11:05');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `breed_master`
--

DROP TABLE IF EXISTS `breed_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `breed_master` (
  `breed_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `breed_code` varchar(50) NOT NULL,
  `breed_name` varchar(100) NOT NULL,
  `species` varchar(100) NOT NULL,
  `breed_type` varchar(50) NOT NULL,
  `avg_growth_rate_g_day` decimal(10,4) DEFAULT NULL,
  `avg_fcr` decimal(8,4) DEFAULT NULL,
  `avg_mortality_pct` decimal(6,2) DEFAULT NULL,
  `avg_lay_rate_pct` decimal(6,2) DEFAULT NULL,
  `incubation_days` int DEFAULT NULL,
  `gestation_days` int DEFAULT NULL,
  `avg_litter_size` decimal(6,2) DEFAULT NULL,
  `mature_age_months` int DEFAULT NULL,
  `productive_life_months` int DEFAULT NULL,
  `premature_years` decimal(5,2) DEFAULT NULL,
  `avg_yield_per_unit` decimal(10,4) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`breed_id`),
  KEY `breed_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `breed_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `breed_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `breed_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `breed_master`
--

LOCK TABLES `breed_master` WRITE;
/*!40000 ALTER TABLE `breed_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `breed_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_address`
--

DROP TABLE IF EXISTS `company_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_address` (
  `address_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `address_type` varchar(30) NOT NULL DEFAULT 'REGISTERED',
  `address_label` varchar(100) DEFAULT NULL,
  `line1` varchar(200) NOT NULL,
  `line2` varchar(200) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state_id` varchar(36) NOT NULL,
  `country_id` varchar(36) NOT NULL,
  `pincode` varchar(20) NOT NULL,
  `gps_latitude` decimal(10,6) DEFAULT NULL,
  `gps_longitude` decimal(10,6) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`address_id`),
  KEY `company_address_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_address_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_address`
--

LOCK TABLES `company_address` WRITE;
/*!40000 ALTER TABLE `company_address` DISABLE KEYS */;
INSERT INTO `company_address` VALUES ('f4959553-7042-4ea7-9f25-822c9828dd79','00000000-0000-0000-0000-000000000000','HEAD_OFFICE',NULL,'Main Gate','Orch Street','DELHI','singapore','India','18',28.704100,77.102500,1,1);
/*!40000 ALTER TABLE `company_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_contacts`
--

DROP TABLE IF EXISTS `company_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_contacts` (
  `contact_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `contact_type` varchar(30) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `phone_primary` varchar(30) DEFAULT NULL,
  `phone_secondary` varchar(30) DEFAULT NULL,
  `receives_alerts` tinyint(1) NOT NULL DEFAULT '0',
  `receives_reports` tinyint(1) NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`contact_id`),
  KEY `company_contacts_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_contacts_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_contacts`
--

LOCK TABLES `company_contacts` WRITE;
/*!40000 ALTER TABLE `company_contacts` DISABLE KEYS */;
INSERT INTO `company_contacts` VALUES ('93555e02-72ee-4053-92eb-dcbf659a3a5a','00000000-0000-0000-0000-000000000000','PRIMARY','007 Bond','CEO','jams@bond.com','1234567890',NULL,1,0,1,1);
/*!40000 ALTER TABLE `company_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_currency_config`
--

DROP TABLE IF EXISTS `company_currency_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_currency_config` (
  `curr_config_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `currency_id` varchar(36) NOT NULL,
  `is_base` tinyint(1) NOT NULL DEFAULT '0',
  `is_reporting` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`curr_config_id`),
  KEY `company_currency_config_company_id_company_master_company_id_fk` (`company_id`),
  KEY `comp_curr_config_curr_id_fk` (`currency_id`),
  CONSTRAINT `comp_curr_config_curr_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE RESTRICT,
  CONSTRAINT `company_currency_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_currency_config`
--

LOCK TABLES `company_currency_config` WRITE;
/*!40000 ALTER TABLE `company_currency_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_currency_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_fiscal`
--

DROP TABLE IF EXISTS `company_fiscal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_fiscal` (
  `fiscal_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `fiscal_year_format` varchar(20) NOT NULL DEFAULT 'FY APR MAR',
  `fiscal_start_month` int NOT NULL DEFAULT '4',
  `fiscal_start_day` int NOT NULL DEFAULT '1',
  `current_fiscal_year` varchar(20) NOT NULL,
  `period_type` varchar(20) NOT NULL DEFAULT 'MONTHLY',
  `accounting_standard` varchar(20) NOT NULL DEFAULT 'IND AS',
  `depreciation_method` varchar(30) NOT NULL DEFAULT 'SLM',
  `inventory_valuation` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `gst_filing_frequency` varchar(20) DEFAULT NULL,
  `tax_audit_applicable` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`fiscal_id`),
  UNIQUE KEY `company_fiscal_company_id_unique` (`company_id`),
  CONSTRAINT `company_fiscal_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_fiscal`
--

LOCK TABLES `company_fiscal` WRITE;
/*!40000 ALTER TABLE `company_fiscal` DISABLE KEYS */;
INSERT INTO `company_fiscal` VALUES ('9f9aba87-5aba-48b5-89da-dd4187926616','00000000-0000-0000-0000-000000000000','FY APR-MAR',4,1,'2026-27','MONTHLY','Local GAAP','SLM','FIFO',NULL,0,1);
/*!40000 ALTER TABLE `company_fiscal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_language_config`
--

DROP TABLE IF EXISTS `company_language_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_language_config` (
  `config_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `set_by` varchar(36) DEFAULT NULL,
  `set_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`config_id`),
  KEY `company_language_config_company_id_company_master_company_id_fk` (`company_id`),
  KEY `company_language_config_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `company_language_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `company_language_config_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_language_config`
--

LOCK TABLES `company_language_config` WRITE;
/*!40000 ALTER TABLE `company_language_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_language_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_master`
--

DROP TABLE IF EXISTS `company_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_master` (
  `company_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `company_code` varchar(20) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `company_display_name` varchar(100) DEFAULT NULL,
  `company_type` varchar(30) NOT NULL,
  `industry_type` varchar(30) NOT NULL,
  `registration_no` varchar(100) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `tax_regime` varchar(20) DEFAULT 'STANDARD',
  `incorporation_date` date DEFAULT NULL,
  `financial_year_start` int NOT NULL DEFAULT '4',
  `base_currency_id` varchar(36) NOT NULL,
  `default_language_id` varchar(36) NOT NULL,
  `default_timezone_id` varchar(100) NOT NULL,
  `country_id` varchar(36) NOT NULL,
  `company_logo_url` varchar(500) DEFAULT NULL,
  `company_logo_dark_url` varchar(500) DEFAULT NULL,
  `primary_color_hex` varchar(7) NOT NULL DEFAULT '#1F4E79',
  `website` varchar(300) DEFAULT NULL,
  `email_domain` varchar(100) DEFAULT NULL,
  `support_email` varchar(200) DEFAULT NULL,
  `phone_primary` varchar(30) DEFAULT NULL,
  `is_multi_farm` tinyint(1) NOT NULL DEFAULT '0',
  `max_farm_locations` int NOT NULL DEFAULT '1',
  `onboarding_status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `created_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_master`
--

LOCK TABLES `company_master` WRITE;
/*!40000 ALTER TABLE `company_master` DISABLE KEYS */;
INSERT INTO `company_master` VALUES ('00000000-0000-0000-0000-000000000000','3e6adab1-c6c5-4114-be76-9d1239e481d6','HIMA','Placeholder Company','HIMA','Pvt Ltd','Poultry Farming','768765712512','512513515315','STANDARD',NULL,4,'20000000-2000-2000-2000-200000000001','10000000-1000-1000-1000-100000000001','Asia/Kolkata','IN',NULL,NULL,'#1F4E79',NULL,NULL,NULL,NULL,0,1,'COMPLETED',1,'2026-07-09 08:51:51',NULL,'2026-07-09 08:51:51',NULL);
/*!40000 ALTER TABLE `company_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_modules`
--

DROP TABLE IF EXISTS `company_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_modules` (
  `module_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `activated_on` date DEFAULT NULL,
  `activated_by` varchar(36) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `config_json` json DEFAULT NULL,
  PRIMARY KEY (`module_id`),
  KEY `company_modules_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `company_modules_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_modules`
--

LOCK TABLES `company_modules` WRITE;
/*!40000 ALTER TABLE `company_modules` DISABLE KEYS */;
INSERT INTO `company_modules` VALUES ('242c2cbe-b0b5-4173-8c98-ab5a777938ac','00000000-0000-0000-0000-000000000000','AQUA',1,'2026-07-20',NULL,NULL,NULL),('3b8203f4-73bf-457e-894b-9f8ea444f206','00000000-0000-0000-0000-000000000000','LIVESTOCK',1,'2026-07-20',NULL,NULL,NULL),('3e4d9ce2-9eb7-4932-8032-7bcee8e22a51','00000000-0000-0000-0000-000000000000','PLT_SLAUGHTER',1,'2026-07-20',NULL,NULL,NULL),('484c4cd7-1de6-49d7-b33b-a1d35b6baa1e','00000000-0000-0000-0000-000000000000','PLT_REARING',1,'2026-07-20',NULL,NULL,NULL),('5e201404-c9db-4e6a-b675-358b47d3f314','00000000-0000-0000-0000-000000000000','INSECT',1,'2026-07-20',NULL,NULL,NULL),('79eccfb8-f0c7-4e47-b002-df5e6671b75c','00000000-0000-0000-0000-000000000000','AGRI_SEEDS',1,'2026-07-20',NULL,NULL,NULL),('7d7f5f7f-1636-4c6f-8cb0-8407faec361d','00000000-0000-0000-0000-000000000000','INS_BEE',1,'2026-07-20',NULL,NULL,NULL),('86ac4f5a-efc0-4659-a7b1-51577db2e1da','00000000-0000-0000-0000-000000000000','AGRI_FRUIT',1,'2026-07-20',NULL,NULL,NULL),('9033465f-253c-4032-b04a-a805aa7e884b','00000000-0000-0000-0000-000000000000','AQA_FISH',1,'2026-07-20',NULL,NULL,NULL),('92e2bb5d-5d0d-4b7b-ab44-0b863f607a78','00000000-0000-0000-0000-000000000000','PLT_CB',1,'2026-07-20',NULL,NULL,NULL),('a4872bfb-ae66-479f-b561-921ef509d1f6','00000000-0000-0000-0000-000000000000','AGRI',1,'2026-07-20',NULL,NULL,NULL),('aa1a7b31-a0bf-46f8-89a9-7b7a3d986995','00000000-0000-0000-0000-000000000000','PLT_HATCHING',1,'2026-07-20',NULL,NULL,NULL),('badd224e-f9a9-4b5a-89f3-e638fd9ab9f7','00000000-0000-0000-0000-000000000000','AGRI_FLOWER',1,'2026-07-20',NULL,NULL,NULL),('c33a8f64-f9af-4a39-8e8a-5d57623ef3f2','00000000-0000-0000-0000-000000000000','PLT_LAYING',1,'2026-07-20',NULL,NULL,NULL),('cbd302ca-7ea7-461d-aba2-5e31251841bf','00000000-0000-0000-0000-000000000000','PRODUCTION',1,'2026-07-20',NULL,NULL,NULL),('d57a84a1-5ecc-49e3-bd03-a49e27eacd98','00000000-0000-0000-0000-000000000000','AQA_SLAUGHTER',1,'2026-07-20',NULL,NULL,NULL),('eb34b36b-557a-46b0-88ce-1af86a3d6dc1','00000000-0000-0000-0000-000000000000','POULTRY',1,'2026-07-20',NULL,NULL,NULL),('eeceb698-7910-4e23-a3a3-4a7bee7c9094','00000000-0000-0000-0000-000000000000','FEED_PROD',1,'2026-07-20',NULL,NULL,NULL),('f2413d44-d9f3-4d63-8e34-8c546cce149b','00000000-0000-0000-0000-000000000000','AGRI_CROP',1,'2026-07-20',NULL,NULL,NULL);
/*!40000 ALTER TABLE `company_modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_master`
--

DROP TABLE IF EXISTS `currency_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_master` (
  `currency_id` varchar(36) NOT NULL,
  `iso_code` char(3) NOT NULL,
  `currency_name` varchar(100) NOT NULL,
  `symbol` varchar(5) NOT NULL,
  `symbol_position` varchar(10) NOT NULL DEFAULT 'PREFIX',
  `decimal_places` int NOT NULL DEFAULT '2',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`currency_id`),
  UNIQUE KEY `currency_master_iso_code_unique` (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_master`
--

LOCK TABLES `currency_master` WRITE;
/*!40000 ALTER TABLE `currency_master` DISABLE KEYS */;
INSERT INTO `currency_master` VALUES ('20000000-2000-2000-2000-200000000001','INR','Indian Rupee','₹','PREFIX',2,1,1),('20000000-2000-2000-2000-200000000002','USD','US Dollar','$','PREFIX',2,0,1),('20000000-2000-2000-2000-200000000003','EUR','Euro','€','PREFIX',2,0,1);
/*!40000 ALTER TABLE `currency_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exchange_rate`
--

DROP TABLE IF EXISTS `exchange_rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_rate` (
  `rate_id` varchar(36) NOT NULL,
  `from_currency_id` varchar(36) NOT NULL,
  `to_currency_id` varchar(36) NOT NULL,
  `rate` decimal(18,6) NOT NULL,
  `rate_date` date NOT NULL,
  `rate_source` varchar(30) NOT NULL DEFAULT 'MANUAL',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`rate_id`),
  KEY `exchange_rate_from_currency_id_currency_master_currency_id_fk` (`from_currency_id`),
  KEY `exchange_rate_to_currency_id_currency_master_currency_id_fk` (`to_currency_id`),
  CONSTRAINT `exchange_rate_from_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`from_currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE CASCADE,
  CONSTRAINT `exchange_rate_to_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`to_currency_id`) REFERENCES `currency_master` (`currency_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exchange_rate`
--

LOCK TABLES `exchange_rate` WRITE;
/*!40000 ALTER TABLE `exchange_rate` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_attribute_master`
--

DROP TABLE IF EXISTS `item_attribute_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_attribute_master` (
  `attribute_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `attribute_code` varchar(50) NOT NULL,
  `attribute_name` varchar(100) NOT NULL,
  `data_type` varchar(20) NOT NULL,
  `list_values` json DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `affects_costing` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_variant` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`attribute_id`),
  KEY `item_attribute_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `item_attribute_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `item_attribute_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE CASCADE,
  CONSTRAINT `item_attribute_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_attribute_master`
--

LOCK TABLES `item_attribute_master` WRITE;
/*!40000 ALTER TABLE `item_attribute_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_attribute_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_attribute_values`
--

DROP TABLE IF EXISTS `item_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_attribute_values` (
  `value_id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `attribute_id` varchar(36) NOT NULL,
  `attribute_value` text NOT NULL,
  PRIMARY KEY (`value_id`),
  KEY `item_attribute_values_item_id_item_master_item_id_fk` (`item_id`),
  KEY `item_attr_vals_attr_id_fk` (`attribute_id`),
  CONSTRAINT `item_attr_vals_attr_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `item_attribute_master` (`attribute_id`) ON DELETE RESTRICT,
  CONSTRAINT `item_attribute_values_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_attribute_values`
--

LOCK TABLES `item_attribute_values` WRITE;
/*!40000 ALTER TABLE `item_attribute_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_master`
--

DROP TABLE IF EXISTS `item_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_master` (
  `item_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `item_type` varchar(30) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `uom_primary` varchar(20) NOT NULL,
  `uom_secondary` varchar(20) DEFAULT NULL,
  `uom_conversion_factor` decimal(18,6) DEFAULT NULL,
  `valuation_method` varchar(20) DEFAULT NULL,
  `standard_cost` decimal(18,6) DEFAULT NULL,
  `is_lot_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `is_serial_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `is_biological_asset` tinyint(1) NOT NULL DEFAULT '0',
  `is_biological_costing_method` varchar(30) DEFAULT NULL,
  `is_inventoriable` tinyint(1) NOT NULL DEFAULT '1',
  `min_stock_level` decimal(18,4) DEFAULT NULL,
  `max_stock_level` decimal(18,4) DEFAULT NULL,
  `reorder_level` decimal(18,4) DEFAULT NULL,
  `shelf_life_days` int DEFAULT NULL,
  `storage_temp_min` decimal(6,2) DEFAULT NULL,
  `storage_temp_max` decimal(6,2) DEFAULT NULL,
  `is_qr_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `qr_trigger_event` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  `created_by` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`item_id`),
  KEY `item_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `item_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `item_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `item_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_master`
--

LOCK TABLES `item_master` WRITE;
/*!40000 ALTER TABLE `item_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_master`
--

DROP TABLE IF EXISTS `language_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_master` (
  `lang_id` varchar(36) NOT NULL,
  `lang_code` varchar(10) NOT NULL,
  `lang_name_english` varchar(100) NOT NULL,
  `lang_name_native` varchar(100) NOT NULL,
  `script` varchar(30) NOT NULL,
  `is_rtl` tinyint(1) NOT NULL DEFAULT '0',
  `is_system_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `translation_coverage_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `date_format` varchar(30) NOT NULL DEFAULT 'DD/MM/YYYY',
  `number_format` varchar(20) NOT NULL DEFAULT 'IN',
  `decimal_separator` char(1) NOT NULL DEFAULT '.',
  `thousands_separator` char(1) NOT NULL DEFAULT ',',
  `flag_emoji` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`lang_id`),
  UNIQUE KEY `language_master_lang_code_unique` (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_master`
--

LOCK TABLES `language_master` WRITE;
/*!40000 ALTER TABLE `language_master` DISABLE KEYS */;
INSERT INTO `language_master` VALUES ('10000000-1000-1000-1000-100000000001','en','English','English','Latin',0,1,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000002','hi','Hindi','हिन्दी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL),('10000000-1000-1000-1000-100000000003','mr','Marathi','मराठी','Devanagari',0,0,1,0.00,'DD/MM/YYYY','IN','.',',',NULL);
/*!40000 ALTER TABLE `language_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_translations`
--

DROP TABLE IF EXISTS `language_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_translations` (
  `trans_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `translation_key` varchar(200) NOT NULL,
  `translation_value` text NOT NULL,
  `is_html` tinyint(1) NOT NULL DEFAULT '0',
  `is_auto_translated` tinyint(1) NOT NULL DEFAULT '0',
  `verified_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`trans_id`),
  KEY `language_translations_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `language_translations_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_translations`
--

LOCK TABLES `language_translations` WRITE;
/*!40000 ALTER TABLE `language_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `language_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lob_master`
--

DROP TABLE IF EXISTS `lob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lob_master` (
  `lob_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) NOT NULL,
  `lob_code` varchar(50) NOT NULL,
  `lob_name` varchar(100) NOT NULL,
  `costing_method_allowed` varchar(100) NOT NULL,
  `qc_required` varchar(10) NOT NULL DEFAULT 'NO',
  `qr_required` varchar(10) NOT NULL DEFAULT 'NO',
  `batch_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `scheduler_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
  `traceability_required` varchar(10) NOT NULL DEFAULT 'YES',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`lob_id`),
  UNIQUE KEY `lob_master_lob_code_unique` (`lob_code`),
  KEY `lob_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  CONSTRAINT `lob_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lob_master`
--

LOCK TABLES `lob_master` WRITE;
/*!40000 ALTER TABLE `lob_master` DISABLE KEYS */;
INSERT INTO `lob_master` VALUES ('07b2de20-a304-4b53-b4eb-0e41123a91db','11111111-1111-1111-1111-111111111111','PLT_LAYING','Laying','STANDARD,FIFO,BIO_ASSET,AVG','NO','NO','YES','YES','YES','Laying hens producing eggs',2,1,1,NULL,NULL,NULL),('2a362ff0-798c-4727-97b8-d6e8abb9788d','22222222-2222-2222-2222-222222222222','LVS_PIGGERY','Piggery','STANDARD,FIFO,BIO_ASSET,AVG','YES','NO','YES','YES','YES','Piggery rearing and growout',9,1,1,NULL,NULL,NULL),('2ad69bb6-b984-4728-8a89-3424f116670a','55555555-5555-5555-5555-555555555555','INS_BEE','Bee Keeping','STANDARD,FIFO,BIO_ASSET','YES','NO','YES','YES','NO','Honey apiaries',16,1,1,NULL,NULL,NULL),('2dfab306-9ab7-47c4-867a-0c0d2cbcdcee','44444444-4444-4444-4444-444444444444','AQA_SLAUGHTER','Aqua Slaughter','STANDARD,FIFO','YES','YES','YES','YES','YES','Aqua filleting and processing',15,1,1,NULL,NULL,NULL),('34e4b50a-2ac7-4d7e-bff5-367cc3b6a10d','11111111-1111-1111-1111-111111111111','PLT_CB','CB Farming (Broiler)','STANDARD,FIFO','NO','NO','YES','YES','YES','Commercial broiler batch growout',4,1,1,NULL,NULL,NULL),('3533f9ef-57dc-41ce-8cce-37285867c675','22222222-2222-2222-2222-222222222222','LVS_SLAUGHTER','Livestock Slaughtering','STANDARD,FIFO,AVG','YES','YES','YES','YES','YES','Slaughter line',8,1,1,NULL,NULL,NULL),('43b11b0b-b76d-4bf0-a21f-b5ebadbd4c2e','66666666-6666-6666-6666-666666666666','FEED_PROD','Feed Production (BOR)','STANDARD,FIFO','YES','YES','YES','YES','YES','Feed Mill compounding',17,1,1,NULL,NULL,NULL),('4ef5479e-e5cd-4307-b60c-fb5c5ea5faca','33333333-3333-3333-3333-333333333333','AGRI_FRUIT','Fruit Farming','STANDARD,BIO_ASSET','YES','YES','YES','YES','YES','Bearer plants orchard management',10,1,1,NULL,NULL,NULL),('528eb1ac-461d-428c-910f-f48eccd30bbc','11111111-1111-1111-1111-111111111111','PLT_SLAUGHTER','Poultry Slaughter','STANDARD,FIFO','YES','YES','YES','YES','YES','Processing line and joint cost splits',5,1,1,NULL,NULL,NULL),('6666f388-5a7e-481f-8dc8-08ebdced12a0','11111111-1111-1111-1111-111111111111','PLT_REARING','Rearing & Breeding','STANDARD,FIFO,BIO_ASSET,AVG','NO','NO','YES','YES','YES','Rearing and breeding layer/breeder parent flocks',1,1,1,NULL,NULL,NULL),('7a763d80-da73-4c38-a5be-1868c6ce611c','22222222-2222-2222-2222-222222222222','LVS_MILKING','Milking operations','STANDARD,FIFO,BIO_ASSET,AVG','YES','NO','YES','YES','YES','Milking operations',7,1,1,NULL,NULL,NULL),('86b60d9b-504d-4ed5-b83b-52a2da8e7491','33333333-3333-3333-3333-333333333333','AGRI_SEEDS','Seeds','STANDARD,FIFO','YES','YES','YES','YES','YES','Seeds processing',13,1,1,NULL,NULL,NULL),('9a576d2b-5063-43f6-8e74-1f13cd15cbc8','33333333-3333-3333-3333-333333333333','AGRI_FLOWER','Flower Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Flower harvest stems',12,1,1,NULL,NULL,NULL),('9f858f70-44bc-4503-8153-9d9c3bbc0ac1','11111111-1111-1111-1111-111111111111','PLT_HATCHING','Hatching','STANDARD,FIFO','NO','NO','YES','YES','YES','Incubator & hatching operations',3,1,1,NULL,NULL,NULL),('d6ff6308-ea1b-4ee8-b036-d513779a366d','44444444-4444-4444-4444-444444444444','AQA_FISH','Fish Farming','STANDARD,FIFO,BIO_ASSET','YES','NO','YES','YES','YES','Fish ponds growout',14,1,1,NULL,NULL,NULL),('e8f2e5ef-0522-4639-8ab5-a23d172dfcce','33333333-3333-3333-3333-333333333333','AGRI_CROP','Crop Farming','STANDARD,FIFO','YES','YES','YES','YES','YES','Seasonal grain / crop batch',11,1,1,NULL,NULL,NULL),('ecb38d4e-5de8-42ed-8c5d-7f3555aee967','22222222-2222-2222-2222-222222222222','LVS_BREEDING','Livestock Breeding','STANDARD,FIFO,BIO_ASSET,AVG','YES','NO','YES','YES','YES','Breeding livestock herds',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `lob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_master`
--

DROP TABLE IF EXISTS `location_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_master` (
  `location_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `location_code` varchar(50) NOT NULL,
  `location_name` varchar(200) NOT NULL,
  `location_level` int NOT NULL,
  `location_type` varchar(50) NOT NULL,
  `parent_location_id` varchar(36) DEFAULT NULL,
  `area_size` decimal(18,4) DEFAULT NULL,
  `area_unit` varchar(10) DEFAULT NULL,
  `max_capacity` decimal(18,4) DEFAULT NULL,
  `capacity_uom` varchar(20) DEFAULT NULL,
  `current_count` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `gps_latitude` decimal(10,8) DEFAULT NULL,
  `gps_longitude` decimal(11,8) DEFAULT NULL,
  `storage_type` varchar(30) DEFAULT NULL,
  `is_quarantine_zone` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `location_master_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `location_master_lob_id_lob_master_lob_id_fk` (`lob_id`),
  KEY `loc_master_parent_loc_id_fk` (`parent_location_id`),
  CONSTRAINT `loc_master_parent_loc_id_fk` FOREIGN KEY (`parent_location_id`) REFERENCES `location_master` (`location_id`) ON DELETE RESTRICT,
  CONSTRAINT `location_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE RESTRICT,
  CONSTRAINT `location_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_master`
--

LOCK TABLES `location_master` WRITE;
/*!40000 ALTER TABLE `location_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `location_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_lob_extension_config`
--

DROP TABLE IF EXISTS `nob_lob_extension_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_lob_extension_config` (
  `config_id` varchar(36) NOT NULL,
  `nob_id` varchar(36) DEFAULT NULL,
  `lob_id` varchar(36) DEFAULT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` varchar(200) NOT NULL,
  `data_type` varchar(30) NOT NULL,
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`config_id`),
  KEY `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` (`nob_id`),
  KEY `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` (`lob_id`),
  CONSTRAINT `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master` (`lob_id`) ON DELETE CASCADE,
  CONSTRAINT `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master` (`nob_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_lob_extension_config`
--

LOCK TABLES `nob_lob_extension_config` WRITE;
/*!40000 ALTER TABLE `nob_lob_extension_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `nob_lob_extension_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nob_master`
--

DROP TABLE IF EXISTS `nob_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nob_master` (
  `nob_id` varchar(36) NOT NULL,
  `nob_code` varchar(50) NOT NULL,
  `nob_name` varchar(100) NOT NULL,
  `default_costing_method` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `description` text,
  `sort_order` int DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` date DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`nob_id`),
  UNIQUE KEY `nob_master_nob_code_unique` (`nob_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nob_master`
--

LOCK TABLES `nob_master` WRITE;
/*!40000 ALTER TABLE `nob_master` DISABLE KEYS */;
INSERT INTO `nob_master` VALUES ('11111111-1111-1111-1111-111111111111','POULTRY','Poultry','STANDARD','Birds - broiler, layer, breeder, hatchery',1,1,1,NULL,NULL,NULL),('22222222-2222-2222-2222-222222222222','LIVESTOCK','Livestock','BIO_ASSET','Animals - cattle, piggery, goat, sheep',2,1,1,NULL,NULL,NULL),('33333333-3333-3333-3333-333333333333','AGRI','Agriculture','BIO_ASSET','Crops, fruits, flowers, seeds',3,1,1,NULL,NULL,NULL),('44444444-4444-4444-4444-444444444444','AQUA','Aquaculture','BIO_ASSET','Fish, shrimp, other aquatic',4,1,1,NULL,NULL,NULL),('55555555-5555-5555-5555-555555555555','INSECT','Insect Farming','STANDARD','Bee keeping, black soldier fly',5,1,1,NULL,NULL,NULL),('66666666-6666-6666-6666-666666666666','PRODUCTION','Feed & Processing','STANDARD','Feed mill, processing plant',6,1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `nob_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_config`
--

DROP TABLE IF EXISTS `notification_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_config` (
  `notif_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `channel` varchar(20) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `smtp_host` varchar(200) DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_user` varchar(200) DEFAULT NULL,
  `smtp_password_enc` text,
  `from_email` varchar(200) DEFAULT NULL,
  `from_name` varchar(100) DEFAULT NULL,
  `sms_provider` varchar(30) DEFAULT NULL,
  `sms_api_key_enc` text,
  `sms_sender_id` varchar(20) DEFAULT NULL,
  `push_fcm_key_enc` text,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_secret_enc` text,
  `test_sent_at` timestamp NULL DEFAULT NULL,
  `test_status` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`notif_id`),
  KEY `notification_config_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `notification_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_config`
--

LOCK TABLES `notification_config` WRITE;
/*!40000 ALTER TABLE `notification_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_master`
--

DROP TABLE IF EXISTS `role_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_master` (
  `role_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `role_description` text,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`role_id`),
  KEY `role_master_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `role_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_master`
--

LOCK TABLES `role_master` WRITE;
/*!40000 ALTER TABLE `role_master` DISABLE KEYS */;
INSERT INTO `role_master` VALUES ('1c7f0d60-79df-4c3d-8fd3-39651badcf16','00000000-0000-0000-0000-000000000000','SUPER_ADMIN','Super Administrator','Full administrative control over all company scopes',1,1),('3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','00000000-0000-0000-0000-000000000000','SUPERVISOR','Supervisor','manager of workers',0,1);
/*!40000 ALTER TABLE `role_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `perm_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `module_code` varchar(50) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT '0',
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_edit` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  `can_approve` tinyint(1) NOT NULL DEFAULT '0',
  `can_export` tinyint(1) NOT NULL DEFAULT '0',
  `can_print` tinyint(1) NOT NULL DEFAULT '0',
  `field_restrictions` json DEFAULT NULL,
  PRIMARY KEY (`perm_id`),
  KEY `role_permissions_role_id_role_master_role_id_fk` (`role_id`),
  CONSTRAINT `role_permissions_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`role_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('2191f0da-0785-4a5b-9502-c9046ab9cd15','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','RBAC','ROLE',0,0,0,0,0,0,0,NULL),('322e10b9-3729-4555-8d9b-aa434f49f770','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','POULTRY','BATCH_CONTROL',1,1,1,1,1,0,0,NULL),('5126db30-0e12-40c0-abb7-52bbeaf52bec','1c7f0d60-79df-4c3d-8fd3-39651badcf16','ALL','ALL',1,1,1,1,1,1,1,NULL),('5ac23967-580d-4ae2-8c5c-5e07c25b9bcc','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','NOTIFICATION','SETTINGS',0,0,0,0,0,0,0,NULL),('6c894691-0dd3-43be-961c-83732a726886','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','AUDIT','LOGS',0,0,0,0,0,0,0,NULL),('8641a7c1-a29b-45b9-996c-f4bd385a9c9b','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','COMPANY','SETTINGS',1,0,0,0,0,0,0,NULL),('b14c9619-6db7-460f-ab7c-5869f5fbc223','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','FINANCE','VALUATION',1,1,1,1,1,0,0,NULL),('bcd01822-2198-4bfd-a9ec-14811497562b','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','ACCOUNTING','LEDGER',1,1,1,1,1,0,0,NULL),('e06a5edf-1e3d-4923-9848-b8439fd833b2','3cb652e3-77e0-460d-b7f0-fb9053fb3f6d','POULTRY','FEED_LOGS',1,1,1,1,1,0,0,NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_step_master`
--

DROP TABLE IF EXISTS `setup_step_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_step_master` (
  `step_id` varchar(36) NOT NULL,
  `step_code` varchar(50) NOT NULL,
  `step_name` varchar(100) NOT NULL,
  `step_description` text,
  `step_order` int NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `step_category` varchar(30) NOT NULL,
  `estimated_minutes` int DEFAULT NULL,
  `help_url` varchar(300) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `setup_step_master_step_code_unique` (`step_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_step_master`
--

LOCK TABLES `setup_step_master` WRITE;
/*!40000 ALTER TABLE `setup_step_master` DISABLE KEYS */;
INSERT INTO `setup_step_master` VALUES ('0463b4ba-cd85-4464-a0ee-6e8f6b63ce26','NOB_LOB_CONFIG','NOB & LOB Config',NULL,12,0,'CONFIG',NULL,NULL,1),('07cf6610-8de3-4113-a0d7-530dd212bd4b','BASE_CURRENCY','Base Currency',NULL,5,1,'LOCALIZATION',NULL,NULL,1),('090c7070-2f2a-4a0a-b1a9-71fc6720d1f1','DEFAULT_LANGUAGE','Default Language',NULL,4,1,'LOCALIZATION',NULL,NULL,1),('22e8ee4f-c787-4548-9ecf-5b9ec1c460ef','NOTIFICATION_SETTINGS','Notification Settings',NULL,14,0,'CONFIG',NULL,NULL,1),('259ea841-322f-4979-ab23-b25845f637b4','CHART_OF_ACCOUNTS','Chart of Accounts (COA)',NULL,11,0,'FINANCE',NULL,NULL,1),('3c9d4fad-dc9a-4a2d-a6b8-7290dedb0052','SETUP_COMPLETE','Setup Complete',NULL,15,0,'CONFIG',NULL,NULL,1),('4bb20456-76a3-45d8-9295-8b1afe3bdcb6','TEAM_MEMBERS','Invite Team Members',NULL,10,0,'SECURITY',NULL,NULL,1),('52d915ac-3c0a-4ee3-b2c9-c2b6d1e1b387','MASTER_DATA_LOAD','Master Data Load',NULL,13,0,'GENERAL',NULL,NULL,1),('6099fc74-dfc4-4e5a-ab9d-a7c7c0df2b39','ENABLE_MODULES','Enable Modules',NULL,8,1,'CONFIG',NULL,NULL,1),('65267a11-e09e-44a4-bc87-b485fd12f9e3','COMPANY_PROFILE','Company Profile',NULL,1,1,'GENERAL',NULL,NULL,1),('6863c43a-4108-4446-8c22-a848a8780e44','ADDRESS','Office Address',NULL,2,1,'GENERAL',NULL,NULL,1),('8214645f-6435-4105-86a7-00501a046234','FISCAL_YEAR','Fiscal Year & Accounting',NULL,7,1,'FINANCE',NULL,NULL,1),('937a5b0d-f85a-44ef-8220-5c65cd566d45','ADMIN_USER','Admin User Account',NULL,9,1,'SECURITY',NULL,NULL,1),('f262e531-537c-4326-937e-f38d904dc1af','TIMEZONE','Timezone & Region',NULL,6,1,'LOCALIZATION',NULL,NULL,1),('fa80ef54-adf3-453f-92e2-68a3d28eb01d','KEY_CONTACTS','Key Contacts',NULL,3,1,'GENERAL',NULL,NULL,1);
/*!40000 ALTER TABLE `setup_step_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setup_wizard_log`
--

DROP TABLE IF EXISTS `setup_wizard_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_wizard_log` (
  `log_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed_by` varchar(36) DEFAULT NULL,
  `attempt_count` int NOT NULL DEFAULT '0',
  `data_snapshot` json DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`log_id`),
  KEY `setup_wizard_log_company_id_company_master_company_id_fk` (`company_id`),
  KEY `setup_wizard_log_step_id_setup_step_master_step_id_fk` (`step_id`),
  CONSTRAINT `setup_wizard_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `setup_wizard_log_step_id_setup_step_master_step_id_fk` FOREIGN KEY (`step_id`) REFERENCES `setup_step_master` (`step_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setup_wizard_log`
--

LOCK TABLES `setup_wizard_log` WRITE;
/*!40000 ALTER TABLE `setup_wizard_log` DISABLE KEYS */;
INSERT INTO `setup_wizard_log` VALUES ('24b3187f-ff32-47c1-85d0-a5d678bf2922','00000000-0000-0000-0000-000000000000','8214645f-6435-4105-86a7-00501a046234','COMPLETED','2026-07-20 02:32:15',NULL,0,NULL,NULL),('32ecea7c-b404-4d32-bcfd-252094ac97d3','00000000-0000-0000-0000-000000000000','07cf6610-8de3-4113-a0d7-530dd212bd4b','COMPLETED','2026-07-20 02:32:03',NULL,0,NULL,NULL),('57d6ae44-09dd-46fc-a6c2-10f21cbc204e','00000000-0000-0000-0000-000000000000','3c9d4fad-dc9a-4a2d-a6b8-7290dedb0052','COMPLETED','2026-07-20 02:32:34',NULL,0,NULL,NULL),('5f6cfe1f-8762-4427-bd91-1035ea5ed850','00000000-0000-0000-0000-000000000000','f262e531-537c-4326-937e-f38d904dc1af','COMPLETED','2026-07-20 02:32:13',NULL,0,NULL,NULL),('62b016ad-015d-47b6-a201-b2a705cc6acf','00000000-0000-0000-0000-000000000000','6099fc74-dfc4-4e5a-ab9d-a7c7c0df2b39','COMPLETED','2026-07-20 02:32:32',NULL,0,NULL,NULL),('6d84548b-586b-4c51-aaff-6bc8b4811734','00000000-0000-0000-0000-000000000000','090c7070-2f2a-4a0a-b1a9-71fc6720d1f1','COMPLETED','2026-07-20 02:31:58',NULL,0,NULL,NULL),('89208b1a-b079-40d2-851c-2947931823bc','00000000-0000-0000-0000-000000000000','fa80ef54-adf3-453f-92e2-68a3d28eb01d','COMPLETED','2026-07-20 02:31:51',NULL,0,NULL,NULL),('a5352341-bf24-4ed6-aa37-c26aad98db66','00000000-0000-0000-0000-000000000000','6863c43a-4108-4446-8c22-a848a8780e44','COMPLETED','2026-07-20 02:31:07',NULL,0,NULL,NULL),('babb1f71-272a-476f-8cbe-a48594149567','00000000-0000-0000-0000-000000000000','65267a11-e09e-44a4-bc87-b485fd12f9e3','COMPLETED','2026-07-20 02:30:33',NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `setup_wizard_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom_conversion_master`
--

DROP TABLE IF EXISTS `uom_conversion_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom_conversion_master` (
  `conversion_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `item_id` varchar(36) DEFAULT NULL,
  `from_uom` varchar(20) NOT NULL,
  `to_uom` varchar(20) NOT NULL,
  `conversion_factor` decimal(18,8) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`conversion_id`),
  KEY `uom_conversion_master_item_id_item_master_item_id_fk` (`item_id`),
  CONSTRAINT `uom_conversion_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom_conversion_master`
--

LOCK TABLES `uom_conversion_master` WRITE;
/*!40000 ALTER TABLE `uom_conversion_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `uom_conversion_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uom_master`
--

DROP TABLE IF EXISTS `uom_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uom_master` (
  `uom_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) DEFAULT NULL,
  `uom_code` varchar(20) NOT NULL,
  `uom_name` varchar(100) NOT NULL,
  `uom_type` varchar(20) NOT NULL,
  `decimal_places` int NOT NULL DEFAULT '0',
  `is_base_uom` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `extension_config` json DEFAULT NULL,
  PRIMARY KEY (`uom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uom_master`
--

LOCK TABLES `uom_master` WRITE;
/*!40000 ALTER TABLE `uom_master` DISABLE KEYS */;
/*!40000 ALTER TABLE `uom_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_language_pref`
--

DROP TABLE IF EXISTS `user_language_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_language_pref` (
  `pref_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `lang_id` varchar(36) NOT NULL,
  `date_format_override` varchar(30) DEFAULT NULL,
  `number_format_override` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`pref_id`),
  KEY `user_language_pref_lang_id_language_master_lang_id_fk` (`lang_id`),
  CONSTRAINT `user_language_pref_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master` (`lang_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_language_pref`
--

LOCK TABLES `user_language_pref` WRITE;
/*!40000 ALTER TABLE `user_language_pref` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_language_pref` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_master`
--

DROP TABLE IF EXISTS `user_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_master` (
  `user_id` varchar(36) NOT NULL,
  `company_id` varchar(36) NOT NULL,
  `tenant_id` varchar(36) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(200) NOT NULL,
  `auth_provider` varchar(20) NOT NULL DEFAULT 'EMAIL',
  `auth_provider_id` varchar(200) DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `mfa_method` varchar(20) DEFAULT NULL,
  `mfa_secret` varchar(100) DEFAULT NULL,
  `user_type` varchar(20) NOT NULL DEFAULT 'STAFF',
  `employee_id` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `profile_photo_url` varchar(500) DEFAULT NULL,
  `lang_pref_id` varchar(36) DEFAULT NULL,
  `timezone_pref_id` varchar(100) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(50) DEFAULT NULL,
  `failed_login_count` int NOT NULL DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `invited_by` varchar(36) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_master_email_unique` (`email`),
  KEY `user_master_company_id_company_master_company_id_fk` (`company_id`),
  CONSTRAINT `user_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master` (`company_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_master`
--

LOCK TABLES `user_master` WRITE;
/*!40000 ALTER TABLE `user_master` DISABLE KEYS */;
INSERT INTO `user_master` VALUES ('d78e3670-c753-4c56-a7ed-a8fec8af1fdf','00000000-0000-0000-0000-000000000000','3e6adab1-c6c5-4114-be76-9d1239e481d6','com 1','com-1@gmail.com','1234567890','$2b$10$Bj5HtnW1r8IXfyZoaJo7bumpNgSoo8usqF4Snd4pQgrrE9mYal12e','EMAIL',NULL,0,NULL,NULL,'COMPANY_ADMIN',NULL,NULL,NULL,NULL,NULL,'Asia/Kolkata','2026-07-20 03:41:04',NULL,0,NULL,1,'2026-07-20 09:04:11',NULL,NULL,NULL),('dcbd9a39-202b-4be4-9417-9ac256619a79','00000000-0000-0000-0000-000000000000','3e6adab1-c6c5-4114-be76-9d1239e481d6','Nero','rgtheking01@gmail.com','','$2b$10$azDnJkuWdF5rYIH24s8cEuc4SlbqUh34RigZc.krwe5cYut4WceX6','EMAIL',NULL,0,NULL,NULL,'TENANT_ADMIN',NULL,NULL,NULL,NULL,NULL,'Asia/Kolkata','2026-08-10 04:36:16',NULL,0,NULL,1,'2026-07-09 08:51:51',NULL,NULL,NULL),('f2277747-ffb2-4479-a2de-11bacfaad87a','00000000-0000-0000-0000-000000000000','3e6adab1-c6c5-4114-be76-9d1239e481d6','wor 1','wor-1@gmail.com','1234567890','$2b$10$k5ZdUHXNB5kLlXhX4hM2K.MGD0EiV5CLrp7aW6kptoWTMQGyI4iua','EMAIL',NULL,0,NULL,NULL,'STANDARD_USER',NULL,NULL,NULL,NULL,NULL,'Asia/Kolkata',NULL,NULL,0,NULL,1,'2026-07-20 11:36:06',NULL,NULL,NULL),('f53dcccc-7b74-11f1-b68b-a243673cf829','00000000-0000-0000-0000-000000000000','3e6adab1-c6c5-4114-be76-9d1239e481d6','Risgur','risgur00@gmail.com','','$2b$10$azDnJkuWdF5rYIH24s8cEuc4SlbqUh34RigZc.krwe5cYut4WceX6','EMAIL',NULL,0,NULL,NULL,'TENANT_ADMIN',NULL,NULL,NULL,NULL,NULL,'Asia/Kolkata','2026-07-23 02:01:02',NULL,0,NULL,1,'2026-07-09 09:02:48',NULL,NULL,NULL);
/*!40000 ALTER TABLE `user_master` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role_assignment`
--

DROP TABLE IF EXISTS `user_role_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role_assignment` (
  `assign_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `assigned_by` varchar(36) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT (now()),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`assign_id`),
  KEY `user_role_assignment_user_id_user_master_user_id_fk` (`user_id`),
  KEY `user_role_assignment_role_id_role_master_role_id_fk` (`role_id`),
  CONSTRAINT `user_role_assignment_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master` (`role_id`) ON DELETE RESTRICT,
  CONSTRAINT `user_role_assignment_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role_assignment`
--

LOCK TABLES `user_role_assignment` WRITE;
/*!40000 ALTER TABLE `user_role_assignment` DISABLE KEYS */;
INSERT INTO `user_role_assignment` VALUES ('02ceaeca-c4a6-4ee7-98cf-42d1c85f3c07','f2277747-ffb2-4479-a2de-11bacfaad87a','1c7f0d60-79df-4c3d-8fd3-39651badcf16','f2277747-ffb2-4479-a2de-11bacfaad87a','2026-07-20 11:36:06',NULL,1),('b3a6f710-4fba-4812-8833-2ef4c475c7ca','d78e3670-c753-4c56-a7ed-a8fec8af1fdf','1c7f0d60-79df-4c3d-8fd3-39651badcf16','d78e3670-c753-4c56-a7ed-a8fec8af1fdf','2026-07-20 09:04:11',NULL,1);
/*!40000 ALTER TABLE `user_role_assignment` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-10 15:46:39
