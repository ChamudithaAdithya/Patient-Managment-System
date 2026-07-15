package com.pm.appointment_service.mapper;

import com.pm.appointment_service.dto.AppointmentRequestDTO;
import com.pm.appointment_service.dto.AppointmentResponseDTO;
import com.pm.appointment_service.model.Appointment;
import com.pm.appointment_service.model.AppointmentStatus;

public class AppointmentMapper {

    public static Appointment toModel(AppointmentRequestDTO dto) {
        Appointment a = new Appointment();
        a.setPatientId(dto.getPatientId());
        a.setDoctorId(dto.getDoctorId());
        a.setAppointmentDateTime(dto.getAppointmentDateTime());
        a.setReason(dto.getReason());
        a.setStatus(AppointmentStatus.SCHEDULED);
        return a;
    }

    public static AppointmentResponseDTO toDTO(Appointment a) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.setId(a.getId());
        dto.setPatientId(a.getPatientId());
        dto.setDoctorId(a.getDoctorId());
        dto.setAppointmentDateTime(a.getAppointmentDateTime());
        dto.setStatus(a.getStatus());
        dto.setReason(a.getReason());
        return dto;
    }
}
