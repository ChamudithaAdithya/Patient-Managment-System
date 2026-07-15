package com.pm.appointment_service.service;

import com.pm.appointment_service.dto.ConsultationRequestDTO;
import com.pm.appointment_service.dto.ConsultationResponseDTO;
import com.pm.appointment_service.exception.BusinessException;
import com.pm.appointment_service.exception.ResourceNotFoundException;
import com.pm.appointment_service.kafka.KafkaProducer;
import com.pm.appointment_service.mapper.ConsultationMapper;
import com.pm.appointment_service.model.Appointment;
import com.pm.appointment_service.model.AppointmentStatus;
import com.pm.appointment_service.model.Consultation;
import com.pm.appointment_service.repository.AppointmentRepository;
import com.pm.appointment_service.repository.ConsultationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ConsultationService {

    private final ConsultationRepository consultationRepo;
    private final AppointmentRepository appointmentRepo;
    private final KafkaProducer kafkaProducer;

    public ConsultationService(ConsultationRepository consultationRepo,
                               AppointmentRepository appointmentRepo,
                               KafkaProducer kafkaProducer) {
        this.consultationRepo = consultationRepo;
        this.appointmentRepo = appointmentRepo;
        this.kafkaProducer = kafkaProducer;
    }

    public ConsultationResponseDTO create(ConsultationRequestDTO request) {
        if (consultationRepo.existsByAppointmentId(request.getAppointmentId())) {
            throw new BusinessException("Consultation already exists for this appointment");
        }

        Appointment appointment = appointmentRepo.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", request.getAppointmentId()));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException("Cannot create consultation for a completed appointment");
        }

        Consultation consultation = ConsultationMapper.toModel(request, appointment.getDoctorId());
        Consultation saved = consultationRepo.save(consultation);

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepo.save(appointment);
        kafkaProducer.sendEvent(appointment, "APPOINTMENT_COMPLETED");

        return ConsultationMapper.toDTO(saved);
    }

    public ConsultationResponseDTO getByAppointmentId(UUID appointmentId) {
        Consultation c = consultationRepo.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", appointmentId));
        return ConsultationMapper.toDTO(c);
    }

    public ConsultationResponseDTO getById(UUID id) {
        Consultation c = consultationRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", id));
        return ConsultationMapper.toDTO(c);
    }

    public List<ConsultationResponseDTO> getByPatientId(UUID patientId) {
        return consultationRepo.findAll().stream()
                .filter(c -> c.getPatientId().equals(patientId))
                .map(ConsultationMapper::toDTO)
                .collect(Collectors.toList());
    }
}
