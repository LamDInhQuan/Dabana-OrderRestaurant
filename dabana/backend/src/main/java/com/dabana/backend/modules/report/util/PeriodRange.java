package com.dabana.backend.modules.report.util;

import com.dabana.backend.modules.report.dto.PeriodQueryParams;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

/**
 * Hàm mọi service report đều gọi để đổi {@link PeriodQueryParams} thành khoảng
 * {@link LocalDateTime} thật + khoảng kỳ trước tương ứng.
 * <p>
 * Đây là contract quan trọng nhất của Shared Kernel — signature cố định,
 * các task khác cứ import và gọi thẳng {@link #resolve(PeriodQueryParams)} /
 * {@link #resolvePrevious(PeriodQueryParams)}.
 */
public class PeriodRange {

    private PeriodRange() {
    }

    /** Khoảng thời gian [from, to] (inclusive) suy ra từ PeriodQueryParams hiện tại. */
    public record Range(LocalDateTime from, LocalDateTime to) {}

    /**
     * Suy ra khoảng thời gian thực tế của kỳ báo cáo hiện tại theo {@code params.getPeriod()}:
     * <ul>
     *     <li>DAY     -&gt; [date 00:00:00, date 23:59:59]</li>
     *     <li>MONTH   -&gt; [ngày 01 tháng month/year, ngày cuối tháng 23:59:59]</li>
     *     <li>QUARTER -&gt; [tháng đầu quý, tháng cuối quý ngày cuối 23:59:59]</li>
     *     <li>YEAR    -&gt; [01/01/year, 31/12/year 23:59:59]</li>
     *     <li>CUSTOM  -&gt; [from 00:00:00, to 23:59:59]</li>
     * </ul>
     */
    public static Range resolve(PeriodQueryParams params) {
        ReportPeriod period = params.getPeriod() == null ? ReportPeriod.MONTH : params.getPeriod();

        switch (period) {
            case DAY: {
                LocalDate day = params.getDate() != null ? params.getDate() : LocalDate.now();
                return ofDay(day);
            }
            case MONTH: {
                int year = resolveYear(params.getYear());
                int month = params.getMonth() != null ? params.getMonth() : LocalDate.now().getMonthValue();
                validateMonth(month);
                return ofMonth(year, month);
            }
            case QUARTER: {
                int year = resolveYear(params.getYear());
                int quarter = params.getQuarter() != null ? params.getQuarter() : currentQuarter();
                validateQuarter(quarter);
                return ofQuarter(year, quarter);
            }
            case YEAR: {
                int year = resolveYear(params.getYear());
                return ofYear(year);
            }
            case CUSTOM: {
                if (params.getFrom() == null || params.getTo() == null) {
                    throw new IllegalArgumentException("CUSTOM period requires both 'from' and 'to'");
                }
                if (params.getFrom().isAfter(params.getTo())) {
                    throw new IllegalArgumentException("'from' must not be after 'to'");
                }
                return new Range(startOfDay(params.getFrom()), endOfDay(params.getTo()));
            }
            default:
                throw new IllegalArgumentException("Unsupported period: " + period);
        }
    }

    /**
     * Khoảng thời gian liền trước, cùng độ dài với {@link #resolve(PeriodQueryParams)} —
     * phục vụ tính % tăng/giảm so với kỳ trước:
     * <ul>
     *     <li>DAY     -&gt; ngày trước</li>
     *     <li>MONTH   -&gt; tháng trước</li>
     *     <li>QUARTER -&gt; quý trước</li>
     *     <li>YEAR    -&gt; năm trước</li>
     *     <li>CUSTOM  -&gt; dịch lùi (to - from) ngày</li>
     * </ul>
     */
    public static Range resolvePrevious(PeriodQueryParams params) {
        ReportPeriod period = params.getPeriod() == null ? ReportPeriod.MONTH : params.getPeriod();

        switch (period) {
            case DAY: {
                LocalDate day = params.getDate() != null ? params.getDate() : LocalDate.now();
                return ofDay(day.minusDays(1));
            }
            case MONTH: {
                int year = resolveYear(params.getYear());
                int month = params.getMonth() != null ? params.getMonth() : LocalDate.now().getMonthValue();
                validateMonth(month);
                LocalDate firstOfMonth = LocalDate.of(year, month, 1).minusMonths(1);
                return ofMonth(firstOfMonth.getYear(), firstOfMonth.getMonthValue());
            }
            case QUARTER: {
                int year = resolveYear(params.getYear());
                int quarter = params.getQuarter() != null ? params.getQuarter() : currentQuarter();
                validateQuarter(quarter);
                int prevQuarter = quarter - 1;
                int prevYear = year;
                if (prevQuarter < 1) {
                    prevQuarter = 4;
                    prevYear = year - 1;
                }
                return ofQuarter(prevYear, prevQuarter);
            }
            case YEAR: {
                int year = resolveYear(params.getYear());
                return ofYear(year - 1);
            }
            case CUSTOM: {
                if (params.getFrom() == null || params.getTo() == null) {
                    throw new IllegalArgumentException("CUSTOM period requires both 'from' and 'to'");
                }
                long lengthInDays = ChronoUnit.DAYS.between(params.getFrom(), params.getTo()) + 1;
                LocalDate prevTo = params.getFrom().minusDays(1);
                LocalDate prevFrom = prevTo.minusDays(lengthInDays - 1);
                return new Range(startOfDay(prevFrom), endOfDay(prevTo));
            }
            default:
                throw new IllegalArgumentException("Unsupported period: " + period);
        }
    }

    // ---------- helpers ----------

    private static int resolveYear(Integer year) {
        return year != null ? year : LocalDate.now().getYear();
    }

    private static int currentQuarter() {
        return (LocalDate.now().getMonthValue() - 1) / 3 + 1;
    }

    private static void validateMonth(int month) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("month must be between 1 and 12");
        }
    }

    private static void validateQuarter(int quarter) {
        if (quarter < 1 || quarter > 4) {
            throw new IllegalArgumentException("quarter must be between 1 and 4");
        }
    }

    private static Range ofDay(LocalDate day) {
        return new Range(startOfDay(day), endOfDay(day));
    }

    private static Range ofMonth(int year, int month) {
        LocalDate firstDay = LocalDate.of(year, month, 1);
        LocalDate lastDay = firstDay.with(TemporalAdjusters.lastDayOfMonth());
        return new Range(startOfDay(firstDay), endOfDay(lastDay));
    }

    private static Range ofQuarter(int year, int quarter) {
        int firstMonthOfQuarter = (quarter - 1) * 3 + 1;
        LocalDate firstDay = LocalDate.of(year, firstMonthOfQuarter, 1);
        LocalDate lastDay = firstDay.plusMonths(2).with(TemporalAdjusters.lastDayOfMonth());
        return new Range(startOfDay(firstDay), endOfDay(lastDay));
    }

    private static Range ofYear(int year) {
        LocalDate firstDay = LocalDate.of(year, 1, 1);
        LocalDate lastDay = LocalDate.of(year, 12, 31);
        return new Range(startOfDay(firstDay), endOfDay(lastDay));
    }

    private static LocalDateTime startOfDay(LocalDate date) {
        return LocalDateTime.of(date, LocalTime.MIN); // 00:00:00
    }

    private static LocalDateTime endOfDay(LocalDate date) {
        return LocalDateTime.of(date, LocalTime.of(23, 59, 59)); // 23:59:59
    }
}
