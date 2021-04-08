/*
 * @Author: gyjian
 * @Date: 2021-03-28 13:14:30
 * @LastEditTime: 2021-04-08 22:30:14
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \leetcodec:\server\learngit\main.js
 */

function Draw() {
    this.isMouseDown = false,
    this.locHistory = [], //数据项为字符串,格式：x|y|line
    this.lastLoc = { x: 0, y: 0 },
    this.lastTimestamp = 0,
    this.lastLineWidth = -1, //记录最后的画笔粗细
    this.endTime = "",
    this.c = null, //canvas
    this.ctx = null //canvas实例
    return this;
}

Draw.prototype.init = function(obj) {
    if(!obj && !obj.id){
        console.error("Missing required parameters: `id`");
        return;
    };
    var _this = this;
    this.c = document.getElementById(obj.id);
    var docH = Math.max(
        document.documentElement.clientHeight,
        document.body.clientHeight
    );
    var width = obj.width || docH-4;
    var height = obj.height || window.innerHeight -4;
    this.c.setAttribute("height", width + "px");
    this.c.setAttribute("width", height - 4 + "px");
    this.ctx = this.c.getContext("2d");

    var eventHandler = {
        mousedown: function(event) {
            event.preventDefault();
            _this.beginStroke({ x: event.clientX, y: event.clientY });
        },
        mousemove: function(event) {
            event.preventDefault();
            if (_this.isMouseDown) {
                _this.moveStroke({ x: event.clientX, y: event.clientY });
            }
        },
        mouseup: function(event) {
            event.preventDefault();
            _this.endStroke();
          },
        mouseout: function(event) {
            event.preventDefault();
            _this.endStroke();
          },
        touchstart: function(event) {
            event.preventDefault();
            var touch = event.touches[0];
            _this.beginStroke({ x: touch.pageX, y: touch.pageY });
        },
        touchmove: function(event) {
            event.preventDefault();
            if (_this.isMouseDown) {
                var touch = event.touches[0];
                _this.moveStroke({ x: touch.pageX, y: touch.pageY });
            }
        },
        touchend: function(event) {
            event.preventDefault();
            _this.endStroke();
        }
    }

    for(var name in eventHandler) {
        this.c.addEventListener(name, eventHandler[name], !1);
    }
}

/**
 * 开始绘制
 * @param {object} point 
 */
Draw.prototype.beginStroke = function(point) {
  this.isMouseDown = true;
  this.lastTimestamp = new Date().getTime();

  this.lastLoc = this.windowToCanvas(point.x, point.y);
  var dataStr = this.lastLoc.x + "|" + this.lastLoc.y + "|" + 0;
  this.locHistory.push(dataStr);
}

/**
 * 停止绘制
 */
Draw.prototype.endStroke = function() {
    var dataStr = this.lastLoc.x + "|" + this.lastLoc.y + "|" + 0;
    this.locHistory.push(dataStr);

    if (this.locHistory.length > 3) {
      var lastTwoPoints = this.locHistory.slice(-2);
      var point1 = lastTwoPoints[0].split("|");
      var point2 = lastTwoPoints[1].split("|");
      var controlPoint = { x: Number(point1[0]), y: Number(point1[1]) };
      var endPoint = { x: Number(point2[0]), y: Number(point2[1]) };
      this.drawLine(this.lastLoc, controlPoint, endPoint);
    }

    this.isMouseDown = false;
    this.endTime = new Date().getTime();
}

/**
 * 绘制中
 * @param {object} point 
 */
Draw.prototype.moveStroke = function(point) {
    var curLoc = this.windowToCanvas(point.x, point.y);
    var curTimestamp = new Date().getTime();
    var s = this.calcDistance(curLoc, this.lastLoc);
    var t = curTimestamp - this.lastTimestamp;
    var lineWidth = this.calcLineWidth(t, s);

    //TODO:直线绘制？ 
    /*var calc = function(x, y, lineWidth, num, count) {
      if (num < count) {
        var newX = this.lastLoc.x + x;
        var newY = this.lastLoc.y + y;
        var width = (this.lastLineWidth + lineWidth) / 2;
        var time = (curTimestamp + this.lastTimestamp) / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastLoc.x, this.lastLoc.y);
        this.ctx.lineTo(newX, newY);
        var str = this.lastLoc.x + "|" + this.lastLoc.y + "|" + width;
        this.locHistory.push(str);
        this.ctx.lineWidth = width;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.stroke();
        this.lastLoc.x = newX;
        this.lastLoc.y = newY;
        this.lastTimestamp = time;
        this.lastLineWidth = width;
        num++;
        return calc(x, y, lineWidth, num, count);
      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastLoc.x, this.lastLoc.y);
        this.ctx.lineTo(curLoc.x, curLoc.y);

        var dataStr = this.lastLoc.x + "|" + this.lastLoc.y + "|" + lineWidth;
        this.locHistory.push(dataStr);

        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.stroke();

        this.lastLoc = curLoc;
        this.lastTimestamp = curTimestamp;
        this.lastLineWidth = lineWidth;
      }
    };*/
    var str = curLoc.x + "|" + curLoc.y + "|" + lineWidth;
    this.locHistory.push(str);

    //设置画笔粗细
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    //曲线绘制
    if (this.locHistory.length > 3) {
      var lastTwoPoints = this.locHistory.slice(-2);
      var point1 = lastTwoPoints[0].split("|");
      var point2 = lastTwoPoints[1].split("|");
      var controlPoint = { x: Number(point1[0]), y: Number(point1[1]) };
      var endPoint = {
        x: (Number(point1[0]) + Number(point2[0])) / 2,
        y: (Number(point1[1]) + Number(point2[1])) / 2
      };
      this.drawLine(this.lastLoc, controlPoint, endPoint);
      this.lastLoc = endPoint;
      this.lastTimestamp = curTimestamp;
      this.lastLineWidth = lineWidth;
    }
}

