// var ip;

// ip = ('');



// var timer=setInterval(function(){
//   var xmlHttp = new XMLHttpRequest();
  // xmlHttp.open( 'GET',  ip , false );
  // xmlHttp.send( null );
  // var data = JSON.parse(xmlHttp.responseText);
  // sensor_number = data.sensors.length;

// },16);

(function () {
  "use strict";

  function App (url, ui) {
    this.url = url || "http://localhost:8765";
    this.ui = ui;
    this.dataHistory = [];
    this.historySize = 60;
    this.pullEvery = 16;

    this.start(this.url);
  }

  App.prototype = {
    pull: function (url) {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", url, false);
      xmlHttp.send(null);
      var data = JSON.parse(xmlHttp.responseText);
      // console.log(data);

      return data;
    },

    start: function (url) {
      window.setInterval(function (url) {
        this.process(this.pull(url));
      }.bind(this), this.pullEvery, url);
    },

    process: function (data) {
      this.dataHistory.push(data);
      this.dataHistory = this.dataHistory.slice(this.historySize);

      // debug
      var laValues = _.find(data.sensors, function (s) {
        return s.type === "linear_acceleration";
      }).values;

      var oValues = _.find(data.sensors, function (s) {
        return s.type === "orientation";
      }).values;

      this.ui.updateServeValues(laValues[0], oValues[0], oValues[1]);
    }
  };

  function UI (root) {
    this.root = root;
    this.frontAngleEl = this.root.querySelector("#sensor-forward-angle-value");
    this.sideAngleEl = this.root.querySelector("#sensor-side-angle-value");
    this.forceEl = this.root.querySelector("#sensor-force-value");
  }

  UI.prototype = {
    updateServeValues: function (forwardAngle, sideAngle, force) {
      this.frontAngleEl.innerHTML = forwardAngle.toPrecision(3);
      this.sideAngleEl.innerHTML = sideAngle.toPrecision(3);
      this.forceEl.innerHTML = force.toPrecision(3);
    }
  };

  var ui = new UI(document);
  new App("http://192.168.1.190:8765", ui);
}());
