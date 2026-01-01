import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AnimatedGif extends StatefulWidget {
  final String asset;
  final double? width;
  final double? height;
  final double speed; // 1.0이 기본, 0.5는 절반 속도, 2.0은 2배속
  final BoxFit fit;
  final Widget? errorWidget;

  const AnimatedGif({
    required this.asset,
    this.width,
    this.height,
    this.speed = 1.0,
    this.fit = BoxFit.cover,
    this.errorWidget,
    super.key,
  });

  @override
  State<AnimatedGif> createState() => _AnimatedGifState();
}

class _AnimatedGifState extends State<AnimatedGif> {
  ui.Codec? _codec;
  ui.Image? _currentImage;
  Timer? _timer;
  int _frameIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadGif();
  }

  Future<void> _loadGif() async {
    try {
      final ByteData data = await rootBundle.load(widget.asset);
      _codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
      _getNextFrame();
    } catch (e) {
      debugPrint('GIF 로드 에러: $e');
    }
  }

  void _getNextFrame() async {
    if (_codec == null || !mounted) return;

    try {
      final frameInfo = await _codec!.getNextFrame();
      if (mounted) {
        setState(() {
          _currentImage = frameInfo.image;
        });
        
        // 프레임 지속 시간 가져오기 (기본값 100ms)
        int frameDuration = frameInfo.duration.inMilliseconds;
        if (frameDuration <= 0) frameDuration = 100;
        
        // 속도 적용: speed가 0.1이면 duration이 10배가 되어 10배 느려짐
        final adjustedMs = (frameDuration / widget.speed).round();
        
        _timer?.cancel();
        _timer = Timer(Duration(milliseconds: adjustedMs), _getNextFrame);
      }
    } catch (e) {
      debugPrint('GIF Frame Error: $e');
      _loadGif(); // 에러 발생 시 처음부터 다시 시도
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _codec?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_currentImage == null) {
      return widget.errorWidget ?? const SizedBox();
    }
    return RawImage(
      image: _currentImage,
      width: widget.width,
      height: widget.height,
      fit: widget.fit,
    );
  }
}

