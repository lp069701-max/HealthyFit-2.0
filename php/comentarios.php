<?php
/* Autor de la página web: Leonel. P */
/* =====================================================================
   HEALTHYFIT · php/comentarios.php — recibe los COMENTARIOS del inicio (index.html)
   Te llega por correo y se guarda un respaldo en php/datos/comentarios.csv
   ===================================================================== */
require __DIR__ . '/config.php';

solo_post();
trampa_spam();
limitar_envios('comentarios');

$nombre     = campo('nombre', 80);
$correo     = campo('correo', 150);          // opcional
$comentario = campo('comentario', 1000);

if (mb_strlen($nombre) < 2)       { responder(false, 'Escribe tu nombre (mínimo 2 letras).', 422); }
if (mb_strlen($comentario) < 5)   { responder(false, 'Escribe un comentario (mínimo 5 letras).', 422); }
if ($correo !== '' && !es_email($correo)) { responder(false, 'El correo no es válido (puedes dejarlo vacío).', 422); }

$cuerpo = "Nuevo comentario en la página de inicio\n"
        . "----------------------------------------\n"
        . "Nombre: $nombre\n"
        . "Correo: " . ($correo !== '' ? $correo : '(no indicado)') . "\n"
        . "Fecha:  " . date('d/m/Y H:i') . "\n"
        . "IP:     " . ip_visitante() . "\n\n"
        . "Comentario:\n$comentario\n";

guardar_csv('comentarios', [$nombre, $correo, $comentario]);
enviar_aviso('Nuevo comentario de ' . $nombre, $cuerpo, $correo);

responder(true, '¡Gracias por tu comentario!');
