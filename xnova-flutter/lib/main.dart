import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'providers/providers.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/main/main_screen.dart';

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
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends ConsumerStatefulWidget {
  const AuthWrapper({super.key});

  @override
  ConsumerState<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends ConsumerState<AuthWrapper> {
  bool _isLogin = true;
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
          setState(() => _isLogin = true);
        },
      );
    }

    if (_isLogin) {
      return LoginScreen(
        onRegisterTap: () => setState(() => _isLogin = false),
        onLoginSuccess: () {},
      );
    } else {
      return RegisterScreen(
        onLoginTap: () => setState(() => _isLogin = true),
        onRegisterSuccess: () {},
      );
    }
  }
}
