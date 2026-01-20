import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _progressController;
  late AnimationController _particleController;
  late AnimationController _pulseController;

  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  late Animation<double> _titleOpacity;
  late Animation<double> _subtitleOpacity;
  late Animation<double> _progressOpacity;
  late Animation<double> _creditOpacity;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _startAnimations();
  }

  void _initAnimations() {
    // Logo animation controller
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    // Progress bar animation
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 2500),
      vsync: this,
    );

    // Particle animation (continuous)
    _particleController = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    )..repeat();

    // Pulse animation for glow effects
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    // Logo animations
    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );

    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
      ),
    );

    _titleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.3, 0.6, curve: Curves.easeOut),
      ),
    );

    _subtitleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.5, 0.8, curve: Curves.easeOut),
      ),
    );

    _progressOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.6, 0.9, curve: Curves.easeOut),
      ),
    );

    _creditOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.7, 1.0, curve: Curves.easeOut),
      ),
    );
  }

  void _startAnimations() async {
    // Start logo animation
    _logoController.forward();

    // Start progress after logo appears
    await Future.delayed(const Duration(milliseconds: 800));
    _progressController.forward();

    // Wait for animations to complete then navigate
    await Future.delayed(const Duration(milliseconds: 2800));
    widget.onComplete();
  }

  @override
  void dispose() {
    _logoController.dispose();
    _progressController.dispose();
    _particleController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Animated star particles background
          _buildStarField(),

          // Nebula gradient overlay
          _buildNebulaOverlay(),

          // Main content
          Center(
            child: AnimatedBuilder(
              animation: Listenable.merge([
                _logoController,
                _progressController,
                _pulseController,
              ]),
              builder: (context, child) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(flex: 2),

                    // Logo with glow effect
                    _buildLogo(),

                    const SizedBox(height: 24),

                    // Title "XNOVA"
                    _buildTitle(),

                    const SizedBox(height: 8),

                    // Subtitle
                    _buildSubtitle(),

                    const Spacer(flex: 1),

                    // Progress bar
                    _buildProgressBar(),

                    const SizedBox(height: 16),

                    // Loading text
                    _buildLoadingText(),

                    const Spacer(flex: 1),

                    // Credits
                    _buildCredits(),

                    const SizedBox(height: 48),
                  ],
                );
              },
            ),
          ),

          // Corner decorations
          _buildCornerDecorations(),
        ],
      ),
    );
  }

  Widget _buildStarField() {
    return AnimatedBuilder(
      animation: _particleController,
      builder: (context, child) {
        return CustomPaint(
          painter: StarFieldPainter(
            animationValue: _particleController.value,
          ),
          size: Size.infinite,
        );
      },
    );
  }

  Widget _buildNebulaOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.5,
          colors: [
            AppColors.accent.withOpacity(0.05),
            AppColors.background.withOpacity(0.0),
            const Color(0xFF1A0A2E).withOpacity(0.3),
          ],
          stops: const [0.0, 0.5, 1.0],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Opacity(
      opacity: _logoOpacity.value,
      child: Transform.scale(
        scale: _logoScale.value,
        child: Container(
          width: 140,
          height: 140,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.accent.withOpacity(0.3 + (_pulseController.value * 0.2)),
                blurRadius: 30 + (_pulseController.value * 20),
                spreadRadius: 5 + (_pulseController.value * 10),
              ),
            ],
          ),
          child: ClipOval(
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.accent.withOpacity(0.5),
                  width: 2,
                ),
                gradient: RadialGradient(
                  colors: [
                    AppColors.surface,
                    AppColors.background,
                  ],
                ),
              ),
              child: Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTitle() {
    return Opacity(
      opacity: _titleOpacity.value,
      child: ShaderMask(
        shaderCallback: (bounds) => LinearGradient(
          colors: [
            AppColors.accent,
            AppColors.accent.withOpacity(0.7),
            AppColors.resourceCrystal,
          ],
        ).createShader(bounds),
        child: Text(
          'XNOVA',
          style: GoogleFonts.orbitron(
            fontSize: 48,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            letterSpacing: 12,
            shadows: [
              Shadow(
                color: AppColors.accent.withOpacity(0.5),
                blurRadius: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubtitle() {
    return Opacity(
      opacity: _subtitleOpacity.value,
      child: Text(
        'GALACTIC CONQUEST',
        style: GoogleFonts.exo2(
          fontSize: 14,
          fontWeight: FontWeight.w300,
          color: AppColors.textSecondary,
          letterSpacing: 8,
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return Opacity(
      opacity: _progressOpacity.value,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 60),
        child: Column(
          children: [
            // Progress bar container
            Container(
              height: 4,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                color: AppColors.panelBorder,
              ),
              child: Stack(
                children: [
                  // Progress fill
                  FractionallySizedBox(
                    widthFactor: _progressController.value,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(2),
                        gradient: LinearGradient(
                          colors: [
                            AppColors.accent,
                            AppColors.resourceCrystal,
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.accent.withOpacity(0.6),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Shine effect
                  if (_progressController.value > 0.1)
                    Positioned(
                      left: (_progressController.value * MediaQuery.of(context).size.width * 0.7) - 30,
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 30,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.white.withOpacity(0.0),
                              Colors.white.withOpacity(0.4),
                              Colors.white.withOpacity(0.0),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingText() {
    return Opacity(
      opacity: _progressOpacity.value,
      child: AnimatedBuilder(
        animation: _progressController,
        builder: (context, child) {
          final percentage = (_progressController.value * 100).toInt();
          String statusText = _getStatusText(percentage);

          return Column(
            children: [
              Text(
                '$percentage%',
                style: GoogleFonts.orbitron(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                statusText,
                style: GoogleFonts.exo2(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  letterSpacing: 1,
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _getStatusText(int percentage) {
    if (percentage < 20) return 'Initializing systems...';
    if (percentage < 40) return 'Loading galaxy data...';
    if (percentage < 60) return 'Connecting to servers...';
    if (percentage < 80) return 'Preparing fleet...';
    if (percentage < 95) return 'Almost ready...';
    return 'Launching...';
  }

  Widget _buildCredits() {
    return Opacity(
      opacity: _creditOpacity.value,
      child: Column(
        children: [
          // Version badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              border: Border.all(
                color: AppColors.accent.withOpacity(0.4),
                width: 1,
              ),
              borderRadius: BorderRadius.circular(12),
              color: AppColors.accent.withOpacity(0.1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.accent,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.accent.withOpacity(0.5),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'CLOSED BETA',
                  style: GoogleFonts.exo2(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.accent,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'v0.28',
                  style: GoogleFonts.orbitron(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 1,
                color: AppColors.panelBorder,
              ),
              const SizedBox(width: 12),
              Text(
                'A PROJECT BY',
                style: GoogleFonts.exo2(
                  fontSize: 10,
                  fontWeight: FontWeight.w300,
                  color: AppColors.textMuted,
                  letterSpacing: 3,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 40,
                height: 1,
                color: AppColors.panelBorder,
              ),
            ],
          ),
          const SizedBox(height: 8),
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: [
                const Color(0xFFFFD700),
                const Color(0xFFFFA500),
                const Color(0xFFFFD700),
              ],
            ).createShader(bounds),
            child: Text(
              'NobleCat',
              style: GoogleFonts.cinzel(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 4,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.star,
                size: 14,
                color: AppColors.textMuted.withOpacity(0.5),
              ),
              const SizedBox(width: 8),
              Text(
                '2026',
                style: GoogleFonts.exo2(
                  fontSize: 11,
                  color: AppColors.textMuted,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.star,
                size: 14,
                color: AppColors.textMuted.withOpacity(0.5),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCornerDecorations() {
    return AnimatedBuilder(
      animation: _logoController,
      builder: (context, child) {
        final opacity = _progressOpacity.value * 0.3;
        return Stack(
          children: [
            // Top left
            Positioned(
              top: 60,
              left: 20,
              child: Opacity(
                opacity: opacity,
                child: _buildCornerLines(false),
              ),
            ),
            // Top right
            Positioned(
              top: 60,
              right: 20,
              child: Opacity(
                opacity: opacity,
                child: Transform.scale(
                  scaleX: -1,
                  child: _buildCornerLines(false),
                ),
              ),
            ),
            // Bottom left
            Positioned(
              bottom: 30,
              left: 20,
              child: Opacity(
                opacity: opacity,
                child: Transform.scale(
                  scaleY: -1,
                  child: _buildCornerLines(true),
                ),
              ),
            ),
            // Bottom right
            Positioned(
              bottom: 30,
              right: 20,
              child: Opacity(
                opacity: opacity,
                child: Transform.scale(
                  scaleX: -1,
                  scaleY: -1,
                  child: _buildCornerLines(true),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCornerLines(bool isBottom) {
    return SizedBox(
      width: 60,
      height: 60,
      child: CustomPaint(
        painter: CornerLinePainter(
          color: AppColors.accent.withOpacity(0.5),
        ),
      ),
    );
  }
}

// Star field painter for animated background
class StarFieldPainter extends CustomPainter {
  final double animationValue;
  final List<Star> stars;

  StarFieldPainter({required this.animationValue})
      : stars = List.generate(100, (index) => Star.random(index));

  @override
  void paint(Canvas canvas, Size size) {
    for (final star in stars) {
      final paint = Paint()
        ..color = Colors.white.withOpacity(
          (0.3 + 0.7 * ((math.sin((animationValue + star.phase) * 2 * math.pi) + 1) / 2)) * star.brightness,
        );

      final x = (star.x * size.width + animationValue * star.speed * 100) % size.width;
      final y = star.y * size.height;

      canvas.drawCircle(
        Offset(x, y),
        star.size,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant StarFieldPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}

class Star {
  final double x;
  final double y;
  final double size;
  final double brightness;
  final double phase;
  final double speed;

  Star({
    required this.x,
    required this.y,
    required this.size,
    required this.brightness,
    required this.phase,
    required this.speed,
  });

  factory Star.random(int seed) {
    final random = math.Random(seed);
    return Star(
      x: random.nextDouble(),
      y: random.nextDouble(),
      size: random.nextDouble() * 1.5 + 0.5,
      brightness: random.nextDouble() * 0.5 + 0.5,
      phase: random.nextDouble(),
      speed: random.nextDouble() * 0.5 + 0.1,
    );
  }
}

// Corner decoration painter
class CornerLinePainter extends CustomPainter {
  final Color color;

  CornerLinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Horizontal line
    canvas.drawLine(
      Offset(0, 0),
      Offset(size.width, 0),
      paint,
    );

    // Vertical line
    canvas.drawLine(
      Offset(0, 0),
      Offset(0, size.height * 0.5),
      paint,
    );

    // Diagonal accent
    canvas.drawLine(
      Offset(size.width * 0.7, 0),
      Offset(size.width, size.height * 0.3),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

