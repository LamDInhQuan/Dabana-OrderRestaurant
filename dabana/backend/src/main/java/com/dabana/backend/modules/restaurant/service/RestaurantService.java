package com.dabana.backend.modules.restaurant.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.mapper.BookingMapper;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.report.BranchReportDto;
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

@Service
@RequiredArgsConstructor
public class RestaurantService {
    private final RestaurantRepository restaurantRepos;
    private final BranchRepository branchRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final WaitlistRepository waitlistRepository;
    private final DiningTableRepository diningTableRepository;
    private final ReviewRepository reviewRepository;

    private final RestaurantMapper restaurantMapper;
    private final BookingMapper bookingMapper;

    public RestaurantResponse findByOwnerId(Long ownerId) {
        return restaurantMapper.toResponse(restaurantRepos.findByOwnerUserId(ownerId).
                orElseThrow(() -> new RuntimeException("Restaurant not found for ownerId: " + ownerId)));
    }

    public Restaurant findByRestaurantName(String name) {
        return restaurantRepos.findByRestaurantName(name).
                orElseThrow(() -> new RuntimeException("Restaurant not found for name: " + name));
    }

    public void deleteById(Long id) {
        restaurantRepos.deleteById(id);
    }

    public Restaurant findById(Long id) {
        return restaurantRepos.findById(id).
                orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));
    }

    public RestaurantResponse updateRestaurantById(Long id, RestaurantUpdateRequest request) {
        Restaurant restaurant = restaurantRepos.findByOwnerUserId(id)

                .orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));

        restaurant = restaurantMapper.toEntity(request, restaurant);
        restaurant.setApprovalStatus(ApprovalStatus.PENDING_UPDATE);

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
                : occupiedTables * 100.0 / totalTables;

        long finished30day = branchBookings30Day.stream()
                .filter(booking -> isFinishedStatus(booking.getStatus()))
                .count();
        long noShow30day = branchBookings30Day.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.NO_SHOW)
                .count();
        double noShowRate = finished30day == 0
                ? 0.0
                : noShow30day * 100.0 / finished30day;


        double reviewScore = 0;

        // reviewScore = reviewRepository.calculateAverageRating(branchId);

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
                .map(entry -> buildPerDayReport(branchId, entry.getValue(), entry.getKey()))
                .toList();

    }

    private PerDayReport buildPerDayReport(Long branchId, List<Booking> bookings, LocalDate date) {
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
                .reportedDate(LocalDateTime.now())
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


}
