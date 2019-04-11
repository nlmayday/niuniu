/*
Navicat MySQL Data Transfer

Source Server         : 豆牛士
Source Server Version : 50543
Source Host           : 47.97.107.130:3306
Source Database       : qp

Target Server Type    : MYSQL
Target Server Version : 50543
File Encoding         : 65001

Date: 2018-03-09 16:00:53
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for t_niuniu_permission
-- ----------------------------
DROP TABLE IF EXISTS `t_niuniu_permission`;
CREATE TABLE `t_niuniu_permission` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `area` varchar(32) DEFAULT NULL,
  `userId` varchar(8) DEFAULT NULL,
  `times` int(11) unsigned DEFAULT '0' COMMENT '次数',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
