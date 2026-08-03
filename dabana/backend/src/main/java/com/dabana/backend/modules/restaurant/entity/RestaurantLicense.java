package com.dabana.backend.modules.restaurant.entity;

import java.sql.Blob;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// B03: Ho so thuong hieu nha hang doi tac (mot tai khoan doi tac
// chi co mot ho so duy nhat - BR01).
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Entity
@Table(name = "rt_restaurant_licenses")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor

public class RestaurantLicense extends com.dabana.backend.common.BaseEntity {

    @Column(length = 200)
    private String url;

    @Column(length = 200)
    private String fileName;

    @Column(length = 200)
    private String fileType;

    @JsonIgnore
    @Lob
    private Blob image;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;
    
}
