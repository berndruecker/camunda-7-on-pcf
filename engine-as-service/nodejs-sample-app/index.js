var camundaEngineUrl = "http://localhost:8080/rest/"; // default if not overwritten by ENV variable
var targetPort = "8090";

if (process.env.CAMUNDA_URL) {
  camundaEngineUrl = process.env.CAMUNDA_URL;
}
if (process.env.TARGET_PORT) {
  targetPort = process.env.TARGET_PORT;
}
console.log("Use Camunda Server at " + camundaEngineUrl);

var fs = require('fs');
var path = require('path');

// setup external task client
const {Client} = require("camunda-external-task-client-js");
const client = new Client( { baseUrl: camundaEngineUrl, interval: 50, asyncResponseTimeout: 10000});

// setup Camunda client
var CamundaSDK = require('camunda-bpm-sdk-js');
var camundaClient = new CamundaSDK.Client({ mock: false, apiUri: camundaEngineUrl });
var processDefinitionService  = new camundaClient.resource('process-definition');
var deploymentService         = new camundaClient.resource('deployment');

// External Task subscription to do business logic
client.subscribe("sysout", async function({ task, taskService }) {
  console.log('Hello World: %s', task.variables.get("text"));
  await taskService.complete(task);
});

// Deployment of Workflow Definition during startup (duplicates are NOT deployed)
function deployProcess() {
    filename = "sysout.bpmn";
    path = path.join(__dirname, filename);
    console.log(path);

    fs.readFile(path, function (err, content) {
      if (err) { throw err }

      console.log(content.toString());
      
      // create a deployment with...
      deploymentService.create({
        // ... the settings
        deploymentName:           "sysout",
        enableDuplicateFiltering: "true",
        deployChangedOnly:        "true",
        files:                    [ {
          name:    filename,
          content: content.toString()
        } ]
      }, function (err, deployment) {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log('[%s] Deployment "' + deployment.name + '" succeeded, ' + deployment.deploymentTime);
      });
    });

}

// Auto deploy on Startup
deployProcess();

// Start workflow instance
function startProcess(text) {
  processDefinitionService.submit({
        key: "sysout",
        variables: {
          "text" : {
              "value" : text,
              "type": "String"
          }
        }
  }, function (err) {
    if (err) {
      throw err;
    }

    console.log('Process instance started: ' + text);
  });
}

// Webserver to provide REST API to start workflow instances
var express = require('express');
var app = express();
app.use(express.json());

app.post('/hello', function (req, res) {
  startProcess(req.body.text);  
  res.send('Hello initiated');
})

var server = app.listen(targetPort, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("REST API now listening at http://%s:%s", host, port)
})