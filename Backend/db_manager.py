from importador_TACA import leer_taca, importar_alumnos, importar_materias, importar_calificaciones
from conexion_db import obtener_conexion
import bcrypt

def insertar_materia(cursor, materia, id_carrera, semestre):
    sql = "INSERT IGNORE INTO materias (Nombre, Semestre, Id_Carrera, Tipo) VALUES (%s, %s, %s, %s)"
    valores = (
        materia["nombre"],
        semestre,
        id_carrera,
        materia["tipo"]
    )
    cursor.execute(sql, valores)
    cursor.execute("SELECT Id_Materia FROM materias WHERE Nombre = %s AND Id_Carrera = %s", (materia["nombre"], id_carrera))
    resultado = cursor.fetchone()
    return resultado[0]

def normalizar_matricula(matricula):
    """Quita el prefijo 'M' si existe, para que coincida con el formato
    guardado en alumnos.Matricula (sin la M)."""
    matricula = str(matricula).strip()
    if matricula.upper().startswith("M") and matricula[1:].isdigit():
        matricula = matricula[1:]
    return matricula

def insertar_alumnos_usuarios(cursor, alumno):
    # Si el usuario ya existe (misma matrícula como Email), no lo volvemos a crear
    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (alumno["matricula"],))
    existente = cursor.fetchone()
    if existente:
        return existente[0]

    password = bcrypt.hashpw(alumno["matricula"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) VALUES (%s, %s, %s, %s, %s)"
    apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
    valores = (
        4,
        alumno["nombre(s)"],
        apellidos,
        alumno["matricula"],
        password
    )
    cursor.execute(sql, valores)
    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (alumno["matricula"],))
    resultado = cursor.fetchone()
    return resultado[0]

def insertar_alumnos(cursor, alumno, id_grupo, id_usuario):
    sql = """INSERT INTO alumnos (Matricula, Nombre, Apellidos, Id_Grupo, id_usuario, PAC)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE PAC = VALUES(PAC)"""
    apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
    valores = (
        alumno["matricula"],
        alumno["nombre(s)"],
        apellidos,
        id_grupo,
        id_usuario,
        alumno["PAC"],
    )
    cursor.execute(sql, valores)
    cursor.execute("SELECT Matricula FROM alumnos WHERE Matricula = %s", (alumno["matricula"],))
    resultado = cursor.fetchone()
    return resultado[0]

