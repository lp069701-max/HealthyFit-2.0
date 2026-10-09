<?php
/* Autor de la página web: Leonel. P */
/* =====================================================================
   HEALTHYFIT · php/contacto.php — recibe el FORMULARIO DE CONTACTO (paginas/contacto.html)
   Te llega por correo (DESTINO en config.php) y se guarda un respaldo en php/datos/contactos.csv
   ===================================================================== */
require __DIR__ . '/config.php';

solo_post();
trampa_spam();
limitar_envios('contacto');

$nombre   = campo('nombre', 100);
$correo   = campo('correo', 150);
$telefono = campo('telefono', 30);
$asunto   = campo('asunto', 30);
$mensaje  = campo('mensaje', 3000);
$terminos = campo('terminos', 5) !== '';

$asuntos = [
    'membresia'     => 'Membresías y planes',
    'entrenamiento' => 'Entrenamiento personalizado',
    'nutricion'     => 'Planes de alimentación',
    'productos'     => 'Productos y suplementos',
    'otro'          => 'Otro',
];

if (!es_email($correo))                  { responder(false, 'Escribe un correo válido.', 422); }
if (!isset($asuntos[$asunto]))           { responder(false, 'Elige un asunto.', 422); }
if (mb_strlen($mensaje) < 10)            { responder(false, 'El mensaje debe tener al menos 10 letras.', 422); }
if (!$terminos)                          { responder(false, 'Debes aceptar los términos y condiciones.', 422); }

$cuerpo = "Nuevo mensaje desde el formulario de contacto\n"
        . "----------------------------------------------\n"
        . "Nombre:   " . ($nombre !== '' ? $nombre : '(no indicado)') . "\n"
        . "Correo:   " . $correo . "\n"
        . "Teléfono: " . ($telefono !== '' ? $telefono : '(no indicado)') . "\n"
        . "Asunto:   " . $asuntos[$asunto] . "\n"
        . "Fecha:    " . date('d/m/Y H:i') . "\n"
        . "IP:       " . ip_visitante() . "\n\n"
        . "Mensaje:\n" . $mensaje . "\n";

$guardado = guardar_csv('contactos', [$nombre, $correo, $telefono, $asuntos[$asunto], $mensaje]);
$enviado = enviar_aviso('Contacto: ' . $asuntos[$asunto], $cuerpo, $correo);

if (!$enviado && !$guardado) {
    // No se pudo ni enviar el correo ni guardar el respaldo.
    responder(false, 'Recibimos tu mensaje, pero hubo un problema con el aviso. Escríbenos por WhatsApp.', 500);
}
$primero = $nombre !== '' ? ', ' . explode(' ', $nombre)[0] : '';
responder(true, '¡Gracias' . $primero . '! Te responderemos en menos de 24 horas.');
