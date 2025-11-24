
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
    fotoPrincipal BYTEA,
    fotosEvidencia BYTEA[]

);

-- Inserciones 

INSERT INTO usuarios (nombre, apellidos, email, contrasena, rol)
VALUES ('Javier', 'Gomez', 'admin@placas.com', 'admin123', 'admin');

INSERT INTO usuarios (nombre, apellidos, email, contrasena)
VALUES ('Ana', 'Perez', 'ana@perez.com', 'ana123');

INSERT INTO vehiculos (placa, marca, modelo, color, id_usuario)
VALUES ('XYZ-888', 'Nissan', 'Versa', 'Gris', 1);

INSERT INTO vehiculos (placa, marca, modelo, color, id_usuario)
VALUES ('MNO-555', 'Ford', 'Focus', 'Blanco', 2);


INSERT INTO incidencias (id_usuario, id_vehiculo, descripcion, fecha, latitud, longitud)
VALUES (
    1, -- id_usuario Javier
    1, -- id_vehiculo (XYZ-888)
    'Detección por cámara: Estacionamiento en zona prohibida.',
    NOW() - INTERVAL '1 hour',
    19.432600, 
    -99.133200
);


INSERT INTO incidencias (id_usuario, id_vehiculo, descripcion, fecha, latitud, longitud)
VALUES (
    2, -- id_usuario Ana
    2, -- id_vehiculo (MNO-555)
    'Avistamiento reportado manualmente: Conductor utilizando el móvil.',
    NOW(),
    20.659698, 
    -103.349609
);