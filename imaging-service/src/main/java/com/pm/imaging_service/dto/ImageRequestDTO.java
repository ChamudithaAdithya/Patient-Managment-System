package com.pm.imaging_service.dto;

import com.pm.imaging_service.model.ImageType;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class ImageRequestDTO {

    @NotNull
    private UUID patientId;

    @NotNull
    private ImageType imageType;

    public UUID getPatientId() { return patientId; }
    public void setPatientId(UUID patientId) { this.patientId = patientId; }

    public ImageType getImageType() { return imageType; }
    public void setImageType(ImageType imageType) { this.imageType = imageType; }
}
