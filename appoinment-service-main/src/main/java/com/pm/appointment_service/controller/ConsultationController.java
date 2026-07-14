package com.pm.appointment_service.controller;

import com.pm.appointment_service.dto.ConsultationRequestDTO;
import com.pm.appointment_service.dto.ConsultationResponseDTO;
import com.pm.appointment_service.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/consultations")
public class ConsultationController {

    private final ConsultationService service;

    public ConsultationController(ConsultationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ConsultationResponseDTO> create(@Valid @RequestBody ConsultationRequestDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ConsultationResponseDTO getByAppointment(@PathVariable UUID appointmentId) {
        return service.getByAppointmentId(appointmentId);
    }

    @GetMapping("/patient/{patientId}")
    public List<ConsultationResponseDTO> getByPatient(@PathVariable UUID patientId) {
        return service.getByPatientId(patientId);
    }

    @GetMapping("/{id}")
    public ConsultationResponseDTO getById(@PathVariable UUID id) {
        return service.getById(id);
    }
}
