package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.branch2.dto.request.BranchScheduleExceptionRequest;
import com.dabana.backend.modules.branch2.service.BranchScheduleExceptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.http.ResponseUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/branchs/{branchId}/schedule-exceptions")
@RequiredArgsConstructor
public class BranchScheduleExceptionController {
    private final BranchScheduleExceptionService service;

    @PostMapping
    public ResponseEntity<?> create(
            @PathVariable Long branchId,
            @Valid @RequestBody BranchScheduleExceptionRequest request){

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        SuccessCode.CREATED,
                        service.create(branchId,request)
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long branchId,
            @PathVariable Long id,
            @Valid @RequestBody BranchScheduleExceptionRequest request){

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        SuccessCode.UPDATED,
                        service.update(branchId,id,request)
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long branchId,
            @PathVariable Long id){
        service.delete(branchId,id);
        return ResponseEntity.ok(
                ResponseBuilder.success(
                        SuccessCode.DELETED , null
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(
            @PathVariable Long branchId,
            @PathVariable Long id){

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        SuccessCode.SUCCESS,
                        service.findById(branchId,id)
                )
        );
    }

    @GetMapping
    public ResponseEntity<?> findAll(
            @PathVariable Long branchId){

        return ResponseEntity.ok(
                ResponseBuilder.success(
                        SuccessCode.SUCCESS,
                        service.findAll(branchId)
                )
        );
    }
}
