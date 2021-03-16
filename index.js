const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ObjectID = require("mongodb").ObjectID;
// const port=3000;
// app.get('/',(req,res)=> res.send('Hello World'));
// app.listen(process.env.Portt || port, ()=> console.log('Example app listening at htts://loca;host:${port}'));

const mongodbUrl =
  "mongodb+srv://harshad:harshad@cluster0.mr9yg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoClient.connect(mongodbUrl,async function(err, db) {
//   if (err) throw err;
//   db.db('JCTWARDBANDI').collection('User').insertOne({username: 'Abhishek', password: 'Abhishek'});
//   db.close();
// })

app.get("/", (req, res) => {
  if (req.cookies.loggedIn) res.redirect("/w1");
  res.render("index", { err: undefined });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  MongoClient.connect(mongodbUrl, async function (err, db) {
    if (err) throw err;
    db.db("JCTWARDBANDI")
      .collection("User")
      .findOne({ username }, (err, data) => {
        if (err) throw err;
        if (data === null) {
          res.cookie("loggedIn", false);
          res.render("index", { err: "Username is not correct" });
        } else if (data.password !== password) {
          res.cookie("loggedIn", false);
          res.render("index", { err: "Incorrect password" });
        } else {
          res.cookie("loggedIn", true);
          res.cookie("user", data._id);
          res.redirect("/w1");
        }
        db.close();
      });
  });
});

app.post("/area", (req, res) => {
  const userid = new ObjectID(req.cookies.user);
  MongoClient.connect(mongodbUrl, async function (err, db) {
    if (err) throw err;
    db.db("JCTWARDBANDI")
      .collection("User")
      .findOne({ _id: userid }, (err, data) => {
        if (err) throw err;
        if (data.areas === undefined) {
          data.areas = [];
        }
        if (
          data.areas.filter(
            (area) =>
              area.nameOfArea === req.body.nameOfArea &&
              area.blockNumber === req.body.blockNumber &&
              area.wardNumber === req.body.wardNumber
          ).length === 0
        ) {
          data.areas.push(req.body);
          delete data._id;
          db.db("JCTWARDBANDI")
            .collection("User")
            .updateOne(
              { _id: userid },
              { $set: { ...data } },
              (err, updatedUser) => {
                if (err) throw err;
                db.close();
                res.cookie("nameOfArea", req.body.nameOfArea);
                res.cookie("blockNumber", req.body.blockNumber);
                res.cookie("wardNumber", req.body.wardNumber);
                res.redirect("/w2");
              }
            );
        } else {
          db.close();
          res.cookie("nameOfArea", req.body.nameOfArea);
          res.cookie("blockNumber", req.body.blockNumber);
          res.cookie("wardNumber", req.body.wardNumber);
          res.redirect("/w2");
        }
      });
  });
});

app.get("/w2", (req, res) => {
  if (req.cookies.loggedIn) res.render("w2");
  else res.redirect("/");
});

app.get("/w1", (req, res) => {
  if (req.cookies.loggedIn) res.render("w1");
  else res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("loggedIn", false);
  res.cookie("user", null);
  res.redirect("/");
});

app.post("/entry", (req, res) => {
  const userId = new ObjectID(req.cookies.user);
  const { nameOfArea, blockNumber, wardNumber } = req.cookies;
  MongoClient.connect(mongodbUrl, (err, db) => {
    if (err) throw err;
    db.db("JCTWARDBANDI")
      .collection("User")
      .findOne({ _id: userId }, (err, data) => {
        if (err) throw err;
        const areaRef = data.areas.filter(
          (area) =>
            area.nameOfArea === nameOfArea &&
            area.blockNumber === blockNumber &&
            area.wardNumber === wardNumber
        )[0];
        if (areaRef.people === undefined) {
          areaRef.people = [];
        }
        areaRef.people.push(req.body);
        delete data._id;
        db.db("JCTWARDBANDI")
          .collection("User")
          .updateOne(
            { _id: userId },
            { $set: { ...data } },
            (err, updatedUser) => {
              if (err) throw err;
              db.close();
              res.redirect("/w2");
            }
          );
      });
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));
