package com.pm.imaging_service.repository;

import com.pm.imaging_service.model.MedicalImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicalImageRepository extends JpaRepository<MedicalImage, UUID> {
    List<MedicalImage> findByPatientIdOrderByUploadedDateDesc(UUID patientId);
}
