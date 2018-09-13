/**
 * Common database helper functions.
 */

 /* 
 Included idb.js as a local file and included the building of the database in the dbhelper file rather than the service worker. While this isn't ideal for production,
 it was the easiest method for me to follow.
 The following resources were consulted to help build the database creation code:
 https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
 https://developers.google.com/web/ilt/pwa/working-with-indexeddb
 */

var idbProject = (function() {
  'use strict';

  //is indexedDB supported; if not throw an error
  if(!('indexedDB' in window)) {
    console.log('indexedDB not supported in this browser');
    return;
  }

  // initiate DB magic and mumbojumbo
  var dbPromise = idb.open('brin-restaurant-review-stage2', 1, function(upgradeDB) {
    switch (upgradeDB.oldVersion) {
      case 0:
      case 1:
        console.log('Establishing object store for the project');
        upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
    }
  });

  // All the restaurants into the pool
  function addRestaurants() {
    fetch(DBHelper.DATABASE_URL)
    .then(response => response.json())
    .then(function(restaurants) {
      console.log('json data for restaurants compiled')
      dbPromise.then((db) => {
        let restaurantValStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants')
          for (const restaurant of restaurants) {
            restaurantValStore.put(restaurant)
          }
      })
      //send the information back out
      callback(null, restaurants);
    }).catch(function (err) {
      dbPromise.then( (db) => {
        let restaurantValStore = db.transaction('restaurants').objectStore('restaurants')
        return restaurantValStore.getAll();
      })
    })
  }

  //get the restaurants using the id field for the identifier
  function getByID(id) {
    return dbPromise.then(function(db) {
      const txtion = db.transaction('restaurants', 'readonly');
      const store = txtion.objectStore('restaurants');
      return store.get(parseInt(id));
    }).then(function(restaurantObject) {
      return restaurantObject;
    }).catch(function(z) {
      console.log('Fetch Function errored out:', z);
    });
  }

  //retrieve the restaurants like a champ
  function getRestaurantsAll() {
    dbPromise.then(db => {
      return db.transaction('restaurants').objectstore('restaurants')
      .getRestaurantsAll();
    }).then(allObjs => console.log(allObjs));
  }

  //send back the promises 
  return {
    dbPromise: (dbPromise),
    addRestaurants: (addRestaurants),
    getByID: (getByID),
    getRestaurantsAll: (getRestaurantsAll)
  };
   
})();

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

    
  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let retrieveURL;
    if (!id) {
      retrieveURL = DBHelper.DATABASE_URL;
    } else {
      retrieveURL = DBHelper.DATABASE_URL + '/' + id;
    }
    fetch(retrieveURL, {method:'GET'})
      .then(response => {
        response.json().then(restaurants => {
          console.log('Restaurants JSON ', restaurants);
          callback(null, restaurants);
        });
      })
      .catch(error => {
        callback('Failed Request. Error Returned: $(error)', null);
      })
  }
/* 
* Removing xhr call in favor of a fetch *  
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const json = JSON.parse(xhr.responseText);
        const restaurants = json;
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }
*/

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

