package com.dabana.backend.modules.booking;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
        name = "rs_reservation_tables",
        uniqueConstraints = @UniqueConstraint(columnNames = {"reservation_id", "table_id"})
)
public class BookingTable extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private DiningTable diningTable;
}
