<?php
/* Autor de la página web: Leonel. P */
/* =====================================================================
   HEALTHYFIT · php/config.php
   Configuración y funciones comunes de contacto.php, suscribir.php y comentarios.php
   ===================================================================== */
declare(strict_types=1);

/* ---------- LO ÚNICO QUE DEBES CAMBIAR ---------- */
const DESTINO    = 'info@healthyfit.com';          // ← correo donde TÚ recibirás todos los avisos
const REMITENTE  = 'no-responder@tudominio.com';   // ← correo de tu dominio (el hosting suele exigirlo para que mail() funcione)
const NOMBRE_SITIO = 'HealthyFit';
/* ------------------------------------------------ */

const CARPETA_DATOS = __DIR__ . '/datos';           // aquí se guarda un respaldo (.csv) de todo lo recibido

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

/** Responde en JSON y termina. */
function responder(bool $ok, string $mensaje, int $codigo = 200): void {
    http_response_code($codigo);
    echo json_encode(['ok' => $ok, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Solo acepta envíos por POST. */
function solo_post(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        responder(false, 'Método no permitido.', 405);
    }
}

/** Campo del formulario, limpio y con largo máximo. */
function campo(string $nombre, int $max = 500): string {
    $v = isset($_POST[$nombre]) && is_string($_POST[$nombre]) ? $_POST[$nombre] : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr(trim($v), 0, $max);
}

/** Quita saltos de línea (evita inyección de cabeceras en el correo). */
function linea_segura(string $s): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $s) ?? '');
}

function es_email(string $v): bool {
    return (bool) filter_var($v, FILTER_VALIDATE_EMAIL);
}

/** Campo-trampa "web": los humanos no lo ven; los robots sí lo llenan. Si viene lleno, se finge éxito y no se hace nada. */
function trampa_spam(): void {
    if (campo('web') !== '') {
        responder(true, '¡Gracias!');
    }
}

/** Evita envíos repetidos seguidos desde el mismo navegador. */
function limitar_envios(string $clave, int $segundos = 15): void {
    if (session_status() !== PHP_SESSION_ACTIVE) { @session_start(); }
    $k = 'ultimo_' . $clave;
    $ahora = time();
    if (isset($_SESSION[$k]) && $ahora - (int) $_SESSION[$k] < $segundos) {
        responder(false, 'Espera unos segundos antes de volver a enviar.', 429);
    }
    $_SESSION[$k] = $ahora;
}

/** Celda de CSV segura (evita que Excel ejecute fórmulas). */
function celda_csv(string $s): string {
    $s = linea_segura($s);
    return preg_match('/^[=+\-@]/', $s) ? "'" . $s : $s;
}

/** Guarda una fila en datos/<archivo>.csv (carpeta protegida con .htaccess). */
function guardar_csv(string $archivo, array $fila): bool {
    if (!is_dir(CARPETA_DATOS)) { @mkdir(CARPETA_DATOS, 0755, true); }
    $ruta = CARPETA_DATOS . '/' . $archivo . '.csv';
    $nuevo = !file_exists($ruta);
    $f = @fopen($ruta, 'ab');
    if (!$f) { return false; }
    $ok = false;
    if (flock($f, LOCK_EX)) {
        if ($nuevo) { fwrite($f, "\xEF\xBB\xBF"); }                         // para que Excel lea bien las tildes
        fputcsv($f, array_merge([date('Y-m-d H:i:s')], array_map('celda_csv', $fila)));
        fflush($f);
        flock($f, LOCK_UN);
        $ok = true;
    }
    fclose($f);
    return $ok;
}

/** Envía un aviso a DESTINO. */
function enviar_aviso(string $asunto, string $cuerpo, string $responderA = ''): bool {
    $cabeceras = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . NOMBRE_SITIO . ' <' . REMITENTE . '>',
    ];
    if ($responderA !== '' && es_email($responderA)) {
        $cabeceras[] = 'Reply-To: ' . linea_segura($responderA);
    }
    $asuntoCodificado = '=?UTF-8?B?' . base64_encode('[' . NOMBRE_SITIO . '] ' . linea_segura($asunto)) . '?=';
    return @mail(DESTINO, $asuntoCodificado, $cuerpo, implode("\r\n", $cabeceras));
}

/** IP del visitante (para el aviso). */
function ip_visitante(): string {
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}
