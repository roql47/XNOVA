import 'package:intl/intl.dart';

/// 한국 표준시(KST, UTC+9)로 변환
DateTime toKST(DateTime dateTime) {
  // UTC로 변환 후 9시간 추가
  final utc = dateTime.toUtc();
  return utc.add(const Duration(hours: 9));
}

/// KST 시간을 포맷팅 (MM-dd HH:mm)
String formatKSTDateTime(DateTime dateTime) {
  final kst = toKST(dateTime);
  return DateFormat('MM-dd HH:mm').format(kst);
}

/// KST 시간을 포맷팅 (HH:mm:ss)
String formatKSTTime(DateTime dateTime) {
  final kst = toKST(dateTime);
  return DateFormat('HH:mm:ss').format(kst);
}

/// KST 시간을 포맷팅 (yyyy-MM-dd HH:mm:ss)
String formatKSTFull(DateTime dateTime) {
  final kst = toKST(dateTime);
  return DateFormat('yyyy-MM-dd HH:mm:ss').format(kst);
}

