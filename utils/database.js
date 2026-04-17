/**
 * 本地存储操作模块
 * 使用 wx.setStorageSync / wx.getStorageSync 进行数据持久化
 * 日期统一使用 "yyyy-MM-dd" 字符串格式
 */

const STORAGE_KEYS = {
  TASKS: 'checkin_tasks',
  RECORDS: 'checkin_records',
  HOLIDAYS: 'checkin_holidays',
};

// ==================== 通用辅助 ====================

/**
 * 生成唯一ID
 * @returns {string} 唯一标识符
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 日期格式化：Date -> "yyyy-MM-dd"
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * 日期解析："yyyy-MM-dd" -> Date
 * @param {string} str 日期字符串
 * @returns {Date} 日期对象
 */
function parseDate(str) {
  if (!str || typeof str !== 'string') {
    return new Date();
  }
  const parts = str.split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

// ==================== 任务操作 ====================

/**
 * 获取所有任务
 * @returns {Array} 任务列表
 */
function getTasks() {
  try {
    return wx.getStorageSync(STORAGE_KEYS.TASKS) || [];
  } catch (e) {
    console.error('getTasks error:', e);
    return [];
  }
}

/**
 * 保存任务列表（全量覆盖）
 * @param {Array} tasks 任务列表
 */
function saveTasks(tasks) {
  try {
    wx.setStorageSync(STORAGE_KEYS.TASKS, tasks);
  } catch (e) {
    console.error('saveTasks error:', e);
  }
}

/**
 * 添加任务
 * @param {Object} task 任务对象 { name, frequency, isActive, ... }
 * @returns {Object} 带ID的任务对象
 */
function addTask(task) {
  const tasks = getTasks();
  const now = new Date();
  const defaultStartTime = formatDate(now);
  const defaultEndTime = formatDate(new Date(now.setDate(now.getDate() + 30)));
  const newTask = Object.assign({}, task, {
    id: generateId(),
    createdAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
    startTime: task.startTime || defaultStartTime,
    endTime: task.endTime || defaultEndTime,
  });
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

/**
 * 更新任务
 * @param {string} id 任务ID
 * @param {Object} updates 需要更新的字段
 * @returns {boolean} 是否更新成功
 */
function updateTask(id, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(function (t) { return t.id === id; });
  if (index === -1) {
    return false;
  }
  tasks[index] = Object.assign({}, tasks[index], updates, {
    updatedAt: formatDate(new Date()),
  });
  saveTasks(tasks);
  return true;
}

/**
 * 根据ID获取任务
 * @param {string} id 任务ID
 * @returns {Object|null} 任务对象或null
 */
function getTaskById(id) {
  const tasks = getTasks();
  return tasks.find(function (t) { return t.id === id; }) || null;
}

/**
 * 删除任务
 * @param {string} id 任务ID
 * @returns {boolean} 是否删除成功
 */
function deleteTask(id) {
  const tasks = getTasks();
  const filtered = tasks.filter(function (t) { return t.id !== id; });
  if (filtered.length === tasks.length) {
    return false;
  }
  saveTasks(filtered);
  return true;
}

// ==================== 打卡记录操作 ====================

/**
 * 获取所有记录
 * @returns {Array} 记录列表
 */
function getRecords() {
  try {
    return wx.getStorageSync(STORAGE_KEYS.RECORDS) || [];
  } catch (e) {
    console.error('getRecords error:', e);
    return [];
  }
}

/**
 * 保存记录列表（全量覆盖）
 * @param {Array} records 记录列表
 */
function saveRecords(records) {
  try {
    wx.setStorageSync(STORAGE_KEYS.RECORDS, records);
  } catch (e) {
    console.error('saveRecords error:', e);
  }
}

/**
 * 添加记录
 * @param {Object} record 记录对象 { taskId, date, status, ... }
 * @returns {Object} 带ID的记录对象
 */
function addRecord(record) {
  const records = getRecords();
  const newRecord = Object.assign({}, record, {
    id: generateId(),
    createdAt: formatDate(new Date()),
  });
  records.push(newRecord);
  saveRecords(records);
  return newRecord;
}

/**
 * 更新记录
 * @param {string} id 记录ID
 * @param {Object} updates 需要更新的字段
 * @returns {boolean} 是否更新成功
 */
function updateRecord(id, updates) {
  const records = getRecords();
  const index = records.findIndex(function (r) { return r.id === id; });
  if (index === -1) {
    return false;
  }
  records[index] = Object.assign({}, records[index], updates);
  saveRecords(records);
  return true;
}

/**
 * 获取某天某任务的记录
 * @param {string} date 日期字符串 "yyyy-MM-dd"
 * @param {string} taskId 任务ID
 * @returns {Object|null} 记录对象或null
 */
function getRecordByDateAndTask(date, taskId) {
  const records = getRecords();
  return records.find(function (r) {
    return r.date === date && r.taskId === taskId;
  }) || null;
}

/**
 * 获取某任务某月的记录
 * @param {string} taskId 任务ID
 * @param {number} year 年份
 * @param {number} month 月份 (1-12)
 * @returns {Array} 该月的记录列表
 */
function getRecordsByTaskAndMonth(taskId, year, month) {
  const records = getRecords();
  const prefix = year + '-' + String(month).padStart(2, '0') + '-';
  return records.filter(function (r) {
    return r.taskId === taskId && r.date && r.date.indexOf(prefix) === 0;
  });
}

/**
 * 获取某任务某日期范围的记录
 * @param {string} taskId 任务ID
 * @param {string} start 开始日期 "yyyy-MM-dd"
 * @param {string} end 结束日期 "yyyy-MM-dd"
 * @returns {Array} 该日期范围内的记录列表
 */
function getRecordsByTaskAndDateRange(taskId, start, end) {
  const records = getRecords();
  return records.filter(function (r) {
    return r.taskId === taskId && r.date >= start && r.date <= end;
  });
}

// ==================== 假日数据操作 ====================

/**
 * 获取所有假日数据
 * @returns {Array} 假日列表
 */
function getHolidays() {
  try {
    return wx.getStorageSync(STORAGE_KEYS.HOLIDAYS) || [];
  } catch (e) {
    console.error('getHolidays error:', e);
    return [];
  }
}

/**
 * 保存假日数据（全量覆盖）
 * @param {Array} holidays 假日列表
 */
function saveHolidays(holidays) {
  try {
    wx.setStorageSync(STORAGE_KEYS.HOLIDAYS, holidays);
  } catch (e) {
    console.error('saveHolidays error:', e);
  }
}

/**
 * 批量导入假日数据（合并去重）
 * @param {Array} newHolidays 新假日数据
 */
function importHolidays(newHolidays) {
  const existing = getHolidays();
  // 以日期为key去重
  var map = {};
  existing.forEach(function (h) {
    map[h.date] = h;
  });
  newHolidays.forEach(function (h) {
    map[h.date] = h;
  });
  var merged = [];
  for (var key in map) {
    if (map.hasOwnProperty(key)) {
      merged.push(map[key]);
    }
  }
  // 按日期排序
  merged.sort(function (a, b) {
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });
  saveHolidays(merged);
}

// ==================== 统计方法 ====================

/**
 * 计算连续打卡天数（从今天往前算）
 * @param {string} taskId 任务ID
 * @returns {number} 连续打卡天数
 */
function getStreakDays(taskId) {
  var records = getRecords();
  var taskRecords = records.filter(function (r) {
    return r.taskId === taskId && r.status === 'completed';
  });
  if (taskRecords.length === 0) {
    return 0;
  }

  // 构建已完成日期的集合
  var completedDates = {};
  taskRecords.forEach(function (r) {
    completedDates[r.date] = true;
  });

  // 从今天开始往前数连续天数
  var streak = 0;
  var today = new Date();
  var current = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  while (true) {
    var dateStr = formatDate(current);
    if (completedDates[dateStr]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 计算总完成率
 * @param {string} taskId 任务ID
 * @returns {number} 完成率 0~1
 */
function getCompletionRate(taskId) {
  var records = getRecords();
  var taskRecords = records.filter(function (r) {
    return r.taskId === taskId;
  });
  if (taskRecords.length === 0) {
    return 0;
  }
  var completed = taskRecords.filter(function (r) {
    return r.status === 'completed';
  }).length;
  return completed / taskRecords.length;
}

/**
 * 计算月完成率
 * @param {string} taskId 任务ID
 * @param {number} year 年份
 * @param {number} month 月份 (1-12)
 * @returns {number} 月完成率 0~1
 */
function getCompletionRateByMonth(taskId, year, month) {
  var records = getRecordsByTaskAndMonth(taskId, year, month);
  if (records.length === 0) {
    return 0;
  }
  var completed = records.filter(function (r) {
    return r.status === 'completed';
  }).length;
  return completed / records.length;
}

/**
 * 获取总打卡次数
 * @param {string} taskId 任务ID
 * @returns {number} 打卡次数
 */
function getTotalCheckIns(taskId) {
  var records = getRecords();
  return records.filter(function (r) {
    return r.taskId === taskId && r.status === 'completed';
  }).length;
}

/**
 * 导出所有任务数据
 * @returns {Object} 包含所有任务、记录和假日数据的对象
 */
function exportAllData() {
  return {
    tasks: getTasks(),
    records: getRecords(),
    holidays: getHolidays(),
    exportedAt: formatDate(new Date())
  };
}

/**
 * 导出数据为JSON文件
 * @param {function} success 成功回调
 * @param {function} fail 失败回调
 */
function exportToJsonFile(success, fail) {
  try {
    const allData = exportAllData();
    const jsonContent = JSON.stringify(allData, null, 2);
    const fileName = `checkin_backup_${Date.now()}.json`;
    const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    // 先保存到临时文件
    wx.getFileSystemManager().writeFile({
      filePath: tempFilePath,
      data: jsonContent,
      encoding: 'utf8',
      success: () => {
        // 使用文件管理器API让用户选择保存位置
        wx.saveFile({
          tempFilePath: tempFilePath,
          success: (res) => {
            console.log('文件保存成功:', res);
            success && success({ savedFilePath: res.savedFilePath, fileName });
          },
          fail: (err) => {
            console.error('文件保存失败:', err);
            fail && fail(err);
          }
        });
      },
      fail: (err) => {
        console.error('临时文件保存失败:', err);
        fail && fail(err);
      }
    });
  } catch (error) {
    console.error('导出失败:', error);
    fail && fail(error);
  }
}

/**
 * 导入数据
 * @param {object} importedData 导入的数据对象
 */
function importData(importedData) {
  try {
    // 导入任务数据
    if (importedData.tasks && Array.isArray(importedData.tasks)) {
      const existingTasks = getTasks();
      const newTasks = importedData.tasks.filter(task => 
        !existingTasks.some(existing => existing.id === task.id)
      );
      if (newTasks.length > 0) {
        saveTasks(existingTasks.concat(newTasks));
      }
    }
    
    // 导入记录数据
    if (importedData.records && Array.isArray(importedData.records)) {
      const existingRecords = getRecords();
      const newRecords = importedData.records.filter(record => 
        !existingRecords.some(existing => existing.id === record.id)
      );
      if (newRecords.length > 0) {
        saveRecords(existingRecords.concat(newRecords));
      }
    }
    
    // 导入假日数据
    if (importedData.holidays && Array.isArray(importedData.holidays)) {
      const existingHolidays = getHolidays();
      const newHolidays = importedData.holidays.filter(holiday => 
        !existingHolidays.some(existing => existing.date === holiday.date)
      );
      if (newHolidays.length > 0) {
        saveHolidays(existingHolidays.concat(newHolidays));
      }
    }
    
    console.log('数据导入成功');
  } catch (error) {
    console.error('数据导入失败:', error);
    throw error;
  }
}

// ==================== 导出 ====================

module.exports = {
  STORAGE_KEYS: STORAGE_KEYS,
  getTasks: getTasks,
  getTaskById: getTaskById,
  saveTasks: saveTasks,
  addTask: addTask,
  updateTask: updateTask,
  deleteTask: deleteTask,
  getRecords: getRecords,
  saveRecords: saveRecords,
  addRecord: addRecord,
  updateRecord: updateRecord,
  getRecordByDateAndTask: getRecordByDateAndTask,
  getRecordsByTaskAndMonth: getRecordsByTaskAndMonth,
  getRecordsByTaskAndDateRange: getRecordsByTaskAndDateRange,
  getHolidays: getHolidays,
  saveHolidays: saveHolidays,
  importHolidays: importHolidays,
  importData: importData,
  getStreakDays: getStreakDays,
  getCompletionRate: getCompletionRate,
  getCompletionRateByMonth: getCompletionRateByMonth,
  getTotalCheckIns: getTotalCheckIns,
  exportAllData: exportAllData,
  exportToJsonFile: exportToJsonFile,
  generateId: generateId,
  formatDate: formatDate,
  parseDate: parseDate,
};
