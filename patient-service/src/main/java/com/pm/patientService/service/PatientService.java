package com.pm.patientService.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.pm.patientService.dto.PatientRequestDTO;
import com.pm.patientService.dto.PatientResponseDTO;
@Service
public interface PatientService {
    public List<PatientResponseDTO> getAllPatients();
    public PatientResponseDTO getPatientById(UUID id);
    public PatientResponseDTO createPatient(PatientRequestDTO patient);
    public PatientResponseDTO updatePatient(UUID id,PatientRequestDTO patientRequestDTO);
    public PatientResponseDTO deletePatientById(UUID id);
}
