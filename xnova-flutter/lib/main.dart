import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'providers/providers.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/auth/nickname_setup_screen.dart';
import 'presentation/screens/main/main_screen.dart';
import 'presentation/screens/splash/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 상태바 스타일 설정
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  
  runApp(const ProviderScope(child: XNovaApp()));
}

class XNovaApp extends StatelessWidget {
  const XNovaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'XNOVA',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const AppEntry(),
    );
  }
}

class AppEntry extends StatefulWidget {
  const AppEntry({super.key});

  @override
  State<AppEntry> createState() => _AppEntryState();
}

class _AppEntryState extends State<AppEntry> {
  bool _showSplash = true;

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(
        onComplete: () {
          setState(() => _showSplash = false);
        },
      );
    }
    return const AuthWrapper();
  }
}

class AuthWrapper extends ConsumerStatefulWidget {
  const AuthWrapper({super.key});

  @override
  ConsumerState<AuthWrapper> createState() => _AuthWrapperState();
}

enum AuthScreen { login, register, nicknameSetup }

class _AuthWrapperState extends ConsumerState<AuthWrapper> {
  AuthScreen _currentScreen = AuthScreen.login;
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await ref.read(authProvider.notifier).checkAuth();
    setState(() => _isChecking = false);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (authState.isAuthenticated) {
      return MainScreen(
        onLogout: () {
          setState(() => _currentScreen = AuthScreen.login);
        },
      );
    }

    // 구글 로그인 후 닉네임 설정이 필요한 경우
    if (authState.needsNickname || _currentScreen == AuthScreen.nicknameSetup) {
      return NicknameSetupScreen(
        onComplete: () {
          setState(() => _currentScreen = AuthScreen.login);
        },
        onCancel: () {
          setState(() => _currentScreen = AuthScreen.login);
        },
      );
    }

    switch (_currentScreen) {
      case AuthScreen.login:
        return LoginScreen(
          onRegisterTap: () => setState(() => _currentScreen = AuthScreen.register),
          onLoginSuccess: () {},
          onNicknameRequired: () => setState(() => _currentScreen = AuthScreen.nicknameSetup),
        );
      case AuthScreen.register:
        return RegisterScreen(
          onLoginTap: () => setState(() => _currentScreen = AuthScreen.login),
          onRegisterSuccess: () {},
        );
      case AuthScreen.nicknameSetup:
        return NicknameSetupScreen(
          onComplete: () {
            setState(() => _currentScreen = AuthScreen.login);
          },
          onCancel: () {
            setState(() => _currentScreen = AuthScreen.login);
          },
        );
    }
  }
}
