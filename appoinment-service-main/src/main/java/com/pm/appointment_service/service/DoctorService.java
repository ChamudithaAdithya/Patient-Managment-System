package com.pm.appointment_service.service;

import com.pm.appointment_service.dto.DoctorRequestDTO;
import com.pm.appointment_service.dto.DoctorResponseDTO;

import java.util.List;
import java.util.UUID;

public interface DoctorService {
    List<DoctorResponseDTO> getAllDoctors();
    DoctorResponseDTO getDoctorById(UUID id);
    DoctorResponseDTO createDoctor(DoctorRequestDTO dto);
    DoctorResponseDTO updateDoctor(UUID id, DoctorRequestDTO dto);
    void deleteDoctor(UUID id);
}
