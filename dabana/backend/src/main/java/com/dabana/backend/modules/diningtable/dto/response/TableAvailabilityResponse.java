package com.dabana.backend.modules.diningtable.dto.response;

import com.dabana.backend.modules.diningtable.util.TableAvailabilityStatus;
import lombok.Builder;
import lombok.Data;

@Data
public class TableAvailabilityResponse extends DiningTableResponse{
     private TableAvailabilityStatus availabilityStatus;
}
