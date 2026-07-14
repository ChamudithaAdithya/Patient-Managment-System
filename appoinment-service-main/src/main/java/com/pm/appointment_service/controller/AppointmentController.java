package com.pm.appointment_service.controller;

import com.pm.appointment_service.dto.AppointmentRequestDTO;
import com.pm.appointment_service.dto.AppointmentResponseDTO;
import com.pm.appointment_service.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<AppointmentResponseDTO> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public AppointmentResponseDTO getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @GetMapping("/patient/{patientId}")
    public List<AppointmentResponseDTO> getByPatient(@PathVariable UUID patientId) {
        return service.getByPatientId(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<AppointmentResponseDTO> getByDoctor(@PathVariable UUID doctorId) {
        return service.getByDoctorId(doctorId);
    }

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> create(@Valid @RequestBody AppointmentRequestDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponseDTO> complete(@PathVariable UUID id) {
        return ResponseEntity.ok(service.complete(id));
    }

    @GetMapping("/doctor/{doctorId}/available")
    public ResponseEntity<List<LocalDateTime>> getAvailableSlots(
            @PathVariable UUID doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getAvailableSlots(doctorId, date));
    }
}