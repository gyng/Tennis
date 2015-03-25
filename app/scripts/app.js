(function () {
  "use strict";

  function App (ui) {
    this.ui = ui;
    this.url = this.ui.getUrl();
    this.dataHistory = [];
    this.serveHistory = [];
    this.pinnedServes = [];
    this.historySize = 60;
    this.pullEvery = 100;
    this.activeServe = null;

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

      this.ui.updateIndicator(force);
    },

    pinServe: function () {
      var serve = this.serveHistory[this.serveHistory.length - 1];
      this.ui.setPinnedServe(serve);
      this.pinnedServes.push(serve);
    }
  };

  function UI (root) {
    this.root = root;
    this.frontAngleEl = this.root.querySelector(".sensor-result.forward-angle");
    this.sideAngleEl = this.root.querySelector(".sensor-result.side-angle");
    this.forceEl = this.root.querySelector(".sensor-result.force");
    this.serveToggleEl = this.root.querySelector(".serve-type-toggle");
    this.serveHistory = [];

    this.urlFormEl = this.root.querySelector("#url-form");
    this.createUrlListener();

    this.setupNav();
    this.setupServeToggle();
  }

  UI.prototype = {
    updateServeValues: function (forwardAngle, sideAngle, force) {
      this.frontAngleEl.querySelector(".sensor-number").innerHTML = forwardAngle.toPrecision(3);
      this.sideAngleEl.querySelector(".sensor-number").innerHTML = sideAngle.toPrecision(3);
      this.forceEl.querySelector(".sensor-number").innerHTML = force.toPrecision(3);

      if (this.serveHistory.length > 0) {
        var previousServe = this.serveHistory[this.serveHistory.length - 1];
        this.frontAngleEl.querySelector(".previous-serve").innerHTML = previousServe.forwardAngle.toPrecision(3);
        this.sideAngleEl.querySelector(".previous-serve").innerHTML = previousServe.sideAngle.toPrecision(3);
        this.forceEl.querySelector(".previous-serve").innerHTML = previousServe.force.toPrecision(3);
      }

      this.serveHistory.push({
        forwardAngle: forwardAngle,
        sideAngle: sideAngle,
        force: force
      });

      if (window.history.state.page === "#start-serving") {
        this.navigate("#serve-result")
      }
    },

    updateIndicator: function(value) {
      var indicatorValue = this.root.querySelector(".sensor-indicator .sensor-indicator-value");
      indicatorValue.innerHTML = value;
    },

    createUrlListener: function () {
      this.urlFormEl.onsubmit = function (e) {
        e.preventDefault();
        this.app.url = this.getUrl();
        this.app.stop();
        this.app.start();
      }.bind(this);
    },

    setupServeToggle: function () {
      Array.prototype.forEach.call(this.serveToggleEl.querySelectorAll(".button"), function (el) {
        if (el.dataset.servetype !== null && typeof el.dataset.servetype !== "undefined") {
          el.addEventListener("click", function () {
            this.toggleServe(el.dataset.servetype);
          }.bind(this));
        }
      }.bind(this));
    },

    toggleServe: function (serve) {
      Array.prototype.forEach.call(this.serveToggleEl.querySelectorAll(".button"), function (el) {
        el.classList.remove("active-serve");
      });

      this.serveToggleEl.querySelector("." + serve).classList.add("active-serve");
      this.app.activeServe = serve;
    },

    setupNav: function () {
      this.homeEl = this.root.querySelector(".nav .home");
      this.navigate("#home");

      this.homeEl.addEventListener("click", function () {
        this.navigate("#home");
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

    startSession: function () {
      this.toggleServe("flatserve");
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
    },

    pinServe: function () {
      this.app.pinServe();
    },

    setPinnedServe: function (serve) {
      console.log(serve)
      this.frontAngleEl.querySelector(".pinned-serve").innerHTML = serve.forwardAngle.toPrecision(3);
      this.sideAngleEl.querySelector(".pinned-serve").innerHTML = serve.sideAngle.toPrecision(3);
      this.forceEl.querySelector(".pinned-serve").innerHTML = serve.force.toPrecision(3);
    },

    updateLogbook: function () {
      var serves = this.app.pinnedServes;
      var list = this.root.querySelector(".serve-list");

      list.innerHTML = "";

      for (var i = 0; i < serves.length; i++) {
        var li = document.createElement("li");
        list.appendChild(li);
        li.innerHTML = JSON.stringify(serves[i]);
      }
    }
  };

  var ui = new UI(document);
  new App(ui);
}());
