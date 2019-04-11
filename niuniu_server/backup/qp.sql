/*
Navicat MySQL Data Transfer

Source Server         : 湖南牛牛正式
Source Server Version : 50633
Source Host           : 47.106.128.165:3306
Source Database       : qp

Target Server Type    : MYSQL
Target Server Version : 50633
File Encoding         : 65001

Date: 2018-10-18 18:20:32
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for cccq
-- ----------------------------
DROP TABLE IF EXISTS `cccq`;
CREATE TABLE `cccq` (
  `aa` varchar(255) CHARACTER SET gb2312 DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for dd_bank_log
-- ----------------------------
DROP TABLE IF EXISTS `dd_bank_log`;
CREATE TABLE `dd_bank_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(10) DEFAULT NULL,
  `userName` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `create_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for s_agecy
-- ----------------------------
DROP TABLE IF EXISTS `s_agecy`;
CREATE TABLE `s_agecy` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `account` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `password` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `area` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8 DEFAULT NULL COMMENT '//预留',
  `rate` int(11) DEFAULT '0' COMMENT '//等级预留',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for s_agecy_records
-- ----------------------------
DROP TABLE IF EXISTS `s_agecy_records`;
CREATE TABLE `s_agecy_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account` varchar(16) CHARACTER SET utf8 NOT NULL,
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `unionId` int(11) unsigned DEFAULT NULL,
  `type` int(2) unsigned DEFAULT NULL COMMENT '1.上分 2.下分',
  `coins` int(11) unsigned DEFAULT NULL,
  `time` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=56 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for s_agecy_tax
-- ----------------------------
DROP TABLE IF EXISTS `s_agecy_tax`;
CREATE TABLE `s_agecy_tax` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8 DEFAULT NULL,
  `coins` int(11) DEFAULT NULL,
  `rate` int(11) DEFAULT NULL,
  `tax1` int(11) DEFAULT NULL,
  `tax2` int(11) DEFAULT NULL,
  `time` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=21724 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for s_union_apply_list
-- ----------------------------
DROP TABLE IF EXISTS `s_union_apply_list`;
CREATE TABLE `s_union_apply_list` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `area` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `userId` int(11) unsigned DEFAULT NULL,
  `type` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `unionName` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `phone` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `wechatId` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `stat` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for s_union_list
-- ----------------------------
DROP TABLE IF EXISTS `s_union_list`;
CREATE TABLE `s_union_list` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `area` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `userId` int(11) unsigned DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8 DEFAULT NULL COMMENT '//预留位',
  `name` varchar(32) CHARACTER SET utf8 DEFAULT NULL COMMENT '//真实姓名',
  `unionName` varchar(32) CHARACTER SET utf8 DEFAULT NULL COMMENT '//公会名',
  `phone` varchar(16) CHARACTER SET utf8 DEFAULT NULL COMMENT '//手机号',
  `wechatId` varchar(32) CHARACTER SET utf8 DEFAULT NULL COMMENT '//微信号',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for s_union_score_detail
-- ----------------------------
DROP TABLE IF EXISTS `s_union_score_detail`;
CREATE TABLE `s_union_score_detail` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `area` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `userId` int(8) unsigned NOT NULL,
  `taxRate1` int(3) unsigned DEFAULT '50' COMMENT '//公会抽成税率',
  `taxRate2` int(3) unsigned DEFAULT '50' COMMENT '//平台抽成税率',
  `totalTax1` int(11) unsigned DEFAULT '0' COMMENT '//公会总抽成',
  `totalTax2` int(11) unsigned DEFAULT '0' COMMENT '//平台总抽成',
  `getTax` int(11) unsigned DEFAULT '0' COMMENT '//收取的税收',
  `agentTax` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_access
-- ----------------------------
DROP TABLE IF EXISTS `t_access`;
CREATE TABLE `t_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL COMMENT '权限名称',
  `mark` varchar(255) DEFAULT NULL COMMENT '权限标识',
  `pid` int(11) NOT NULL DEFAULT '0' COMMENT '上级权限id',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='*权限记录';

-- ----------------------------
-- Table structure for t_admin_log
-- ----------------------------
DROP TABLE IF EXISTS `t_admin_log`;
CREATE TABLE `t_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `create_time` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for t_admins
-- ----------------------------
DROP TABLE IF EXISTS `t_admins`;
CREATE TABLE `t_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `pass` varchar(255) DEFAULT NULL,
  `access` varchar(255) DEFAULT NULL COMMENT '权限',
  `last_ip` varchar(255) DEFAULT NULL COMMENT '最后登录IP',
  `last_time` int(11) NOT NULL DEFAULT '0' COMMENT '最后登录时间',
  `login_times` int(11) NOT NULL DEFAULT '0' COMMENT '登录次数',
  `super` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否超管',
  `pid` int(11) DEFAULT NULL,
  `childId` text,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='*管理员';

-- ----------------------------
-- Table structure for t_game_records
-- ----------------------------
DROP TABLE IF EXISTS `t_game_records`;
CREATE TABLE `t_game_records` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(32) CHARACTER SET utf8 NOT NULL,
  `roomId` char(8) CHARACTER SET utf8 DEFAULT NULL,
  `type` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `numOfGames` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  `userArr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  `scoreArr` varchar(128) CHARACTER SET utf8 DEFAULT NULL,
  `actionList` text CHARACTER SET utf8,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=22393 DEFAULT CHARSET=latin1;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for t_niuniu_rate
-- ----------------------------
DROP TABLE IF EXISTS `t_niuniu_rate`;
CREATE TABLE `t_niuniu_rate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(8) DEFAULT NULL,
  `rate` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for t_notify
-- ----------------------------
DROP TABLE IF EXISTS `t_notify`;
CREATE TABLE `t_notify` (
  `type` varchar(24) NOT NULL,
  `msg` varchar(1024) NOT NULL,
  `time` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for t_room_history
-- ----------------------------
DROP TABLE IF EXISTS `t_room_history`;
CREATE TABLE `t_room_history` (
  `uuid` varchar(32) CHARACTER SET utf8 NOT NULL,
  `roomId` char(8) CHARACTER SET utf8 NOT NULL,
  `type` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `numOfGames` varchar(6) CHARACTER SET utf8 DEFAULT NULL,
  `owner` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `time` varchar(14) CHARACTER SET utf8 DEFAULT NULL,
  `config` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `url` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `userId0` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name0` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score0` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  `userId1` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name1` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score1` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  `userId2` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name2` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score2` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  `userId3` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name3` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score3` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  `userId4` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name4` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score4` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  `userId5` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `name5` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score5` varchar(11) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_room_play
-- ----------------------------
DROP TABLE IF EXISTS `t_room_play`;
CREATE TABLE `t_room_play` (
  `roomId` varchar(8) CHARACTER SET utf8 NOT NULL,
  `type` varchar(10) CHARACTER SET utf8 DEFAULT NULL,
  `owner` int(8) NOT NULL,
  `numOfGames` int(11) DEFAULT NULL,
  `createTime` varchar(14) CHARACTER SET utf8 DEFAULT NULL,
  `config` varchar(256) CHARACTER SET utf8 DEFAULT NULL,
  `user_id0` int(8) DEFAULT NULL,
  `user_name0` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `user_score0` int(11) DEFAULT NULL,
  `user_id1` int(8) DEFAULT NULL,
  `user_name1` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `user_score1` int(11) DEFAULT NULL,
  `user_id2` int(8) DEFAULT NULL,
  `user_name2` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `user_score2` int(11) DEFAULT NULL,
  `user_id3` int(8) DEFAULT NULL,
  `user_name3` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `user_score3` int(11) DEFAULT NULL,
  `user_id4` int(8) DEFAULT NULL,
  `user_name4` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `user_score4` int(11) DEFAULT NULL,
  `user_id5` int(8) DEFAULT NULL,
  `user_name5` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `user_score5` int(11) DEFAULT NULL,
  `url` varchar(32) CHARACTER SET utf8 DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_union_create_limit
-- ----------------------------
DROP TABLE IF EXISTS `t_union_create_limit`;
CREATE TABLE `t_union_create_limit` (
  `area` varchar(16) CHARACTER SET utf8 NOT NULL,
  `userId` varchar(8) CHARACTER SET utf8 NOT NULL,
  `isLimit` tinyint(2) unsigned DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_union_list
-- ----------------------------
DROP TABLE IF EXISTS `t_union_list`;
CREATE TABLE `t_union_list` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(24) CHARACTER SET utf8 NOT NULL,
  `unionId` int(6) unsigned NOT NULL,
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `name` varchar(16) CHARACTER SET utf8 NOT NULL,
  `createTime` varchar(24) DEFAULT NULL,
  `notify` varchar(128) CHARACTER SET utf8 DEFAULT '',
  `coins` bigint(24) unsigned DEFAULT '0',
  `creator` varchar(8) CHARACTER SET utf8 DEFAULT NULL,
  `manager` text CHARACTER SET utf8,
  `member` text CHARACTER SET utf8,
  `admin` varchar(255) CHARACTER SET utf8 DEFAULT '' COMMENT '指派管理员',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_union_record
-- ----------------------------
DROP TABLE IF EXISTS `t_union_record`;
CREATE TABLE `t_union_record` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `unionId` int(6) unsigned NOT NULL,
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL COMMENT '//哪个区，服务器',
  `memberId` int(4) unsigned NOT NULL,
  `memberName` varchar(32) CHARACTER SET utf8 NOT NULL,
  `type` varchar(1) CHARACTER SET utf8 NOT NULL COMMENT '1.申请豆 2.贡献豆 3.领奖记录',
  `coins` int(11) unsigned NOT NULL COMMENT '豆数量（玩家，申请，贡献）',
  `time` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `stat` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=753 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_union_record_temp
-- ----------------------------
DROP TABLE IF EXISTS `t_union_record_temp`;
CREATE TABLE `t_union_record_temp` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `unionId` int(6) unsigned NOT NULL,
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL COMMENT '//哪个区，服务器',
  `memberId` int(4) unsigned NOT NULL,
  `memberName` varchar(32) CHARACTER SET utf8 NOT NULL,
  `type` varchar(1) CHARACTER SET utf8 NOT NULL COMMENT '1.申请入会 2.申请豆',
  `coins` int(11) unsigned NOT NULL COMMENT '豆数量（玩家，申请，贡献）',
  `time` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_union_user
-- ----------------------------
DROP TABLE IF EXISTS `t_union_user`;
CREATE TABLE `t_union_user` (
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `userId` int(8) NOT NULL,
  `unionId` int(8) NOT NULL,
  `apply` bigint(24) unsigned DEFAULT '0',
  `offer` bigint(24) unsigned DEFAULT '0',
  PRIMARY KEY (`userId`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_user_record
-- ----------------------------
DROP TABLE IF EXISTS `t_user_record`;
CREATE TABLE `t_user_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account` varchar(255) DEFAULT NULL COMMENT '操作用户',
  `userId` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `type` tinyint(3) NOT NULL DEFAULT '0' COMMENT '类型,1.上分 2.下分',
  `coins` int(11) DEFAULT '0' COMMENT '豆豆数量',
  `time` varchar(255) DEFAULT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=45 DEFAULT CHARSET=utf8 COMMENT='*用户上下分记录';

-- ----------------------------
-- Table structure for t_userinfo
-- ----------------------------
DROP TABLE IF EXISTS `t_userinfo`;
CREATE TABLE `t_userinfo` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` varchar(10) CHARACTER SET utf8 NOT NULL,
  `area` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `account` varchar(32) CHARACTER SET utf8 NOT NULL,
  `sign` varchar(32) CHARACTER SET utf8 DEFAULT NULL COMMENT '当作用户密码使用',
  `userName` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `sex` tinyint(3) unsigned DEFAULT '0' COMMENT '0未定义1男2女',
  `headImg` varchar(256) CHARACTER SET utf8 DEFAULT NULL COMMENT '用户头像地址',
  `lv` tinyint(3) unsigned DEFAULT '0',
  `exp` int(10) unsigned DEFAULT '0',
  `gems` int(10) unsigned DEFAULT '0',
  `coins` bigint(10) DEFAULT '0',
  `roomCard` int(10) unsigned DEFAULT '0',
  `createTime` varchar(24) CHARACTER SET utf8 DEFAULT NULL,
  `ip` varchar(16) CHARACTER SET utf8 DEFAULT NULL,
  `address` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `oldRoomId` varchar(10) CHARACTER SET utf8 DEFAULT NULL,
  `records` text CHARACTER SET utf8,
  `isBlack` tinyint(3) NOT NULL DEFAULT '0',
  `lastLogin` varchar(255) DEFAULT NULL,
  `watch` tinyint(3) NOT NULL DEFAULT '0' COMMENT '*是否监控',
  `reward` tinyint(3) NOT NULL DEFAULT '0' COMMENT '*显示在奖励列表',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=133 DEFAULT CHARSET=latin1;
