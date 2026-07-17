package com.dabana.backend.common;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class ErrorDetail {

    private String field;

    private String message;
}