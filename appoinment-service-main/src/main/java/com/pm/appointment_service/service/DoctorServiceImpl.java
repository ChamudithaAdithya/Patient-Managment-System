package com.pm.appointment_service.service;

import com.pm.appointment_service.dto.DoctorRequestDTO;
import com.pm.appointment_service.dto.DoctorResponseDTO;
import com.pm.appointment_service.exception.ResourceNotFoundException;
import com.pm.appointment_service.mapper.DoctorMapper;
import com.pm.appointment_service.model.Doctor;
import com.pm.appointment_service.repository.DoctorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository repository;

    DoctorServiceImpl(DoctorRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<DoctorResponseDTO> getAllDoctors() {
        return repository.findAll().stream().map(DoctorMapper::toDTO).toList();
    }

    @Override
    public DoctorResponseDTO getDoctorById(UUID id) {
        Doctor doctor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));
        return DoctorMapper.toDTO(doctor);
    }

    @Override
    public DoctorResponseDTO createDoctor(DoctorRequestDTO dto) {
        Doctor doctor = DoctorMapper.toModel(dto);
        return DoctorMapper.toDTO(repository.save(doctor));
    }

    @Override
    public DoctorResponseDTO updateDoctor(UUID id, DoctorRequestDTO dto) {
        Doctor doctor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", id));
        doctor.setName(dto.getName());
        doctor.setEmail(dto.getEmail());
        doctor.setPhone(dto.getPhone());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setDepartment(dto.getDepartment());
        return DoctorMapper.toDTO(repository.save(doctor));
    }

    @Override
    public void deleteDoctor(UUID id) {
        repository.deleteById(id);
    }
}
