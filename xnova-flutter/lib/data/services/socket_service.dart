import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/constants/api_constants.dart';
import 'token_service.dart';

class ChatMessage {
  final String senderId;
  final String senderName;
  final String message;
  final DateTime timestamp;

  ChatMessage({
    required this.senderId,
    required this.senderName,
    required this.message,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      senderId: json['senderId'] ?? '',
      senderName: json['senderName'] ?? 'Unknown',
      message: json['message'] ?? '',
      timestamp: json['timestamp'] != null 
          ? DateTime.parse(json['timestamp']) 
          : DateTime.now(),
    );
  }
}

class SocketService {
  IO.Socket? _socket;
  final TokenService _tokenService;
  
  // 스트림 컨트롤러
  final _connectionController = StreamController<bool>.broadcast();
  final _chatMessageController = StreamController<ChatMessage>.broadcast();
  final _chatHistoryController = StreamController<List<ChatMessage>>.broadcast();
  final _userCountController = StreamController<int>.broadcast();
  
  // 스트림
  Stream<bool> get connectionStream => _connectionController.stream;
  Stream<ChatMessage> get chatMessageStream => _chatMessageController.stream;
  Stream<List<ChatMessage>> get chatHistoryStream => _chatHistoryController.stream;
  Stream<int> get userCountStream => _userCountController.stream;
  
  bool _isConnected = false;
  bool get isConnected => _isConnected;
  bool _autoJoinChat = false;

  SocketService({required TokenService tokenService}) : _tokenService = tokenService;

  Future<void> connect({bool autoJoinChat = false}) async {
    _autoJoinChat = autoJoinChat;
    if (_socket != null && _isConnected) {
      return;
    }

    // 토큰 로드 (최대 3회 재시도)
    String? token;
    for (int i = 0; i < 3; i++) {
      token = await _tokenService.getToken();
      print('Socket: Token attempt ${i + 1}: ${token != null ? 'found (${token.length} chars)' : 'null'}');
      if (token != null && token.isNotEmpty) break;
      await Future.delayed(const Duration(milliseconds: 500));
    }
    
    if (token == null || token.isEmpty) {
      print('Socket: No token available after retries');
      return;
    }

    _socket = IO.io(
      '${ApiConstants.socketUrl}/game',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      print('Socket: Connected');
      _isConnected = true;
      _connectionController.add(true);
      
      // 자동 채팅방 입장
      if (_autoJoinChat) {
        print('Socket: Auto joining chat...');
        _socket!.emit('join_chat');
      }
    });

    _socket!.onDisconnect((_) {
      print('Socket: Disconnected');
      _isConnected = false;
      _connectionController.add(false);
    });

    _socket!.onConnectError((error) {
      print('Socket: Connection error - $error');
      _isConnected = false;
      _connectionController.add(false);
    });

    // 채팅 이벤트 리스너
    _socket!.on('chat_history', (data) {
      print('Socket: Received chat_history: $data');
      if (data is List) {
        final messages = data.map((m) => ChatMessage.fromJson(m as Map<String, dynamic>)).toList();
        _chatHistoryController.add(messages);
      }
    });

    // 서버에서 'new_chat_message'로 전송
    _socket!.on('new_chat_message', (data) {
      print('Socket: Received new_chat_message: $data');
      if (data is Map<String, dynamic>) {
        final message = ChatMessage.fromJson(data);
        _chatMessageController.add(message);
      }
    });

    // 서버에서 'chat_user_count'로 전송
    _socket!.on('chat_user_count', (data) {
      print('Socket: Received chat_user_count: $data');
      if (data is Map<String, dynamic>) {
        _userCountController.add(data['count'] ?? 0);
      }
    });
    
    // chat_joined 이벤트
    _socket!.on('chat_joined', (data) {
      print('Socket: Received chat_joined: $data');
      if (data is Map<String, dynamic>) {
        _userCountController.add(data['userCount'] ?? 0);
      }
    });

    _socket!.on('chat_error', (data) {
      print('Socket: Received chat_error: $data');
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }

  /// 소켓 재연결 - 백그라운드에서 복귀 시 사용
  Future<void> reconnect({bool autoJoinChat = false}) async {
    print('Socket: Reconnecting...');
    disconnect();
    await connect(autoJoinChat: autoJoinChat);
  }

  // 채팅방 입장
  void joinChat() {
    print('Socket: joinChat called, connected: $_isConnected');
    if (_socket != null && _isConnected) {
      print('Socket: Emitting join_chat');
      _socket!.emit('join_chat');
    }
  }

  // 채팅방 퇴장
  void leaveChat() {
    if (_socket != null && _isConnected) {
      _socket!.emit('leave_chat');
    }
  }

  // 메시지 전송
  void sendChatMessage(String message) {
    if (_socket != null && _isConnected && message.trim().isNotEmpty) {
      print('Socket: Sending message: ${message.trim()}');
      _socket!.emit('send_chat', {'message': message.trim()});
    }
  }

  void dispose() {
    disconnect();
    _connectionController.close();
    _chatMessageController.close();
    _chatHistoryController.close();
    _userCountController.close();
  }
}

