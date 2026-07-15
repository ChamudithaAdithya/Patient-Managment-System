package com.pm.imaging_service.dto;

import com.pm.imaging_service.model.ImageType;
import java.time.LocalDateTime;
import java.util.UUID;

public class ImageResponseDTO {

    private UUID id;
    private UUID patientId;
    private UUID uploadedBy;
    private ImageType imageType;
    private String fileName;
    private LocalDateTime uploadedDate;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPatientId() { return patientId; }
    public void setPatientId(UUID patientId) { this.patientId = patientId; }

    public UUID getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(UUID uploadedBy) { this.uploadedBy = uploadedBy; }

    public ImageType getImageType() { return imageType; }
    public void setImageType(ImageType imageType) { this.imageType = imageType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public LocalDateTime getUploadedDate() { return uploadedDate; }
    public void setUploadedDate(LocalDateTime uploadedDate) { this.uploadedDate = uploadedDate; }
}
