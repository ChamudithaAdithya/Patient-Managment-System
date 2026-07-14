package com.pm.appointment_service.service;

import com.pm.appointment_service.dto.AppointmentRequestDTO;
import com.pm.appointment_service.dto.AppointmentResponseDTO;
import com.pm.appointment_service.exception.BusinessException;
import com.pm.appointment_service.exception.ResourceNotFoundException;
import com.pm.appointment_service.kafka.KafkaProducer;
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
    private final KafkaProducer kafkaProducer;

    public AppointmentService(AppointmentRepository repo, KafkaProducer kafkaProducer) {
        this.repo = repo;
        this.kafkaProducer = kafkaProducer;
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
        Appointment a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        return AppointmentMapper.toDTO(a);
    }

    public AppointmentResponseDTO create(AppointmentRequestDTO request) {
        boolean conflict = repo.existsByDoctorIdAndAppointmentDateTime(request.getDoctorId(), request.getAppointmentDateTime());
        if (conflict) {
            throw new BusinessException("Doctor already has an appointment at this time");
        }

        Appointment a = AppointmentMapper.toModel(request);
        Appointment saved = repo.save(a);
        kafkaProducer.sendEvent(saved, "APPOINTMENT_CREATED");
        return AppointmentMapper.toDTO(saved);
    }

    public AppointmentResponseDTO cancel(UUID id) {
        Appointment a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        a.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = repo.save(a);
        kafkaProducer.sendEvent(saved, "APPOINTMENT_CANCELLED");
        return AppointmentMapper.toDTO(saved);
    }

    public AppointmentResponseDTO complete(UUID id) {
        Appointment a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        a.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = repo.save(a);
        kafkaProducer.sendEvent(saved, "APPOINTMENT_COMPLETED");
        return AppointmentMapper.toDTO(saved);
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