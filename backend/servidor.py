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

        # ---------- SI NO DETECTA, NO GUARDAR ----------
        if not placas_detectadas:
            return jsonify({
                "success": False,
                "message": "No se detectó ninguna placa."
            })

        # ---------- SI DETECTA, GUARDAR LA IMAGEN ----------
        filename = datetime.now().strftime("%Y%m%d_%H%M%S") + ".jpg"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Guardar imagen procesada en disco
        cv2.imwrite(file_path, image)

        return jsonify({
            "success": True,
            "placas": placas_detectadas,
            "imagen_guardada": filename
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
                        
                        # INSERCCION EN LA BASE DE DATOS
                        # cursor = db_conn.cursor()
                        # query = "INSERT INTO usuarios (nombre, apellidos, email, contrasena, rol) VALUES (%s, %s, %s, %s, %s);"
                        
                        # cursor.execute(query, ("Alma", "Cuen", "alma.cuen@gmail.com", "alma123", "usuario"))
                        
                        # db_conn.commit()
                        # cursor.close()
                        

                        return jsonify({
                            "success": True,
                            "placas": cleaned_text,
                        })
            

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/create-incidence", methods=["POST"])
def create_incidence():
    try:
        data = request.get_json()
        print(data)
        
        return jsonify({"success": True, "message": "Incidencia creada correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
