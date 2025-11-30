import uuid
from email_utils import enviar_notificacion
from flask import Flask, request, jsonify
from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import numpy as np
import re
from flask_cors import CORS
import os
from datetime import datetime
import psycopg2
import json
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Variables de entorno definidas en env 

DB_HOST = os.getenv("DB_HOST") 
DB_NAME = os.getenv("POSTGRES_DB") 
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_PORT = os.getenv("DB_PORT", "5432")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        print("Conexión exitosa a PostgreSQL .")
        return conn
    except Exception as e:
        print(f"error: No se pudo conectar a la base de datos: {e}")
        return None

db_conn = get_db_connection()

# Cargar modelos
model = YOLO("best.pt")
ocr = PaddleOCR(use_angle_cls=True, lang='en')

blacklist = ["grupo", "premie", "premier", "mx", "com", "agency", "automotriz", "auto", "motors", "dealer", "deals", "online", "ventas", "venta", "motor", "motorsport", "premler", "romes", "nissan", "sinaloa"]
plate_pattern = r'^[A-Z0-9]{5,8}$'


@app.route("/detectar-placa", methods=["POST"])
def detectar_placa():
    try:
        # Validar imagen
        if "image" not in request.files:
            return jsonify({"error": "No se envió la imagen"}), 400

        file = request.files["image"]
        img_bytes = file.read()

        # Convertir a OpenCV
        npimg = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Imagen inválida"}), 400

        # ---------- PROCESAR ANTES DE GUARDAR ----------
        results = model(image)
        placas_detectadas = []

        for result in results:
            index_plates = (result.boxes.cls == 0).nonzero(as_tuple=True)[0]

            for idx in index_plates:
                conf = result.boxes.conf[idx].item()
                if conf > 0.5:

                    xyxy = result.boxes.xyxy[idx].squeeze().tolist()
                    x1, y1, x2, y2 = map(int, xyxy)

                    placa_recorte = image[max(0, y1-15):y2+15, max(0, x1-15):x2+15]

                    ocr_res = ocr.predict(cv2.cvtColor(placa_recorte, cv2.COLOR_BGR2RGB))
                    textos = ocr_res[0]["rec_texts"]

                    for texto in textos:
                        cleaned = re.sub(r'[^A-Za-z0-9]', '', texto).upper()

                        if len(cleaned) == 0:
                            continue
                        if any(b in cleaned.lower() for b in blacklist):
                            continue

                        if not re.match(plate_pattern, cleaned):
                            continue

                        placas_detectadas.append(cleaned)
        
        print("Placas detectadas:", placas_detectadas)

        # ---------- SI NO DETECTA, NO GUARDAR ----------
        if not placas_detectadas:
            return jsonify({
                "success": False,
                "message": "No se detectó ninguna placa."
            })

        return jsonify({
            "success": True,
            "placas": placas_detectadas
            # "imagen_guardada": filename
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/test", methods=["POST"])
def test():
    try:
        image_path = cv2.imread("img/IMG_0503.jpg")
        results = model(image_path)

        for result in results:
            index_plates = (result.boxes.cls == 0).nonzero(as_tuple=True)[0]

            for idx in index_plates:
                #OBTENER CONFIANZA DE LA CAJA
                conf = result.boxes.conf[idx].item()
                if conf > 0.5:
                    # OBTENER LAS COORDENADAS DE LA CAJA
                    xyxy = result.boxes.xyxy[idx].squeeze().tolist()
                    x1, y1 = int(xyxy[0]), int(xyxy[1])
                    x2, y2 = int(xyxy[2]), int(xyxy[3])

                    # RECORTAR LA IMAGEN DE LA PLACA
                    plate_image = image_path[y1-15:y2+15, x1-15:x2+15]

                    # REALIZAR OCR EN LA IMAGEN DE LA PLACA
                    result_ocr = ocr.predict(cv2.cvtColor(plate_image, cv2.COLOR_BGR2RGB))

                    # EXTRAER EL TEXTO RECONOCIDO
                    texts = result_ocr[0]["rec_texts"]
                    plate_pattern = r'^[A-Z0-9]{5,8}$'


                    for text in texts:
                        cleaned_text = re.sub(r'[^A-Za-z0-9]', '', text).upper()

                        # Ignorar textos vacíos
                        if len(cleaned_text) == 0:
                            continue

                        # Ignorar palabras en lista negra
                        if any(b in cleaned_text.lower() for b in blacklist):
                            continue

                        # Filtrar por patrón de placa
                        if not re.match(plate_pattern, cleaned_text):
                            continue

                        # Si pasa todos los filtros, esto sí es una placa real
                        # print("Detected Plate Text:", cleaned_text)

                        return jsonify({
                            "success": True,
                            "placas": cleaned_text,
                        })
            

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/create-incidence", methods=["POST"])
def create_incidence():
    try:
        id_infractor = request.form.get("id_infractor")
        correo_infractor = request.form.get("correo_infractor")
        nombre_infractor = request.form.get("nombre_infractor")
        apellidos_infractor = request.form.get("apellidos_infractor")
        placas = request.form.get("placas")
        descripcion = request.form.get("descripcion")
        lat = request.form.get("lat")
        lon = request.form.get("lng")
        fecha = request.form.get("fecha")

        imagen = request.files.get("imgPrincipal")
        evidencias = request.files.getlist("evidencias")

        cursor = db_conn.cursor()
        query = "SELECT id_vehiculo, id_usuario FROM vehiculos WHERE placa = %s;"
        cursor.execute(query, (placas,))
        vehiculo = cursor.fetchone()

        if not vehiculo:
            return jsonify({"error": "Vehículo no encontrado"}), 404
    
        id_vehiculo = vehiculo[0]
        id_usuario_reportado = vehiculo[1]

        foto_principal_path = None
        if imagen:
            filename = f"{uuid.uuid4()}.jpg"
            save_path = os.path.join(UPLOAD_FOLDER, filename)
            imagen.save(save_path)
            foto_principal_path = save_path

        rutas_evidencias = []
        for evidencia in evidencias:
            fname = f"{uuid.uuid4()}.jpg"
            path = os.path.join(UPLOAD_FOLDER, fname)
            evidencia.save(path)
            rutas_evidencias.append(path)

        # Guardar como JSON en PostgreSQL
        evidencias_json = json.dumps(rutas_evidencias)

        # INSERTAR INCIDENCIA

        query_incidencia = """
            INSERT INTO incidencias 
            (id_usuario, id_vehiculo, descripcion, latitud, longitud, fecha, fotoPrincipal, fotosEvidencia)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id_incidencia;
        """
        cursor.execute(query_incidencia, (
            id_infractor, id_vehiculo, descripcion, lat, lon, fecha,
            foto_principal_path, evidencias_json
        ))        
        id_incidencia = cursor.fetchone()[0]

        #OBTENER CORREO DEL USUARIO REPORTADO Y ENVIAR NOTIFICACION POR CORREO
        query_usuario = "SELECT email, nombre, apellidos FROM usuarios WHERE id_usuario = %s;"
        cursor.execute(query_usuario, (id_usuario_reportado,))
        usuario = cursor.fetchone()

        if usuario:
            email_reportado, nombre, apellidos = usuario

            mensaje = f"""
                <h2>Notificación de nueva incidencia</h2>
                <p>Hola <b>{nombre} {apellidos}</b>,</p>
                <p>Se ha registrado una nueva incidencia relacionada con tu vehículo con placas <b>{placas}</b>.</p>
                <p><b>Descripción:</b> {descripcion}</p>
                <p><b>Ubicación:</b> lat {lat}, lon {lon}</p>
                <p>Fecha: {fecha}</p>
            """

            enviado = enviar_notificacion(
                email_destino=email_reportado,
                asunto="Nueva incidencia registrada",
                mensaje=mensaje,
                img_principal=foto_principal_path,
                evidencias=rutas_evidencias
            )

            mensaje_infractor = f"""
                <h2>Notificación de incidencia registrada</h2>
                <p>Hola <b>{nombre_infractor} {apellidos_infractor}</b>,</p>
                <p>Se ha registrado una nueva incidencia relacionada con el vehículo de placas <b>{placas}</b>.</p>
                <p><b>Descripción:</b> {descripcion}</p>
                <p><b>Ubicación:</b> lat {lat}, lon {lon}</p>
                <p>Fecha: {fecha}</p>
            """

            enviado_infractor = enviar_notificacion(
                email_destino=correo_infractor,
                asunto="Incidencia registrada",
                mensaje=mensaje_infractor,
                img_principal=foto_principal_path,
                evidencias=rutas_evidencias
            )


        db_conn.commit()

        return jsonify({"success": True, "message": "Incidencia creada correctamente"})
    except Exception as e:
        db_conn.rollback()
        return jsonify({"error": str(e)}), 500

    
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email").lower()
        password = data.get("password")
        
        cursor = db_conn.cursor()
        query = "SELECT id_usuario, nombre, apellidos, rol, email FROM usuarios WHERE email = %s AND contrasena = %s;"
        cursor.execute(query, (email, password))
        user = cursor.fetchone()
        cursor.close()
        
        if user:
            user_data = {
                "id_usuario": user[0],
                "nombre": user[1],
                "apellidos": user[2],
                "rol": user[3],
                "email": user[4]
            }
            return jsonify({"success": True, "user": user_data, "token": "dummy-jwt-token"}), 200
        else:
            return jsonify({"success": False, "message": "Credenciales inválidas"}), 401
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
    

# ENDPOINT PARA OBTENER TODAS LAS INCIDENCIAS

@app.route("/obtener-incidencias", methods=["GET"])
def obtener_incidencias():
    try:
        cursor = db_conn.cursor()
        query=""" SELECT  i.id_incidencia, i.descripcion, i.fecha, i.latitud, i.longitud,i.fotoPrincipal,
        i.fotosEvidencia,v.placa,u.nombre, u.apellidos
        FROM incidencias i
        JOIN vehiculos v ON i.id_vehiculo = v.id_vehiculo
        JOIN usuarios u ON i.id_usuario = u.id_usuario
        ORDER BY i.fecha DESC;
        """
        cursor.execute(query)
        incidencias_db = cursor.fetchall()

        incidencias_list = []
        for inc in incidencias_db:
            incidencias_list.append({
                "id_incidencia": inc[0],
                "descripcion": inc[1],
                "fecha": inc[2].isoformat() if inc[2] else None,
                "latitud": str(inc[3]),
                "longitud": str(inc[4]),
                "foto_principal": inc[5],
                "fotos_evidencia": inc[6],
                "placa_vehiculo": inc[7],
                "usuario_reportador": f"{inc[8]} {inc[9]}"
            })

        return jsonify({
            "success": True,"incidencias": incidencias_list
        })
    
    except Exception as e:
        print(f"Error al obtener incidencias: {e}")
        return jsonify({"error": str(e)}), 500

# ENDPOINT PARA CREAR UN USUARIO

@app.route("/crear-usuarios", methods=["POST"])
def crear_usuario():
    try:
        data = request.get_json()
        print(data)
        
        nombre = data.get("nombre")
        apellidos = data.get("apellidos")
        email = data.get("email").lower()
        contrasena = data.get("contrasena")
    
        cursor = db_conn.cursor()
        query = """ INSERT INTO usuarios (nombre, apellidos, email, contrasena)
        VALUES (%s, %s, %s, %s)RETURNING id_usuario; """
        cursor.execute(query, (nombre, apellidos, email, contrasena))
        nuevo_id = cursor.fetchone()[0]
       
        return jsonify({"success": True,"message": "Usuario creado exitosamente"})
    except Exception as e:
        return jsonify({"error":str(e)}),500

# ENDPOINT PARA OBTENER TODOS LOS USUARIOS

@app.route("/obtener-usuarios", methods=["GET"])
def obtener_usuarios():
    try:
        cursor = db_conn.cursor()
        query = """ SELECT id_usuario, nombre, apellidos, email, rol 
        FROM usuarios
        ORDER BY id_usuario ASC; 
        """
        cursor.execute(query)
        usuarios_db = cursor.fetchall()
        
        usuarios_list = []
        for user in usuarios_db:
            usuarios_list.append({
                "id_usuario": user[0],
                "nombre": user[1],
                "apellidos": user[2],
                "email": user[3],
            })

        return jsonify({
            "success": True,"usuarios": usuarios_list
        })
        
    except Exception as e:
        print(f"Error al obtener usuarios: {e}")
        return jsonify({"error": str(e)}), 500

# ENDPOINT PARA CREAR UN VEHICULO

@app.route("/crear-vehiculo", methods=["POST"])
def crear_vehiculo():
    try:
        data = request.get_json()
        print(data)

        placa = data.get("placa").upper().replace(" ", "") 
        marca = data.get("marca")
        modelo = data.get("modelo")
        color = data.get("color")
        
        if not placa:
            return jsonify({"error": "La placa es un campo obligatorio"}), 400
        
        cursor = db_conn.cursor()
        
        query_vehiculo = """INSERT INTO vehiculos (placa, marca, modelo, color)
        VALUES (%s, %s, %s, %s)RETURNING id_vehiculo; """
        
        cursor.execute(query_vehiculo, (placa, marca, modelo, color))
        nuevo_id = cursor.fetchone()[0]

        return jsonify({"success": True,"message": "Vehículo registrado exitosamente","id_vehiculo": nuevo_id }), 201 
        
    except Exception as e:
        db_conn.rollback() 
        print(f"Error al registrar vehículo: {e}")
        return jsonify({"error": str(e)}), 500


# ENDPOINT PARA OBTENER TODOS LOS VEHICULOS

@app.route("/obtener-vehiculos", methods=["GET"])
def obtener_vehiculos():
    try:
        cursor = db_conn.cursor()
        
        query = """ SELECT v.id_vehiculo,v.placa,v.marca,v.modelo,v.color,u.nombre,u.apellidos
        FROM vehiculos v
        LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
        ORDER BY v.placa ASC; 
        """
        cursor.execute(query)
        vehiculos_db = cursor.fetchall()
        
        vehiculos_list = []
        for veh in vehiculos_db:
            nombre_propietario = f"{veh[5]} {veh[6]}" if veh[5] else None 
            
            vehiculos_list.append({
                "id_vehiculo": veh[0],
                "placa": veh[1],
                "marca": veh[2],
                "modelo": veh[3],
                "color": veh[4],
                "propietario_nombre": nombre_propietario
            })
            

        return jsonify({
            "success": True, 
            "vehiculos": vehiculos_list
        })
        
    except Exception as e:
        print(f"Error al obtener vehículos: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
