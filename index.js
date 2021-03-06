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

// const mongodbUrl = "mongodb://localhost:27017";


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoClient.connect(mongodbUrl,async function(err, db) {
//   if (err) throw err;
//   db.db('JCTWARDBANDI').collection('User').insertOne({username: 'Abhishek', password: 'Abhishek'});
//   db.close();
// })

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    if (req.cookies.loggedIn === 'true') {
        const userid = new ObjectID(req.cookies.user);
        MongoClient.connect(mongodbUrl, function(err, db) {
        if(err) throw err;
        db.db('JCTWARDBANDI')
          .collection('User')
          .findOne({_id: userid}, (err, data) => {
            if(err) throw err;
            if(data === null) {
              res.cookie('user', null);
              res.cookie('loggedIn', false);
              res.render('index',{err: undefined});
              return;
            } else {
              if(data.lastEntry) {
                res.cookie('name',data.lastEntry.name);
                res.cookie('number',data.lastEntry.phn);
                res.cookie('blockNumber', data.lastEntry.blockNumber);
                res.cookie('wardNumber', data.lastEntry.wardNumber);
                res.cookie('nameOfArea', data.lastEntry.nameOfArea);
                res.cookie('totalEntries', data.totalEntries);
              } else {
                res.cookie('name',"none");
                res.cookie('number', 'none');
                res.cookie('blockNumber', 'none');
                res.cookie('nameOfArea', 'none');
                res.cookie('wardNumber', 'none');
                res.cookie('totalEntries', 0);
              }
              res.redirect('/w1');
              return;
            }
          })
      })
  } else {
  res.render("index", { err: undefined });
  }
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
          if(data.lastEntry) {
            res.cookie('name',data.lastEntry.name);
            res.cookie('number',data.lastEntry.phn);
            res.cookie('blockNumber', data.lastEntry.blockNumber);
            res.cookie('wardNumber', data.lastEntry.wardNumber);
            res.cookie('nameOfArea', data.lastEntry.nameOfArea);
            res.cookie('totalEntries', data.totalEntries);
          } else {
            res.cookie('name',"none");
            res.cookie('number', 'none');
            res.cookie('blockNumber', 'none');
            res.cookie('nameOfArea', 'none');
            res.cookie('wardNumber', 'none');
            res.cookie('totalEntries', 0);
          }
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
                res.cookie('serialNo', 1);
                res.redirect("/w2");
                return;
              }
            );
        } else {
          db.close();
          res.cookie("nameOfArea", req.body.nameOfArea);
          res.cookie("blockNumber", req.body.blockNumber);
          res.cookie("wardNumber", req.body.wardNumber);
          let area = data.areas.filter(area => 
            area.nameOfArea === req.body.nameOfArea &&
            area.blockNumber === req.body.blockNumber &&
            area.wardNumber === req.body.wardNumber)[0];
          let sno = area.people ? area.people.length+1 : 1;
          res.cookie('serialNo', sno)
          res.redirect("/w2");
          return;
        }
      });
  });
});

app.get("/w2", (req, res) => {
  if (req.cookies.loggedIn === 'true') {
    const userid = new ObjectID(req.cookies.user);
    MongoClient.connect(mongodbUrl, function(err, db) {
      if(err) throw err;
      db.db('JCTWARDBANDI')
        .collection('User')
        .findOne({_id: userid}, (err, data) => {
          if(err) throw err;
          if(data === null) {
            res.cookie('user', null);
            res.cookie('loggedIn', false);
            res.redirect('/');
            return;
          } else {
            res.render("w2",{wardNumber:req.cookies.wardNumber, blockNumber: req.cookies.blockNumber,
            name:req.cookies.name, number: req.cookies.number, serialNumber: req.cookies.serialNo, totalEntries: req.cookies.totalEntries});
            return;
          }
        })
      })
  } else {
    res.redirect("/");
    return;
  };
});

app.get("/w1", (req, res) => {
  if (req.cookies.loggedIn === 'true') {
    const userid = new ObjectID(req.cookies.user);
    MongoClient.connect(mongodbUrl, function(err, db) {
      if(err) throw err;
      db.db('JCTWARDBANDI')
        .collection('User')
        .findOne({_id: userid}, (err, data) => {
          if(err) throw err;
          if(data === null) {
            res.cookie('user', null);
            res.cookie('loggedIn', false);
            res.redirect('/');
            return;
          } else {
            res.render("w1",{entries: req.cookies.entries, blockNumber: req.cookies.blockNumber, totalEntries: req.cookies.totalEntries});
            return;
          }
        })
      })
  } else {
    res.redirect("/");
    return;
  };
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
        data.lastEntry = {
          ...req.body,
          nameOfArea, blockNumber, wardNumber
        };
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
        if(data.totalEntries === undefined) {
          data.totalEntries = 1;
        } else {
          data.totalEntries += 1;
        }
        delete data._id;
        db.db("JCTWARDBANDI")
          .collection("User")
          .updateOne(
            { _id: userId },
            { $set: { ...data } },
            (err, updatedUser) => {
              if (err) throw err;
              res.cookie('name',req.body.name);
              res.cookie('number',req.body.phn);
              res.cookie('totalEntries', data.totalEntries);
              res.cookie('serialNo', areaRef.people.length + 1);
              res.cookie('entries', +req.cookies.entries + 1);
              db.close();
              res.redirect("/w2");
            }
          );
      });
  });
});

app.get('/resetcounter',(req, res) => {
  res.cookie('entries',0);
  res.redirect('/w1');
})

app.listen(port, () => console.log("Server started on port "+port));
