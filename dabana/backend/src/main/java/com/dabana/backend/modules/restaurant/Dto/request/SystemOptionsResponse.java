package com.dabana.backend.modules.restaurant.Dto.request;

import java.util.List;

public class SystemOptionsResponse {
    private List<String> provinces;
    private List<String> cuisines;

    // Constructor mặc định (cần thiết cho Jackson khi parse JSON nếu có)
    public SystemOptionsResponse() {
    }

    // Constructor đầy đủ tham số
    public SystemOptionsResponse(List<String> provinces, List<String> cuisines) {
        this.provinces = provinces;
        this.cuisines = cuisines;
    }

    // Getters và Setters
    public List<String> getProvinces() {
        return provinces;
    }

    public void setProvinces(List<String> provinces) {
        this.provinces = provinces;
    }

    public List<String> getCuisines() {
        return cuisines;
    }

    public void setCuisines(List<String> cuisines) {
        this.cuisines = cuisines;
    }
}