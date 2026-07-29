import React, { useState, useEffect, useCallback } from 'react'
import { operatingHourApi, branchScheduleExceptionApi } from '../../../../api'
import WeeklyHoursPanel from './WeeklyHoursPanel'
import ExceptionsPanel from './ExceptionsPanel'
import ErrorDetailsModal from './ErrorDetailsModal' // 👈 1. Import Modal báo lỗi

export default function BranchScheduleTab({ branch }) {
    const [tab, setTab] = useState('weekly')
    const [loading, setLoading] = useState(false)

    const [activeDays, setActiveDays] = useState([])
    const [weeklyHours, setWeeklyHours] = useState({})
    const [rawOperatingHours, setRawOperatingHours] = useState([])

    const [exceptions, setExceptions] = useState([])
    const [editingException, setEditingException] = useState(null)

    // State Modal thông báo lỗi
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: '',
        details: []
    })

    // Catch & format lỗi từ Axios/Fetch Response
    const handleApiError = (err) => {
        const errorData = err?.response?.data || err
        const message = errorData?.message || 'Có lỗi xảy ra khi xử lý dữ liệu'
        const details = errorData?.errorDetails || []

        setErrorModal({
            isOpen: true,
            title: message,
            details: details
        })
    }

    // Fetch Giờ tuần
    const fetchWeeklyHours = useCallback(async () => {
        if (!branch?.id) return
        const res = await operatingHourApi.getByBranch(branch.id)
        const rawList = res?.data?.data || res?.data || []
        setRawOperatingHours(Array.isArray(rawList) ? rawList : [])
        parseWeeklyData(rawList)
    }, [branch?.id])

    // Fetch Lịch Ngoại lệ
    const fetchExceptions = useCallback(async () => {
        if (!branch?.id) return
        const res = await branchScheduleExceptionApi.getByBranch(branch.id)
        const excData = res?.data?.data || res?.data || []
        setExceptions(Array.isArray(excData) ? excData : [])
    }, [branch?.id])

    useEffect(() => {
        if (!branch?.id) return
        const load = async () => {
            setLoading(true)
            try {
                if (tab === 'weekly') {
                    await fetchWeeklyHours()
                } else {
                    await Promise.all([fetchExceptions(), fetchWeeklyHours()])
                }
            } catch (err) {
                console.error('Error loading schedule:', err)
                handleApiError(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [branch?.id, tab, fetchWeeklyHours, fetchExceptions])

    const parseWeeklyData = (rawList) => {
        if (!Array.isArray(rawList) || rawList.length === 0) {
            setActiveDays([])
            setWeeklyHours({})
            return
        }

        const newActiveDays = []
        const newWeeklyHours = {}

        rawList.forEach(item => {
            const day = item.dayOfWeek
            if (!newActiveDays.includes(day)) newActiveDays.push(day)
            if (!newWeeklyHours[day]) newWeeklyHours[day] = { shifts: [] }

            newWeeklyHours[day].shifts.push({
                id: item.id,
                open: item.openTime ? item.openTime.slice(0, 5) : '08:00',
                close: item.closeTime ? item.closeTime.slice(0, 5) : '22:00',
                shiftName: item.shiftName || ''
            })
        })

        setActiveDays(newActiveDays)
        setWeeklyHours(newWeeklyHours)
    }

    // API Call: Lưu Giờ Hoạt Động Cố Định
    const handleSaveWeekly = async (payload) => {
        try {
            await operatingHourApi.save(branch.id, payload)
            await fetchWeeklyHours()
            alert('Đã cập nhật khung giờ hoạt động thành công!')
        } catch (err) {
            console.error('Lỗi khi lưu giờ tuần:', err)
            handleApiError(err) // 👈 2. Bắt lỗi để hiện Modal
        }
    }

    // API Call: Lưu Lịch Ngoại Lệ
    const handleSaveException = async (form) => {
        try {
            const payload = {
                startDate: form.startDate,
                endDate: form.endDate,
                exceptionType: form.exceptionType,
                operatingHourId: form.operatingHourId || null,
                openTime: form.openTime ? (form.openTime.length === 5 ? `${form.openTime}:00` : form.openTime) : null,
                closeTime: form.closeTime ? (form.closeTime.length === 5 ? `${form.closeTime}:00` : form.closeTime) : null,
                reason: form.reason || null
            }

            if (form.id) {
                await branchScheduleExceptionApi.update(branch.id, form.id, payload)
            } else {
                await branchScheduleExceptionApi.create(branch.id, payload)
            }

            await fetchExceptions()
            setEditingException(null)
        } catch (err) {
            console.error('Lỗi khi lưu ngoại lệ:', err)
            handleApiError(err) // 👈 2. Bắt lỗi để hiện Modal
        }
    }

    // API Call: Xóa Ngoại Lệ
    const handleDeleteException = async (id) => {
        try {
            await branchScheduleExceptionApi.delete(branch.id, id)
            setExceptions(prev => prev.filter(e => e.id !== id))
        } catch (err) {
            console.error('Lỗi khi xóa ngoại lệ:', err)
            handleApiError(err) // 👈 2. Bắt lỗi để hiện Modal
        }
    }

    // Helper lấy ngày hôm nay theo Local Time ISO YYYY-MM-DD
    const getTodayLocalDate = () => {
        const today = new Date()
        const offset = today.getTimezoneOffset()
        const localDate = new Date(today.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().split('T')[0]
    }
    const formatTimeVN = (timeStr, use12h = true) => {
        if (!timeStr) return ''

        // Nếu chuỗi dạng "08:00:00" thì lấy "08:00"
        const cleanTime = timeStr.slice(0, 5)
        const [hoursStr, minutesStr] = cleanTime.split(':')
        let hours = parseInt(hoursStr, 10)
        const minutes = minutesStr || '00'

        if (isNaN(hours)) return timeStr

        if (!use12h) {
            return `${cleanTime}` // Kiểu 24h: "18:00"
        }

        // Phân loại buổi theo giờ Việt Nam
        let session = 'sáng'
        if (hours >= 12 && hours < 18) {
            session = 'chiều'
        } else if (hours >= 18 && hours < 22) {
            session = 'tối'
        } else if (hours >= 22 || hours < 4) {
            session = 'đêm'
        }

        // Đổi giờ 24h sang 12h
        let hours12 = hours % 12
        if (hours12 === 0) hours12 = 12

        return `${hours12}:${minutes} ${session}`
    }
    return (
        <div style={{ maxWidth: 760 }}>
            {/* Header Tabs */}
            <div style={{ display: 'flex', gap: '.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
                <button onClick={() => setTab('weekly')} style={tabBtnStyle(tab === 'weekly')}>
                    📅 Giờ hoạt động theo tuần
                </button>
                <button onClick={() => setTab('exceptions')} style={tabBtnStyle(tab === 'exceptions')}>
                    ⚠️ Ngoại lệ lịch hoạt động
                </button>
            </div>

            {/* Body Tab */}
            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
            ) : tab === 'weekly' ? (
                <WeeklyHoursPanel
                    activeDays={activeDays}
                    weeklyHours={weeklyHours}
                    setActiveDays={setActiveDays}
                    setWeeklyHours={setWeeklyHours}
                    onSaveWeekly={handleSaveWeekly}
                    formatTimeVN={formatTimeVN} // 👈 Truyền xuống đây
                    activeBranch={branch}
                />
            ) : (
                <ExceptionsPanel
                    exceptions={exceptions}
                    operatingHours={rawOperatingHours}
                    editing={editingException}
                    onNew={() => setEditingException({
                        exceptionType: 'CLOSE_ALL_DAY',
                        startDate: getTodayLocalDate(),
                        endDate: getTodayLocalDate(),
                        reason: ''
                    })}
                    onEdit={setEditingException}
                    onCancelEdit={() => setEditingException(null)}
                    onSave={handleSaveException}
                    onDelete={handleDeleteException}
                    formatTimeVN={formatTimeVN} // 👈 Truyền xuống đây
                />
            )}

            {/* 👈 3. Render Modal hiển thị bảng chi tiết lỗi */}
            <ErrorDetailsModal
                isOpen={errorModal.isOpen}
                title={errorModal.title}
                errorDetails={errorModal.details}
                onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    )
}

function tabBtnStyle(active) {
    return {
        padding: '.65rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
        fontWeight: active ? 700 : 500, fontSize: '.9rem',
        color: active ? 'var(--brand)' : 'var(--text-muted)',
        borderBottom: active ? '3px solid var(--brand)' : '3px solid transparent',
        marginBottom: '-2px',
    }
}