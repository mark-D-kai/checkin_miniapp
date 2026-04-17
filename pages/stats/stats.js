const db = require('../../utils/database.js');
const chart = require('../../utils/chart.js');
const calendar = require('../../utils/calendar.js');

Page({
  data: {
    tasks: [],
    selectedTaskId: '',
    selectedTaskIndex: 0,
    streakDays: 0,
    completionRate: -1,
    completionRateText: '--',
    totalCheckIns: 0,
    monthlyRate: -1,
    monthlyRateText: '--',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarData: [],
    selectedDate: '',
    selectedRecords: {},
  },

  onLoad: function () {
    this.loadTasks();
  },

  onShow: function () {
    this.loadTasks();
  },

  /**
   * 加载任务列表
   */
  loadTasks: function () {
    var tasks = db.getTasks().filter(function (t) { return t.isActive; });
    var selectedTaskId = tasks.length > 0 ? tasks[0].id : '';
    this.setData({
      tasks: tasks,
      selectedTaskId: selectedTaskId,
      selectedTaskIndex: 0,
    });
    if (tasks.length > 0) {
      this.loadStats();
    }
  },

  /**
   * 选择任务
   */
  selectTask: function (e) {
    var index = e.detail.value;
    var tasks = this.data.tasks;
    this.setData({
      selectedTaskIndex: index,
      selectedTaskId: tasks[index].id,
    });
    this.loadStats();
  },

  /**
   * 加载统计数据
   */
  loadStats: function () {
    var taskId = this.data.selectedTaskId;
    if (!taskId) return;

    var streak = db.getStreakDays(taskId);
    var rate = db.getCompletionRate(taskId);
    var total = db.getTotalCheckIns(taskId);
    var monthlyRate = db.getCompletionRateByMonth(taskId, this.data.currentYear, this.data.currentMonth);

    this.setData({
      streakDays: streak,
      completionRate: rate,
      completionRateText: rate >= 0 ? (rate * 100).toFixed(1) + '%' : '--',
      totalCheckIns: total,
      monthlyRate: monthlyRate,
      monthlyRateText: monthlyRate >= 0 ? (monthlyRate * 100).toFixed(1) + '%' : '--',
    });

    // 生成月度日历数据
    this.generateCalendarData();
  },

  /**
   * 上一个月
   */
  prevMonth: function () {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    
    this.setData({ currentYear: year, currentMonth: month });
    this.loadStats();
  },

  /**
   * 下一个月
   */
  nextMonth: function () {
    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    var now = new Date();
    var maxYear = now.getFullYear();
    var maxMonth = now.getMonth() + 1;
    
    if (year === maxYear && month === maxMonth) {
      return; // 不能超过当前月份
    }
    
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    
    this.setData({ currentYear: year, currentMonth: month });
    this.loadStats();
  },

  /**
   * 生成月度日历数据
   */
  generateCalendarData: function () {
    var taskId = this.data.selectedTaskId;
    if (!taskId) return;

    var year = this.data.currentYear;
    var month = this.data.currentMonth;
    var daysInMonth = new Date(year, month, 0).getDate();
    var calendarData = [];

    // 获取该月所有打卡记录
    var records = db.getRecordsByTaskAndMonth(taskId, year, month);
    var recordMap = {};
    records.forEach(function (record) {
      recordMap[record.date] = record.status;
    });

    // 获取任务信息
    var task = db.getTaskById(taskId);
    if (!task) return;

    // 计算当月第一天是星期几
    var firstDayOfMonth = new Date(year, month - 1, 1);
    var firstDayWeekday = firstDayOfMonth.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 填充月初空白
    for (var i = 0; i < firstDayWeekday; i++) {
      calendarData.push({ date: '', day: '', status: 'empty' });
    }

    // 生成每日数据
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var status = recordMap[dateStr];
      
      calendarData.push({ date: dateStr, day: day, status: status });
    }
    this.setData({ calendarData: calendarData });
  },



  /**
   * 选择日期
   */
  selectDate: function (e) {
    var date = e.currentTarget.dataset.date;
    // 获取当前选中的任务
    var selectedTask = this.data.tasks.find(t => t.id === this.data.selectedTaskId);
    // 过滤出该日期的当前任务
    var dateTasks = calendar.getTasksForDate(date).filter(t => t.id === this.data.selectedTaskId);
    this.setData({ 
      selectedDate: date,
      dateTasks: dateTasks,
      selectedTask: selectedTask
    });
    this.loadSelectedRecords(date);
  },

  /**
   * 加载选中日期的打卡记录
   */
  loadSelectedRecords: function (date) {
    // 只加载当前选中任务的记录
    var taskId = this.data.selectedTaskId;
    if (!taskId) return;
    
    // 筛选出该日期且属于当前任务的打卡记录
    var records = db.getRecords().filter(function (r) {
      return r.date === date && r.taskId === taskId;
    });
    
    // 附加任务名，构建以 taskId 为键的对象
    var recordMap = {};
    records.forEach(function (r) {
      var task = this.data.tasks.find(function (t) { return t.id === r.taskId; });
      recordMap[r.taskId] = {
        id: r.id,
        taskId: r.taskId,
        taskName: task ? task.name : '未知任务',
        status: r.status,
        note: r.note || '',
        date: r.date,
      };
    }.bind(this));
    this.setData({ selectedRecords: recordMap });
  },

});
