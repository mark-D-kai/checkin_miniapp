const db = require('../../utils/database.js');
const calendar = require('../../utils/calendar.js');

const PRESET_COLORS = [
  '#4A90D9', '#50C878', '#FF6B6B', '#FFB347',
  '#9B59B6', '#1ABC9C', '#E91E63', '#795548'
];

Page({
  data: {
    mode: 'add',           // add / miss / note / edit
    // add / edit 模式字段
    taskName: '',
    frequency: 'daily',
    selectedColor: PRESET_COLORS[0],
    presetColors: PRESET_COLORS,
    startTime: '',
    endTime: '',
    // miss / note 模式字段
    taskId: '',
    taskNameDisplay: '',
    date: '',
    recordId: '',
    status: 'completed',
    note: '',
    // note 模式额外
    statusOptions: [
      { value: 'completed', label: '已完成' },
      { value: 'missed', label: '未完成' }
    ],
  },

  onLoad(options) {
    calendar.init();
    const mode = options.mode || 'add';
    const data = { mode: mode };

    if (mode === 'miss') {
      data.taskId = options.taskId || '';
      data.taskNameDisplay = decodeURIComponent(options.taskName || '');
      data.date = options.date || '';
      data.note = '';
      data.status = 'missed';
    } else if (mode === 'note') {
      data.taskId = options.taskId || '';
      data.taskNameDisplay = decodeURIComponent(options.taskName || '');
      data.date = options.date || '';
      data.recordId = options.recordId || '';
      data.status = options.status || 'completed';
      data.note = decodeURIComponent(options.note || '');
    } else if (mode === 'edit') {
      const taskId = options.taskId;
      const task = db.getTaskById(taskId);
      data.taskId = taskId;
      data.taskName = task.name;
      data.frequency = task.frequency;
      data.selectedColor = task.color;
      data.startTime = task.startTime || '';
      data.endTime = task.endTime || '';
    }

    this.setData(data);

    // 动态设置导航栏标题
    if (mode === 'add') {
      wx.setNavigationBarTitle({ title: '添加任务' });
    } else if (mode === 'edit') {
      wx.setNavigationBarTitle({ title: '编辑任务' });
    } else if (mode === 'miss') {
      wx.setNavigationBarTitle({ title: '标记未完成' });
    } else if (mode === 'note') {
      wx.setNavigationBarTitle({ title: '编辑备注' });
    }
  },

  // 输入任务名称
  onTaskNameInput(e) {
    this.setData({ taskName: e.detail.value });
  },

  // 选择频率
  onFrequencyChange(e) {
    this.setData({ frequency: e.detail.value });
  },

  // 选择颜色
  onColorSelect(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ selectedColor: color });
  },

  // 选择开始时间
  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value });
  },

  // 选择结束时间
  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value });
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 选择状态 (note 模式)
  onStatusChange(e) {
    this.setData({ status: e.detail.value });
  },

  // 保存
  handleSave() {
    const mode = this.data.mode;

    if (mode === 'add') {
      this.saveNewTask();
    } else if (mode === 'edit') {
      this.saveEditTask();
    } else if (mode === 'miss') {
      this.saveMissRecord();
    } else if (mode === 'note') {
      this.saveNoteRecord();
    }
  },

  // 保存新任务
  saveNewTask() {
    const name = this.data.taskName.trim();
    if (!name) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' });
      return;
    }

    db.addTask({
      name: name,
      frequency: this.data.frequency,
      color: this.data.selectedColor,
      isActive: true,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
    });

    wx.showToast({ title: '添加成功', icon: 'success' });
    setTimeout(function () {
      wx.navigateBack();
    }, 1000);
  },

  // 保存编辑任务
  saveEditTask() {
    const name = this.data.taskName.trim();
    if (!name) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' });
      return;
    }

    const success = db.updateTask(this.data.taskId, {
      name: name,
      frequency: this.data.frequency,
      color: this.data.selectedColor,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
    });

    if (success) {
      wx.showToast({ title: '修改成功', icon: 'success' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1000);
    } else {
      wx.showToast({ title: '修改失败', icon: 'none' });
    }
  },

  // 保存未完成记录
  saveMissRecord() {
    const now = new Date();
    db.addRecord({
      id: db.generateId(),
      taskId: this.data.taskId,
      date: this.data.date,
      status: 'missed',
      note: this.data.note.trim(),
      checkedInAt: now.toISOString(),
    });

    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(function () {
      wx.navigateBack();
    }, 1000);
  },

  // 保存备注记录
  saveNoteRecord() {
    const recordId = this.data.recordId;

    if (recordId) {
      // 更新已有记录
      db.updateRecord(recordId, {
        status: this.data.status,
        note: this.data.note.trim(),
      });
    } else {
      // 新建记录
      const now = new Date();
      db.addRecord({
        id: db.generateId(),
        taskId: this.data.taskId,
        date: this.data.date,
        status: this.data.status,
        note: this.data.note.trim(),
        checkedInAt: now.toISOString(),
      });
    }

    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(function () {
      wx.navigateBack();
    }, 1000);
  },
});
