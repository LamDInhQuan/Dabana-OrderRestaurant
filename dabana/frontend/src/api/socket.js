import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
  }

  // Hàm kết nối tới WebSocket Server của Backend (/ws)
  connect(onConnectedCallback) {
    if (this.isConnected) {
      if (onConnectedCallback) onConnectedCallback();
      return;
    }

    const socketFactory = () => new SockJS('http://localhost:8080/ws'); // Thay đổi URL backend nếu cần

    this.stompClient = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000, // Tự động kết nối lại sau 5 giây nếu mất mạng
      debug: (str) => {
        // console.log(str); // Bật log nếu muốn debug
      },
      onConnect: () => {
        this.isConnected = true;
        console.log('Connected to WebSocket Server');
        if (onConnectedCallback) onConnectedCallback();
      },
      onDisconnect: () => {
        this.isConnected = false;
        console.log('Disconnected from WebSocket Server');
      },
    });

    this.stompClient.activate();
  }

  // Hàm đăng ký lắng nghe một kênh (Topic) cụ thể
  subscribe(destination, callback) {
    if (!this.stompClient || !this.isConnected) {
      console.warn('WebSocket chưa được kết nối!');
      return null;
    }

    return this.stompClient.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (e) {
        callback(message.body);
      }
    });
  }

  // Hàm ngắt kết nối khi không dùng nữa (ví dụ: khi unmount app hoặc logout)
  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.isConnected = false;
    }
  }
}

export default new WebSocketService();