const db = require('../../utils/database.js');
const calendar = require('../../utils/calendar.js');

Page({
  data: {
    currentYear: 2026,
    currentMonth: 4,
    days: [],
    selectedDate: '',
    selectedRecords: {},
    tasks: [],
  },

  onLoad: function () {
    calendar.init();
    var now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
    });
    this.loadCalendar();
  },

  onShow: function () {
    this.loadCalendar();
  },

  /**
   * 生成当月日历数据
   */
  loadCalendar: function () {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;

    // 获取所有活跃任务并按中文名称排序（用于日历格子标记）
    var allTasks = (db.getTasks() || []).filter(t => t.isActive).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    
    // 初始化选中日期的任务列表（默认空）
    var selectedDateTasks = [];
    if (this.data.selectedDate) {
      selectedDateTasks = calendar.getTasksForDate(this.data.selectedDate);
    }
    
    this.setData({ 
      allTasks: allTasks, 
      tasks: selectedDateTasks 
    });

    // 获取所有记录，用于标记打卡状态
    var allRecords = db.getRecords();

    // 当月天数
    var daysInMonth = new Date(year, month, 0).getDate();
    // 当月第一天是周几（0=周日）
    var firstDayOfWeek = new Date(year, month - 1, 1).getDay();

    // 今天
    var now = new Date();
    var todayStr = db.formatDate(now);

    // 生成日历格子（6行7列 = 42格）
    var days = [];
    // 上月补齐
    var prevMonth = month === 1 ? 12 : month - 1;
    var prevYear = month === 1 ? year - 1 : year;
    var prevMonthDays = new Date(prevYear, prevMonth, 0).getDate();
    for (var i = 0; i < firstDayOfWeek; i++) {
      var day = prevMonthDays - firstDayOfWeek + 1 + i;
      var dateStr = prevYear + '-' + String(prevMonth).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      days.push({
        date: dateStr,
        day: day,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        isCurrentMonth: false,
        records: this.getRecordsForDate(allRecords, dateStr, allTasks),
      });
    }

    // 当月
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      days.push({
        date: dateStr,
        day: d,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        isCurrentMonth: true,
        records: this.getRecordsForDate(allRecords, dateStr, allTasks),
      });
    }

    // 下月补齐到42格
    var remaining = 42 - days.length;
    var nextMonth = month === 12 ? 1 : month + 1;
    var nextYear = month === 12 ? year + 1 : year;
    for (var j = 1; j <= remaining; j++) {
      var dateStr = nextYear + '-' + String(nextMonth).padStart(2, '0') + '-' + String(j).padStart(2, '0');
      days.push({
        date: dateStr,
        day: j,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        isCurrentMonth: false,
        records: this.getRecordsForDate(allRecords, dateStr, allTasks),
      });
    }

    this.setData({ days: days });

    // 如果有选中日期，刷新选中日期的记录
    if (this.data.selectedDate) {
      this.loadSelectedRecords(this.data.selectedDate);
    }
  },

  /**
   * 获取某天的打卡记录（按任务过滤，转换为taskId映射）
   */
  getRecordsForDate: function (allRecords, dateStr, tasks) {
    const taskIds = tasks.map(t => t.id);
    const dateRecords = (allRecords ?? []).filter(r => r.date === dateStr && taskIds.includes(r.taskId));
    // 初始化所有活跃任务的打卡状态为未记录
    const recordMap = Object.fromEntries(tasks.map(t => [t.id, 'none']));
    // 覆盖已有打卡记录的状态，处理未定义的状态值
    dateRecords.forEach(r => {
      recordMap[r.taskId] = r?.status || 'none';
    });
    return recordMap;
  },

  /**
   * 上个月
   */
  prevMonth: function () {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    if (month === 1) {
      year = year - 1;
      month = 12;
    } else {
      month = month - 1;
    }
    this.setData({
      currentYear: year,
      currentMonth: month,
      selectedDate: '',
      selectedRecords: [],
    });
    this.loadCalendar();
  },

  /**
   * 下个月
   */
  nextMonth: function () {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    if (month === 12) {
      year = year + 1;
      month = 1;
    } else {
      month = month + 1;
    }
    this.setData({
      currentYear: year,
      currentMonth: month,
      selectedDate: '',
      selectedRecords: [],
    });
    this.loadCalendar();
  },

  /**
   * 选择日期
   */
  selectDate: function (e) {
    var date = e.currentTarget.dataset.date;
    // 获取该日期应显示的任务列表
    var dateTasks = calendar.getTasksForDate(date);
    this.setData({ 
      selectedDate: date,
      tasks: dateTasks
    });
    this.loadSelectedRecords(date);
  },

  /**
   * 加载选中日期的打卡记录
   */
  loadSelectedRecords: function (date) {
    // 获取该日期应显示的任务列表（考虑任务频率）
    var tasks = calendar.getTasksForDate(date);
    var taskIds = tasks.map(function (t) { return t.id; });
    
    // 筛选出该日期且属于应显示任务的打卡记录
    var records = db.getRecords().filter(function (r) {
      return r.date === date && taskIds.includes(r.taskId);
    });
    
    // 附加任务名，构建以 taskId 为键的对象
    var recordMap = {};
    records.forEach(function (r) {
      var task = tasks.find(function (t) { return t.id === r.taskId; });
      recordMap[r.taskId] = {
        id: r.id,
        taskId: r.taskId,
        taskName: task ? task.name : '未知任务',
        status: r.status,
        note: r.note || '',
        date: r.date,
      };
    });
    this.setData({ selectedRecords: recordMap });
  },

  /**
   * 打卡操作
   */
  handleCheckIn: function (e) {
    var taskId = e.currentTarget.dataset.taskid;
    var date = this.data.selectedDate;
    if (!date) {
      wx.showToast({ title: '请先选择日期', icon: 'none' });
      return;
    }
    // 检查是否已有记录
    var existing = db.getRecordByDateAndTask(date, taskId);
    if (existing) {
      db.updateRecord(existing.id, { status: 'completed' });
    } else {
      db.addRecord({
        taskId: taskId,
        date: date,
        status: 'completed',
        note: '',
      });
    }
    wx.showToast({ title: '打卡成功', icon: 'success' });
    this.loadCalendar();
  },

  /**
   * 标记未完成
   */
  handleMiss: function (e) {
    var taskId = e.currentTarget.dataset.taskid;
    var date = this.data.selectedDate;
    if (!date) {
      wx.showToast({ title: '请先选择日期', icon: 'none' });
      return;
    }
    var existing = db.getRecordByDateAndTask(date, taskId);
    if (existing) {
      db.updateRecord(existing.id, { status: 'missed' });
    } else {
      db.addRecord({
        taskId: taskId,
        date: date,
        status: 'missed',
        note: '',
      });
    }
    wx.showToast({ title: '已标记未完成', icon: 'none' });
    this.loadCalendar();
  },

  /**
   * 添加备注
   */
  handleNote: function (e) {
    var recordId = e.currentTarget.dataset.recordid;
    var self = this;
    wx.showModal({
      title: '添加备注',
      editable: true,
      placeholderText: '请输入备注内容',
      success: function (res) {
        if (res.confirm && res.content) {
          db.updateRecord(recordId, { note: res.content });
          wx.showToast({ title: '备注已保存', icon: 'success' });
          self.loadCalendar();
        }
      },
    });
  },



});
