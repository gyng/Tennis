require(["scripts/app.js", "scripts/ui.js"], function () {
  "use strict";

  var ui = new UI(document);
  new App(ui);
});
