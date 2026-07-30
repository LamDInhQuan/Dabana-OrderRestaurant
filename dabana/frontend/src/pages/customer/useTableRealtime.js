import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import wsService from '../../api/socket';

export function useTableRealtime(branchId, currentUserId, currentEmail, onUpdate) {
  // dùng ref để luôn đọc được giá trị mới nhất mà KHÔNG cần đưa vào dependency array
  const userIdRef = useRef(currentUserId);
  const emailRef = useRef(currentEmail);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => { userIdRef.current = currentUserId }, [currentUserId]);
  useEffect(() => { emailRef.current = currentEmail }, [currentEmail]);
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate]);

  useEffect(() => {
    if (!branchId) return;

    let subscription;
    let isCancelled = false;

    wsService.connect(() => {
      if (isCancelled) return; // tránh subscribe sau khi component đã unmount / effect đã cleanup
      subscription = wsService.subscribe(`/topic/branch/${branchId}/tables-update`, (message) => {
        let data = {};
        try { data = JSON.parse(message) } catch (e) { data = {} }

        const { email: eventEmail, userId: eventUserId } = data;
        const isMe =
          (userIdRef.current && eventUserId && String(userIdRef.current) === String(eventUserId)) ||
          (emailRef.current && eventEmail && emailRef.current.toLowerCase() === eventEmail.toLowerCase());

        if (isMe) return;

        toast('⚠️ Sơ đồ bàn vừa có thay đổi do có khách khác vừa đặt chỗ!', {
          icon: '🔄',
          duration: 4000,
          position: 'top-right',
        });

        onUpdateRef.current?.();
      });
    });

    // ✅ cleanup thật sự nằm ở đây, thuộc về useEffect chính
    return () => {
      isCancelled = true;
      subscription?.unsubscribe();
    };
  }, [branchId]); // chỉ phụ thuộc branchId — không re-subscribe khi userId/email/onUpdate đổi
}