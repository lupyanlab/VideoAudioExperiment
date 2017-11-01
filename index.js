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
let writer = csvWriter({sendHeaders: false});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

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

let categoriesQueues = {};
let images = {};
fs.readdirSync('dev/17-objects').forEach(folder => {
  if (folder != '.DS_Store') {
    images[folder] = [];
    fs.readdirSync('dev/17-objects/'+folder).forEach(file => {
      if (file == 'TestItems') {
        fs.readdirSync('dev/17-objects/'+folder+'/TestItems').forEach(file => {     
          if (!['.DS_Store', 'Thumbs.db', 'extra','AMC5143AAS_COB_370.jpe'].includes(file)) {
            images[folder].push('17-objects/'+folder+'/TestItems/'+file);
          }
        });
      }
      if (!['.DS_Store', 'TestItems', 'Thumbs.db', 'extra','AMC5143AAS_COB_370.jpe'].includes(file)) {
        // console.log('dev/17-objects/'+folder+'/'+file)
        images[folder].push('17-objects/'+folder+'/'+file);
      }
    })
  }
});
// POST endpoint for requesting trials
app.post('/trials', function (req, res) {
  console.log("trials post request received");
  
  let categories = [];
  let subjCode = req.body.subjCode;
  let numTrials = req.body.numTrials;
  let newSet = req.body.newSet;
  let reset = req.body.reset;
  console.log("subjCode received is " + subjCode);
  console.log("numTrials received is " + numTrials);
  console.log("newSet received is " + newSet);
  console.log("reset received is " + newSet);
  if (reset == 'false' && fs.existsSync('trials/'+subjCode+'_trials.txt')) {
    console.log('Grabbing unfinished trials')
    let completed = [];
    const csvFilePath='data/'+subjCode+'_data.csv';
    csv()
    .fromFile(csvFilePath)
    .on('json',(jsonObj)=>{
        // combine csv header row and csv line to a json object
        // jsonObj.a ==> 1 or 4
        completed.push(jsonObj.category);
    })
    .on('done',(error)=>{
      fs.readFile('trials/'+subjCode+'_trials.txt', 'utf8', function(err, data) {
        if (err) throw err;
        let trialsList = data.split('\n');
        let subjCategories = [];
        for (let c of trialsList)
          if (!completed.includes(c))
            subjCategories.push(c);
        
        let subjImages = Object.assign({}, images); 
        for (let category in subjImages)
          subjImages[category] = _.shuffle(subjImages[category]);
        
        let path = 'IRQ_questions.txt';
        let questions = _.shuffle(fs.readFileSync(path).toString().replace(/\r/g,'\n').split('\n')).filter((line) => {return line.replace(/ /g,'').length>0});
        let trials = {categories: subjCategories, images: subjImages, questions: questions};
        
        res.send({success: true, trials: trials});
          
      });
    })
  }
  else {
    if (fs.existsSync('trials/'+subjCode+'_trials.txt'))
      fs.unlinkSync('trials/'+subjCode+'_trials.txt');
    if (fs.existsSync('data/'+subjCode+'_data.csv'))
      fs.unlinkSync('data/'+subjCode+'_data.csv');
    if (newSet == 'true' || !(numTrials in categoriesQueues) || categoriesQueues[numTrials].length == 0 ) {
      categoriesQueues[numTrials] = [];
      images = {};
      let categoriesQueue = [];
      // include all images recursively in 17-objects directory
      fs.readdirSync('dev/17-objects').forEach(folder => {
        if (folder != '.DS_Store') {
          categoriesQueue.push(folder);
          images[folder] = [];
          fs.readdirSync('dev/17-objects/'+folder).forEach(file => {
            if (file == 'TestItems') {
              fs.readdirSync('dev/17-objects/'+folder+'/TestItems').forEach(file => {     
                if (!['.DS_Store', 'Thumbs.db', 'extra','AMC5143AAS_COB_370.jpe'].includes(file)) {
                  images[folder].push('17-objects/'+folder+'/TestItems/'+file);
                }
              });
            }
            if (!['.DS_Store', 'TestItems', 'Thumbs.db', 'extra','AMC5143AAS_COB_370.jpe'].includes(file)) {
              // console.log('dev/17-objects/'+folder+'/'+file)
              images[folder].push('17-objects/'+folder+'/'+file);
            }
          })
        }
      });
      while (categoriesQueue.length > 0) {
        let chunk = [];
        for (let i = 0; i < numTrials; i++) {
          if (categoriesQueue.length == 0)
            break;
          chunk.push(categoriesQueue.pop());
        }
        categoriesQueues[numTrials].push(chunk);
      }
    };
    let subjCategories = _.shuffle(categoriesQueues[numTrials].pop());
    
    fs.writeFile('trials/'+subjCode+'_trials.txt', subjCategories.join('\n'), function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("Trials list saved!");
    }); 
  
    let subjImages = Object.assign({}, images); 
    for (let category in subjImages)
      subjImages[category] = _.shuffle(subjImages[category]);
    
    let path = 'IRQ_questions.txt';
    let questions = _.shuffle(fs.readFileSync(path).toString().replace(/\r/g,'\n').split('\n')).filter((line) => {return line.replace(/ /g,'').length>0});
    let trials = {categories: subjCategories, images: subjImages, questions: questions};
    
    console.log("Trial sets left for "+numTrials+" trials set: " +categoriesQueues[numTrials].length);
    res.send({success: true, trials: trials});
  }
})
// POST endpoint for receiving trial responses
app.post('/data', function (req, res) {
  console.log('data post request received');

  // Parses the trial response data to csv
  let response = req.body;
  console.log(response);
  let path = 'data/'+response.subjCode+'_data.csv';
  let headers = Object.keys(response);
  if (!fs.existsSync(path))
    writer = csvWriter({ headers: headers});
  else
    writer = csvWriter({sendHeaders: false});

  writer.pipe(fs.createWriteStream(path, {flags: 'a'}));
  writer.write(response);
  writer.end();

  res.send({success: true});
})