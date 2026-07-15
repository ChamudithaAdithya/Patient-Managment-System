package com.pm.analytics.kafka;

import appointment.events.AppointmentEvent;
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
    public void consumePatientEvent(byte[] event){
        try {
            PatientEvent patientEvent = PatientEvent.parseFrom(event);
            log.info("Received Patient Event: [patient_id={},patient_name={},patient_email={}]",patientEvent.getPatientID(),patientEvent.getName(),patientEvent.getEmail());
        }catch (InvalidProtocolBufferException e){
            log.info("Failed to deserialize patient event {}",e.getMessage());
        }
    }

    @KafkaListener(topics = "appointment",groupId = "analytic-service")
    public void consumeAppointmentEvent(byte[] event){
        try {
            AppointmentEvent ae = AppointmentEvent.parseFrom(event);
            log.info("Received Appointment Event: [appointment_id={},patient_id={},doctor_id={},date_time={},status={},event_type={}]",
                    ae.getAppointmentID(), ae.getPatientID(), ae.getDoctorID(),
                    ae.getAppointmentDateTime(), ae.getStatus(), ae.getEventType());
        }catch (InvalidProtocolBufferException e){
            log.info("Failed to deserialize appointment event {}",e.getMessage());
        }
    }
}
