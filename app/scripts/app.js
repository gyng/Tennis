(function () {
  "use strict";

  function App (ui) {
    this.ui = ui;
    this.url = this.ui.getUrl();
    this.dataHistory = [];
    this.historySize = 60;
    // this.pullEvery = 16;
    this.pullEvery = 1000;

    this.ui.app = this;

    // this.start(this.url);
  }

  App.prototype = {
    pull: function (url) {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", url, false);
      xmlHttp.send(null);
      var data = JSON.parse(xmlHttp.responseText);

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

    this.urlFormEl = this.root.querySelector("#url-form");
    this.createUrlListener();

    this.history = [];

    this.setupNav();
  }

  UI.prototype = {
    updateServeValues: function (forwardAngle, sideAngle, force) {
      this.frontAngleEl.innerHTML = forwardAngle.toPrecision(3);
      this.sideAngleEl.innerHTML = sideAngle.toPrecision(3);
      this.forceEl.innerHTML = force.toPrecision(3);
    },

    createUrlListener: function () {
      this.urlFormEl.onsubmit = function (e) {
        e.preventDefault();
        this.app.url = this.getUrl();
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
      }.bind(this));
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

      console.log("going to ", pageSelector)
      Array.prototype.forEach.call(this.root.querySelectorAll(".page"), function (el) {
        el.style.display = "none";
      });
      this.root.querySelector(pageSelector).style.display = "";
    }
  };

  var ui = new UI(document);
  new App(ui);
}());
