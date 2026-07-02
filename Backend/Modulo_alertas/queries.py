def consultar_alumnos_por_alerta():
    return """
    SELECT
        a.Matricula,
        a.Nombre,
        a.Apellidos,
        a.Email,
        g.Nombre AS Grupo,
        c.Nombre AS Carrera,
        al.PAC,
        al.Materias_Reprobadas,
        al.Fecha_Calculo,
        na.Id_Nivel,
        na.Nombre AS Nivel_Alerta,
        na.Color_Hex,
        u_tutor.Nombre AS Nombre_Tutor,
        u_tutor.Apellidos AS Apellidos_Tutor,
        u_tutor.Email AS Correo_Tutor,
        u_doc.Nombre AS Nombre_Docente,
        u_doc.Apellidos AS Apellidos_Docente,
        u_doc.Email AS Correo_Docente
    FROM alertas al
    INNER JOIN alumnos a ON al.Matricula = a.Matricula
    INNER JOIN grupos g ON a.Id_Grupo = g.Id_Grupo
    INNER JOIN carreras c ON g.Id_Carrera = c.Id_Carrera
    INNER JOIN niveles_alerta na ON al.Id_Nivel = na.Id_Nivel
    LEFT JOIN padre_alumno pa ON pa.Matricula = a.Matricula
    LEFT JOIN usuarios u_tutor ON pa.Id_Usuario = u_tutor.Id_Usuario AND u_tutor.Id_Rol = 4
    LEFT JOIN tutor_grupo tg ON tg.Id_Grupo = g.Id_Grupo
    LEFT JOIN usuarios u_doc ON tg.Id_Usuario = u_doc.Id_Usuario AND u_doc.Id_Rol = 2
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
        COUNT(DISTINCT pa.Id_Usuario) AS Total_Tutores,
        COUNT(DISTINCT tg.Id_Usuario) AS Total_Docentes
    FROM niveles_alerta na
    LEFT JOIN alertas al ON al.Id_Nivel = na.Id_Nivel
    LEFT JOIN alumnos a ON al.Matricula = a.Matricula
    LEFT JOIN usuarios u_alumno ON u_alumno.Id_Usuario = a.Id_Usuario AND u_alumno.Id_Rol = 5
    LEFT JOIN padre_alumno pa ON pa.Matricula = a.Matricula
    LEFT JOIN usuarios u_tutor ON u_tutor.Id_Usuario = pa.Id_Usuario AND u_tutor.Id_Rol = 4
    LEFT JOIN tutor_grupo tg ON tg.Id_Grupo = a.Id_Grupo
    LEFT JOIN usuarios u_doc ON u_doc.Id_Usuario = tg.Id_Usuario AND u_doc.Id_Rol = 2
    GROUP BY na.Id_Nivel, na.Nombre
    ORDER BY na.Id_Nivel;
    """