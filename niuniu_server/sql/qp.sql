/*
Navicat MySQL Data Transfer

Source Server         : localhost_3306
Source Server Version : 50719
Source Host           : localhost:3306
Source Database       : qp

Target Server Type    : MYSQL
Target Server Version : 50719
File Encoding         : 65001

Date: 2017-12-28 17:46:53
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
-- Records of cccq
-- ----------------------------
INSERT INTO `cccq` VALUES ('得到');

-- ----------------------------
-- Table structure for t_game_records
-- ----------------------------
DROP TABLE IF EXISTS `t_game_records`;
CREATE TABLE `t_game_records` (
  `uuid` varchar(32) NOT NULL,
  `roomId` char(8) DEFAULT NULL,
  `type` varchar(16) DEFAULT NULL,
  `numOfGames` varchar(2) DEFAULT NULL,
  `userArr` varchar(32) DEFAULT NULL,
  `scoreArr` varchar(64) DEFAULT NULL,
  `actionList` text CHARACTER SET latin1 COLLATE latin1_german1_ci,
  PRIMARY KEY (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of t_game_records
-- ----------------------------
INSERT INTO `t_game_records` VALUES ('1514363128512617234', '617234', 'gxmj', '1', '[\"10042\",\"10055\"]', '[-8,8]', '[{\"cmd\":57,\"result\":[{\"userId\":\"10042\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6]},{\"userId\":\"10055\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6,6]}]},{\"cmd\":62,\"result\":109},{\"cmd\":61,\"result\":1},{\"cmd\":58,\"result\":1},{\"cmd\":73,\"result\":{\"userId\":\"10055\",\"type\":\"zimo\",\"hupai\":-1}},{\"cmd\":62,\"result\":{\"results\":[{\"userId\":\"10042\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6],\"penggangs\":[],\"fan\":0,\"score\":-8,\"pattern\":\"7dui\",\"actions\":[]},{\"userId\":\"10055\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6,6],\"penggangs\":[],\"fan\":8,\"score\":8,\"pattern\":\"7dui\",\"actions\":[{\"type\":\"zimo\"}],\"qingyise\":1,\"tianhu\":1}],\"endInfo\":null}}]');
INSERT INTO `t_game_records` VALUES ('1514363334659889324', '889324', 'gxmj', '1', '[\"10042\",\"10055\"]', '[-8,8]', '[{\"cmd\":57,\"result\":[{\"userId\":\"10042\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6]},{\"userId\":\"10055\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6,6]}]},{\"cmd\":62,\"result\":109},{\"cmd\":61,\"result\":1},{\"cmd\":58,\"result\":1},{\"cmd\":73,\"result\":{\"userId\":\"10055\",\"type\":\"zimo\",\"hupai\":-1}},{\"cmd\":62,\"result\":{\"results\":[{\"userId\":\"10042\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6],\"penggangs\":[],\"fan\":0,\"score\":-8,\"pattern\":\"7dui\",\"actions\":[]},{\"userId\":\"10055\",\"holds\":[0,0,1,1,2,2,3,3,4,4,5,5,6,6],\"penggangs\":[],\"fan\":8,\"score\":8,\"pattern\":\"7dui\",\"actions\":[{\"type\":\"zimo\"}],\"qingyise\":1,\"tianhu\":1}],\"endInfo\":null}}]');

-- ----------------------------
-- Table structure for t_message
-- ----------------------------
DROP TABLE IF EXISTS `t_message`;
CREATE TABLE `t_message` (
  `type` varchar(32) NOT NULL,
  `msg` varchar(1024) NOT NULL,
  `version` varchar(32) NOT NULL,
  PRIMARY KEY (`type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of t_message
-- ----------------------------
INSERT INTO `t_message` VALUES ('notice', 'vsyou8,你来你就发~', '20161128');
INSERT INTO `t_message` VALUES ('fkgm', 'http://www.vsyou8.com/scmj<newline>唯一联系方式 1186129887@qq.com', '20161128');

-- ----------------------------
-- Table structure for t_room_history
-- ----------------------------
DROP TABLE IF EXISTS `t_room_history`;
CREATE TABLE `t_room_history` (
  `uuid` varchar(32) NOT NULL,
  `roomId` char(8) NOT NULL,
  `type` varchar(16) DEFAULT NULL,
  `numOfGame` varchar(6) DEFAULT NULL,
  `owner` varchar(8) DEFAULT NULL,
  `time` varchar(14) DEFAULT NULL,
  `config` varchar(256) DEFAULT NULL,
  `url` varchar(32) DEFAULT NULL,
  `userId0` varchar(8) DEFAULT NULL,
  `name0` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score0` varchar(11) DEFAULT NULL,
  `userId1` varchar(8) DEFAULT NULL,
  `name1` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score1` varchar(11) DEFAULT NULL,
  `userId2` varchar(8) DEFAULT NULL,
  `name2` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score2` varchar(11) DEFAULT NULL,
  `userId3` varchar(8) DEFAULT NULL,
  `name3` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `score3` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of t_room_history
-- ----------------------------
INSERT INTO `t_room_history` VALUES ('1514363128512617234', '617234', 'gxmj', '2/2', '10042', '1514363128512', '{\"type\":\"gxmj\",\"difen\":0,\"jushuxuanze\":0,\"playType\":1,\"fangfei\":0,\"zimodouble\":0,\"nogangscore\":0,\"gengpai\":0,\"roomNum\":2,\"maxGames\":2,\"guipai\":[]}', '192.168.0.109:10001', '10042', 'undefined', '0', '10055', 'undefined', '0', null, null, null, null, null, null);
INSERT INTO `t_room_history` VALUES ('1514363334659889324', '889324', 'gxmj', '2/2', '10042', '1514363334659', '{\"type\":\"gxmj\",\"difen\":0,\"jushuxuanze\":0,\"playType\":1,\"fangfei\":0,\"zimodouble\":0,\"nogangscore\":0,\"gengpai\":0,\"roomNum\":2,\"maxGames\":2,\"guipai\":[]}', '192.168.0.109:10001', '10042', 'undefined', '0', '10055', 'undefined', '0', null, null, null, null, null, null);

-- ----------------------------
-- Table structure for t_room_play
-- ----------------------------
DROP TABLE IF EXISTS `t_room_play`;
CREATE TABLE `t_room_play` (
  `roomId` char(8) NOT NULL,
  `type` varchar(10) DEFAULT NULL,
  `owner` int(8) NOT NULL,
  `numOfGames` smallint(2) DEFAULT NULL,
  `createTime` varchar(14) DEFAULT NULL,
  `config` varchar(256) DEFAULT NULL,
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
  `url` varchar(32) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of t_room_play
-- ----------------------------

-- ----------------------------
-- Table structure for t_userinfo
-- ----------------------------
DROP TABLE IF EXISTS `t_userinfo`;
CREATE TABLE `t_userinfo` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` varchar(10) NOT NULL,
  `account` varchar(32) NOT NULL,
  `sign` varchar(32) DEFAULT NULL COMMENT '当作用户密码使用',
  `userName` varchar(32) CHARACTER SET utf8 DEFAULT NULL,
  `sex` tinyint(3) unsigned DEFAULT NULL COMMENT '0未定义1男2女',
  `headImg` varchar(64) DEFAULT NULL COMMENT '用户头像地址',
  `lv` tinyint(3) unsigned DEFAULT NULL,
  `exp` int(10) unsigned DEFAULT NULL,
  `gems` int(10) unsigned DEFAULT NULL,
  `coins` bigint(10) unsigned DEFAULT NULL,
  `roomCard` int(10) unsigned DEFAULT NULL,
  `ip` varchar(16) DEFAULT NULL,
  `address` varchar(32) DEFAULT NULL,
  `oldRoomId` varchar(10) DEFAULT NULL,
  `records` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of t_userinfo
-- ----------------------------
INSERT INTO `t_userinfo` VALUES ('19', '10055', 'guest_2', null, 'guest_2', null, null, null, null, null, null, null, null, null, 'null', null);
INSERT INTO `t_userinfo` VALUES ('15', '10042', 'guest_1', null, 'werty得到', null, 'http://p1.so.qhimgs1.com/bdr/326__/t0141bdfe6e6cd2992d', null, null, '49990', '50000000', null, null, null, 'null', null);
INSERT INTO `t_userinfo` VALUES ('16', '10046', 'guest_1513423124091', null, 'hgjgk', null, 'http://p1.so.qhimgs1.com/bdr/326__/t0141bdfe6e6cd2992d', null, null, null, null, null, null, null, null, null);
INSERT INTO `t_userinfo` VALUES ('23', '10067', 'guest_3', null, 'guest_3', null, null, null, null, null, null, null, null, null, '283704', null);
