(function () {
  "use strict";

  require.config({
    paths: {
      editablegrid: "editablegrid-2.0.1",
    }
  });

  require(["lodash", "editablegrid"], function (_, EditableGrid) {
    require(["app", "ui"], function () {
      var ui = new UI(document);
      new App(ui);
    });
  });
}());
