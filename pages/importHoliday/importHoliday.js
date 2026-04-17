const db = require('../../utils/database.js');
const calendar = require('../../utils/calendar.js');

Page({
  data: {
    fileContent: '',
    previewCount: 0,
    previewData: [],
    isLoading: false,
    successMsg: '',
    errorMsg: '',
  },

  // 选择文件
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: filePath,
          encoding: 'utf-8',
          success: (data) => {
            try {
              const parsed = JSON.parse(data.data);
              const holidays = parsed.holidays;
              if (!Array.isArray(holidays)) {
                this.setData({ errorMsg: '文件格式错误：未找到 holidays 数组' });
                return;
              }
              this.setData({
                fileContent: data.data,
                previewCount: holidays.length,
                previewData: holidays.slice(0, 5),
                errorMsg: '',
                successMsg: '',
              });
            } catch (e) {
              this.setData({ errorMsg: 'JSON 解析失败：' + e.message });
            }
          }
        });
      }
    });
  },

  // 确认导入
  importData() {
    if (!this.data.fileContent) return;
    this.setData({ isLoading: true, errorMsg: '', successMsg: '' });

    try {
      const parsed = JSON.parse(this.data.fileContent);
      calendar.importFromJson(parsed.holidays);
      this.setData({
        isLoading: false,
        successMsg: '成功导入 ' + parsed.holidays.length + ' 条假日数据',
        previewCount: 0,
        previewData: [],
        fileContent: '',
      });
    } catch (e) {
      this.setData({ isLoading: false, errorMsg: '导入失败：' + e.message });
    }
  },

  // 清除
  clearFile() {
    this.setData({ fileContent: '', previewCount: 0, previewData: [], errorMsg: '', successMsg: '' });
  },
});
