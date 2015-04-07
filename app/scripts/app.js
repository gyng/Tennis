function App (ui) {
  this.ui = ui;
  this.ui.app = this;
  this.url = this.ui.getSensorendipityUrl();
  this.dataHistory = [];
  this.serveHistory = [];
  this.pinnedServes = [];
  this.maxServe = null;
  this.serveType = null;
  this.historySize = 200;
  this.pullEvery = 50;
  this.connected = false;
  this.forceThreshold = 15;
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
    this.pullIntervalId = window.setInterval(function () {
      this.pull(this.url);
    }.bind(this), this.pullEvery);
  },

  stop: function () {
    if (this.pullIntervalId) {
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

    var date = Date.now();

    var serve = {
      forwardAngle: -(oValues[1] + 90),
      sideAngle: oValues[0],
      force: force,
      type: this.serveType,
      date: date,
      dateString: new Date(date).toLocaleDateString()
    };

    if (force > this.forceThreshold) {
      this.serveWindowActive = true;

      if (!this.maxServe || serve.force > this.maxServe.force) {
        this.maxServe = serve;
      }
    } else if (this.serveWindowActive === true) {
      this.serveWindowActive = false;
    }

    if (this.serveWindowActive === false) {
      this.serveHistory.push(this.maxServe);
      this.ui.updateServeValues(this.maxServe, this.forceThreshold);
      this.maxServe = null;
      this.serveWindowActive = null;
    }

    // Debug, sensor value monitoring
    // this.ui.updateServeValues(serve, this.forceThreshold);

    this.ui.updateIndicator(this.connected);
  },

  pinServe: function () {
    var serve = this.serveHistory[this.serveHistory.length - 1];
    this.ui.updatePinnedServe(serve);
    this.pinnedServes.push(serve);
  }
};
