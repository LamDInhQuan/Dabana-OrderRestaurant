package com.dabana.backend.modules.branch2.util;

import lombok.Getter;

@Getter
public enum BranchStatus {
    INACTIVE(1),
    ACTIVE(2),
    PENDING(3),
    REJECTED(4),
    SUSPENDED(5);

    BranchStatus(Integer status) {
        this.status = status;
    }

    private final Integer status;
}
