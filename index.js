const express = require("express");
const assemblyStore = require("./shops/assemblyStore");
const everydayCoffee = require("./shops/everydayCoffee");
const blumeCoffee = require("./shops/blumeCoffee");
const marketLaneCoffee = require("./shops/marketLaneCoffee");
const sevenSeeds = require("./shops/sevenSeeds");
const woodAndCoCoffee = require("./shops/woodAndCoCoffee");
const test = require("./shops/test");

const fs = require("fs");
const { PORT } = require("./config");

const app = express();
const cors = require("cors");
const port = PORT || 8000;

app.use(cors());
app.use(express.static("public"));

app.get("/", async (req, res) => {
  fs.access("shops.json", fs.F_OK, (err) => {
    if (err) {
      console.error(err);
      res
        .status(500)
        .json({ msg: "Read Database Failed", result: false, type: 0 });
      return;
    }
    fs.readFile("shops.json", "utf8", function (err, data) {
      if (err)
        res
          .status(500)
          .json({ msg: "error occurred in server !", result: false, type: 0 });
      res.json({ msg: "", result: JSON.parse(data), type: 1 });
    });
  });
});

app.get("/scrape", async (req, res) => {
  Promise.all([
    // assemblyStore(),
    // everydayCoffee(),
    // blumeCoffee(),
    // marketLaneCoffee(),
    // sevenSeeds(),
    // woodAndCoCoffee(),
    test(),
  ])
    .then((values) => {
      fs.writeFile("shops.json", JSON.stringify(values, null, 2), (err) => {
        if (err) {
          console.error(err);
          res
            .status(500)
            .json({ msg: "Read Database Failed", result: false, type: 0 });
          return;
        }
        res.json({
          msg: "Successfully written data to file",
          result: values,
          type: 1,
        });
      });
    })
    .catch((error) => {
      console.error(error);
      res
        .status(500)
        .json({ msg: "Read Database Failed", result: false, type: 0 });
      return;
    });
});

app.listen(port, function () {
  console.log(
    "Express server listening on port %d in %s mode",
    this.address().port,
    app.settings.env
  );
});
