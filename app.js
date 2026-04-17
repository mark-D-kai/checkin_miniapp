App({
  onLaunch() {
    // 初始化假日数据
    const calendar = require('./utils/calendar.js');
    calendar.init();
  }
});
