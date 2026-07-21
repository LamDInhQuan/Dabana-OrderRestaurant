package com.dabana.backend.modules.restaurant.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.BookingTable;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.mapper.BookingMapper;
import com.dabana.backend.modules.branch2.controller.BranchController;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;
import com.dabana.backend.modules.restaurant.Dto.report.BranchReportDto;
import com.dabana.backend.modules.restaurant.Dto.report.PerDayReport;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.waitlist.WaitlistRepository;
import com.dabana.backend.modules.waitlist.WaitlistStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RestaurantService  {
    private final RestaurantRepository restaurantRepos;
    private final BranchRepository branchRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final WaitlistRepository waitlistRepository;
    private final DiningTableRepository diningTableRepository;
    private final BookingMapper bookingMapper;
    private final RestaurantMapper restaurantMapper;

    public RestaurantResponse findByOwnerId(Long ownerId) {
        return restaurantMapper.toResponse( restaurantRepos.findByOwnerUserId(ownerId).
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

        LocalDate now = LocalDate.of(2026, 6, 30);
        
        return branches.stream()
                .map(branch -> buildBranchReport(branch, now))
                .collect(Collectors.toList());
    }

    private BranchReportDto buildBranchReport(
        Branch branch,

        LocalDate now) {
                        
        Long branchId = branch.getId();

        // 1. Đặt bàn hôm nay (tất cả booking có reservationTime trong ngày hôm nay)
        Long todayBooking = bookingRepository
                .countByBranchIdAndDate(
                        branchId,
                        now); //da dinh day la ngay hom nay

        // 2. Đang phục vụ (đã check-in, chưa hoàn tất)
        Long totalServing = bookingRepository
                        .countByBranchIdAndStatusAndCreatedAt(
                                        branchId, BookingStatus.CHECKED_IN,now);

        // 3. Bàn đã đặt (đã confirm nhưng chưa tới giờ / chưa check-in)
        Long totalBooked = bookingRepository
                        .countByBranchIdAndStatusInAndCreatedAt(
                                        branchId,
                                        List.of(BookingStatus.COMPLETED, BookingStatus.HOLDING,
                                                        BookingStatus.AWAITING_PAYMENT),
                                        now);

        // 4. Hàng chờ (waitlist)
        Long totalWait = waitlistRepository
                        .countByBranchIdAndStatus(branchId, WaitlistStatus.WAITING);

        // 5. Tỷ lệ lấp bàn = số bàn đang occupied/reserved / tổng số bàn của chi nhánh
        long totalTables = diningTableRepository.countByZone_Branch_Id(branchId);

        long occupiedTables = diningTableRepository
                        .countByZone_Branch_IdAndStatusIn(branchId,
                                        List.of(DiningTableStatus.OCCUPIED, DiningTableStatus.RESERVED));
        double fillRate = totalTables == 0
                        ? 0.0
                        : occupiedTables * 100.0 / totalTables;

        // 6. Tỷ lệ no-show = số no-show / tổng số booking đã "kết thúc vòng đời" hôm nay
        
        long finishedToday = bookingRepository
                        .countByBranchIdAndStatusInAndCreatedAt(
                                        branchId, List.of(BookingStatus.COMPLETED,BookingStatus.CHECKED_IN),now);
        long noShowToday = bookingRepository
                        .countByBranchIdAndStatusAndCreatedAt(
                                        branchId, BookingStatus.NO_SHOW, now);
        double noShowRate = finishedToday == 0
                        ? 0.0
                        : noShowToday * 100.0 / finishedToday;

        List<PerDayReport> perDayReports = new ArrayList<>();
        Map<LocalDate, List<Booking> >bookings =  bookingRepository.findByBranchId(branchId)
                        .stream()
                .collect(Collectors.groupingBy(b -> b.getCreatedAt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()));

        if (!bookings.isEmpty()) {
            for (LocalDate dateTime : bookings.keySet()) {
                PerDayReport perDayReport = builPerDayReport(bookings.get(dateTime));
                perDayReports.add(perDayReport);
            }
        }

        return BranchReportDto.builder()
                        .branchId(branchId)
                        .branchName(branch.getName())
                        .TodayBooking(todayBooking)
                        .TotalServing(totalServing)
                        .TotalBooked(totalBooked)
                        .TotalWait(totalWait)
                        .fillRate(fillRate)
                        .no_showRate(noShowRate)
                        .perDayReports(perDayReports)
                        .build();
    }
    
    private PerDayReport builPerDayReport(List<Booking> bookings) {
        
        // PerDayReport report;

        List<BookingDtos.BookingResponse> bookingDtos = bookings.stream().map(b -> bookingMapper.toResponse(b))
                .toList();
        
        // for (BookingDtos.BookingResponse bookingResponse : bookingDtos) {
        //     report.setTodayBooked();
        // }


        return PerDayReport.builder()
                .ReportedDate(LocalDateTime.now())
                .TodayBooked(0)
                .TodayBooking(0)
                .TodayServing(0)
                .TodayWait(0)
                .bookingDtos(bookingDtos)
                .build();
    }
    
   
    
    public RestaurantResponse Register(RestaurantRegisterRequest request,Long ownerId) {
            Restaurant restaurant = new Restaurant();
            User user = userRepository.findById(ownerId)
                    .orElseThrow(() -> new RuntimeException("cannot found owner for id: " + ownerId));
            if (!restaurantRepos.findByOwnerUserId(ownerId).isEmpty() ) {
                throw new RuntimeException("owner already registered");
            }
            restaurant = restaurantMapper.toEntity(request);
            restaurant.setOwner(user);
            
            restaurant.setApprovalStatus(ApprovalStatus.PENDING);

            return restaurantMapper.toResponse( restaurantRepos.save(restaurant));
        }

    
}
