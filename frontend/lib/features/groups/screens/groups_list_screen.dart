import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/groups_provider.dart';

class GroupsListScreen extends ConsumerWidget {
  const GroupsListScreen({super.key});

  void _showCreateDialog(BuildContext context, WidgetRef ref) {
    final user = ref.read(authProvider).user;
    if (user != null && !user.canCreateGroups) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.lock_outline, color: AppColors.rankBronce),
              SizedBox(width: 8),
              Text('Rol Insuficiente'),
            ],
          ),
          content: const Text(
            'Tu cuenta actual tiene rol de JUGADOR (cliente estándar). Para crear nuevos grupos se requiere rol de GESTOR o ADMINISTRADOR.\n\nPuedes unirte a grupos existentes con un código de invitación o solicitar a un administrador que asigne el rol de Gestor a tu cuenta.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Entendido'),
            ),
          ],
        ),
      );
      return;
    }

    final nameController = TextEditingController();
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Crear Nuevo Grupo'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Nombre del grupo',
                hintText: 'Ej. Amigos de los Viernes',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descController,
              decoration: const InputDecoration(
                labelText: 'Descripción (opcional)',
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.trim();
              if (name.isNotEmpty) {
                Navigator.pop(ctx);
                try {
                  await ref
                      .read(myGroupsProvider.notifier)
                      .createGroup(
                        name,
                        descController.text.trim().isEmpty
                            ? null
                            : descController.text.trim(),
                      );
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error al crear grupo: $e')),
                    );
                  }
                }
              }
            },
            child: const Text('Crear'),
          ),
        ],
      ),
    );
  }

  void _showJoinDialog(BuildContext context, WidgetRef ref) {
    final codeController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Unirse a un Grupo'),
        content: TextField(
          controller: codeController,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            labelText: 'Código de invitación',
            hintText: 'Ej. AB12CD',
            prefixIcon: Icon(Icons.key),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              final code = codeController.text.trim();
              if (code.isNotEmpty) {
                Navigator.pop(ctx);
                try {
                  await ref.read(myGroupsProvider.notifier).joinGroup(code);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error al unirse: $e')),
                    );
                  }
                }
              }
            },
            child: const Text('Unirme'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupsAsync = ref.watch(myGroupsProvider);
    final user = ref.watch(authProvider).user;
    final displayName = user?.displayName ?? user?.username ?? 'jugador';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tu mesa'),
        actions: [
          IconButton(
            tooltip: 'Unirse por código',
            icon: const Icon(Icons.group_add_outlined),
            onPressed: () => _showJoinDialog(context, ref),
          ),
          IconButton(
            tooltip: 'Crear grupo',
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => _showCreateDialog(context, ref),
          ),
        ],
      ),
      body: groupsAsync.when(
        data: (groups) {
          return RefreshIndicator(
            onRefresh: () => ref.read(myGroupsProvider.notifier).refresh(),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
              children: [
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.22),
                        blurRadius: 24,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hola, $displayName',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              groups.isEmpty
                                  ? 'Crea tu primera mesa y empieza a guardar tus partidas.'
                                  : 'Elige una mesa y sigue construyendo tu historial.',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.82),
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.16),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.casino,
                          size: 32,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tus grupos',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (groups.isNotEmpty)
                      Text(
                        '${groups.length} ${groups.length == 1 ? 'grupo' : 'grupos'}',
                        style: const TextStyle(color: AppColors.textMuted),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                if (groups.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceDark,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppColors.cardDark),
                    ),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.groups_outlined,
                          size: 58,
                          color: AppColors.textMuted,
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Todavía no tienes grupos',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Crea una mesa para tus amigos o únete con un código de invitación.',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            height: 1.35,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () => _showCreateDialog(context, ref),
                              icon: const Icon(Icons.add),
                              label: const Text('Crear grupo'),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => _showJoinDialog(context, ref),
                              icon: const Icon(Icons.key),
                              label: const Text('Unirme'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                else
                  ...groups.map((group) {
                    final isManager = group.isManager;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(22),
                          onTap: () => context.go('/groups/${group.id}'),
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 52,
                                      height: 52,
                                      decoration: BoxDecoration(
                                        color: isManager
                                            ? AppColors.accent.withOpacity(0.16)
                                            : AppColors.secondary.withOpacity(
                                                0.14,
                                              ),
                                        borderRadius: BorderRadius.circular(17),
                                      ),
                                      child: Icon(
                                        isManager
                                            ? Icons.workspace_premium
                                            : Icons.groups,
                                        color: isManager
                                            ? AppColors.accent
                                            : AppColors.secondary,
                                        size: 27,
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            group.name,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          if (group.description != null &&
                                              group
                                                  .description!
                                                  .isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              group.description!,
                                              style: const TextStyle(
                                                color: AppColors.textMuted,
                                                fontSize: 13,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.chevron_right,
                                      color: AppColors.textMuted,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 18),
                                Row(
                                  children: [
                                    _GroupMetric(
                                      icon: Icons.person_outline,
                                      label: '${group.memberCount} miembros',
                                    ),
                                    const SizedBox(width: 18),
                                    _GroupMetric(
                                      icon: Icons.casino_outlined,
                                      label: '${group.gameCount} juegos',
                                    ),
                                    const Spacer(),
                                    Text(
                                      group.myRole == 'MANAGER'
                                          ? 'GESTOR'
                                          : 'JUGADOR',
                                      style: TextStyle(
                                        color: isManager
                                            ? AppColors.accent
                                            : AppColors.textMuted,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: Colors.redAccent,
              ),
              const SizedBox(height: 12),
              Text('Error al cargar grupos: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.read(myGroupsProvider.notifier).refresh(),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GroupMetric extends StatelessWidget {
  final IconData icon;
  final String label;

  const _GroupMetric({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
        ),
      ],
    );
  }
}
