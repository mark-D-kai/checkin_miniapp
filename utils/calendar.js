/**
 * 日历引擎模块
 * 判断工作日、假日，管理假日缓存
 */

const db = require('./database.js');

/** @type {Object} 假日缓存，key为日期字符串，value为假日信息对象 */
let holidayCache = {};

/**
 * 初始化：从内置 JSON 加载假日数据（仅在本地无数据时）
 */
function init() {
  // 简化版初始化，不再处理假日数据
  holidayCache = {};
}

/**
 * 判断某天是否是工作日
 * 优先级：调休工作日 > 法定假日 > 普通周末判断
 * @param {string} dateStr 日期字符串 "yyyy-MM-dd"
 * @returns {boolean} 是否为工作日
 */
function isWorkday(dateStr) {
  // 简化工作日判断：周一到周五为工作日
  const date = new Date(dateStr);
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/**
 * 获取某天的假日信息
 * @param {string} dateStr 日期字符串 "yyyy-MM-dd"
 * @returns {Object|null} 假日信息对象或null
 */
function getHolidayInfo(dateStr) {
  return holidayCache[dateStr] || null;
}

/**
 * 获取某天应该打卡的任务列表
 * 根据任务频率（daily / workday）过滤
 * @param {string} dateStr 日期字符串 "yyyy-MM-dd"
 * @returns {Array} 需要打卡的任务列表
 */
function getTasksForDate(dateStr) {
  const tasks = db.getTasks().filter(function (t) { return t.isActive; });
  const workday = isWorkday(dateStr);
  return tasks.filter(function (t) {
    // 检查任务是否在有效期内
    const isInTimeRange = (!t.startTime || dateStr >= t.startTime) && (!t.endTime || dateStr <= t.endTime);
    if (!isInTimeRange) return false;
    
    if (t.frequency === 'daily') return true;
    if (t.frequency === 'workday') return workday;
    return false;
  });
}



/**
 * 清除缓存
 */
function clearCache() {
  holidayCache = {};
}

/**
 * 获取某月所有工作日
 * @param {number} year 年份
 * @param {number} month 月份 (1-12)
 * @returns {Array} 工作日日期字符串数组
 */
function getWorkdaysInMonth(year, month) {
  const workdays = [];
  // 获取该月的天数
  const daysInMonth = new Date(year, month, 0).getDate();
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    if (isWorkday(dateStr)) {
      workdays.push(dateStr);
    }
  }
  return workdays;
}

module.exports = {
  init: init,
  isWorkday: isWorkday,
  getHolidayInfo: getHolidayInfo,
  getTasksForDate: getTasksForDate,
  clearCache: clearCache,
  getWorkdaysInMonth: getWorkdaysInMonth,
};
