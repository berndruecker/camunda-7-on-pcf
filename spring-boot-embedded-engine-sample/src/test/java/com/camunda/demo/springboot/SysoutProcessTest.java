package com.camunda.demo.springboot;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.test.Deployment;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.NONE, //
    classes = Application.class, //
    properties = { //
        "camunda.bpm.job-execution.enabled=false", //
        "camunda.bpm.auto-deployment-enabled=false", //
        "restProxyHost=api.example.org", //
        "restProxyPort=80" })
@Deployment(resources = { "sysout.bpmn" })
@ActiveProfiles({ "test" })
public class SysoutProcessTest {
  
  @Autowired
  private SysoutRestController sysoutRestController; 

  @Test
  public void testHappyPath() throws Exception {
    String text = "Testcase: " + UUID.randomUUID().toString();

    ProcessInstance processInstance = sysoutRestController.sayHelloWorld(text);
    
    // and very that some things happened
    assertThat(processInstance.isEnded());
  }
}
