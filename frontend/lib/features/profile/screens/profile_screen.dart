import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/user.dart';
import '../../../shared/widgets/user_avatar.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  static const List<String> _presetAvatars = [
    'https://api.dicebear.com/7.x/adventurer/png?seed=warrior',
    'https://api.dicebear.com/7.x/adventurer/png?seed=mage',
    'https://api.dicebear.com/7.x/adventurer/png?seed=king',
    'https://api.dicebear.com/7.x/adventurer/png?seed=rogue',
    'https://api.dicebear.com/7.x/adventurer/png?seed=bard',
    'https://api.dicebear.com/7.x/bottts/png?seed=dice',
  ];

  void _showEditProfileDialog(
    BuildContext context,
    String currentDisplayName,
    String currentAvatarUrl,
  ) {
    final nameController = TextEditingController(text: currentDisplayName);
    final urlController = TextEditingController(text: currentAvatarUrl);
    String selectedUrl = currentAvatarUrl;
    bool saving = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogCtx, setDialogState) {
            return AlertDialog(
              title: const Text('Editar Perfil'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: UserAvatar(
                        avatarUrl: selectedUrl,
                        name: nameController.text.isNotEmpty
                            ? nameController.text
                            : 'Yo',
                        radius: 40,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre público',
                        hintText: 'Tu nombre o apodo',
                        prefixIcon: Icon(Icons.badge),
                      ),
                      onChanged: (val) => setDialogState(() {}),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: urlController,
                      decoration: const InputDecoration(
                        labelText: 'URL de foto de perfil',
                        hintText: 'https://...',
                        prefixIcon: Icon(Icons.link),
                      ),
                      onChanged: (val) {
                        setDialogState(() {
                          selectedUrl = val.trim();
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'O elige un avatar temático:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _presetAvatars.map((preset) {
                        final isSelected = selectedUrl == preset;
                        return InkWell(
                          onTap: () {
                            setDialogState(() {
                              selectedUrl = preset;
                              urlController.text = preset;
                            });
                          },
                          borderRadius: BorderRadius.circular(24),
                          child: Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : Colors.transparent,
                                width: 2.5,
                              ),
                            ),
                            child: UserAvatar(
                              avatarUrl: preset,
                              name: 'P',
                              radius: 20,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: saving ? null : () => Navigator.of(ctx).pop(),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          setDialogState(() => saving = true);
                          final ok = await ref
                              .read(authProvider.notifier)
                              .updateProfile(
                                displayName:
                                    nameController.text.trim().isNotEmpty
                                    ? nameController.text.trim()
                                    : null,
                                avatarUrl: selectedUrl.trim().isNotEmpty
                                    ? selectedUrl.trim()
                                    : null,
                              );
                          if (dialogCtx.mounted) {
                            Navigator.of(ctx).pop();
                          }
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  ok
                                      ? 'Perfil actualizado con éxito'
                                      : 'Error al actualizar el perfil',
                                ),
                                backgroundColor: ok
                                    ? Colors.green
                                    : Colors.redAccent,
                              ),
                            );
                          }
                        },
                  child: saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Guardar'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final displayName = user.displayName ?? user.username;
    final avatarUrl = user.avatarUrl ?? '';
    final statsAsync = ref.watch(accountStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Perfil'),
        actions: [
          IconButton(
            tooltip: 'Editar Perfil',
            icon: const Icon(Icons.edit),
            onPressed: () => _showEditProfileDialog(
              context,
              user.displayName ?? '',
              avatarUrl,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Center(
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      UserAvatar(
                        avatarUrl: user.avatarUrl,
                        name: displayName,
                        radius: 48,
                        onTap: () => _showEditProfileDialog(
                          context,
                          user.displayName ?? '',
                          avatarUrl,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.cardDark,
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    displayName,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '@${user.username} • ${user.email}',
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.cardDark,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: user.isAdmin
                            ? AppColors.rankDiamante
                            : (user.isGestor
                                  ? AppColors.rankOro
                                  : AppColors.rankPlata),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      user.isAdmin
                          ? 'ROL: ADMINISTRADOR GLOBAL'
                          : (user.isGestor
                                ? 'ROL: GESTOR DE PLATAFORMA'
                                : 'ROL: CLIENTE / JUGADOR'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: user.isAdmin
                            ? AppColors.rankDiamante
                            : (user.isGestor
                                  ? AppColors.rankOro
                                  : AppColors.rankPlata),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            statsAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 28),
                child: CircularProgressIndicator(),
              ),
              error: (_, __) => const _StatsUnavailable(),
              data: (stats) => _PlayerProgressCard(stats: stats),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryLight,
                side: const BorderSide(color: AppColors.primaryLight),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
              onPressed: () => _showEditProfileDialog(
                context,
                user.displayName ?? '',
                avatarUrl,
              ),
              icon: const Icon(Icons.edit),
              label: const Text('Editar Nombre y Foto de Perfil'),
            ),
            const SizedBox(height: 24),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(
                      Icons.military_tech,
                      color: Colors.amber,
                    ),
                    title: const Text('Mis Logros e Insignias'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/achievements'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.calendar_month,
                      color: AppColors.primary,
                    ),
                    title: const Text('Miembro desde'),
                    trailing: Text(
                      DateFormat('dd/MM/yyyy').format(user.createdAt),
                      style: const TextStyle(color: AppColors.textMuted),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.redAccent,
                  side: const BorderSide(color: Colors.redAccent),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar Sesión'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlayerProgressCard extends StatelessWidget {
  final AccountStats stats;

  const _PlayerProgressCard({required this.stats});

  @override
  Widget build(BuildContext context) {
    final progress = stats.experienceInLevel / stats.experienceToNextLevel;
    final hours = stats.totalPlayMinutes ~/ 60;
    final minutes = stats.totalPlayMinutes % 60;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.16),
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Text(
                    'NIVEL ${stats.level}',
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.7,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '${stats.experience} XP',
                  style: const TextStyle(color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                minHeight: 10,
                value: progress.clamp(0.0, 1.0),
                backgroundColor: AppColors.cardDark,
                valueColor: const AlwaysStoppedAnimation(AppColors.accent),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${stats.experienceInLevel}/${stats.experienceToNextLevel} XP para el siguiente nivel',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 20),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _StatPill(
                  label: 'Partidas',
                  value: '${stats.gamesPlayed}',
                  icon: Icons.sports_esports,
                ),
                _StatPill(
                  label: 'Victorias',
                  value: '${stats.wins}',
                  icon: Icons.emoji_events,
                ),
                _StatPill(
                  label: 'Win rate',
                  value: '${stats.winRate}%',
                  icon: Icons.insights,
                ),
                _StatPill(
                  label: 'Juegos',
                  value: '${stats.uniqueGames}',
                  icon: Icons.casino,
                ),
                _StatPill(
                  label: 'Tiempo',
                  value: hours > 0 ? '${hours}h ${minutes}m' : '${minutes}m',
                  icon: Icons.timer_outlined,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatPill({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.backgroundDark,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryLight),
          const SizedBox(width: 7),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatsUnavailable extends StatelessWidget {
  const _StatsUnavailable();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'Aún no hay estadísticas confirmadas para mostrar.',
      style: TextStyle(color: AppColors.textMuted),
      textAlign: TextAlign.center,
    );
  }
}
