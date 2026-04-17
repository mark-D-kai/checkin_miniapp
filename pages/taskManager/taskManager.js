const db = require('../../utils/database.js');

Page({
  data: {
    tasks: []
  },

  onLoad() {
    this.loadTasks();
  },

  /**
   * 加载任务列表
   */
  loadTasks: function () {
    var tasks = db.getTasks().filter(function (t) { return t.isActive; });
    this.setData({
      tasks: tasks
    });
  },

  /**
   * 编辑任务
   */
  editTask: function (e) {
    const taskId = e.currentTarget.dataset.taskId;
    const task = db.getTaskById(taskId);
    if (task) {
      wx.navigateTo({
        url: `/pages/addTask/addTask?mode=edit&taskId=${task.id}&taskName=${encodeURIComponent(task.name)}`
      });
    }
  },

  /**
   * 显示删除确认
   */
  showDeleteConfirm: function (e) {
    const taskId = e.currentTarget.dataset.taskId;
    const task = db.getTaskById(taskId);
    if (task) {
      wx.showModal({
        title: '确认删除',
        content: `确定要删除任务“${task.name}”吗？删除后该任务的所有打卡记录也将被删除。`,
        confirmText: '删除',
        confirmColor: '#FF4D4F',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.deleteTask(task);
          }
        }
      });
    }
  },

  /**
   * 删除任务
   */
  deleteTask: function (task) {
    // 删除任务
    db.deleteTask(task.id);
    // 删除该任务的所有记录
    const records = db.getRecords().filter(record => record.taskId !== task.id);
    db.saveRecords(records);
    // 重新加载任务列表
    this.loadTasks();
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
  }
});