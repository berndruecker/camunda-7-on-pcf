# Use Camunda Server in your Node.JS application

In this scenario you run Camunda as a service. See [Engine as a Service](../engine-as-a-service/) for how-to set this up on PCF. In this tutorial I assume that the service is available via REST on https://camunda-on-pcf-engine-as-a-service.cfapps.io.

![](../docs/node-js-architecture.png)

1. Leverage the [REST API](https://docs.camunda.org/manual/latest/reference/rest/) as well as the language client for [External Tasks]https://github.com/camunda/camunda-external-task-client-js):

```
var {Client} = require("camunda-external-task-client-js");  
```

2. [Deploy the workflow model during application startup](https://github.com/berndruecker/camunda-on-pcf/blob/master/nodejs-sample/index.js#Lxx) (you could also do that via CI/CD, but the lifecycle management is easier like this and the Camunda engine detects duplicates and don’t deploy them again).

3. [Create a webserver to serve your REST API and start process instances](https://github.com/berndruecker/camunda-on-pcf/blob/master/nodejs-sample/index.js#Lxx).

4. [Subscribe a worker to the external task](https://github.com/berndruecker/camunda-on-pcf/blob/master/nodejs-sample/index.js#Lxx) to do the sysout when a process instance arrives there:

```
client.subscribe("sysout", async function({ task, taskService }) {  
  console.log('Hello World: %s', task.variables.get("text"));  
  await taskService.complete(task);  
});
```

5. Build and run this application locally:

```
npm start
```

6. Deploy it on PCF:

```
cf push
```

Now you can send REST requests:

```
curl --request POST --data '{"text":"some text for hello world"}' \\  
https://camunda-on-pcf-nodejs-sample.cfapps.io/hello
```

## Screencast

This video walks you through the procedure:
ADD YOUTUBE VIDEO HERE