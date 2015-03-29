function App (ui) {
  this.ui = ui;
  this.url = this.ui.getUrl();
  this.dataHistory = [];
  this.serveHistory = [];
  this.pinnedServes = [];
  this.historySize = 60;
  this.pullEvery = 100;
  this.activeServe = null;
  this.connected = false;

  this.ui.app = this;
}

App.prototype = {
  pull: function (url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          this.connected = true;
          this.process(data);
        } else {
          console.error(xhr.statusText);
        }
      }
    }.bind(this);

    xhr.send(null);
  },

  start: function () {
    console.log("started");
    this.pullIntervalId = window.setInterval(function () {
      this.pull(this.url);
    }.bind(this), this.pullEvery);
  },

  stop: function () {
    if (this.pullIntervalId !== null && typeof this.pullIntervalId !== "undefined") {
      window.clearInterval(this.pullIntervalId);
      this.pullIntervalId = null;
    }
  },

  process: function (data) {
    this.dataHistory.push(data);
    this.dataHistory = this.dataHistory.slice(this.historySize);

    // debug, threshold is not good
    var laValues = _.find(data.sensors, function (s) {
      return s.type === "linear_acceleration";
    }).values;

    var oValues = _.find(data.sensors, function (s) {
      return s.type === "orientation";
    }).values;

    var force = Math.sqrt(
      laValues[0] * laValues[0] +
      laValues[1] * laValues[1] +
      laValues[2] * laValues[2]
    );

    var threshold = 15;
    if (force > threshold) {
      this.serveHistory.push({ forwardAngle: oValues[0], sideAngle: oValues[1], force: force });
      this.ui.updateServeValues(oValues[0], oValues[1], force);
    }

    this.ui.updateIndicator(this.connected);
  },

  pinServe: function () {
    var serve = this.serveHistory[this.serveHistory.length - 1];
    this.ui.setPinnedServe(serve);
    this.pinnedServes.push(serve);
  }
};
