import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/games_provider.dart';

class CustomGameDialog extends ConsumerStatefulWidget {
  final int groupId;

  const CustomGameDialog({super.key, required this.groupId});

  @override
  ConsumerState<CustomGameDialog> createState() => _CustomGameDialogState();
}

class _CustomGameDialogState extends ConsumerState<CustomGameDialog> {
  final _nameController = TextEditingController();
  final _minPlayersController = TextEditingController();
  final _maxPlayersController = TextEditingController();
  final _playtimeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _minPlayersController.dispose();
    _maxPlayersController.dispose();
    _playtimeController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  int? _optionalInt(String value) => value.trim().isEmpty ? null : int.tryParse(value);

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final minPlayers = _optionalInt(_minPlayersController.text);
    final maxPlayers = _optionalInt(_maxPlayersController.text);
    final playtime = _optionalInt(_playtimeController.text);
    if (minPlayers != null && maxPlayers != null && minPlayers > maxPlayers) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('El mínimo no puede superar el máximo de jugadores')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(gameRepositoryProvider).addCustomGame(
            widget.groupId,
            name: _nameController.text.trim(),
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            avgPlaytimeMinutes: playtime,
            description: _descriptionController.text,
          );
      ref.invalidate(groupGamesProvider(widget.groupId));
      if (mounted) Navigator.pop(context);
    } catch (error) {
      setState(() => _saving = false);
      var message = 'No se pudo crear el juego';
      if (error is DioException && error.response?.data is Map) {
        final detail = (error.response!.data as Map)['detail'];
        if (detail != null) message = detail.toString();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    }
  }

  String? _positiveIntValidator(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final parsed = int.tryParse(value);
    return parsed == null || parsed <= 0 ? 'Introduce un número válido' : null;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Crear juego personalizado'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                autofocus: true,
                decoration: const InputDecoration(labelText: 'Nombre del juego'),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Escribe un nombre' : null,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _minPlayersController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Mín. jugadores'),
                      validator: _positiveIntValidator,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _maxPlayersController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Máx. jugadores'),
                      validator: _positiveIntValidator,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _playtimeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Duración aproximada (minutos)'),
                validator: _positiveIntValidator,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _descriptionController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Descripción (opcional)'),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton.icon(
          onPressed: _saving ? null : _save,
          icon: _saving
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.save_outlined),
          label: const Text('Crear'),
        ),
      ],
    );
  }
}
