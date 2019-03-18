var request = require('request');
var {Client} = require('camunda-external-task-client-js');
var fs = require('fs');
var path = require('path');
var express = require('express');


var camundaEngineUrl = 'http://localhost:8080/rest/'; // default if not overwritten by ENV variable
var targetPort = '8090'; //default if not overwritten by ENV
if (process.env.CAMUNDA_URL) {
  camundaEngineUrl = process.env.CAMUNDA_URL;
}
if (process.env.TARGET_PORT) {
  targetPort = process.env.TARGET_PORT;
}
console.log('Use Camunda Server at ' + camundaEngineUrl);


// setup external task client
var client = new Client( { baseUrl: camundaEngineUrl, interval: 50, asyncResponseTimeout: 10000});
// External Task subscription to do business logic
client.subscribe('sysout', async function({ task, taskService }) {
  console.log('Hello World: %s', task.variables.get('text'));
  await taskService.complete(task);
});


// Deployment of Workflow Definition during startup (duplicates are NOT deployed)
function deployProcess() {
    filename = 'sysout.bpmn';
    path = path.join(__dirname, filename);
    console.log(path);

    request(
        {
          method: "POST", // see https://docs.camunda.org/manual/latest/reference/rest/deployment/post-deployment/
          uri: camundaEngineUrl + 'engine/default/deployment/create',
          headers: {
              "Content-Type": "multipart/form-data"
          },
          formData : {
              'deployment-name': 'sysout',
              'enable-duplicate-filtering': 'true',
              'deploy-changed-only': 'true',
              'scripttest.bpmn': {
                'value':  fs.createReadStream(path),
                'options': {'filename': filename}
              }
          }
        }, function (err, res, body) {
            if (err) {
              console.log(err);
              throw err;
            }
            console.log('[%s] Deployment succeeded: ' + body);
    
    });
}

// Start workflow instance: https://docs.camunda.org/manual/latest/reference/rest/process-definition/post-start-process-instance/
function startProcess(text) {
  request(
    {
      method: "POST", // see https://docs.camunda.org/manual/latest/reference/rest/deployment/post-deployment/
      uri: camundaEngineUrl + 'engine/default/process-definition/key/'+'sysout'+'/start',
      json: {
        'variables': {
          'text' : {
              'value' : text,
              'type': 'String'
          },
        }      
      }
    }, function (err, res, body) {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log('Process instance started: ' + body);
  });
}

// Startup: Auto-Deploy
deployProcess();


// Webserver to provide REST API to start workflow instances
var app = express();
app.use(express.json());

app.post('/hello', function (req, res) {
  startProcess(req.body.text);  
  res.send('Hello initiated');
})

var server = app.listen(targetPort, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('REST API now listening at http://%s:%s', host, port)
})