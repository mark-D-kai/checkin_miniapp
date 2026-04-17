/**
 * Canvas 图表绘制模块
 * 使用微信小程序 Canvas 2D API
 * 兼容旧版 wx.createCanvasContext 和新版 Canvas 2D
 */

/**
 * 绘制环形进度条
 * @param {Object} ctx Canvas 上下文（新版 Canvas 2D 或旧版 context）
 * @param {number} width 画布宽度（px）
 * @param {number} height 画布高度（px）
 * @param {number} rate 完成率 0~1
 * @param {string} color 进度条颜色，如 '#4A90D9'
 */
function drawRingChart(ctx, width, height, rate, color) {
  var dpr = wx.getSystemInfoSync().pixelRatio;
  var centerX = width / 2;
  var centerY = height / 2;
  var radius = Math.max(1, Math.min(width, height) / 2 - 20);
  var lineWidth = 12;

  // 清除画布
  ctx.clearRect(0, 0, width, height);

  // 绘制背景圆环
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.setStrokeStyle('#E8E8E8');
  ctx.setLineWidth(lineWidth);
  ctx.setLineCap('round');
  ctx.stroke();

  // 绘制进度圆环
  if (rate > 0) {
    var startAngle = -Math.PI / 2; // 从顶部开始
    var endAngle = startAngle + 2 * Math.PI * Math.min(rate, 1);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.setStrokeStyle(color || '#4A90D9');
    ctx.setLineWidth(lineWidth);
    ctx.setLineCap('round');
    ctx.stroke();
  }

  // 绘制中心百分比文字
  var percent = Math.round(rate * 100);
  ctx.setFillStyle('#333333');
  ctx.setFontSize(24);
  ctx.setTextAlign('center');
  ctx.setTextBaseline('middle');
  ctx.fillText(percent + '%', centerX, centerY);

  ctx.draw && ctx.draw();
}

/**
 * 绘制折线趋势图（近30天）
 * @param {Object} ctx Canvas 上下文
 * @param {number} width 画布宽度（px）
 * @param {number} height 画布高度（px）
 * @param {Array} data 数据数组 [{date: '2026-01-01', status: 'completed'}, ...]
 */
function drawTrendChart(ctx, width, height, data) {
  var dpr = wx.getSystemInfoSync().pixelRatio;
  var padding = { top: 30, right: 20, bottom: 40, left: 40 };
  var chartWidth = width - padding.left - padding.right;
  var chartHeight = height - padding.top - padding.bottom;

  // 清除画布
  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) {
    ctx.setFillStyle('#999999');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText('暂无数据', width / 2, height / 2);
    ctx.draw && ctx.draw();
    return;
  }

  // 按日期排序
  var sorted = data.slice().sort(function (a, b) {
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });

  // 最多显示30天
  if (sorted.length > 30) {
    sorted = sorted.slice(sorted.length - 30);
  }

  var count = sorted.length;
  var stepX = count > 1 ? chartWidth / (count - 1) : 0;

  // 将状态映射为数值：completed=1, missed=0
  var points = sorted.map(function (item, i) {
    var value = item.status === 'completed' ? 1 : 0;
    return {
      x: padding.left + (count > 1 ? i * stepX : chartWidth / 2),
      y: padding.top + chartHeight - value * chartHeight,
      value: value,
      date: item.date,
    };
  });

  // 绘制网格线（水平）
  ctx.setStrokeStyle('#E8E8E8');
  ctx.setLineWidth(0.5);
  for (var i = 0; i <= 2; i++) {
    var gy = padding.top + (chartHeight / 2) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, gy);
    ctx.lineTo(width - padding.right, gy);
    ctx.stroke();
  }

  // 绘制Y轴标签
  ctx.setFillStyle('#999999');
  ctx.setFontSize(10);
  ctx.setTextAlign('right');
  ctx.setTextBaseline('middle');
  ctx.fillText('完成', padding.left - 6, padding.top);
  ctx.fillText('未完成', padding.left - 6, padding.top + chartHeight);

  // 绘制折线
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.setStrokeStyle('#4A90D9');
    ctx.setLineWidth(2);
    ctx.setLineCap('round');
    ctx.setLineJoin('round');
    ctx.stroke();

    // 绘制渐变填充区域
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var k = 1; k < points.length; k++) {
      ctx.lineTo(points[k].x, points[k].y);
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.lineTo(points[0].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.setFillStyle('rgba(74, 144, 217, 0.1)');
    ctx.fill();
  }

  // 绘制数据点
  points.forEach(function (p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
    ctx.setFillStyle(p.value === 1 ? '#4A90D9' : '#FF6B6B');
    ctx.fill();
  });

  // 绘制X轴日期标签（每隔5天显示一个）
  ctx.setFillStyle('#999999');
  ctx.setFontSize(9);
  ctx.setTextAlign('center');
  ctx.setTextBaseline('top');
  for (var m = 0; m < points.length; m += 5) {
    var label = points[m].date.substring(5); // "MM-DD"
    ctx.fillText(label, points[m].x, padding.top + chartHeight + 8);
  }
  // 确保最后一个日期也显示
  if (points.length > 1 && (points.length - 1) % 5 !== 0) {
    var lastLabel = points[points.length - 1].date.substring(5);
    ctx.fillText(lastLabel, points[points.length - 1].x, padding.top + chartHeight + 8);
  }

  ctx.draw && ctx.draw();
}

