--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.16
-- Dumped by pg_dump version 9.5.16

CREATE TABLE test_poly (
    naksha_id integer NOT NULL,
    the_geom geometry(Geometry,4326),
    the_geom_webmercator geometry(Geometry,3857),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    primary key(naksha_id)
);

