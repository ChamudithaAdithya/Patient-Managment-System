package com.pm.imaging_service.controller;

import com.pm.imaging_service.dto.ImageResponseDTO;
import com.pm.imaging_service.model.ImageType;
import com.pm.imaging_service.service.ImageService;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final ImageService service;

    public ImageController(ImageService service) {
        this.service = service;
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
