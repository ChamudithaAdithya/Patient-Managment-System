package com.pm.appointment_service.kafka;

import appointment.events.AppointmentEvent;
import com.pm.appointment_service.model.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducer {

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private static final Logger log = LoggerFactory.getLogger(KafkaProducer.class);

    public KafkaProducer(KafkaTemplate<String, byte[]> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendEvent(Appointment appointment, String eventType) {
        AppointmentEvent event = AppointmentEvent.newBuilder()
                .setAppointmentID(appointment.getId().toString())
                .setPatientID(appointment.getPatientId().toString())
                .setDoctorID(appointment.getDoctorId().toString())
                .setAppointmentDateTime(appointment.getAppointmentDateTime().toString())
                .setStatus(appointment.getStatus().name())
                .setEventType(eventType)
                .build();
        try {
            kafkaTemplate.send("appointment", event.toByteArray());
        } catch (Exception e) {
            log.info("Failed to produce the event {}", event);
        }
    }
}
