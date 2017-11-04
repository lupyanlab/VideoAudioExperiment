// Dependencies
const express = require('express');
const path = require("path");
const PythonShell = require('python-shell');
const fs = require('fs');
const csvWriter = require("csv-write-stream");
const _ = require('lodash');
const bodyParser = require('body-parser');
const csv = require('csvtojson');

let app = express();
let writer = csvWriter({ sendHeaders: false });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('port', (process.env.PORT || 7072))

// Add headers
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// For Rendering HTML
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/dev/index.html'));
})
app.use(express.static(__dirname + '/dev'));

app.listen(app.get('port'), function () {
  console.log("Node app is running at http://localhost:" + app.get('port'))
})


////////////////////////////////////////////////////////////////
// Recursively locates all images and stores in them objects//
/////////////////////////////////////////////////////////////
let images = {};
let categoriesCount = {};
fs.readdirSync('dev/17-objects').forEach(folder => {
  if (folder != '.DS_Store') {
    categoriesCount[folder] = 0;
    images[folder] = [];
    fs.readdirSync('dev/17-objects/' + folder).forEach(file => {
      if (file == 'TestItems') {
        fs.readdirSync('dev/17-objects/' + folder + '/TestItems').forEach(file => {
          if (!['.DS_Store', 'Thumbs.db', 'extra', 'AMC5143AAS_COB_370.jpe'].includes(file))
            images[folder].push('17-objects/' + folder + '/TestItems/' + file);
        });
      }
      if (!['.DS_Store', 'TestItems', 'Thumbs.db', 'extra', 'AMC5143AAS_COB_370.jpe'].includes(file))
        images[folder].push('17-objects/' + folder + '/' + file);
    })
  }
});

// create a new file to store category counts
let categories = Object.keys(categoriesCount);
let catPath = 'categoriesCount.csv';
let headers = categories;
if (fs.existsSync(catPath))
  fs.unlinkSync(catPath);
writer = csvWriter({ headers: headers });

writer.pipe(fs.createWriteStream(catPath, { flags: 'a' }));
writer.write(categoriesCount);
writer.end();

// POST endpoint for requesting trials
app.post('/trials', function (req, res) {
  console.log("trials post request received");

  let subjCode = req.body.subjCode;
  let numTrials = req.body.numTrials;
  let reset = req.body.reset;
  console.log(req.body);

  // subject is not finished
  if (fs.existsSync('trials/' + subjCode + '_trials.txt') && reset == 'false') {
    console.log('Grabbing unfinished trials')
    let completed = [];
    const csvFilePath = 'data/' + subjCode + '_data.csv';
    csv()
      .fromFile(csvFilePath)
      .on('json', (jsonObj) => {completed.push(jsonObj.category)})
      .on('done', (error) => {
        fs.readFile('trials/' + subjCode + '_trials.txt', 'utf8', function (err, data) {
          if (err) throw err;

          let subjCategories = data.split('\n').filter((c) => {return !completed.includes(c)});
          let subjImages = Object.assign({}, images);
          for (let category in subjImages)
            subjImages[category] = _.shuffle(subjImages[category]);
          let questions = _.shuffle(fs.readFileSync('IRQ_questions.txt').toString().replace(/\r/g, '\n').split('\n')).filter((line) => {return line.replace(/ /g, '').length > 0 });

          let trials = { categories: subjCategories, images: subjImages, questions: questions };
          res.send({ success: true, trials: trials });
        });
      })
  }
  // new subject or needs to reset trial data
  else {
    console.log('Creating new trials');
    
    // removes existing data files if resetting
    if (reset == 'true')
      if (fs.existsSync('trials/' + subjCode + '_trials.txt')) fs.unlinkSync('trials/' + subjCode + '_trials.txt');
      if (fs.existsSync('data/' + subjCode + '_data.csv'))  fs.unlinkSync('data/' + subjCode + '_data.csv');
        
    let categories = _.shuffle(Object.keys(categoriesCount));
    let countLists = {};
    for (let cat of categories)
      if (!(categoriesCount[cat] in countLists))
        countLists[categoriesCount[cat]] = [cat];
      else 
        countLists[categoriesCount[cat]].push(cat);
    
    let counts = Object.keys(countLists).sort();
    let subjCategories = [];
    for (let count of counts) {
        for (let cat of countLists[count]) {
          if (subjCategories.length < numTrials) {
            subjCategories.push(cat);
            categoriesCount[cat] = (Number(categoriesCount[cat]) + 1 )+'';
          }
          else break;
        }
    }

    fs.writeFile('trials/' + subjCode + '_trials.txt', subjCategories.join('\n'), function (err) {
      if (err) return console.log(err);
      console.log("Trials list saved!");
    });

    let catPath = 'categoriesCount.csv';
    let headers = categories;
    if (!fs.existsSync(catPath))
      writer = csvWriter({ headers: headers });
    else
      writer = csvWriter({ sendHeaders: false });

    writer.pipe(fs.createWriteStream(catPath, { flags: 'a' }));
    writer.write(categoriesCount);
    writer.end();

    let subjImages = Object.assign({}, images);
    for (let category in subjImages)
      subjImages[category] = _.shuffle(subjImages[category]);

    let questions = _.shuffle(fs.readFileSync('IRQ_questions.txt').toString().replace(/\r/g, '\n').split('\n')).filter((line) => { return line.replace(/ /g, '').length > 0 });
    let trials = { categories: subjCategories, images: subjImages, questions: questions};

    console.log(categoriesCount);
    res.send({ success: true, trials: trials });

  }
})


// POST endpoint for receiving trial responses
app.post('/data', function (req, res) {
  console.log('data post request received');

  // Parses the trial response data to csv
  let response = req.body;
  console.log(response);
  let path = 'data/' + response.subjCode + '_data.csv';
  let headers = Object.keys(response);
  if (!fs.existsSync(path))
    writer = csvWriter({ headers: headers });
  else
    writer = csvWriter({ sendHeaders: false });

  writer.pipe(fs.createWriteStream(path, { flags: 'a' }));
  writer.write(response);
  writer.end();

  res.send({ success: true });
})