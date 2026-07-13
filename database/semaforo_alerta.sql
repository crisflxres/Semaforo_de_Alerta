-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-07-2026 a las 22:28:49
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `semaforo_alerta`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas`
--

CREATE TABLE `alertas` (
  `Id_Alerta` int(10) UNSIGNED NOT NULL,
  `Matricula` varchar(20) NOT NULL,
  `Periodo` varchar(20) NOT NULL,
  `Id_Nivel` tinyint(3) UNSIGNED NOT NULL,
  `Materias_Reprobadas` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `PAC` decimal(4,2) DEFAULT NULL,
  `Fecha_Calculo` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alumnos`
--

CREATE TABLE `alumnos` (
  `Matricula` varchar(20) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Apellidos` varchar(150) NOT NULL,
  `Id_Grupo` smallint(5) UNSIGNED NOT NULL,
  `Foto` varchar(500) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT 1,
  `Id_Usuario` int(10) UNSIGNED NOT NULL,
  `PAC` decimal(4,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `aulas`
--

CREATE TABLE `aulas` (
  `Id_Aula` int(10) UNSIGNED NOT NULL,
  `Nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `aulas`
--

INSERT INTO `aulas` (`Id_Aula`, `Nombre`) VALUES
(1, 'Salón 1'),
(2, 'Salón 2'),
(3, 'Salón 3'),
(4, 'Salón 4'),
(5, 'Salón 5'),
(6, 'Salón 6'),
(7, 'Salón 7'),
(8, 'Salón 8'),
(9, 'Salón 9'),
(10, 'Salón 10'),
(11, 'Salón 11'),
(12, 'Salón 12'),
(13, 'Salón 13'),
(14, 'Salón 14'),
(15, 'Salón 15'),
(16, 'Salón 16'),
(17, 'Salón 17'),
(18, 'Salón 18'),
(19, 'Salón 19'),
(20, 'Salón 20'),
(21, 'Salón 21'),
(22, 'Laboratorio de Usos Múltiples'),
(23, 'Componente Mecatrónica Taller'),
(24, 'Componente Programación Cómputo I'),
(25, 'Cómputo II'),
(26, 'Cómputo III'),
(27, 'Componente Soporte MTTO de Cómputo I'),
(28, 'Componente P.G.A Lab. Contabilidad'),
(29, 'Taller Dibujo '),
(30, 'Ex Lab. P.I');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificaciones`
--

CREATE TABLE `calificaciones` (
  `Id_Calificacion` int(10) UNSIGNED NOT NULL,
  `Matricula` varchar(20) NOT NULL,
  `Id_Materia` smallint(5) UNSIGNED NOT NULL,
  `Id_Importacion` int(10) UNSIGNED NOT NULL,
  `Periodo` varchar(35) NOT NULL,
  `P1` decimal(4,2) DEFAULT NULL,
  `P2` decimal(4,2) DEFAULT NULL,
  `P3` decimal(4,2) DEFAULT NULL,
  `PR` decimal(4,2) DEFAULT NULL,
  `Aprobado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carreras`
--

CREATE TABLE `carreras` (
  `Id_Carrera` smallint(5) UNSIGNED NOT NULL,
  `Nombre` varchar(150) NOT NULL,
  `Clave` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `carreras`
--

INSERT INTO `carreras` (`Id_Carrera`, `Nombre`, `Clave`) VALUES
(1, 'SOPORTE Y MANTENIMIENTO DE EQUIPO DE CÓMPUTO', 'SyMEC'),
(2, 'PROGRAMACIÓN', 'Progra'),
(3, 'PROCESOS DE GESTIÓN ADMINISTRATIVA', 'PGA'),
(4, 'MECATRÓNICA', 'Meca'),
(5, 'PRODUCCIÓN INDUSTRIAL', 'PI');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupos`
--

CREATE TABLE `grupos` (
  `Id_Grupo` smallint(5) UNSIGNED NOT NULL,
  `Nombre` varchar(30) NOT NULL,
  `Semestre` varchar(25) NOT NULL,
  `Id_Carrera` smallint(5) UNSIGNED NOT NULL,
  `Turno` enum('Matutino','Vespertino') NOT NULL DEFAULT 'Matutino'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `grupos`
--

INSERT INTO `grupos` (`Id_Grupo`, `Nombre`, `Semestre`, `Id_Carrera`, `Turno`) VALUES
(1, '03U2A', 'Segundo', 4, 'Matutino'),
(2, '03U2B', 'Segundo', 4, 'Matutino'),
(3, '03U2C', 'Segundo', 4, 'Vespertino'),
(4, '03U2D', 'Segundo', 4, 'Vespertino'),
(5, '03V2E', 'Segundo', 3, 'Matutino'),
(6, '03V2F', 'Segundo', 3, 'Matutino'),
(7, '03V2G', 'Segundo', 3, 'Vespertino'),
(8, '03V2H', 'Segundo', 3, 'Vespertino'),
(9, '03AL2I', 'Segundo', 5, 'Matutino'),
(10, '03AL2J', 'Segundo', 5, 'Vespertino'),
(11, '03AJ2K', 'Segundo', 2, 'Matutino'),
(12, '03AJ2L', 'Segundo', 2, 'Vespertino'),
(13, '03AE2M', 'Segundo', 1, 'Matutino'),
(14, '03AE2N', 'Segundo', 1, 'Vespertino'),
(15, '03U4A', 'Cuarto', 4, 'Matutino'),
(16, '03U4B', 'Cuarto', 4, 'Vespertino'),
(17, '03U4C', 'Cuarto', 4, 'Vespertino'),
(18, '03V4D', 'Cuarto', 3, 'Matutino'),
(19, '03V4E', 'Cuarto', 3, 'Matutino'),
(20, '03V4F', 'Cuarto', 3, 'Vespertino'),
(21, '03AL4G', 'Cuarto', 5, 'Matutino'),
(22, '03AL4H', 'Cuarto', 5, 'Vespertino'),
(23, '03AL4I', 'Cuarto', 5, 'Vespertino'),
(24, '03AJ4J', 'Cuarto', 2, 'Matutino'),
(25, '03AJ4K', 'Cuarto', 2, 'Matutino'),
(26, '03AJ4L', 'Cuarto', 2, 'Vespertino'),
(27, '03AE4M', 'Cuarto', 1, 'Matutino'),
(28, '03AE4N', 'Cuarto', 1, 'Vespertino'),
(29, '03U6A', 'Sexto', 4, 'Matutino'),
(30, '03U6B', 'Sexto', 4, 'Matutino'),
(31, '03U6C', 'Sexto', 4, 'Vespertino'),
(32, '03U6D', 'Sexto', 4, 'Vespertino'),
(33, '03V6E', 'Sexto', 3, 'Matutino'),
(34, '03V6F', 'Sexto', 3, 'Vespertino'),
(35, '03AL6G', 'Sexto', 5, 'Matutino'),
(36, '03AL6H', 'Sexto', 5, 'Vespertino'),
(37, '03AJ6I', 'Sexto', 2, 'Matutino'),
(38, '03AJ6J', 'Sexto', 2, 'Matutino'),
(39, '03AJ6K', 'Sexto', 2, 'Vespertino'),
(40, '03AJ6L', 'Sexto', 2, 'Vespertino'),
(41, '03AE6M', 'Sexto', 1, 'Matutino'),
(42, '03AE6N', 'Sexto', 1, 'Vespertino');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horarios`
--

CREATE TABLE `horarios` (
  `Id_Horario` int(10) UNSIGNED NOT NULL,
  `Id_Usuario` int(10) UNSIGNED NOT NULL,
  `Id_Grupo` smallint(5) UNSIGNED NOT NULL,
  `Id_Materia` smallint(5) UNSIGNED NOT NULL,
  `Dia_Semana` enum('Lunes','Martes','Miercoles','Jueves','Viernes') NOT NULL,
  `Hora_Inicio` time NOT NULL,
  `Hora_Fin` time NOT NULL,
  `Id_Aula` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `importaciones`
--

CREATE TABLE `importaciones` (
  `id_importacion` int(10) UNSIGNED NOT NULL,
  `id_grupo` smallint(5) UNSIGNED NOT NULL,
  `periodo` varchar(35) NOT NULL,
  `archivo` varchar(255) DEFAULT NULL,
  `importado_por` int(10) UNSIGNED DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `Id_Materia` smallint(5) UNSIGNED NOT NULL,
  `Nombre` varchar(200) NOT NULL,
  `Semestre` tinyint(3) UNSIGNED NOT NULL,
  `Id_Carrera` smallint(5) UNSIGNED NOT NULL,
  `Periodo` varchar(35) NOT NULL,
  `Tipo` enum('basica','optativa','modulo','submodulo') NOT NULL DEFAULT 'basica'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `niveles_alerta`
--

CREATE TABLE `niveles_alerta` (
  `Id_Nivel` tinyint(3) UNSIGNED NOT NULL,
  `Nombre` enum('Verde','Amarillo','Rojo') NOT NULL,
  `Color_Hex` char(7) NOT NULL,
  `Min_Reprobadas` tinyint(3) UNSIGNED NOT NULL,
  `Max_Reprobados` tinyint(3) UNSIGNED DEFAULT NULL,
  `Descripcion` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `niveles_alerta`
--

INSERT INTO `niveles_alerta` (`Id_Nivel`, `Nombre`, `Color_Hex`, `Min_Reprobadas`, `Max_Reprobados`, `Descripcion`) VALUES
(1, 'Verde', '#28a745', 0, 0, 'Alumno al corriente, sin materias reprobadas'),
(2, 'Amarillo', '#ffc107', 1, 2, 'En riesgo: 1 o 2 materias reprobadas'),
(3, 'Rojo', '#dc3545', 3, NULL, 'Critico: 3 o mas materias reprobadas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `Id_Notificacion` int(10) UNSIGNED NOT NULL,
  `Matricula` varchar(20) NOT NULL,
  `Destinatario` varchar(150) NOT NULL,
  `Asunto` varchar(255) NOT NULL,
  `Cuerpo` text NOT NULL,
  `Fecha_Enviado` datetime NOT NULL DEFAULT current_timestamp(),
  `Estado` enum('Enviado','Error') NOT NULL DEFAULT 'Enviado',
  `Id_Alerta` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `observaciones`
--

CREATE TABLE `observaciones` (
  `Id_Observacion` int(10) UNSIGNED NOT NULL,
  `Matricula` varchar(20) NOT NULL,
  `Id_Usuario` int(10) UNSIGNED NOT NULL,
  `Comentario` text NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `padre_alumno`
--

CREATE TABLE `padre_alumno` (
  `Id_Padre_Alumno` int(10) UNSIGNED NOT NULL,
  `Id_Usuario` int(10) UNSIGNED NOT NULL,
  `Matricula` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `Id_Rol` tinyint(3) UNSIGNED NOT NULL,
  `Nombre` enum('Administrador','Docente','Tutor','Padre','Alumno') NOT NULL,
  `Descripcion` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`Id_Rol`, `Nombre`, `Descripcion`) VALUES
(1, 'Administrador', 'Administrador del sistema'),
(2, 'Docente', 'Docente de la Institución'),
(3, 'Tutor', 'Tutor académico'),
(4, 'Alumno', 'Alumno del Plantel');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tutor_grupo`
--

CREATE TABLE `tutor_grupo` (
  `Id_Tutor_Grupo` int(10) UNSIGNED NOT NULL,
  `Id_Usuario` int(10) UNSIGNED NOT NULL,
  `Id_Grupo` smallint(5) UNSIGNED NOT NULL,
  `Periodo` varchar(35) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `Id_Usuario` int(10) UNSIGNED NOT NULL,
  `Id_Rol` tinyint(3) UNSIGNED NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Apellidos` varchar(150) NOT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Password` varchar(255) NOT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT 1,
  `Fecha_Creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `Telefono` varchar(20) DEFAULT NULL,
  `reset_token` varchar(100) DEFAULT NULL,
  `reset_expiracion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD PRIMARY KEY (`Id_Alerta`),
  ADD UNIQUE KEY `UQ_Alerta_Periodo` (`Matricula`,`Periodo`),
  ADD KEY `FK_Alerta_Nivel` (`Id_Nivel`);

--
-- Indices de la tabla `alumnos`
--
ALTER TABLE `alumnos`
  ADD PRIMARY KEY (`Matricula`),
  ADD KEY `FK_Alumno_Grupo` (`Id_Grupo`),
  ADD KEY `FK_Alumno_Usuario` (`Id_Usuario`);

--
-- Indices de la tabla `aulas`
--
ALTER TABLE `aulas`
  ADD PRIMARY KEY (`Id_Aula`);

--
-- Indices de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  ADD PRIMARY KEY (`Id_Calificacion`),
  ADD UNIQUE KEY `UQ_Alumno_Materia_Periodo` (`Matricula`,`Id_Materia`,`Periodo`),
  ADD KEY `FK_Cal_Materia` (`Id_Materia`),
  ADD KEY `FK_Cal_Importacion` (`Id_Importacion`);

--
-- Indices de la tabla `carreras`
--
ALTER TABLE `carreras`
  ADD PRIMARY KEY (`Id_Carrera`),
  ADD UNIQUE KEY `Clave` (`Clave`);

--
-- Indices de la tabla `grupos`
--
ALTER TABLE `grupos`
  ADD PRIMARY KEY (`Id_Grupo`),
  ADD UNIQUE KEY `UQ_Grupo_Carrera_Semestre` (`Nombre`,`Id_Carrera`,`Semestre`),
  ADD KEY `FK_Grupo_Carrera` (`Id_Carrera`);

--
-- Indices de la tabla `horarios`
--
ALTER TABLE `horarios`
  ADD PRIMARY KEY (`Id_Horario`),
  ADD KEY `FK_Horario_Usuario` (`Id_Usuario`),
  ADD KEY `FK_Horario_Grupo` (`Id_Grupo`),
  ADD KEY `FK_Horario_Materia` (`Id_Materia`),
  ADD KEY `FK_Horario_Aula` (`Id_Aula`);

--
-- Indices de la tabla `importaciones`
--
ALTER TABLE `importaciones`
  ADD PRIMARY KEY (`id_importacion`),
  ADD KEY `fk_importacion_grupo` (`id_grupo`),
  ADD KEY `fk_importacion_usuario` (`importado_por`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`Id_Materia`),
  ADD UNIQUE KEY `UQ_Materia_Carrera_Periodo` (`Nombre`,`Id_Carrera`,`Periodo`),
  ADD KEY `FK_Materia_Carrera` (`Id_Carrera`);

--
-- Indices de la tabla `niveles_alerta`
--
ALTER TABLE `niveles_alerta`
  ADD PRIMARY KEY (`Id_Nivel`),
  ADD UNIQUE KEY `Nombre` (`Nombre`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`Id_Notificacion`),
  ADD KEY `FK_Notificacion_Alumno` (`Matricula`),
  ADD KEY `FK_Notificacion_Alerta` (`Id_Alerta`);

--
-- Indices de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD PRIMARY KEY (`Id_Observacion`),
  ADD KEY `FK_Observacion_Alumno` (`Matricula`),
  ADD KEY `FK_Observacion_Usuario` (`Id_Usuario`);

--
-- Indices de la tabla `padre_alumno`
--
ALTER TABLE `padre_alumno`
  ADD PRIMARY KEY (`Id_Padre_Alumno`),
  ADD UNIQUE KEY `UQ_Padre_Alumno` (`Id_Usuario`,`Matricula`),
  ADD KEY `FK_PadreAlumno_Alumno` (`Matricula`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`Id_Rol`),
  ADD UNIQUE KEY `Nombre` (`Nombre`);

--
-- Indices de la tabla `tutor_grupo`
--
ALTER TABLE `tutor_grupo`
  ADD PRIMARY KEY (`Id_Tutor_Grupo`),
  ADD UNIQUE KEY `UQ_Tutor_Grupo_Periodo` (`Id_Usuario`,`Id_Grupo`,`Periodo`),
  ADD KEY `FK_TutorGrupo_Grupo` (`Id_Grupo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`Id_Usuario`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `FK_Usuario_Rol` (`Id_Rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alertas`
--
ALTER TABLE `alertas`
  MODIFY `Id_Alerta` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `aulas`
--
ALTER TABLE `aulas`
  MODIFY `Id_Aula` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  MODIFY `Id_Calificacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `carreras`
--
ALTER TABLE `carreras`
  MODIFY `Id_Carrera` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `Id_Grupo` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de la tabla `horarios`
--
ALTER TABLE `horarios`
  MODIFY `Id_Horario` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `importaciones`
--
ALTER TABLE `importaciones`
  MODIFY `id_importacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `Id_Materia` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tutor_grupo`
--
ALTER TABLE `tutor_grupo`
  MODIFY `Id_Tutor_Grupo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `Id_Usuario` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