/**
 * 绘制曲线
 * @param {object} beginPoint 
 * @param {object} controlPoint 
 * @param {object} endPoint 
 */
Draw.prototype.drawLine = function(beginPoint, controlPoint, endPoint) {
    this.ctx.beginPath();
    this.ctx.moveTo(beginPoint.x, beginPoint.y);
    this.ctx.quadraticCurveTo(
      controlPoint.x,
      controlPoint.y,
      endPoint.x,
      endPoint.y
    );
    this.ctx.stroke();
    // this.ctx.closePath();
}

/**
 * 清理画布
 */
 Draw.prototype.clearCanvas = function() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.locHistory = [];
    this.lastLoc = { x: 0, y: 0 };
    this.lastTimestamp = 0;
    this.lastLineWidth = -1; //记录最后的画笔粗细
    this.endTime = "";
}

/**
 * 重绘
 */
Draw.prototype.reDraw = function() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    var lastLoc = null;
    for (var i = 0; i < this.locHistory.length; i++) {
        if (i > 1) {
            var point0 = this.locHistory[i - 2].split("|");
            var point1 = this.locHistory[i - 1].split("|");
            var point2 = this.locHistory[i].split("|");
            if (point0[2] == 0 && point1[2] == 0) {
            lastLoc = { x: Number(point1[0]), y: Number(point1[1]) };
            continue;
            }
            if (point1[2] == 0 && point2[2] == 0) {
            lastLoc = { x: Number(point2[0]), y: Number(point2[1]) };
            continue;
            }
            var startPoint = lastLoc
            ? lastLoc
            : { x: Number(point0[0]), y: Number(point0[1]) };
            var controlPoint = { x: Number(point1[0]), y: Number(point1[1]) };
            var endPoint = {
            x: (Number(point1[0]) + Number(point2[0])) / 2,
            y: (Number(point1[1]) + Number(point2[1])) / 2
            };

            //设置画笔粗细
            this.ctx.lineWidth = Number(point1[2]);
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.drawLine(startPoint, controlPoint, endPoint);
            lastLoc = endPoint;
        }
    }
}

/**
 * 返回当前鼠标相对于canvas的位置
 * @param {number} x 
 * @param {number} y 
 * @returns an object 
 */
Draw.prototype.windowToCanvas = function(x, y) {
    var bbox = this.c.getBoundingClientRect();
    return {
        x: Math.round(x - bbox.left),
        y: Math.round(y - bbox.top)
    };
}

/**
 * 通过起始结束坐标x,y值计算路程长度
 * @param {object} loc1 
 * @param {object} loc2 
 * @returns an object
 */
Draw.prototype.calcDistance = function(loc1, loc2) {
    return Math.sqrt(
        (loc1.x - loc2.x) * (loc1.x - loc2.x) +
        (loc1.y - loc2.y) * (loc1.y - loc2.y)
    ); 
}

/**
 * 根据速度计算画笔粗细, 计算方式不唯一，可根据需要自行修改
 * @param {number} t 
 * @param {number} s 
 * @returns number
 */
Draw.prototype.calcLineWidth = function(t, s) {
    var v = s / t;
    var resultLineWidth;

    if (v <= 0.1) {
      resultLineWidth = 5;
    } else if (v >= 1) {
      resultLineWidth = 2;
    } else {
      resultLineWidth = 5 - ((v - 0.1) / (1 - 0.1)) * (5 - 2);
    }
    if (this.lastLineWidth == -1) {
      return resultLineWidth;
    }
    return (this.lastLineWidth * 3) / 5 + (resultLineWidth * 2) / 5;
}

/**
 * 获取图形数据
 * @returns an object
 */
Draw.prototype.getGraphData = function() {
    var Pic = this.c.toDataURL("image/png");
    var opt = {
        backups: this.locHistory,
        snapshot: Pic
    };
    return opt;
}