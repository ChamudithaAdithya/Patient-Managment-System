package com.pm.appointment_service.mapper;

import com.pm.appointment_service.dto.DoctorRequestDTO;
import com.pm.appointment_service.dto.DoctorResponseDTO;
import com.pm.appointment_service.model.Doctor;

public class DoctorMapper {

    public static Doctor toModel(DoctorRequestDTO dto) {
        Doctor d = new Doctor();
        d.setName(dto.getName());
        d.setEmail(dto.getEmail());
        d.setPhone(dto.getPhone());
        d.setSpecialization(dto.getSpecialization());
        d.setDepartment(dto.getDepartment());
        return d;
    }

    public static DoctorResponseDTO toDTO(Doctor d) {
        DoctorResponseDTO dto = new DoctorResponseDTO();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setEmail(d.getEmail());
        dto.setPhone(d.getPhone());
        dto.setSpecialization(d.getSpecialization());
        dto.setDepartment(d.getDepartment());
        return dto;
    }
}
