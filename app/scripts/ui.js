function UI (root) {
  this.root = root;
  this.els = {};
  this.serveHistory = [];

  this.registerElements();
  this.createUrlListener();
  this.setupNav();
  this.setupServeToggle();
}

UI.prototype = {
  registerElements: function() {
    var els = this.root.querySelectorAll("[data-el]");
    Array.prototype.forEach.call(els, function (el) {
      this.els[el.dataset.el] = el;
    }.bind(this));
  },

  updateServeValues: function (forwardAngle, sideAngle, force) {
    this.els.frontAngleVal.innerHTML = forwardAngle.toPrecision(3);
    this.els.sideAngleVal.innerHTML  = sideAngle.toPrecision(3);
    this.els.forceVal.innerHTML      = force.toPrecision(3);

    if (this.serveHistory.length > 0) {
      var prevServe = this.serveHistory[this.serveHistory.length - 1];
      this.els.prevFrontAngle.innerHTML = prevServe.forwardAngle.toPrecision(3);
      this.els.prevSideAngle.innerHTML  = prevServe.sideAngle.toPrecision(3);
      this.els.prevForce.innerHTML      = prevServe.force.toPrecision(3);

      this.enable(this.els.prevFrontAngle);
      this.enable(this.els.prevSideAngle);
      this.enable(this.els.prevForce);
    }

    this.serveHistory.push({
      forwardAngle: forwardAngle,
      sideAngle: sideAngle,
      force: force
    });

    if (window.history.state.page === "#start-serving") {
      this.navigate("#serve-result");
    }

    this.enable(this.els.pinButton);
  },

  updateIndicator: function(isConnected) {
    var indicatorValue = this.root.querySelector(".sensor-indicator .sensor-indicator-value");
    var instructionsHeader = this.root.querySelector("#start-serving h1.instructions");
    var instructionsDesc = this.root.querySelector("#start-serving h2.instructions");
    var sensorIndicator = this.root.querySelector(".sensor-indicator");

    if (isConnected) {
      sensorIndicator.classList.remove("disconnected");
      sensorIndicator.classList.add("connected");
      indicatorValue.innerHTML = "connected";
      instructionsHeader.innerHTML = "Start serving!";
      instructionsDesc.innerHTML = "Your serves are automatically recorded";
    } else {
      sensorIndicator.classList.remove("connected");
      sensorIndicator.classList.add("disconnected");
      indicatorValue.innerHTML = "not connected";
    }
  },

  hide: function (el) {
    el.classList.add("hide");
  },

  unhide: function (el) {
    el.classList.remove("hide");
  },

  enable: function(el) {
    el.classList.remove("disable");
  },

  disable: function(el) {
    el.classList.add("disable");
  },

  createUrlListener: function () {
    this.els.urlForm.onsubmit = function (e) {
      e.preventDefault();
      this.app.url = this.getUrl();
      this.app.stop();
      this.app.start();
    }.bind(this);
  },

  setupServeToggle: function () {
    var toggleButtons = this.els.serveToggle.querySelectorAll(".button");
    Array.prototype.forEach.call(toggleButtons, function (el) {
      if (el.dataset.servetype) {
        el.addEventListener("click", function () {
          this.toggleServe(el.dataset.servetype);
        }.bind(this));
      }
    }.bind(this));
  },

  toggleServe: function (serve) {
    var toggleButtons = this.els.serveToggle.querySelectorAll(".button");
    Array.prototype.forEach.call(toggleButtons, function (el) {
      el.classList.remove("active-serve");
    });

    this.els.serveToggle.querySelector("." + serve).classList.add("active-serve");
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

    var buttons = this.root.querySelectorAll(".button");
    Array.prototype.forEach.call(buttons, function (el) {
      if (el.dataset.goto) {
        el.addEventListener("click", function () {
          this.navigate(el.dataset.goto);
        }.bind(this));
      }

      if (el.dataset.fn) {
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
    return this.els.urlForm.querySelector("#url").value;
  },

  navigate: function (pageSelector) {
    if (!pageSelector) {
      this.navigate("#home");
    } else {
      window.history.pushState({ page: pageSelector }, "");
      this.loadPage(pageSelector);
    }
  },

  loadPage: function (pageSelector) {
    var pages = this.root.querySelectorAll(".page");
    Array.prototype.forEach.call(pages, function (el) {
      el.style.display = "none";
    });
    this.root.querySelector(pageSelector).style.display = "";

    this.setElementVisibilities(pageSelector);
  },

  setElementVisibilities: function (pageSelector) {
    this.hide(this.els.homeButton);
    this.hide(this.els.serveToggle);
    this.hide(this.els.pinButton);

    switch (pageSelector) {
      case "#home":
        break;
      case "#start-serving":
      case "#serve-result":
        this.unhide(this.els.homeButton);
        this.unhide(this.els.serveToggle);
        this.unhide(this.els.pinButton);
        this.updateIndicator();
        break;
      case "#log":
        this.unhide(this.els.homeButton);
        break;
    }
  },

  pinServe: function () {
    this.app.pinServe();
  },

  setPinnedServe: function (serve) {
    this.els.frontAngle.innerHTML = serve.forwardAngle.toPrecision(3);
    this.els.sideAngle.innerHTML = serve.sideAngle.toPrecision(3);
    this.els.force.innerHTML = serve.force.toPrecision(3);

    this.enable(this.els.frontAngle);
    this.enable(this.els.sideAngle);
    this.enable(this.els.force);
  },

  updateLogbook: function () {
    var serves = this.app.pinnedServes;
    var list = this.els.serveList;

    list.innerHTML = "";

    for (var i = 0; i < serves.length; i++) {
      var li = document.createElement("li");
      list.appendChild(li);
      li.innerHTML = JSON.stringify(serves[i]);
    }
  }
};
