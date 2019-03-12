package com.camunda.demo.springboot;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.variable.Variables;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.camunda.demo.springboot.conf.ProcessConstants;

@RestController
@RequestMapping("/hello")
public class SysoutRestController {
  
  @Autowired
  private ProcessEngine camunda;

  @RequestMapping(method=RequestMethod.POST)
  public void sayHelloWorldPOST(String text) {
    sayHelloWorld(text);
  }

  /**
   * we need a method returning the {@link ProcessInstance} to allow for easier tests,
   * that's why I separated the REST method (without return) from the actual implementation (with return value)
   */
  public ProcessInstance sayHelloWorld(String text) {
    return camunda.getRuntimeService().startProcessInstanceByKey(//
        ProcessConstants.PROCESS_KEY, //
        Variables //
          .putValue(ProcessConstants.VAR_NAME_text, text));
  }
}
