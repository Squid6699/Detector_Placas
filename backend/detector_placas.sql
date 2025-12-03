
CREATE DATABASE detector_placas;

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'usuario'
);

CREATE TABLE vehiculos (
    id_vehiculo SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    color VARCHAR(30),
    id_usuario INT REFERENCES usuarios(id_usuario)
);

CREATE TABLE incidencias (
    id_incidencia SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    id_vehiculo INT NOT NULL REFERENCES vehiculos(id_vehiculo),
    descripcion VARCHAR(255),
    fecha TIMESTAMP NOT NULL,
    latitud DECIMAL(9,6),
    longitud DECIMAL(9,6),
    fotoPrincipal text,
    fotosEvidencia text[]
);

-- Inserciones 

INSERT INTO usuarios (nombre, apellidos, email, contrasena, rol)
VALUES ('Javier', 'Gomez', 'buenoqueteimporta69@gmail.com', 'admin123', 'admin');

INSERT INTO usuarios (nombre, apellidos, email, contrasena)
VALUES ('Alma', 'Cuen', 'brayanaviles2017@gmail.com', 'alma123');

INSERT INTO usuarios (nombre, apellidos, email, contrasena)
VALUES ('Brayan', 'Aviles', 'brayanaviles96@gmail.com', 'alma123');

INSERT INTO vehiculos (placa, marca, modelo, color, id_usuario)
VALUES ('VNB954C', 'Volkswagen', 'Jetta', 'Gris', 2);

INSERT INTO vehiculos (placa, marca, modelo, color, id_usuario)
VALUES ('VKJ525C', 'Ford', 'Fiesta', 'Gris', 3);

INSERT INTO vehiculos (placa, marca, modelo, color, id_usuario)
VALUES ('VNB800A', 'Hyundai', 'Accent', 'Blanco', 3);