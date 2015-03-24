(function () {
  "use strict";

  function App (ui) {
    this.ui = ui;
    this.url = this.ui.getUrl();
    this.dataHistory = [];
    this.historySize = 60;
    // this.pullEvery = 16;
    this.pullEvery = 100;

    this.ui.app = this;

    // this.start(this.url);
  }

  App.prototype = {
    pull: function (url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);

      xhr.onload = function (e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
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
        this.ui.updateServeValues(oValues[0], oValues[1], force);
      }
    }
  };

  function UI (root) {
    this.root = root;
    this.frontAngleEl = this.root.querySelector(".sensor-result.forward-angle");
    this.sideAngleEl = this.root.querySelector(".sensor-result.side-angle");
    this.forceEl = this.root.querySelector(".sensor-result.force");
    this.serveHistory = [];

    this.urlFormEl = this.root.querySelector("#url-form");
    this.createUrlListener();

    this.setupNav();
  }

  UI.prototype = {
    updateServeValues: function (forwardAngle, sideAngle, force) {
      this.frontAngleEl.querySelector(".sensor-number").innerHTML = forwardAngle.toPrecision(3);
      this.sideAngleEl.querySelector(".sensor-number").innerHTML = sideAngle.toPrecision(3);
      this.forceEl.querySelector(".sensor-number").innerHTML = force.toPrecision(3);

      if (this.serveHistory.length > 0) {
        var previousServe = this.serveHistory[this.serveHistory.length - 1];
        this.frontAngleEl.querySelector(".sensor-comparison").innerHTML = previousServe.forwardAngle.toPrecision(3);
        this.sideAngleEl.querySelector(".sensor-comparison").innerHTML = previousServe.sideAngle.toPrecision(3);
        this.forceEl.querySelector(".sensor-comparison").innerHTML = previousServe.force.toPrecision(3);
      }

      this.serveHistory.push({
        forwardAngle: forwardAngle,
        sideAngle: sideAngle,
        force: force
      });
    },

    createUrlListener: function () {
      this.urlFormEl.onsubmit = function (e) {
        e.preventDefault();
        this.app.url = this.getUrl();
        this.app.stop();
        this.app.start();
      }.bind(this);
    },

    setupNav: function () {
      this.backEl = this.root.querySelector(".nav .back");
      this.navigate("#home");

      this.backEl.addEventListener("click", function () {
        window.history.back();
      }.bind(this));

      window.onpopstate = function (e) {
        this.loadPage(e.state.page);
      }.bind(this);

      Array.prototype.forEach.call(this.root.querySelectorAll(".button"), function (el) {
        if (el.dataset.goto !== null && typeof el.dataset.goto !== "undefined") {
          el.addEventListener("click", function () {
            this.navigate(el.dataset.goto);
          }.bind(this));
        }

        if (el.dataset.fn !== null && typeof el.dataset.fn !== "undefined") {
          el.addEventListener("click", function () {
            this[el.dataset.fn]();
          }.bind(this));
        }
      }.bind(this));
    },

    startApp: function () {
      this.app.start();
    },

    getUrl: function () {
      return this.urlFormEl.querySelector("#url").value;
    },

    navigate: function (pageSelector) {
      if (pageSelector === null || typeof pageSelector === "undefined" || pageSelector === "") {
        this.navigate("#home");
      } else {
        window.history.pushState({ page: pageSelector }, "");
        this.loadPage(pageSelector);
      }
    },

    loadPage: function (pageSelector) {
      Array.prototype.forEach.call(this.root.querySelectorAll(".page"), function (el) {
        el.style.display = "none";
      });
      this.root.querySelector(pageSelector).style.display = "";
    }
  };

  var ui = new UI(document);
  new App(ui);
}());