def insertar_importacion(cursor, id_grupo, archivo, importador_por):
    sql = "INSERT INTO importaciones (Id_grupo, archivo, importado_por) VALUES (%s, %s, %s)"
    valores = (
        id_grupo,
        archivo,
        importador_por,
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def insertar_calificaciones(cursor, calificacion, id_materia, id_importacion, aprobado):
    sql = "INSERT INTO calificaciones (Matricula, Id_Materia, Id_Importacion, P1, P2, P3, PR, Aprobado) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE P1 = VALUES(P1), P2 = VALUES(P2), P3 = VALUES(P3), PR = VALUES(PR), Aprobado = VALUES(Aprobado)"
    valores = (
        calificacion["matricula"],
        id_materia,
        id_importacion,
        calificacion["P1"],
        calificacion["P2"],
        calificacion["P3"],
        calificacion["PR"],
        aprobado
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def calcular_id_nivel(cursor, materias_reprobadas):
    cursor.execute("""
        SELECT Id_Nivel FROM niveles_alerta
        WHERE Min_Reprobadas <= %s
        AND (Max_Reprobados IS NULL OR Max_Reprobados >= %s)
        ORDER BY Min_Reprobadas DESC
        LIMIT 1
    """, (materias_reprobadas, materias_reprobadas))
    resultado = cursor.fetchone()
    return resultado[0] if resultado else None

def insertar_alerta(cursor, matricula, materias_reprobadas, pac):
    id_nivel = calcular_id_nivel(cursor, materias_reprobadas)
    sql = """INSERT INTO alertas (Matricula, Id_Nivel, Materias_Reprobadas, PAC, Fecha_Calculo)
            VALUES (%s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE Id_Nivel = VALUES(Id_Nivel), Materias_Reprobadas = VALUES(Materias_Reprobadas),
                                    PAC = VALUES(PAC), Fecha_Calculo = NOW()"""
    valores = (matricula, id_nivel, materias_reprobadas, pac)
    cursor.execute(sql, valores)
    return cursor.lastrowid

def actualizar_correo(cursor, contacto):
    matricula = normalizar_matricula(contacto["matricula"])
    sql = "UPDATE alumnos SET Email = %s WHERE Matricula = %s"
    valores = (contacto["correo"], matricula)
    cursor.execute(sql, valores)
    if cursor.rowcount == 0:
        print(f"[AVISO] No se actualizó correo: matrícula '{matricula}' no encontrada en alumnos")
    return cursor.rowcount

def actualizar_fotos(cursor, matricula, contenido_bytes):
    matricula = normalizar_matricula(matricula)
    sql = "UPDATE alumnos SET Foto = %s WHERE Matricula = %s"
    valores = (contenido_bytes, matricula)
    cursor.execute(sql, valores)
    if cursor.rowcount == 0:
        print(f"[AVISO] No se actualizó foto: matrícula '{matricula}' no encontrada en alumnos")
    return cursor.rowcount

def insertar_tutores_usuarios(cursor, tutor):
    partes = tutor["tutor"].split(" ")
    nombre = " ".join(partes[:2])
    apellidos = " ".join(partes[2:])

    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Nombre = %s AND Apellidos = %s LIMIT 1", (nombre, apellidos))
    resultado = cursor.fetchone()
    if resultado:
        return resultado[0]
    password = bcrypt.hashpw(tutor["tutor"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Password) VALUES (%s, %s, %s, %s)"
    valores = (
        3,
        nombre,
        apellidos,
        password
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def obtener_mapa_grupos(cursor):
    cursor.execute("SELECT Id_Grupo, Nombre FROM grupos")
    return {nombre: id_grupo for (id_grupo, nombre) in cursor.fetchall()}

def insertar_tutor_grupo(cursor, id_usuario, id_grupo):
    sql = "INSERT IGNORE INTO tutor_grupo (Id_Usuario, Id_Grupo) VALUES (%s, %s)"
    valores = (
        id_usuario,
        id_grupo
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid


def _cargar_matriculas_existentes(cursor, matriculas):
    """1 sola query: de un lote de matrículas, cuáles ya existen en alumnos."""
    if not matriculas:
        return set()
    placeholders = ",".join(["%s"] * len(matriculas))
    cursor.execute(f"SELECT Matricula FROM alumnos WHERE Matricula IN ({placeholders})", tuple(matriculas))
    return {fila[0] for fila in cursor.fetchall()}


def actualizar_correos_bulk(cursor, contactos):
    """Igual que actualizar_correo pero para un lote completo: 1 query de
    verificación + 1 UPDATE en lote, en vez de 1 UPDATE por contacto."""
    normalizados = [(normalizar_matricula(c["matricula"]), c["correo"]) for c in contactos]
    matriculas = [m for m, _ in normalizados]
    existentes = _cargar_matriculas_existentes(cursor, matriculas)

    valores = [(correo, matricula) for matricula, correo in normalizados if matricula in existentes]
    if valores:
        cursor.executemany("UPDATE alumnos SET Email = %s WHERE Matricula = %s", valores)

    for matricula in set(matriculas) - existentes:
        print(f"[AVISO] No se actualizó correo: matrícula '{matricula}' no encontrada en alumnos")

    return len(valores)


def actualizar_fotos_bulk(cursor, fotos):
    """fotos: lista de dicts {'matricula': ..., 'contenido_bytes': ...} ya comprimidos.
    Igual que actualizar_fotos pero para un lote completo."""
    normalizados = [(normalizar_matricula(f["matricula"]), f["contenido_bytes"]) for f in fotos]
    matriculas = [m for m, _ in normalizados]
    existentes = _cargar_matriculas_existentes(cursor, matriculas)

    valores = [(contenido, matricula) for matricula, contenido in normalizados if matricula in existentes]
    if valores:
        cursor.executemany("UPDATE alumnos SET Foto = %s WHERE Matricula = %s", valores)

    for matricula in set(matriculas) - existentes:
        print(f"[AVISO] No se actualizó foto: matrícula '{matricula}' no encontrada en alumnos")

    return len(valores)


def _cargar_materias_existentes(cursor, id_carrera):
    """1 sola query: trae todas las materias ya registradas para esta carrera."""
    cursor.execute("SELECT Nombre, Id_Materia FROM materias WHERE Id_Carrera = %s", (id_carrera,))
    return {nombre: id_materia for (nombre, id_materia) in cursor.fetchall()}


def _asegurar_materias_bulk(cursor, materias, id_carrera, semestre):
    """Inserta en un solo lote las materias que aún no existen y regresa
    el mapa completo {nombre: Id_Materia} (existentes + nuevas)."""
    mapa = _cargar_materias_existentes(cursor, id_carrera)

    faltantes = [m for m in materias if m["nombre"] not in mapa]
    if faltantes:
        valores = [(m["nombre"], semestre, id_carrera, m["tipo"]) for m in faltantes]
        cursor.executemany(
            "INSERT IGNORE INTO materias (Nombre, Semestre, Id_Carrera, Tipo) VALUES (%s, %s, %s, %s)",
            valores
        )
        # Volvemos a cargar una vez más para obtener los Id_Materia recién generados
        mapa = _cargar_materias_existentes(cursor, id_carrera)

    return mapa


def _cargar_usuarios_existentes(cursor, matriculas):
    """1 sola query: trae los Id_Usuario ya existentes para un lote de matrículas (Email)."""
    if not matriculas:
        return {}
    placeholders = ",".join(["%s"] * len(matriculas))
    cursor.execute(
        f"SELECT Email, Id_Usuario FROM usuarios WHERE Email IN ({placeholders})",
        tuple(matriculas)
    )
    return {email: id_usuario for (email, id_usuario) in cursor.fetchall()}


def _asegurar_usuarios_alumnos_bulk(cursor, alumnos):
    """Inserta en un solo lote los usuarios (login) de los alumnos que aún no existen
    y regresa el mapa completo {matricula: Id_Usuario}."""
    matriculas = [a["matricula"] for a in alumnos]
    mapa = _cargar_usuarios_existentes(cursor, matriculas)

    faltantes = [a for a in alumnos if a["matricula"] not in mapa]
    if faltantes:
        valores = []
        for alumno in faltantes:
            password = bcrypt.hashpw(alumno["matricula"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
            valores.append((5, alumno["nombre(s)"], apellidos, alumno["matricula"], password))

        cursor.executemany(
            "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) VALUES (%s, %s, %s, %s, %s)",
            valores
        )
        mapa = _cargar_usuarios_existentes(cursor, matriculas)

    return mapa


def _insertar_alumnos_bulk(cursor, alumnos, id_grupo, mapa_usuarios):
    valores = []
    for alumno in alumnos:
        apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
        valores.append((
            alumno["matricula"],
            alumno["nombre(s)"],
            apellidos,
            id_grupo,
            mapa_usuarios[alumno["matricula"]],
            alumno["PAC"],
        ))
    cursor.executemany(
        """INSERT INTO alumnos (Matricula, Nombre, Apellidos, Id_Grupo, id_usuario, PAC)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE PAC = VALUES(PAC)""",
        valores
    )


def _insertar_calificaciones_bulk(cursor, calificaciones, mapa_materias, id_importacion):
    valores = [
        (
            c["matricula"],
            mapa_materias[c["materia"]],
            id_importacion,
            c["P1"], c["P2"], c["P3"], c["PR"],
            c["aprobado"],
        )
        for c in calificaciones
    ]
    cursor.executemany(
        """INSERT INTO calificaciones (Matricula, Id_Materia, Id_Importacion, P1, P2, P3, PR, Aprobado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE P1 = VALUES(P1), P2 = VALUES(P2), P3 = VALUES(P3),
                                    PR = VALUES(PR), Aprobado = VALUES(Aprobado)""",
        valores
    )


def _cargar_niveles_alerta(cursor):
    """1 sola query: la tabla niveles_alerta es chica (un puñado de filas),
    así que la traemos completa y calculamos el nivel de cada alumno en Python."""
    cursor.execute("SELECT Min_Reprobadas, Max_Reprobados, Id_Nivel FROM niveles_alerta ORDER BY Min_Reprobadas DESC")
    return cursor.fetchall()


def _encontrar_nivel(niveles, materias_reprobadas):
    for min_reprobadas, max_reprobados, id_nivel in niveles:
        if min_reprobadas <= materias_reprobadas and (max_reprobados is None or max_reprobados >= materias_reprobadas):
            return id_nivel
    return None


def _insertar_alertas_bulk(cursor, alumnos, reprobadas_por_alumno, niveles):
    valores = []
    for alumno in alumnos:
        matricula = alumno["matricula"]
        reprobadas = reprobadas_por_alumno.get(matricula, 0)
        id_nivel = _encontrar_nivel(niveles, reprobadas)
        valores.append((matricula, id_nivel, reprobadas, alumno["PAC"]))

    cursor.executemany(
        """INSERT INTO alertas (Matricula, Id_Nivel, Materias_Reprobadas, PAC, Fecha_Calculo)
            VALUES (%s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE Id_Nivel = VALUES(Id_Nivel), Materias_Reprobadas = VALUES(Materias_Reprobadas),
                                    PAC = VALUES(PAC), Fecha_Calculo = NOW()""",
        valores
    )


def importar_taca_completo(ruta_archivo, nombre_archivo, id_grupo, id_carrera,
                            semestre, importado_por=None):
    """
    Recibe la ruta de un archivo TACA ya guardado en disco (temporal),
    lo procesa completo e inserta materias, alumnos y calificaciones.
    Detecta automáticamente si el archivo es HTML disfrazado (.xls) o
    un Excel binario real (.xlsx).
    Devuelve un resumen para mostrar en el Historial de Importaciones.
    """
    hoja = leer_taca(ruta_archivo)

    materias = importar_materias(hoja)
    alumnos = importar_alumnos(hoja)
    calificaciones = importar_calificaciones(hoja, materias)

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    try:
        # Materias: 1-2 queries + 1 insert en lote (antes: 2 queries POR materia)
        mapa_materias = _asegurar_materias_bulk(cursor, materias, id_carrera, semestre)

        # Usuarios/alumnos: 1-2 queries + 2 inserts en lote (antes: 3 queries POR alumno)
        mapa_usuarios = _asegurar_usuarios_alumnos_bulk(cursor, alumnos)
        _insertar_alumnos_bulk(cursor, alumnos, id_grupo, mapa_usuarios)

        id_importacion = insertar_importacion(cursor, id_grupo, nombre_archivo, importado_por)

        # Calificaciones: 1 insert en lote (antes: 1 query POR calificación)
        _insertar_calificaciones_bulk(cursor, calificaciones, mapa_materias, id_importacion)

        # Calculamos materias reprobadas por alumno y guardamos su alerta (PAC + nivel)
        reprobadas_por_alumno = {}
        for calificacion in calificaciones:
            if calificacion["aprobado"] == 0:
                matricula = calificacion["matricula"]
                reprobadas_por_alumno[matricula] = reprobadas_por_alumno.get(matricula, 0) + 1

        # Alertas: 1 query (niveles_alerta, tabla chica) + 1 insert en lote
        # (antes: 1 query de nivel + 1 insert POR alumno)
        niveles = _cargar_niveles_alerta(cursor)
        _insertar_alertas_bulk(cursor, alumnos, reprobadas_por_alumno, niveles)

        conexion.commit()
        return {
            "id_importacion": id_importacion,
            "alumnos": len(alumnos),
            "materias": len(materias),
            "calificaciones": len(calificaciones),
        }
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()