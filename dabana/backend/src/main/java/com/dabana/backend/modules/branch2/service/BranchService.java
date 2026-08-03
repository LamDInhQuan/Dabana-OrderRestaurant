package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.OtpService;
import com.dabana.backend.modules.auth.service.IAuthService;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.Role;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.entity.UserRole;
import com.dabana.backend.modules.auth.mapper.UserMapper;
import com.dabana.backend.modules.auth.repository.RoleRepository;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.repository.UserRoleRepository;
import com.dabana.backend.modules.auth.util.AccountStatus;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.RoleUser;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.dto.BranchImageDto;
import com.dabana.backend.modules.branch2.dto.OperatingPeriod;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.request.BranchUpdateRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchAvailabilityResponse;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import com.dabana.backend.modules.branch2.entity.OperatingHour;
import com.dabana.backend.modules.branch2.mapper.BranchMapper;
import com.dabana.backend.modules.branch2.repository.BranchImageRepository;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.repository.OperatingHourRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.branch2.util.OperatingDay;
import com.dabana.backend.modules.diningtable.dto.response.TableAvailabilityResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.service.DiningTableAvailabilityService;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.diningtable.util.TableAvailabilityStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
import com.dabana.backend.modules.zone.entity.Zone;
import com.dabana.backend.modules.zone.mapper.ZoneMapper;
import com.dabana.backend.modules.zone.repository.ZoneRepository;
import com.dabana.backend.security.CustomUserDetail;
import com.dabana.backend.security.CustomUserDetailsService;
import com.dabana.backend.security.JwtService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Trien khai dac ta B02: Dang ky va tro thanh nha hang doi tac
 * (va dang ky khach hang thong thuong dung chung quy trinh don gian hoa).
 */
@Service
@RequiredArgsConstructor
public class BranchService implements IBranchService {

    private final BranchRepository branchRepository;
    private final BranchImageRepository branchImageRepository;
    private final BranchMapper branchMapper;
    private final RestaurantRepository restaurantRepository;
    private final ISubscriptionService subscriptionService;
    private final OperatingHourRepository operatingHourRepository;
    private final ZoneRepository zoneRepository;
    private final DiningTableAvailabilityService diningTableAvailabilityService;
    private final DiningTableRepository diningTableRepository;
    private final BookingRepository bookingRepository;
    private final AvailableSlotService availableSlotService ;

