package com.pm.analytics_service.kafka;

import com.google.protobuf.InvalidProtocolBufferException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import patient.events.PatientEvent;

@Service
public class KafkaConsumer {
    private final static Logger log = LoggerFactory.getLogger(KafkaConsumer.class);
    
    @KafkaListener(topics = "patient",groupId = "analytic-service")
    public void consumeEvent(byte[] event){
        try {
            PatientEvent patientEvent = PatientEvent.parseFrom(event);
            log.info("Received Patient Event: [patient_id={},patient_name={},patient_email={}",patientEvent.getPatientID(),patientEvent.getName(),patientEvent.getEmail());
        }catch (InvalidProtocolBufferException e){
            log.info("Failed to deserialize event {}",e.getMessage());
        }
    }
}
