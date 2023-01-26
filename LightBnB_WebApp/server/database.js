const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users


// * Get a single user from the database given their email.

const getUserWithEmail = function(email) {
  const queryString = `
    SELECT * 
    FROM users 
    WHERE users.email = $1;
  `;
  return pool.query(queryString, [email])
    .then(result => {
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch(error => {
      console.log('query error:', error);
    });
};
exports.getUserWithEmail = getUserWithEmail;


// * Get a single user from the database given their id.

const getUserWithId = function(id) {
  const queryString = `
    SELECT * 
    FROM users 
    WHERE users.id = $1;
  `;
  return pool.query(queryString, [id])
    .then(result => {
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch(error => {
      console.log('query error:', error);
    });
};
exports.getUserWithId = getUserWithId;



// * Add a new user to the database given parameters inputed on web form.

const addUser =  function(user) {
  const queryString = `INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [user.name, user.email, user.password];
  return pool.query(queryString, values)
    .then(result => {
      return result.rows[0];
    })
    .catch(error => {
      console.log('query error:', error);
    });
};
exports.addUser = addUser;

/// Reservations


// * Get all reservations for a single user.

const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `
    SELECT properties.*, reservations.*, avg(rating) AS average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;

  const values = [guest_id, limit];

  return pool
    .query(queryString, values)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties


// * Get all properties in website search filter page.

const getAllProperties = (options, limit) => {
  const queryParams = [];

  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;

  // check if city form is filled in
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  // check if owner_id exists
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    if (queryParams.length === 1) {
      queryString += `WHERE owner_id = $${queryParams.length} `;
    } else {
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }

  // check if min and max price forms are filled in
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100, options.maximum_price_per_night * 100);
    if (queryParams.length === 2) {
      queryString += `WHERE cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length} `;
    }
  }

  queryString += `GROUP BY properties.id `;

  // check if min rating form is filled in
  if (options.minimum_rating) {
    queryParams.push(parseInt(options.minimum_rating));
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night LIMIT $${queryParams.length};`;
  
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;



// * Add a property to the database given parameter from webpage form for create new listing.

const addProperty = function(property) {
  const queryString = `
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, 
      cover_photo_url, cost_per_night, street, city, province, post_code, 
      country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
  `;

  const values = [
    property.owner_id, property.title, property.description, property.thumbnail_photo_url,
    property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province,
    property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms
  ];


  return pool.query(queryString, values)
    .then(result => {
      return result.rows[0];
    })
    .catch(error => {
      console.log('query error:', error);
    });
};
exports.addProperty = addProperty;
