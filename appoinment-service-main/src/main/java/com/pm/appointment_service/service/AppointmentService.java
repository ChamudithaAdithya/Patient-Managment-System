package com.pm.appointment_service.service;

import com.pm.appointment_service.dto.AppointmentRequestDTO;
import com.pm.appointment_service.dto.AppointmentResponseDTO;
import com.pm.appointment_service.mapper.AppointmentMapper;
import com.pm.appointment_service.model.Appointment;
import com.pm.appointment_service.model.AppointmentStatus;
import com.pm.appointment_service.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository repo;

    public AppointmentService(AppointmentRepository repo) {
        this.repo = repo;
    }

    public List<AppointmentResponseDTO> getAll() {
        return repo.findAll().stream().map(AppointmentMapper::toDTO).collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByPatientId(UUID patientId) {
        return repo.findByPatientId(patientId).stream().map(AppointmentMapper::toDTO).collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByDoctorId(UUID doctorId) {
        return repo.findByDoctorId(doctorId).stream().map(AppointmentMapper::toDTO).collect(Collectors.toList());
    }

    public AppointmentResponseDTO getById(UUID id) {
        Appointment a = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        return AppointmentMapper.toDTO(a);
    }

    public AppointmentResponseDTO create(AppointmentRequestDTO request) {
        // CONFLICT CHECK: doctor already booked at this exact time
        boolean conflict = repo.existsByDoctorIdAndAppointmentDateTime(request.getDoctorId(), request.getAppointmentDateTime());
        if (conflict) {
            throw new RuntimeException("Doctor already has an appointment at this time");
        }

        Appointment a = AppointmentMapper.toModel(request);
        Appointment saved = repo.save(a);
        return AppointmentMapper.toDTO(saved);
    }

    public AppointmentResponseDTO cancel(UUID id) {
        Appointment a = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        a.setStatus(AppointmentStatus.CANCELLED);
        return AppointmentMapper.toDTO(repo.save(a));
    }

    public AppointmentResponseDTO complete(UUID id) {
        Appointment a = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        a.setStatus(AppointmentStatus.COMPLETED);
        return AppointmentMapper.toDTO(repo.save(a));
    }

    public List<LocalDateTime> getAvailableSlots(UUID doctorId, LocalDate date) {
        // Simple logic: 9 AM to 5 PM, 30-min slots
        LocalDateTime start = date.atTime(9, 0);
        LocalDateTime end = date.atTime(17, 0);

        List<Appointment> booked = repo.findByDoctorIdAndAppointmentDateTimeBetween(doctorId, start, end);
        List<LocalDateTime> bookedTimes = booked.stream()
                .map(Appointment::getAppointmentDateTime)
                .collect(Collectors.toList());

        List<LocalDateTime> slots = new ArrayList<>();
        LocalDateTime current = start;
        while (current.isBefore(end)) {
            if (!bookedTimes.contains(current)) {
                slots.add(current);
            }
            current = current.plusMinutes(30);
        }
        return slots;
    }
}