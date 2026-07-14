package com.pm.appointment_service.mapper;

import com.pm.appointment_service.dto.ConsultationRequestDTO;
import com.pm.appointment_service.dto.ConsultationResponseDTO;
import com.pm.appointment_service.model.Consultation;

import java.time.LocalDateTime;
import java.util.UUID;

public class ConsultationMapper {

    public static Consultation toModel(ConsultationRequestDTO dto, UUID doctorId) {
        Consultation c = new Consultation();
        c.setAppointmentId(dto.getAppointmentId());
        c.setDoctorId(doctorId);
        c.setPatientId(dto.getPatientId());
        c.setSymptoms(dto.getSymptoms());
        c.setDiagnosis(dto.getDiagnosis());
        c.setNotes(dto.getNotes());
        c.setCreatedDate(LocalDateTime.now());
        return c;
    }

    public static ConsultationResponseDTO toDTO(Consultation c) {
        ConsultationResponseDTO dto = new ConsultationResponseDTO();
        dto.setId(c.getId());
        dto.setAppointmentId(c.getAppointmentId());
        dto.setDoctorId(c.getDoctorId());
        dto.setPatientId(c.getPatientId());
        dto.setSymptoms(c.getSymptoms());
        dto.setDiagnosis(c.getDiagnosis());
        dto.setNotes(c.getNotes());
        dto.setCreatedDate(c.getCreatedDate());
        return dto;
    }
}
