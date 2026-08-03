package com.dabana.backend.modules.restaurant.service;

import com.dabana.backend.modules.branch2.dto.OperatingPeriod;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import com.dabana.backend.modules.branch2.mapper.BranchMapper;
import com.dabana.backend.modules.branch2.repository.BranchImageRepository;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import com.dabana.backend.modules.restaurant.Dto.request.SystemOptionsResponse;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantDetailResponse;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.dto.BookingDtos.BookingResponse;
import com.dabana.backend.modules.booking.mapper.BookingMapper;
import com.dabana.backend.modules.booking.repository.BookingTableRepository;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.invoice.repository.InvoiceRepository;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.RestaurantErrorCode;
import com.dabana.backend.modules.restaurant.Dto.report.BranchReportDto;
import com.dabana.backend.modules.restaurant.Dto.report.DetailExcelReport;
import com.dabana.backend.modules.restaurant.Dto.report.PerDayReport;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.review.ReviewRepository;
import com.dabana.backend.modules.waitlist.WaitlistRepository;
import com.dabana.backend.modules.waitlist.WaitlistStatus;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RestaurantService {
    private final DiningTableMapper diningTableMapper;
    private final RestaurantRepository restaurantRepos;
    private final BranchRepository branchRepository;
    private final BookingRepository bookingRepository;
    private final BookingTableRepository bookingTableRepository;
    private final UserRepository userRepository;
    private final WaitlistRepository waitlistRepository;
    private final DiningTableRepository diningTableRepository;
    private final ReviewRepository reviewRepository;
    private final InvoiceRepository invoiceRepository;
    private final BranchImageRepository branchImageRepository;
    private final BranchMapper branchMapper;


    private final RestaurantMapper restaurantMapper;
    private final BookingMapper bookingMapper;

    public List<RestaurantResponse> findAll() {
        List<Restaurant> restaurants = restaurantRepos.findRestaurantsWithActiveBranches(BranchStatus.ACTIVE.getStatus());

        return restaurants.stream()
                .map(restaurantMapper::toResponse)
                .toList();
    }

    public RestaurantResponse findByOwnerId(Long ownerId) {
        return restaurantMapper.toResponse(restaurantRepos.findByOwnerUserId(ownerId)
                .orElseThrow(() -> new RuntimeException(
                        "Restaurant not found for ownerId: " + ownerId)));
    }

    public SystemOptionsResponse getAllOptions() {
        // Lấy danh sách tên các tỉnh thành (đã distinct hoặc chỉ lấy active)
        List<String> provinces = branchRepository.findAllActiveProvinceNames();

        // Lấy danh sách tên các loại ẩm thực từ các nhà hàng đã được duyệt
        List<String> cuisines = restaurantRepos.findAllActiveCuisineNames();

        return new SystemOptionsResponse(provinces, cuisines);
    }

    @Transactional(readOnly = true)
    public List<RestaurantDetailResponse> searchRestaurantsWithBranches(String keyword, String province, String cuisine) {
        // 1. Lấy danh sách Restaurant từ câu query branch filter
        List<Restaurant> restaurants = branchRepository.searchRestaurantsByBranchFilter(keyword, province, cuisine);

        if (restaurants.isEmpty()) {
            return List.of();
        }

        // 2. Lấy toàn bộ ID của các nhà hàng này để tìm các chi nhánh tương ứng
        List<Long> restaurantIds = restaurants.stream().map(Restaurant::getId).toList();
        List<Branch> branches = branchRepository.findByRestaurantIdInAndStatus(restaurantIds, 2);

        // LỌC NGAY TẠI ĐÂY: Chỉ giữ lại các chi nhánh khớp thực sự với Province và Cuisine người dùng tìm kiếm
        List<Branch> filteredBranches = branches.stream().filter(branch -> {
            if (province != null && !province.isBlank()) {
                if (branch.getProvince() == null || !branch.getProvince().toLowerCase().contains(province.trim().toLowerCase())) {
                    return false;
                }
            }
            if (cuisine != null && !cuisine.isBlank()) {
                String restaurantCuisine = branch.getRestaurant().getCuisineType();
                boolean matchCuisine = restaurantCuisine != null && restaurantCuisine.toLowerCase().contains(cuisine.trim().toLowerCase());
                if (!matchCuisine) {
                    return false;
                }
            }
            return true;
        }).toList();

        List<Long> validRestaurantIds = filteredBranches.stream()
                .map(b -> b.getRestaurant().getId())
                .distinct()
                .toList();

        List<Restaurant> finalRestaurants = restaurants.stream()
                .filter(r -> validRestaurantIds.contains(r.getId()))
                .toList();

        if (finalRestaurants.isEmpty()) {
            return List.of();
        }

        // 3. Gom ID các chi nhánh đã lọc lại
        List<Long> branchIds = filteredBranches.stream().map(Branch::getId).toList();

        // Lấy toàn bộ ảnh của các chi nhánh trong 1 câu lệnh duy nhất (tránh N+1)
        List<BranchImage> allImages = branchIds.isEmpty() ? List.of() : branchImageRepository.findByBranchIdInOrderByDisplayOrderAsc(branchIds);
        Map<Long, List<BranchImage>> imagesByBranchMap = allImages.stream()
                .collect(Collectors.groupingBy(img -> img.getBranch().getId()));

        // LẤY ĐIỂM ĐÁNH GIÁ (RATE) CHO TỪNG CHI NHÁNH
        Map<Long, Double> ratingMap = new HashMap<>();
        if (!branchIds.isEmpty()) {
            List<Object[]> rawRatings = reviewRepository.getAverageRatingByBranchIds(branchIds);
            for (Object[] row : rawRatings) {
                Long bId = (Long) row[0];
                Double avgVal = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
                ratingMap.put(bId, Math.round(avgVal * 10.0) / 10.0);
            }
        }
        Map<Long, List<Branch>> branchesByRestaurantMap = filteredBranches.stream()
                .collect(Collectors.groupingBy(b -> b.getRestaurant().getId()));

        // 4. Map sang Response DTO
        return finalRestaurants.stream().map(restaurant -> {
            List<Branch> restaurantBranches = branchesByRestaurantMap.getOrDefault(restaurant.getId(), List.of());
            return restaurantMapper.toDetailResponse(restaurant, restaurantBranches, imagesByBranchMap,ratingMap);
        }).toList();
    }

    public ByteArrayInputStream exportToExcel(Long ownerId, List<Long> branchIds, LocalDate from, LocalDate to)
            throws IOException {
        LocalDate startDate = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate endDate = to != null ? to : LocalDate.now();
        if (startDate.isAfter(endDate)) {
            LocalDate tmp = startDate;
            startDate = endDate;
            endDate = tmp;
        }

        List<Branch> branches = resolveBranches(ownerId, branchIds);

        try (
                Workbook workbook = new SXSSFWorkbook(100);
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            if (branches.isEmpty()) {
                Sheet sheet = workbook.createSheet("No data");
                Row headerRow = sheet.createRow(0);
                String[] headers = {"Ngày ", "Tổng phục vụ", "Tổng đơn đặt", "Tỉ lệ lấp bàn",
                        "Tỉ lệ no-show / hoàn thành", "Tổng giá trị đơn đặt"};
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                }
            } else {
                for (Branch branch : branches) {
                    buildExcelReport(branch, startDate, endDate, workbook);
                }
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private List<Branch> resolveBranches(Long ownerId, List<Long> branchIds) {
        if (branchIds == null || branchIds.isEmpty()) {
            return branchRepository.findByRestaurant_Owner_Id(ownerId);
        }

        return branchRepository.findAllById(branchIds).stream()
                .filter(branch -> branch.getRestaurant() != null
                        && branch.getRestaurant().getOwner() != null
                        && ownerId.equals(branch.getRestaurant().getOwner().getId()))
                .toList();
    }

    private void buildExcelReport(Branch branch, LocalDate from, LocalDate to, Workbook workbook) {
        List<Booking> branchBookings = bookingRepository.findByBranchId(branch.getId());
        List<Booking> filteredBookings = branchBookings.stream()
                .filter(booking -> booking.getCreatedAt() != null)
                .filter(booking -> {
                    LocalDate bookingDate = booking.getCreatedAt().toLocalDate();
                    return !bookingDate.isBefore(from) && !bookingDate.isAfter(to);
                })
                .toList();

        Map<LocalDate, List<Booking>> bookingsByDay = filteredBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getCreatedAt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()));

        Sheet sheet = workbook.createSheet(branch.getName());

        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());

        CellStyle summaryStyle = workbook.createCellStyle();
        Font summaryFont = workbook.createFont();
        summaryFont.setBold(true);
        summaryStyle.setFont(summaryFont);

        DetailExcelReport summaryDetail = buildSummaryExcelReport(filteredBookings, branch);

        int Row = 0;
        Row summaryRow0 = sheet.createRow(Row);
        summaryRow0.createCell(0).setCellValue("Chi nhánh");
        summaryRow0.createCell(2).setCellValue(branch.getName() != null ? branch.getName() : "");
        summaryRow0.createCell(3).setCellValue("Khoảng thời gian");
        summaryRow0.createCell(5).setCellValue(from + " đến " + to);

        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 0, 1));
        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 3, 4));
        Row++;

        Row summaryRow1 = sheet.createRow(Row);
        summaryRow1.createCell(0).setCellValue("Tổng phục vụ");
        summaryRow1.createCell(2)
                .setCellValue(summaryDetail.getDailyServing() != null ? summaryDetail.getDailyServing()
                        : 0L);
        summaryRow1.createCell(3).setCellValue("Tổng đơn đặt");
        summaryRow1.createCell(5)
                .setCellValue(summaryDetail.getDailyBooked() != null ? summaryDetail.getDailyBooked()
                        : 0L);

        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 0, 1));
        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 3, 4));
        Row++;

        Row summaryRow2 = sheet.createRow(Row);
        summaryRow2.createCell(0).setCellValue("Tỉ lệ lấp bàn");
        summaryRow2.createCell(2)
                .setCellValue(summaryDetail.getFillrate() != null ? summaryDetail.getFillrate() : 0.0);
        summaryRow2.createCell(3).setCellValue("Tỉ lệ no-show / hoàn thành");
        summaryRow2.createCell(5)
                .setCellValue(summaryDetail.getNoShowRate() != null ? summaryDetail.getNoShowRate()
                        : 0.0);
        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 0, 1));
        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 3, 4));
        Row++;

        Row summaryRow3 = sheet.createRow(Row);
        summaryRow3.createCell(0).setCellValue("Tổng giá trị đơn đặt");

        summaryRow3.createCell(2)
                .setCellValue(summaryDetail.getRevenue() != null ? summaryDetail.getRevenue() : 0.0);

        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 0, 1));
        sheet.addMergedRegion(new CellRangeAddress(Row, Row, 3, 4));

        for (int i = 0; i < 4; i++) {
            Row row = sheet.getRow(i);
            if (row != null) {
                for (int j = 0; j < 4; j++) {
                    Cell cell = row.getCell(j);
                    if (cell == null) {
                        cell = row.createCell(j);
                    }
                    cell.setCellStyle(summaryStyle);
                }
            }
        }

        String[] headers = {"Ngày ", "Tổng phục vụ", "Tổng đơn đặt", "Tỉ lệ lấp bàn",
                "Tỉ lệ no-show / hoàn thành", "Tổng giá trị đơn đặt"};
        Row headerRow = sheet.createRow(5);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
        sheet.setColumnWidth(0, 20 * 256);
        sheet.setColumnWidth(1, 15 * 256);
        sheet.setColumnWidth(2, 15 * 256);
        sheet.setColumnWidth(3, 15 * 256);
        sheet.setColumnWidth(4, 20 * 256);
        sheet.setColumnWidth(5, 20 * 256);

        int rowIdx = 6;
        for (LocalDate date : bookingsByDay.keySet()) {
            List<Booking> dayBookings = bookingsByDay.get(date);
            DetailExcelReport detail = buildDetailExcelReport(date, dayBookings, branch);
            Row row = sheet.createRow(rowIdx++);

            row.createCell(0).setCellValue(date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")).toString());
            row.createCell(1)
                    .setCellValue(detail.getDailyServing() != null ? detail.getDailyServing() : 0L);
            row.createCell(2).setCellValue(detail.getDailyBooked() != null ? detail.getDailyBooked() : 0L);
            row.createCell(3).setCellValue(detail.getFillrate() != null ? detail.getFillrate() : 0.0);
            row.createCell(4)
                    .setCellValue(detail.getNoShowRate() != null ? detail.getNoShowRate() : 0.0);
            row.createCell(5).setCellValue(detail.getRevenue() != null ? detail.getRevenue() : 0.0);
        }
    }

    private DetailExcelReport buildSummaryExcelReport(List<Booking> bookings, Branch branch) {
        long totalServing = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CHECKED_IN)
                .count();
        long totalBooked = bookings.stream().count();

        long noShow = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.NO_SHOW)
                .count();

        double revenue = bookings.stream()
                .filter(booking -> booking.getEstimatedTotal() != null
                        && isFinishedStatus(booking.getStatus()))
                .mapToDouble(booking -> booking.getEstimatedTotal().doubleValue())
                .sum();
        long totalTables = diningTableRepository.countByZone_Branch_Id(branch.getId());
        long occupiedTables = bookings.stream().filter(booking -> isOccupied(booking.getStatus())).count();

        return DetailExcelReport.builder()
                .dailyServing(totalServing)
                .dailyBooked(totalBooked)
                .totalTables(totalTables)
                .totaloccupied(occupiedTables)
                .noShow(noShow)
                .revenue(roundUp(revenue))
                .build();
    }

    private DetailExcelReport buildDetailExcelReport(LocalDate day, List<Booking> dayBookings, Branch branch) {
        long totalServing = dayBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CHECKED_IN)
                .count();
        long totalBooked = dayBookings.stream().count();

        long noShow = dayBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.NO_SHOW)
                .count();

        double revenue = dayBookings.stream()
                .filter(booking -> booking.getEstimatedTotal() != null
                        && isFinishedStatus(booking.getStatus()))
                .mapToDouble(booking -> booking.getEstimatedTotal().doubleValue())
                .sum();
        long totalTables = diningTableRepository.countByZone_Branch_Id(branch.getId());
        long occupiedTables = dayBookings.stream().filter(booking -> isOccupied(booking.getStatus())).count();


        return DetailExcelReport.builder()
                .dailyServing(totalServing)
                .dailyBooked(totalBooked)
                .reportedDate(day)
                .totalTables(totalTables)
                .totaloccupied(occupiedTables)
                .noShow(noShow)
                .revenue(roundUp(revenue))
                .build();
    }

    public Restaurant findByRestaurantName(String name) {
        return restaurantRepos.findByRestaurantName(name)
                .orElseThrow(() -> new RuntimeException("Restaurant not found for name: " + name));
    }

    public void deleteById(Long id) {
        restaurantRepos.deleteById(id);
    }

    public Restaurant findById(Long id) {
        return restaurantRepos.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));
    }

    public RestaurantResponse updateRestaurantById(Long id, RestaurantUpdateRequest request) {
        Restaurant restaurant = restaurantRepos.findByOwnerUserId(id)

                .orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));

        restaurant = restaurantMapper.toEntity(request, restaurant);

        return restaurantMapper.toResponse(restaurantRepos.save(restaurant));
    }

    public RestaurantResponse CancelUpdate(Long id) {
        Restaurant restaurant = restaurantRepos.findByOwnerUserId(id)

                .orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));

        restaurant.setPendingDescription(null);
        restaurant.setPendingLogoUrl(null);
        restaurant.setApprovalStatus(ApprovalStatus.APPROVED);

        return restaurantMapper.toResponse(restaurantRepos.save(restaurant));
    }

    public List<BranchReportDto> dashboard(Long ownerId) {
        List<Branch> branches = branchRepository.findByRestaurant_Owner_Id(ownerId);

        LocalDate now = LocalDate.now();

        return branches.stream()
                .map(branch -> buildBranchReport(branch, now))
                .toList();
    }

    public List<DiningTableResponse> getAllTableByBranch(Long branchid) {
        branchRepository.findById(branchid)
                .orElseThrow(() -> new RuntimeException("branch not found for :" + branchid));
        List<DiningTable> tables = diningTableRepository.findByZoneBranchId(branchid);

        return tables.stream()
                .map(diningTableMapper::toResponse)
                .toList();
    }

    private BranchReportDto buildBranchReport(Branch branch, LocalDate now) {
        Long branchId = branch.getId();

        List<Booking> branchBookings = bookingRepository.findByBranchId(branchId);
        List<Booking> branchBookings30Day = bookingRepository.findByBranchIdAndCreatedAtAfter(branchId,
                now.minusDays(30));
        List<Booking> bookingsForToday = branchBookings.stream()
                .filter(booking -> isSameDate(booking.getCreatedAt(), now))
                .toList();

        long todayBooking = bookingsForToday.size();

        long totalServing = branchBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CHECKED_IN)
                .count();
        long totalBooked = branchBookings.stream()
                .filter(booking -> isBookedStatus(booking.getStatus()))
                .count();

        Long totalWait = waitlistRepository.countByBranchIdAndStatus(branchId, WaitlistStatus.WAITING);

        long totalTables = diningTableRepository.countByZone_Branch_Id(branchId);
        long occupiedTables = diningTableRepository
                .countByZone_Branch_IdAndStatusIn(branchId,
                        List.of(DiningTableStatus.OCCUPIED, DiningTableStatus.RESERVED));
        double fillRate = totalTables == 0
                ? 0.0
                : roundUp(occupiedTables * 100.0 / totalTables);

        long finished30day = branchBookings30Day.stream().count();
        long noShow30day = branchBookings30Day.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.NO_SHOW)
                .count();
        double noShowRate = finished30day == 0
                ? 0.0
                : roundUp(noShow30day * 100.0 / finished30day);

        Double reviewScore = reviewRepository.calculateAverageRating(branchId) == null ? 0.0
                : reviewRepository.calculateAverageRating(branchId);

        return BranchReportDto.builder()
                .branchId(branchId)
                .branchName(branch.getName())
                .TodayBooking(todayBooking)
                .TotalServing(totalServing)
                .TotalBooked(totalBooked)
                .TotalWait(totalWait)
                .fillRate(fillRate)
                .no_showRate30Day(noShowRate)
                // .perDayReports(perDayReports)
                .totalReviewScore(reviewScore)
                .build();
    }

    public List<BookingResponse> getBranchBookings(Long BranchId) {
        List<BookingResponse> respones = bookingRepository
                .findByBranchId(BranchId).stream()
                .map(b -> bookingMapper.toResponse(b)).toList();

        return respones;
    }

    /**
     * lấy tất cả booking của từng ngày cho 1 chi nhánh
     *
     * @param branchId
     * @return PerDayReport
     */
    public List<PerDayReport> getPerDayReports(Long branchId, Long ownerId) {

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("cannot find branch : " + branchId));

        if (!branchRepository.findByRestaurant_Owner_Id(ownerId)
                .contains(branch)) {
            throw new RuntimeException("branch do not belong to owner: " + ownerId);
        }

        List<Booking> branchBookings = bookingRepository.findByBranchId(branchId);

        if (branchBookings.isEmpty()) {
            throw new RuntimeException("no booking found");
        }

        Map<LocalDate, List<Booking>> bookingsByDate = branchBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> booking.getCreatedAt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()));

        return bookingsByDate.entrySet().stream()
                .map(entry -> buildPerDayReport(entry.getValue(), entry.getKey()))
                .toList();

    }

    private PerDayReport buildPerDayReport(List<Booking> bookings, LocalDate date) {

        List<BookingDtos.BookingResponse> bookingDtos = bookings.stream()
                .map(bookingMapper::toResponse)
                .toList();

        long dailyBooked = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .count();
        long dailyBooking = bookings.size();
        long dailyServing = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CHECKED_IN)
                .count();
        long dailyWait = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
                .count();

        return PerDayReport.builder()
                .reportedDate(date)
                .dailyBooked(dailyBooked)
                .dailyBooking(dailyBooking)
                .dailyServing(dailyServing)
                .dailyWait(dailyWait)
                .bookingDtos(bookingDtos)
                .build();
    }

    private boolean isSameDate(LocalDateTime bookingDateTime, LocalDate targetDate) {
        return bookingDateTime != null && bookingDateTime.toLocalDate().equals(targetDate);
    }

    private boolean isBookedStatus(BookingStatus status) {
        return status == BookingStatus.COMPLETED
                || status == BookingStatus.HOLDING
                || status == BookingStatus.AWAITING_PAYMENT;
    }

    private boolean isFinishedStatus(BookingStatus status) {
        return status == BookingStatus.COMPLETED || status == BookingStatus.CHECKED_IN;
    }

    private boolean isOccupied(BookingStatus status) {
        return status == BookingStatus.COMPLETED || status == BookingStatus.CHECKED_IN
                || status == BookingStatus.CONFIRMED;
    }

    public RestaurantResponse Register(RestaurantRegisterRequest request, Long ownerId) {
        Restaurant restaurant = new Restaurant();
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("cannot found owner for id: " + ownerId));
        if (!restaurantRepos.findByOwnerUserId(ownerId).isEmpty()) {
            throw new RuntimeException("owner already registered");
        }
        restaurant = restaurantMapper.toEntity(request);
        restaurant.setOwner(user);

        restaurant.setApprovalStatus(ApprovalStatus.PENDING);

        return restaurantMapper.toResponse(restaurantRepos.save(restaurant));
    }

    private double roundUp(Double d) {
        if (d == null) {
            return 0.0;
        }
        BigDecimal bd = new BigDecimal(d).setScale(2, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }


}