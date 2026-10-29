import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../../shared/models/user.dart';

final accountStatsProvider = FutureProvider<AccountStats>((ref) async {
  return ref.watch(authRepositoryProvider).getMyStats();
});
