from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import imutils
import re

#Cargar imagen de entrada como prueba
image_path = cv2.imread("img/IMG_0504.jpg")

#Iniciar el modelo
model = YOLO("best.pt")
ocr = PaddleOCR(use_angle_cls=True, lang='en')

blacklist = ["grupo", "premie", "premier", "mx", "com", "agency", "automotriz", "romes", "nissan", "sinaloa"]

results = model(image_path)

for result in results:
    index_plates = (result.boxes.cls == 0).nonzero(as_tuple=True)[0]

    for idx in index_plates:
        #OBTENER CONFIANZA DE LA CAJA
        conf = result.boxes.conf[idx].item()
        print("confianza:", conf)
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
                print("Detected Plate Text:", cleaned_text)


                # DIBUJAR LA CAJA Y EL TEXTO EN LA IMAGEN ORIGINAL
                cv2.rectangle(image_path, (x1, y1), (x2, y2), (0, 0, 0), 5)
                cv2.putText(image_path, cleaned_text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 3)
                
                # MOSTRAR LA IMAGEN RESULTANTE
                cv2.imshow("Image", imutils.resize(image_path, width=720))    
                cv2.waitKey(0)
                cv2.destroyAllWindows()