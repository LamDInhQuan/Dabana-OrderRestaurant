package com.dabana.backend.modules.zone.service;

import com.dabana.backend.modules.zone.dto.request.CreateZoneRequest;
import com.dabana.backend.modules.zone.dto.request.UpdateZoneRequest;
import com.dabana.backend.modules.zone.dto.response.ZoneResponse;

import java.util.List;

public interface IZoneService {

    List<ZoneResponse> getZonesByBranch(Long branchId);

    ZoneResponse createZone(CreateZoneRequest request);

    ZoneResponse updateZone(Long zoneId, UpdateZoneRequest request);

    void deleteZone(Long zoneId);
}