    private static final List<BookingStatus> CONFLICT_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED
    );

    @Override
    public List<BranchResponse> findByRestaurant(Long restaurantId) {
        // Chỉ lấy các chi nhánh có status là 2 (ACTIVE)
        List<Branch> branches = branchRepository.findByRestaurantIdAndStatus(restaurantId,
                BranchStatus.ACTIVE.getStatus());
        // Map sang danh sách Response trả về cho Frontend
        return branches.stream()
                .map(branchMapper::toResponse)
                .toList();
    }

    @Override
    public List<BranchResponse> findAll() {
        List<Branch> branches = branchRepository.findAll();
        return branches.stream()
                .map(branch -> branchMapper.toResponse(branch)) // Hoặc dùng new BranchResponse(branch) tuỳ dự án của
                .toList();
    }

    @Override
    public List<BranchAvailabilityResponse> searchAvailableBranches(LocalDate date, String city, Integer guests) {
        // 1. Lấy danh sách chi nhánh từ DB (lọc theo thành phố nếu có)
        List<Branch> branches = getActiveBranches(city);

        if (branches.isEmpty()) {
            return List.of();
        }

        List<Long> branchIds = branches.stream().map(Branch::getId).toList();
        OperatingDay currentDay = OperatingDay.valueOf(date.getDayOfWeek().name());

            // Lấy toàn bộ ảnh của các chi nhánh trong 1 câu lệnh duy nhất
            List<BranchImage> allImages = branchIds.isEmpty() ? List.of() : branchImageRepository.findByBranchIdInOrderByDisplayOrderAsc(branchIds);
            Map<Long, List<BranchImage>> imagesByBranchMap = allImages.stream()
                    .collect(Collectors.groupingBy(img -> img.getBranch().getId()));

        // 2. Batch Fetch: Lấy toàn bộ giờ hoạt động của các chi nhánh trong ngày
        List<OperatingHour> allOperatingHours = operatingHourRepository.findByBranchIdInAndDayOfWeek(branchIds, currentDay);
        Map<Long, List<OperatingHour>> operatingHoursByBranchMap = allOperatingHours.stream()
                .collect(Collectors.groupingBy(op -> op.getBranch().getId()));

        // 3. Batch Fetch: Lấy toàn bộ Zone và Bàn (DiningTable) của các chi nhánh
        List<Zone> allZones = zoneRepository.findByBranchIdInOrderByIdAsc(branchIds);
        Map<Long, List<Zone>> zonesByBranchMap = allZones.stream()
                .collect(Collectors.groupingBy(z -> z.getBranch().getId()));

        List<Long> zoneIds = allZones.stream().map(Zone::getId).toList();
        List<DiningTable> allTables = zoneIds.isEmpty() ? List.of() : diningTableRepository.findByZoneIdInOrderByZoneIdAscIdAsc(zoneIds);
        Map<Long, List<DiningTable>> tablesByZoneMap = allTables.stream()
                .collect(Collectors.groupingBy(table -> table.getZone().getId()));

        // 4. Batch Fetch: Lấy toàn bộ các booking conflict trong cả ngày chỉ bằng 1 QUERY DUY NHẤT
        List<Long> allTableIds = allTables.stream().map(DiningTable::getId).toList();
        List<Object[]> allConflictData = allTableIds.isEmpty() ? List.of() :
                bookingRepository.findConflictTableStatusesInDateRange(allTableIds, date.atStartOfDay(), date.atTime(23, 59, 59), CONFLICT_STATUSES);

        // Gom nhóm conflict theo TableId để tra cứu O(1) trong RAM
        Map<Long, List<Object[]>> conflictsByTableMap = allConflictData.stream()
                .collect(Collectors.groupingBy(row -> (Long) row[0]));

        // 5. Xử lý logic ráp nối hoàn toàn trong RAM (In-memory Processing)
        List<BranchAvailabilityResponse> result = new ArrayList<>();

        for (Branch branch : branches) {
            List<OperatingHour> entityList = operatingHoursByBranchMap.get(branch.getId());
            if (entityList == null || entityList.isEmpty()) {
                continue;
            }

            BranchAvailabilityResponse response = branchMapper.toAvailabilityResponse(branch);
            // Lấy danh sách ảnh đã fetch sẵn trong RAM gắn vào Response
            List<BranchImage> branchImages = imagesByBranchMap.getOrDefault(branch.getId(), List.of());
            List<BranchImageDto> imageDtos = branchImages.stream().map(img -> {
                BranchImageDto dto = new BranchImageDto();
                dto.setId(img.getId() != null ? img.getId().intValue() : null); // Chuyển Long sang Integer nếu ID entity là Long
                dto.setImageUrl(img.getImageUrl());
                dto.setIsCover(img.getIsCover() != null ? (img.getIsCover() == 1 ? 1 : 0) : 0); // Xử lý nếu isCover ở entity là Boolean
                dto.setDisplayOrder(img.getDisplayOrder());
                return dto;
            }).toList();
            response.setBranchImageDtos(imageDtos);

            List<String> slots = new ArrayList<>();
            LocalTime earliestOpen = entityList.get(0).getOpenTime();
            LocalTime latestClose = entityList.get(entityList.size() - 1).getCloseTime();
            response.setOperatingHours(earliestOpen + " - " + latestClose);

            for (OperatingHour oh : entityList) {
                LocalTime current = oh.getOpenTime();
                LocalTime close = oh.getCloseTime();
                if (current == null || close == null || !current.isBefore(close)) {
                    continue;
                }
                while (current.isBefore(close)) {
                    slots.add(current.toString());
                    LocalTime next = current.plusMinutes(60);
                    if (next.isBefore(current) || next.equals(current)) {
                        // Vượt qua 00:00 (nửa đêm) hoặc quay vòng, dừng lặp để tránh lặp vô hạn
                        break;
                    }
                    current = next;
                }
            }
            if (date.equals(LocalDate.now())) {
                LocalTime nowTime = LocalTime.now();
                // Có thể cộng thêm thời gian đệm (ví dụ: +30 phút) để khách không đặt sát giờ quá
//                 LocalTime thresholdTime = nowTime.plusMinutes(30);

                slots = slots.stream().filter(slotStr -> {
                    LocalTime slotTime = LocalTime.parse(slotStr);
                    // Chỉ giữ lại các slot lớn hơn giờ hiện tại (hoặc giờ hiện tại + đệm)
                    return slotTime.isAfter(nowTime);
                }).toList();
            }

            // Nếu sau khi lọc qua ngày hôm nay mà hết sạch slot thì bỏ qua chi nhánh này luôn
            if (slots.isEmpty()) {
                continue;
            }
            Map<String, List<BranchAvailabilityResponse.ZoneAvailabilityDto>> zonesBySlot = new LinkedHashMap<>();
            List<Zone> branchZones = zonesByBranchMap.getOrDefault(branch.getId(), List.of());

            for (String slot : slots) {
                LocalDateTime reservationTime = LocalDateTime.of(date, LocalTime.parse(slot));
                List<BranchAvailabilityResponse.ZoneAvailabilityDto> availableZones = new ArrayList<>();

                for (Zone zone : branchZones) {
                    List<DiningTable> zoneTables = tablesByZoneMap.getOrDefault(zone.getId(), List.of());

                    List<BranchAvailabilityResponse.TableAvailabilityDto> validTables = new ArrayList<>();
                    for (DiningTable table : zoneTables) {
                        if (table.getStatus() == DiningTableStatus.MAINTENANCE || table.getStatus() == DiningTableStatus.CLEANING) {
                            continue;
                        }
                        // Check conflict từ dữ liệu đã fetch sẵn trong RAM
                        List<Object[]> tableConflicts = conflictsByTableMap.get(table.getId());
                        if (tableConflicts != null) {
                            boolean isConflict = checkIfTableIsConflictAtTime(tableConflicts, reservationTime);
                            if (isConflict) {
                                continue;
                            }
                        }

                        BranchAvailabilityResponse.TableAvailabilityDto dto = new BranchAvailabilityResponse.TableAvailabilityDto();
                        dto.setId(table.getId());
                        dto.setName(table.getTableName());
                        dto.setCapacity(table.getCapacity());
                        validTables.add(dto);
                    }

                    if (!validTables.isEmpty()) {
                        BranchAvailabilityResponse.ZoneAvailabilityDto zoneResponse = new BranchAvailabilityResponse.ZoneAvailabilityDto();
                        zoneResponse.setZoneId(zone.getId());
                        zoneResponse.setZoneName(zone.getZoneName());
                        zoneResponse.setTables(validTables);
                        availableZones.add(zoneResponse);
                    }
                }

                if (!availableZones.isEmpty()) {
                    zonesBySlot.put(slot, availableZones);
                }
            }

            if (!zonesBySlot.isEmpty()) {
                response.setAvailableSlots(new ArrayList<>(zonesBySlot.keySet()));
                response.setZonesBySlot(zonesBySlot);
                result.add(response);
            }
        }

        return result;
    }

    @Override
    public BranchResponse findById(Long id, LocalDate date) {
        // 1. Tìm thông tin cơ bản của chi nhánh
        BranchResponse response = branchRepository.findById(id)
                .map(branch -> branchMapper.toResponse(branch))
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 2. Nếu không truyền ngày thì mặc định lấy ngày hiện tại (LocalDate.now())
        LocalDate targetDate = (date != null) ? date : LocalDate.now();

        // 3. Gọi getEffectiveOperatingPeriods để check lịch + ngoại lệ theo ngày
        List<OperatingPeriod> periods = availableSlotService.getEffectiveOperatingPeriods(id, targetDate);

        if (periods == null || periods.isEmpty()) {
            response.setOperatingCurrentDay("Hôm nay đóng cửa");
        } else {
            // Lấy giờ bắt đầu của ca đầu tiên và giờ kết thúc của ca cuối cùng
            LocalTime openTime = periods.get(0).getStartTime();
            LocalTime closeTime = periods.get(periods.size() - 1).getEndTime();

            response.setOperatingCurrentDay(openTime + " - " + closeTime);
        }

        return response;
    }

    @Override
    public BranchResponse create(BranchRequest request) {
        // Kiem tra han muc chi nhanh theo goi subscription dang active cua nha hang
        // (request.getRestaurantId() la Integer - ep sang Long vi Restaurant.id la
        // Long)
        subscriptionService.assertCanAddBranch(request.getRestaurantId().longValue());

        if (branchRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(BranchErrorCode.DUPLICATE_PHONE);
        }
        com.dabana.backend.modules.branch2.entity.Branch branch = branchMapper.toEntity(request);
        initializeAdditionalData(branch, request);
        return branchMapper.toResponse(branchRepository.save(branch));
    }

    // @Override
    // public BranchResponse update(Long id, Branch branch) {
    // return null;
    // }

    @Override
    public void delete(Long id) {

    }

    @Override
    public List<BranchResponse> findBranchesByManager(Long managerId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerUserId(managerId);
        if (restaurantOpt.isEmpty()) {
            return Collections.emptyList(); // Nếu user chưa tạo nhà hàng thì trả về danh sách rỗng
        }
        Long restaurantId = restaurantOpt.get().getId();
        List<Branch> branches = branchRepository.findByRestaurantId(restaurantId);
        return branches.stream()
                .map(branchMapper::toResponse)
                .toList();
    }

    private void initializeAdditionalData(Branch branch, BranchRequest request) {
        // 1. Xử lý mock Restaurant relation
        if (request.getRestaurantId() != null) {
            Restaurant mockRestaurant = new Restaurant();
            mockRestaurant.setId(request.getRestaurantId().longValue());
            branch.setRestaurant(mockRestaurant);
        }
        branch.setStatus(BranchStatus.ACTIVE.getStatus());
        if (request.getBranchImages() != null) {
            branch.setImages(request.getBranchImages().stream().map(dto -> BranchImage.builder()
                    .branch(branch) // Link ngược lại cha
                    .imageUrl(dto.getImageUrl())
                    .isCover(dto.getIsCover())
                    .displayOrder(dto.getDisplayOrder())
                    .build()).toList());
        }

    }

    @Override
    @Transactional
    public BranchResponse update(Long id, BranchUpdateRequest request) {
        // 1. Kiểm tra chi nhánh tồn tại hay không
        Branch existingBranch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 2. Kiểm tra nếu chuyển từ trạng thái khác sang ACTIVE (2)
        if (request.getStatus() != null) {
            boolean isActivating = BranchStatus.ACTIVE.getStatus().equals(request.getStatus())
                    && !BranchStatus.ACTIVE.getStatus().equals(existingBranch.getStatus());

            if (isActivating) {
                Long restaurantId = existingBranch.getRestaurant().getId();
                subscriptionService.assertCanActivateBranch(restaurantId);
            }

            existingBranch.setStatus(request.getStatus());
        }

        // 3. Cập nhật các trường thông tin cơ bản
        existingBranch.setName(request.getName());
        existingBranch.setAddress(request.getAddress());
        existingBranch.setProvince(request.getProvince());
        existingBranch.setPhone(request.getPhone());
        existingBranch.setLatitude(request.getLatitude());
        existingBranch.setLongitude(request.getLongitude());
        if (request.getBranchImages() != null) {
            // Xóa sạch list ảnh cũ trong Hibernate (cần có orphanRemoval = true ở Entity)
            existingBranch.getImages().clear();
            // Tạo list ảnh mới và add vào collection hiện tại của existingBranch
            List<BranchImage> newImages = request.getBranchImages().stream().map(dto -> BranchImage.builder()
                    .branch(existingBranch)
                    .imageUrl(dto.getImageUrl())
                    .isCover(dto.getIsCover() != null ? dto.getIsCover() : 0)
                    .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 1)
                    .build()).toList();
            existingBranch.getImages().addAll(newImages);
        }
        // (Tuỳ chọn) Xử lý cập nhật danh sách ảnh hoặc các thông tin liên quan khác nếu
        // có trong request...
        // 3. Lưu vào cơ sở dữ liệu
        Branch savedBranch = branchRepository.save(existingBranch);
        // 4. Trả về kết quả Response DTO
        return branchMapper.toResponse(savedBranch);
    }

    @Override
    public List<Branch> getActiveBranches(String city) {
        List<Branch> rawBranches;

        if (city != null && !city.trim().isEmpty()) {
            rawBranches = branchRepository.findByProvinceAndStatus(city.trim(), 2);
        } else {
            rawBranches = branchRepository.findByStatus(2);
        }

        // Lọc thêm tầng 2: Kiểm tra xem Restaurant cha của chi nhánh đó có còn hoạt động không
        return rawBranches.stream()
                .filter(branch -> branch.getRestaurant() != null && branch.getRestaurant().isActive())
                .collect(Collectors.toList());
    }


    private boolean checkIfTableIsConflictAtTime(List<Object[]> tableConflicts, LocalDateTime reservationTime) {
        LocalDateTime slotStart = reservationTime;
        LocalDateTime slotEnd = reservationTime.plusMinutes(60); // Hoặc plusHours(2) tùy nghiệp vụ

        for (Object[] conflictRow : tableConflicts) {
            // Lấy reservationTime của đơn cũ ở index [2]
            LocalDateTime existingTime = (LocalDateTime) conflictRow[2];

            // Kiểm tra chồng lấn thời gian
            if (!existingTime.isBefore(slotStart) && existingTime.isBefore(slotEnd)) {
                return true; // Có xung đột
            }
        }

        return false; // Không xung đột
    }
}
