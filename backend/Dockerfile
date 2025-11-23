FROM postgres:15

ENV POSTGRES_USER=postgres
ENV POSTGRES_DB=detector_placas_db

COPY detector_placas.sql /docker-entrypoint-initdb.d/

EXPOSE 5432