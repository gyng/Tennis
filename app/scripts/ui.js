function UI (root) {
  this.root = root;
  this.els = {};
  this.serveHistory = [];

  this.registerElements();
  this.setupUrlListener();
  this.setupNav();
  this.setupServeToggle();

  this.sounds = {};
  this.sounds.beep = new Audio('audio/beep.mp3');
}

UI.prototype = {
  registerElements: function() {
    var els = this.root.querySelectorAll("[data-el]");
    Array.prototype.forEach.call(els, function (el) {
      this.els[el.dataset.el] = el;
    }.bind(this));
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

  setupUrlListener: function () {
    this.els.urlForm.onsubmit = function (e) {
      e.preventDefault();
      this.app.url = this.getSensorendipityUrl();
      this.app.stop();
      this.app.start();
    }.bind(this);
  },

  getSensorendipityUrl: function () {
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

    this.updateVisibilities(pageSelector);
  },

  updateServeValues: function (serve, forceThreshold) {
    this.sounds.beep.play();

    var forwardAngle = serve.forwardAngle;
    var sideAngle = serve.sideAngle;
    var force = serve.force;

    this.els.frontAngleVal.innerHTML = forwardAngle.toPrecision(3) + "°";
    this.els.sideAngleVal.innerHTML  = sideAngle.toPrecision(3) + "°";
    this.els.forceVal.innerHTML      = force.toPrecision(3);

    this.els.frontAngleVis.style.transform = "rotate(" + forwardAngle + "deg)";
    this.els.sideAngleVis.style.transform  = "rotate(" + sideAngle + "deg)";
    this.els.forceVis.style.transform      = "scale(" + force / (forceThreshold * 1.5) + ")";

    if (this.serveHistory.length > 0) {
      var prevServe = this.serveHistory[this.serveHistory.length - 1];
      this.els.prevFrontAngle.innerHTML = prevServe.forwardAngle.toPrecision(3) + "°";
      this.els.prevSideAngle.innerHTML  = prevServe.sideAngle.toPrecision(3) + "°";
      this.els.prevForce.innerHTML      = prevServe.force.toPrecision(3);

      this.enable(this.els.prevFrontAngle);
      this.enable(this.els.prevSideAngle);
      this.enable(this.els.prevForce);
    }

    this.serveHistory.push(serve);

    if (window.history.state.page === "#start-serving") {
      this.navigate("#serve-result");
    }

    this.enable(this.els.pinButton);
  },

  updateIndicator: function(isConnected) {
    if (isConnected) {
      this.els.connIndicator.classList.remove("disconnected");
      this.els.connIndicator.classList.add("connected");
      this.els.connIndicator.innerHTML = "Sensorendipity connected";
      this.els.instHeader.innerHTML = "Start serving!";
      this.els.instSubheader.innerHTML = "Your serves are automatically recorded";
      this.els.instImage.style = "background-image: url(images/tennisracket.png);";
    } else {
      this.els.connIndicator.classList.remove("connected");
      this.els.connIndicator.classList.add("disconnected");
      this.els.connIndicator.innerHTML = "Sensorendipity not connected";
    }
  },

  toggleServe: function (serve) {
    var toggleButtons = this.els.serveToggle.querySelectorAll(".button");
    Array.prototype.forEach.call(toggleButtons, function (el) {
      el.classList.remove("active-serve");
    });

    this.els.serveToggle.querySelector("." + serve).classList.add("active-serve");
    this.app.serveType = serve;
  },

  startSession: function () {
    this.toggleServe("flatserve");
    this.app.start();
  },

  updateVisibilities: function (pageSelector) {
    this.hide(this.els.homeButton);
    this.hide(this.els.serveToggle);
    this.hide(this.els.pinButton);
    this.none(this.els.allServesToggle);
    this.enable(this.els.homeButton);
    this.enable(this.els.serveToggle);
    this.enable(this.els.pinButton);

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
        this.unhide(this.els.serveToggle);
        this.unnone(this.els.allServesToggle);
        this.disable(this.els.serveToggle);
        break;
    }
  },

  pinServe: function () {
    this.app.pinServe();
  },

  updatePinnedServe: function (serve) {
    this.els.pinnedFrontAngle.innerHTML = serve.forwardAngle.toPrecision(3) + "°";
    this.els.pinnedSideAngle.innerHTML = serve.sideAngle.toPrecision(3) + "°";
    this.els.pinnedForce.innerHTML = serve.force.toPrecision(3);

    this.enable(this.els.pinnedFrontAngle);
    this.enable(this.els.pinnedSideAngle);
    this.enable(this.els.pinnedForce);
  },

  updateLogbook: function () {
    var metadata = [];
    metadata.push({ name: "dateString", label: "Date", datatype: "string" });
    metadata.push({ name: "type", label: "Type", datatype: "string" });
    metadata.push({ name: "forwardAngle", label: "Forward", datatype: "double(°,1)" });
    metadata.push({ name: "sideAngle", label: "Side", datatype: "double(°,1)" });
    metadata.push({ name: "force", label: "Force", datatype: "double(f,1)" });

    var count = 0;
    var mapToEditableGrid = function (el) {
      return {
        id: count++,
        values: el
      };
    };

    var allServes = _.map(this.app.serveHistory, mapToEditableGrid);
    var pinnedServes = _.map(this.app.pinnedServes, mapToEditableGrid);

    var editableGrid = new EditableGrid("serve");
    editableGrid.load({ "metadata": metadata, "data": allServes });
    editableGrid.renderGrid("serve-table", "serve-table");

    var pinnedEditableGrid = new EditableGrid("serve");
    pinnedEditableGrid.load({ "metadata": metadata, "data": pinnedServes });
    pinnedEditableGrid.renderGrid("pinned-serve-table", "pinned-serve-table");

    if (this.app.serveHistory.length > 0) {
      var forwardAvg = _.sum(this.app.serveHistory, "forwardAngle") / this.app.serveHistory.length;
      var sideAvg    = _.sum(this.app.serveHistory, "sideAngle") / this.app.serveHistory.length;
      var forceAvg   = _.sum(this.app.serveHistory, "force") / this.app.serveHistory.length;

      this.els.forwardAvg.innerHTML = forwardAvg.toFixed(0) + "°";
      this.els.sideAvg.innerHTML    = sideAvg.toFixed(0)    + "°";
      this.els.forceAvg.innerHTML   = forceAvg.toFixed(0);
    }
  },

  hide: function (el) {
    el.classList.add("hide");
  },

  none: function (el) {
    el.classList.add("none");
  },

  unnone: function (el) {
    el.classList.remove("none");
  },

  unhide: function (el) {
    el.classList.remove("hide");
  },

  enable: function(el) {
    el.classList.remove("disable");
  },

  disable: function(el) {
    el.classList.add("disable");
  }
};
