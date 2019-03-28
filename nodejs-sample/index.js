const request = require('request');
const {Client} = require('camunda-external-task-client-js');
const fs = require('fs');
const path = require('path');
const express = require('express');


var camundaEngineUrl = 'http://localhost:8080/rest/'; // default if not overwritten by ENV variable
var targetPort = '8090'; //default if not overwritten by ENV
if (process.env.CAMUNDA_URL) {
  camundaEngineUrl = process.env.CAMUNDA_URL;
}
// We could also use User-Provided Service Instances (cf cups), see https://docs.cloudfoundry.org/devguide/services/user-provided.html and https://docs.run.pivotal.io/buildpacks/node/node-service-bindings.html
// var cfenv = require("cfenv");
// var vcap_services = JSON.parse(process.env.VCAP_SERVICES);
// var uri = vcap_services.camunda[0].credendtials.uri;

if (process.env.TARGET_PORT) {
  targetPort = process.env.TARGET_PORT;
}
console.log('Use Camunda Server at ' + camundaEngineUrl);


// setup external task client
var client = new Client( { baseUrl: camundaEngineUrl, interval: 50, asyncResponseTimeout: 10000});
// External Task subscription to do business logic
client.subscribe('sysout', async function({ task, taskService }) {
  console.log('Hello World: %s', task.variables.get('someText'));
  await taskService.complete(task);
});


// Deployment of Workflow Definition during startup (duplicates are NOT deployed)
function deployProcess() {
    filename = 'sysout.bpmn';
    filepath = path.join(__dirname, filename);
    console.log(filepath);

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
                'value':  fs.createReadStream(filepath),
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
function startProcess(someText) {
  request(
    {
      method: "POST", // see https://docs.camunda.org/manual/latest/reference/rest/deployment/post-deployment/
      uri: camundaEngineUrl + 'engine/default/process-definition/key/'+'sysout'+'/start',
      json: {
        'variables': {
          'someText' : {
              'value' : someText,
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

// Auto-Deploy on startup
deployProcess();


// Webserver to provide REST API to start workflow instances
var app = express();
app.use(express.json());

app.post('/hello', function (req, res) {
  startProcess(req.body.someText);  
  res.send('Hello initiated with text: ' + req.body.someText);
})

var server = app.listen(targetPort, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('REST API now listening at http://%s:%s', host, port)
})