# Relojes

[![Archivado en Software Heritage](https://archive.softwareheritage.org/badge/origin/https://github.com/camammoli/relojes/)](https://archive.softwareheritage.org/browse/origin/?origin_url=https://github.com/camammoli/relojes)

Dashboard de tarjetas reposicionables: reloj UTC, relojes mundiales, alarmas, timers y cronómetro. Sin cuenta, sin servidor, sin build.

**🌐 [mammoli.ar/relojes](https://mammoli.ar/relojes/)**

## Funcionalidad

| Tarjeta | Descripción |
|---|---|
| **Reloj mundial** | UTC + cualquier zona horaria IANA (buscador con ~60 ciudades curadas o entrada manual), muestra hora, fecha y offset |
| **Alarma** | Hora + repetición por día de la semana (o "una vez"), sonido + notificación del navegador, opción de posponer 5 min |
| **Timer** | Cuenta regresiva con anillo de progreso circular, duración editable en minutos:segundos |
| **Cronómetro** | Start/pausa/reset con registro de vueltas |

Todas las tarjetas (menos el reloj, que ya trae su propio selector) se pueden **renombrar** con el lápiz — por ejemplo un timer llamado "Fideos" o una alarma llamada "Reunión".

Las tarjetas se **arrastran para reordenar** (funciona con mouse y touch) y el orden se guarda solo.

## Persistencia

Todo vive en el `localStorage` del navegador — no hay backend, no hay base de datos, no hay cuentas. Cada dispositivo mantiene su propio tablero.

## Stack

HTML5 + CSS + JavaScript vanilla con ES modules nativos — sin frameworks, sin bundler, sin build step.

- Reordenamiento de tarjetas: Pointer Events (no HTML5 Drag & Drop, para que funcione bien en mobile)
- Zonas horarias: `Intl.DateTimeFormat` nativo (maneja DST automáticamente vía la base de datos tz del sistema)
- Sonido de alarma/timer: Web Audio API con osciladores generados (sin archivos de audio)
- Tipografías: Space Grotesk (UI) + JetBrains Mono (dígitos), Google Fonts

## Estructura

```
index.html
style.css
js/
  storage.js       — persistencia en localStorage
  dragdrop.js       — reorder por pointer events
  sound.js          — beeps generados con Web Audio API
  ring.js           — overlay compartido de alarma/timer sonando
  timezones.js      — catálogo de zonas horarias + validación
  main.js           — orquestación, toolbar, diálogos
  cards/
    clockCard.js
    alarmCard.js
    timerCard.js
    stopwatchCard.js
```

## Desarrollo local

No requiere instalación ni build. Basta con servir la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

y abrir `http://localhost:8000`.

## Licencia

MIT License — Carlos Ariel Mammoli (LU2MCA), Mendoza, Argentina
