def consultar_alumnos_por_alerta():
    return """
    SELECT
        a.Matricula,
        a.Nombre,
        a.Apellidos,
        a.Email,
        g.Id_Grupo,
        g.Nombre AS Grupo,
        c.Nombre AS Carrera,
        al.PAC,
        al.Materias_Reprobadas,
        al.Fecha_Calculo,
        na.Id_Nivel,
        na.Nombre AS Nivel_Alerta,
        na.Color_Hex,
        na.Descripcion AS Descripcion_Nivel,
        pa.Nombre AS Nombre_Tutor,
        pa.Telefono AS Telefono_Tutor,
        pa.Email AS Correo_Tutor,
        u_doc.Nombre AS Nombre_Docente,
        u_doc.Apellidos AS Apellidos_Docente,
        u_doc.Email AS Correo_Docente
    FROM alertas al
    INNER JOIN alumnos a ON al.Matricula = a.Matricula
    INNER JOIN grupos g ON a.Id_Grupo = g.Id_Grupo
    INNER JOIN carreras c ON g.Id_Carrera = c.Id_Carrera
    INNER JOIN niveles_alerta na ON al.Id_Nivel = na.Id_Nivel
    LEFT JOIN padre_alumno pa ON pa.Matricula = a.Matricula
    LEFT JOIN tutor_grupo tg ON tg.Id_Grupo = g.Id_Grupo
    LEFT JOIN usuarios u_doc ON tg.Id_Usuario = u_doc.Id_Usuario AND u_doc.Id_Rol = 2
    WHERE na.Nombre = %s
    ORDER BY g.Nombre, a.Apellidos, a.Nombre;
    """


def consultar_alumnos_por_alerta_docente():
    """
    Igual que consultar_alumnos_por_alerta(), pero el docente sale de la
    tabla `horarios` (docente que realmente da clase al grupo), no de
    `tutor_grupo`. Un mismo alumno puede salir repetido una vez por cada
    materia/horario distinto que tenga su grupo -- es intencional, porque
    cada fila representa "este alumno + este docente que le da clase",
    y así cada docente recibe su propio resumen con sus propios alumnos.
    Úsala SOLO para el flujo de Docentes (docentes_services.py), nunca
    para el conteo de Alumnos/Tutores.
    """
    return """
    SELECT DISTINCT
        a.Matricula,
        a.Nombre,
        a.Apellidos,
        a.Email,
        g.Id_Grupo,
        g.Nombre AS Grupo,
        c.Nombre AS Carrera,
        al.PAC,
        al.Materias_Reprobadas,
        al.Fecha_Calculo,
        na.Id_Nivel,
        na.Nombre AS Nivel_Alerta,
        na.Color_Hex,
        na.Descripcion AS Descripcion_Nivel,
        u_doc.Nombre AS Nombre_Docente,
        u_doc.Apellidos AS Apellidos_Docente,
        u_doc.Email AS Correo_Docente
    FROM alertas al
    INNER JOIN alumnos a ON al.Matricula = a.Matricula
    INNER JOIN grupos g ON a.Id_Grupo = g.Id_Grupo
    INNER JOIN carreras c ON g.Id_Carrera = c.Id_Carrera
    INNER JOIN niveles_alerta na ON al.Id_Nivel = na.Id_Nivel
    INNER JOIN horarios h ON h.Id_Grupo = g.Id_Grupo
    INNER JOIN usuarios u_doc ON h.Id_Usuario = u_doc.Id_Usuario AND u_doc.Id_Rol = 2
    WHERE na.Nombre = %s
    ORDER BY g.Nombre, a.Apellidos, a.Nombre;
    """


def consultar_grupos():
    return """
    SELECT Id_Grupo, Nombre
    FROM grupos
    ORDER BY Nombre;
    """


def consultar_resumen_destinatarios():
    return """
    SELECT
        na.Nombre AS Nivel_Alerta,
        COUNT(DISTINCT a.Matricula) AS Total_Alumnos,
        COUNT(DISTINCT pa.Id_Padre_Alumno) AS Total_Tutores,
        COUNT(DISTINCT h.Id_Usuario) AS Total_Docentes
    FROM niveles_alerta na
    LEFT JOIN alertas al ON al.Id_Nivel = na.Id_Nivel
    LEFT JOIN alumnos a ON al.Matricula = a.Matricula
    LEFT JOIN usuarios u_alumno ON u_alumno.Id_Usuario = a.Id_Usuario AND u_alumno.Id_Rol = 4
    LEFT JOIN padre_alumno pa ON pa.Matricula = a.Matricula
    LEFT JOIN horarios h ON h.Id_Grupo = a.Id_Grupo
    LEFT JOIN usuarios u_doc ON u_doc.Id_Usuario = h.Id_Usuario AND u_doc.Id_Rol = 2
    GROUP BY na.Id_Nivel, na.Nombre
    ORDER BY na.Id_Nivel;
    """

def consultar_alertas_por_alumno():
    return """
    SELECT
        al.Id_Alerta,
        a.Matricula,
        a.Nombre,
        a.Apellidos,
        na.Nombre AS Nivel_Alerta,
        na.Color_Hex,
        na.Descripcion AS Descripcion_Nivel,
        al.PAC,
        al.Materias_Reprobadas,
        DATE_FORMAT(n.Fecha_Enviado, '%d/%m/%Y') AS fecha,
        DATE_FORMAT(n.Fecha_Enviado, '%H:%i') AS hora,
        c.Nombre AS Carrera,
        g.Nombre AS Grupo
    FROM alertas al
    INNER JOIN alumnos a ON al.Matricula = a.Matricula
    INNER JOIN grupos g ON a.Id_Grupo = g.Id_Grupo
    INNER JOIN carreras c ON g.Id_Carrera = c.Id_Carrera
    INNER JOIN niveles_alerta na ON al.Id_Nivel = na.Id_Nivel
    LEFT JOIN notificaciones n ON n.Matricula = a.Matricula
    WHERE a.Matricula = %s
    {filtro_nivel}
    {filtro_fecha}
    ORDER BY n.Fecha_Enviado DESC;
    """