/**
 * 绘制热力图
 * @param {Object} ctx Canvas 上下文
 * @param {number} width 画布宽度（px）
 * @param {number} height 画布高度（px）
 * @param {Object} data 数据对象 {'2026-01-01': 'completed', '2026-01-02': 'missed', ...}
 * @param {string} startDate 开始日期 "yyyy-MM-dd"
 * @param {string} endDate 结束日期 "yyyy-MM-dd"
 */
function drawHeatmap(ctx, width, height, data, startDate, endDate) {
  var padding = { top: 30, right: 10, bottom: 10, left: 10 };
  var chartWidth = width - padding.left - padding.right;
  var chartHeight = height - padding.top - padding.bottom;

  // 清除画布
  ctx.clearRect(0, 0, width, height);

  if (!data || typeof data !== 'object' || !startDate || !endDate) {
    ctx.setFillStyle('#999999');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText('暂无数据', width / 2, height / 2);
    ctx.draw && ctx.draw();
    return;
  }

  // 解析日期范围
  var start = new Date(startDate);
  var end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    ctx.draw && ctx.draw();
    return;
  }

  // 计算总天数
  var totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (totalDays <= 0) {
    ctx.draw && ctx.draw();
    return;
  }

  // 计算网格布局：按周排列（7行 x N列）
  var cols = Math.ceil(totalDays / 7);
  var cellSize = Math.min(
    Math.floor(chartWidth / cols),
    Math.floor(chartHeight / 7)
  );
  cellSize = Math.max(4, cellSize); // 最小4px
  var gap = 2;

  // 居中偏移
  var totalGridWidth = cols * (cellSize + gap) - gap;
  var totalGridHeight = 7 * (cellSize + gap) - gap;
  var offsetX = padding.left + (chartWidth - totalGridWidth) / 2;
  var offsetY = padding.top + (chartHeight - totalGridHeight) / 2;

  // 绘制星期标签
  var weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
  ctx.setFillStyle('#999999');
  ctx.setFontSize(9);
  ctx.setTextAlign('right');
  ctx.setTextBaseline('middle');
  for (var w = 0; w < 7; w++) {
    var labelY = offsetY + w * (cellSize + gap) + cellSize / 2;
    ctx.fillText(weekLabels[w], offsetX - 4, labelY);
  }

  // 颜色映射
  var colors = {
    'completed': '#4A90D9',
    'missed': '#FF6B6B',
    'empty': '#E8E8E8',
  };

  // 绘制每个日期的格子
  var current = new Date(start);
  for (var d = 0; d < totalDays; d++) {
    var dateStr = formatDateStr(current);
    var dayOfWeek = current.getDay();
    // 转换为周一起始: 0(日)->6, 1(一)->0, ..., 6(六)->5
    var row = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    var col = Math.floor(d / 7);

    var x = offsetX + col * (cellSize + gap);
    var y = offsetY + row * (cellSize + gap);

    var status = data[dateStr];
    var fillColor = colors[status] || colors['empty'];

    ctx.setFillStyle(fillColor);
    // 绘制圆角矩形
    drawRoundRect(ctx, x, y, cellSize, cellSize, 2);
    ctx.fill();

    current.setDate(current.getDate() + 1);
  }

  // 绘制图例
  var legendY = offsetY + totalGridHeight + 16;
  var legendItems = [
    { color: colors['completed'], label: '已完成' },
    { color: colors['missed'], label: '未完成' },
    { color: colors['empty'], label: '无记录' },
  ];
  var legendStartX = offsetX;
  ctx.setFontSize(10);
  ctx.setTextAlign('left');
  ctx.setTextBaseline('middle');
  legendItems.forEach(function (item, idx) {
    var lx = legendStartX + idx * 70;
    ctx.setFillStyle(item.color);
    ctx.fillRect(lx, legendY - 5, 10, 10);
    ctx.setFillStyle('#666666');
    ctx.fillText(item.label, lx + 14, legendY);
  });

  ctx.draw && ctx.draw();
}

/**
 * 辅助：格式化日期为 yyyy-MM-dd
 * @param {Date} date
 * @returns {string}
 */
function formatDateStr(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

/**
 * 辅助：绘制圆角矩形路径
 * @param {Object} ctx Canvas 上下文
 * @param {number} x 起始x
 * @param {number} y 起始y
 * @param {number} w 宽度
 * @param {number} h 高度
 * @param {number} r 圆角半径
 */
function drawRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

module.exports = {
  drawRingChart: drawRingChart,
  drawTrendChart: drawTrendChart,
  drawHeatmap: drawHeatmap,
};
