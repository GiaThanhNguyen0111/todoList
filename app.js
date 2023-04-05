//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);


const item1 = new Item({
  name: "Something I want to do"
});
const item2 = new Item({
  name: "Something I want to do 2"
});
const item3 = new Item({
  name: "Something I want to do 3"
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  const day = date.getDate();

  Item.find({}).then( function(results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems).then(function(){
        console.log("Successfully inserted.");
      });
    res.redirect("/");      
    } else {
      res.render("list", {listTitle: day, newListItems: results});
    }
  })

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(result) {
    if(result) {
      res.render("list", {listTitle: result.name, newListItems: result.items});
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+ customListName);
    }
  })

})

app.post("/", function(req, res){
  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  })

  if(listName === day) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(result) {
      console.log(result);
      result.items.push(newItem);
      result.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res) {
  const day = date.getDate();
  const isFinish = req.body.isFinish;
  const listName = req.body.listName;

  if (listName === day) {
      Item.deleteOne({_id: isFinish}).then(function() {
        console.log("Deleted");
        res.redirect("/");
      });
  } else {
      List.findOneAndUpdate({name: listName}, {
        $pull: {
          items: {
            _id: isFinish
          }
        }
      }).then(function(result){
        res.redirect("/" + listName);
      });
  }
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
