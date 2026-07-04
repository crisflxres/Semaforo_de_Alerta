-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-07-2026 a las 05:54:59
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
(4, 'Padre', 'Padre o Tutor familiar'),
(5, 'Alumno', 'Alumno del Plantel');

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
  `Telefono` varchar(20) DEFAULT NULL
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
  MODIFY `Id_Aula` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `calificaciones`
--
ALTER TABLE `calificaciones`
  MODIFY `Id_Calificacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `carreras`
--
ALTER TABLE `carreras`
  MODIFY `Id_Carrera` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `grupos`
--
ALTER TABLE `grupos`
  MODIFY `Id_Grupo` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT;

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
