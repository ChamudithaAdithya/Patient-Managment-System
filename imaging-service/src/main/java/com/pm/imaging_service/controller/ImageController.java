package com.pm.imaging_service.controller;

import com.pm.imaging_service.dto.ImageResponseDTO;
import com.pm.imaging_service.model.ImageType;
import com.pm.imaging_service.service.ImageService;
import com.pm.imaging_service.service.S3ImageService;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final ImageService service;
    private final S3ImageService s3ImageService;

    public ImageController(S3ImageService s3ImageService) {
        this.service = null;
        this.s3ImageService = s3ImageService;
    }

    @PostMapping("/patients/{patientId}/upload")
    public ResponseEntity<Map<String, String>> uploadToS3(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file) {
        String key = s3ImageService.uploadImage(patientId, file);
        String url = s3ImageService.getImageUrl(key);
        return ResponseEntity.ok(Map.of("key", key, "url", url));
    }

    @GetMapping("/url")
    public ResponseEntity<Map<String, String>> getUrl(@RequestParam String key) {
        String url = s3ImageService.getImageUrl(key);
        return ResponseEntity.ok(Map.of("url", url));
    }

    public ImageController(ImageService service) {
        this.service = service;
        this.s3ImageService = null;
    }

    @PostMapping("/upload")
    public ResponseEntity<ImageResponseDTO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") UUID patientId,
            @RequestParam("imageType") ImageType imageType,
            Authentication authentication) throws IOException {

        String email = authentication.getName();
        UUID uploadedBy = UUID.nameUUIDFromBytes(email.getBytes());

        return ResponseEntity.ok(service.upload(file, patientId, imageType, uploadedBy));
    }

    @GetMapping("/patient/{patientId}")
    public List<ImageResponseDTO> getByPatient(@PathVariable UUID patientId) {
        return service.getByPatientId(patientId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        return service.download(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return service.delete(id);
    }
}
