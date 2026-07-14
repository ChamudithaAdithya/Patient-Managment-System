package com.pm.imaging_service.service;

import com.pm.imaging_service.dto.ImageResponseDTO;
import com.pm.imaging_service.exception.ErrorResponseDTO;
import com.pm.imaging_service.model.ImageType;
import com.pm.imaging_service.model.MedicalImage;
import com.pm.imaging_service.repository.MedicalImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ImageService {

    private final MedicalImageRepository repo;
    private final Path storagePath;

    public ImageService(MedicalImageRepository repo,
                        @Value("${image.storage.path}") String storagePath) throws IOException {
        this.repo = repo;
        this.storagePath = Paths.get(storagePath);
        Files.createDirectories(this.storagePath);
    }

    public ImageResponseDTO upload(MultipartFile file, UUID patientId, ImageType imageType, UUID uploadedBy) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }

        String storedName = UUID.randomUUID() + "-" + originalName;

        Path patientDir = storagePath.resolve(patientId.toString());
        Files.createDirectories(patientDir);

        Path targetPath = patientDir.resolve(storedName);
        file.transferTo(targetPath.toFile());

        MedicalImage img = new MedicalImage();
        img.setPatientId(patientId);
        img.setUploadedBy(uploadedBy);
        img.setImageType(imageType);
        img.setFileName(originalName);
        img.setFilePath(targetPath.toString());
        img.setUploadedDate(LocalDateTime.now());

        MedicalImage saved = repo.save(img);
        return toDTO(saved);
    }

    public List<ImageResponseDTO> getByPatientId(UUID patientId) {
        return repo.findByPatientIdOrderByUploadedDateDesc(patientId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ResponseEntity<Resource> download(UUID id) {
        MedicalImage img = repo.findById(id)
                .orElse(null);

        if (img == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get(img.getFilePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header("Content-Disposition", "inline; filename=\"" + img.getFileName() + "\"")
                .body(resource);
    }

    public ResponseEntity<?> delete(UUID id) {
        MedicalImage img = repo.findById(id)
                .orElse(null);

        if (img == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponseDTO("Image not found with id: " + id));
        }

        try {
            Files.deleteIfExists(Paths.get(img.getFilePath()));
        } catch (IOException e) {
            // File already missing — still delete the record
        }

        repo.delete(img);
        return ResponseEntity.noContent().build();
    }

    private ImageResponseDTO toDTO(MedicalImage img) {
        ImageResponseDTO dto = new ImageResponseDTO();
        dto.setId(img.getId());
        dto.setPatientId(img.getPatientId());
        dto.setUploadedBy(img.getUploadedBy());
        dto.setImageType(img.getImageType());
        dto.setFileName(img.getFileName());
        dto.setUploadedDate(img.getUploadedDate());
        return dto;
    }
}
