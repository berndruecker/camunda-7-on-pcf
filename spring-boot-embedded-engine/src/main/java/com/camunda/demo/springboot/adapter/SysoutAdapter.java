package com.camunda.demo.springboot.adapter;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

import com.camunda.demo.springboot.conf.ProcessConstants;

@Component
public class SysoutAdapter implements JavaDelegate {

  @Override
  public void execute(DelegateExecution ctx) throws Exception {
    String text = (String) ctx.getVariable(ProcessConstants.VAR_NAME_text);
    
    System.out.println("Hello World\n" + text + "\n\n");    
  }
}
