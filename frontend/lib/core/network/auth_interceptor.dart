import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../storage/token_storage.dart';
import 'api_endpoints.dart';

/// Interceptor de autenticación.
///
/// - Añade el Access Token (JWT) a cada petición saliente.
/// - Ante un 401 intenta un refresco SILENCIOSO del token y reintenta la
///   petición original.
///
/// Nota sobre concurrencia: el refresh token rota en cada uso (un solo uso),
/// por lo que lanzar varios refrescos en paralelo invalidaría la sesión.
/// Todas las peticiones que reciben un 401 al mismo tiempo comparten un único
/// `Future` de refresco y esperan al mismo resultado.
class AuthInterceptor extends Interceptor {
  final Dio dio;
  final VoidCallback? onSessionExpired;

  /// Refresco en curso compartido entre peticiones concurrentes.
  Future<String?>? _refreshFuture;

  AuthInterceptor({required this.dio, this.onSessionExpired});

  static const String _retriedFlag = 'authRetried';

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Rutas públicas: no necesitan (ni deben) llevar el Bearer token.
    if (!_isPublicEndpoint(options.path)) {
      final token = await TokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = err.response?.statusCode;
    final requestPath = err.requestOptions.path;

    // Solo los 401 sobre endpoints protegidos triggers el refresco.
    if (statusCode != 401 ||
        _isPublicEndpoint(requestPath) ||
        (err.requestOptions.extra[_retriedFlag] == true)) {
      return handler.next(err);
    }

    final newToken = await _refreshAccessToken();
    if (newToken == null) {
      // El refresco falló: la sesión ya no es válida.
      await _expireSession();
      return handler.next(err);
    }

    try {
      final options = err.requestOptions;
      options.headers['Authorization'] = 'Bearer $newToken';
      options.extra[_retriedFlag] = true; // evita bucles de reintento
      final retryResponse = await dio.fetch(options);
      return handler.resolve(retryResponse);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }

  /// Rutas que no requieren Access Token (login, registro, refresh, recuperación).
  bool _isPublicEndpoint(String path) {
    return path.contains('/auth/login') ||
        path.contains('/auth/register') ||
        path.contains('/auth/refresh') ||
        path.contains('/auth/forgot-password') ||
        path.contains('/auth/reset-password');
  }

  /// Devuelve el refresco EN CURSO o lanza uno nuevo. Todas las llamadas
  /// concurrentes reciben el mismo `Future` (y por tanto el mismo token).
  Future<String?> _refreshAccessToken() {
    return _refreshFuture ??= _performRefresh().whenComplete(() {
      _refreshFuture = null;
    });
  }

  Future<String?> _performRefresh() async {
    try {
      // Cliente independiente: no pasa por este interceptor (evita recursión).
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: dio.options.baseUrl,
          extra: {'withCredentials': true},
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final response = await refreshDio.post(ApiEndpoints.refresh);
      final newAccessToken = response.data['access_token'] as String?;

      if (newAccessToken != null && newAccessToken.isNotEmpty) {
        await TokenStorage.saveAccessToken(newAccessToken);
        return newAccessToken;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _expireSession() async {
    await TokenStorage.clear();
    onSessionExpired?.call();
  }
}
