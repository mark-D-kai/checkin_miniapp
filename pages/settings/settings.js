const db = require('../../utils/database.js');

Page({
  data: {
    version: '1.0.1'
  },

  onLoad() {
  },

  // 跳转到任务管理页面
  navigateToTaskManager: function () {
    wx.navigateTo({
      url: '/pages/taskManager/taskManager'
    });
  },

  // 导出数据
  exportData: function () {
    wx.showLoading({ title: '导出中...' });
    
    const allData = db.exportAllData();
    const jsonContent = JSON.stringify(allData, null, 2);
    const fileName = `checkin_backup_${Date.now()}.json`;
    const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    
    // 先保存到临时文件
    wx.getFileSystemManager().writeFile({
      filePath: tempFilePath,
      data: jsonContent,
      encoding: 'utf8',
      success: () => {
        wx.hideLoading();
        // 显示提示框，让用户确认后再分享
        wx.showModal({
          title: '导出成功',
          content: '数据已导出为JSON文件，是否分享给好友？',
          confirmText: '分享',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 用户点击分享按钮，唤起微信聊天选择
              wx.shareFileMessage({
                filePath: tempFilePath,
                success: (res) => {
                  console.log('文件发送成功:', res);
                },
                fail: (err) => {
                  console.error('文件发送失败:', err);
                  wx.showToast({
                    title: '发送失败',
                    icon: 'none'
                  });
                }
              });
            }
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('临时文件保存失败:', err);
        wx.showModal({
          title: '导出失败',
          content: '无法保存数据，请稍后重试',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 跳转到任务管理页面
  navigateToTaskManager: function () {
    wx.navigateTo({
      url: '/pages/taskManager/taskManager'
    });
  },

  // 导入数据
  importData: function () {
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
              const importedData = JSON.parse(data.data);
              // 合并导入的数据到系统中
              db.importData(importedData);
              wx.showToast({
                title: '导入成功',
                icon: 'success'
              });
              // 重新加载任务列表
              this.loadTasks();
            } catch (e) {
              wx.showModal({
                title: '导入失败',
                content: 'JSON解析失败：' + e.message,
                showCancel: false,
                confirmText: '知道了'
              });
            }
          },
          fail: (err) => {
            console.error('读取文件失败:', err);
            wx.showModal({
              title: '导入失败',
              content: '无法读取文件，请稍后重试',
              showCancel: false,
              confirmText: '知道了'
            });
          }
        });
      },
      fail: (err) => {
        console.error('选择文件失败:', err);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  }
});