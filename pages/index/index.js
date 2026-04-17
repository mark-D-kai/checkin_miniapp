const db = require('../../utils/database.js');
const calendar = require('../../utils/calendar.js');

Page({
  data: {
    today: '',           // 今天日期 "2026-04-12"
    weekday: '',         // "周六"
    isWorkday: true,     // 是否工作日
    todayTasks: [],      // 今日应打卡任务
    todayRecords: {},    // {taskId: record} 今日打卡记录映射
    hasTasks: false,
  },

  onLoad() {
    this.loadTodayData();
  },

  onShow() {
    this.loadTodayData(); // 从其他页面返回时刷新
  },

  loadTodayData() {
    const now = new Date();
    const todayStr = db.formatDate(now);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    const tasks = calendar.getTasksForDate(todayStr);
    const records = db.getRecords();
    const todayRecords = {};
    records.forEach(r => {
      if (r.date === todayStr) {
        todayRecords[r.taskId] = r;
      }
    });

    this.setData({
      today: todayStr,
      weekday: weekdays[now.getDay()],
      isWorkday: calendar.isWorkday(todayStr),
      todayTasks: tasks,
      todayRecords: todayRecords,
      hasTasks: tasks.length > 0,
    });
  },

  // 打卡
  handleCheckIn(e) {
    const taskId = e.currentTarget.dataset.taskid;
    const now = new Date();
    db.addRecord({
      id: db.generateId(),
      taskId: taskId,
      date: db.formatDate(now),
      status: 'completed',
      note: '',
      checkedInAt: now.toISOString(),
    });
    wx.showToast({ title: '打卡成功', icon: 'success' });
    this.loadTodayData();
  },

  // 标记未完成
  handleMiss(e) {
    const taskId = e.currentTarget.dataset.taskid;
    const task = this.data.todayTasks.find(t => t.id === taskId);
    wx.navigateTo({
      url: '/pages/addTask/addTask?mode=miss&taskId=' + taskId + '&taskName=' + encodeURIComponent(task.name) + '&date=' + this.data.today,
    });
  },

  // 添加备注
  handleNote(e) {
    const taskId = e.currentTarget.dataset.taskid;
    const task = this.data.todayTasks.find(t => t.id === taskId);
    const record = this.data.todayRecords[taskId];
    wx.navigateTo({
      url: '/pages/addTask/addTask?mode=note&taskId=' + taskId + '&taskName=' + encodeURIComponent(task.name) + '&date=' + this.data.today + '&recordId=' + (record ? record.id : '') + '&status=' + (record ? record.status : 'completed') + '&note=' + encodeURIComponent(record ? (record.note || '') : ''),
    });
  },

  // 添加任务
  goAddTask() {
    wx.navigateTo({ url: '/pages/addTask/addTask?mode=add' });
  },



  // 底部导航
  goHome() {
    // 已在首页，刷新数据
    this.loadTodayData();
  },
  goCalendar() {
    wx.navigateTo({ url: '/pages/calendar/calendar' });
  },
  goStats() {
    wx.navigateTo({ url: '/pages/stats/stats' });
  },
  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },
});
