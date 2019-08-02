CREATE TABLE tbl_stop (
  id INTEGER NOT NULL,
  name VARCHAR(64) NOT NULL,
  frag VARCHAR(8) NOT NULL,
  the_geom Geometry(Point, 4326),
  PRIMARY KEY(id)
);
