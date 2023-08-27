let MOVEMENT_DISTANCE = 0;
let MOVE_FAR = true;
let DIRECTION = 0;


module.exports.calculateNewCoordinates = (latitude, longitude) => {
    //change location;
    MOVEMENT_DISTANCE = MOVE_FAR ? MOVEMENT_DISTANCE+1 : MOVEMENT_DISTANCE-1;
    if(MOVEMENT_DISTANCE === 11 || MOVEMENT_DISTANCE === 0) {
        MOVE_FAR = !MOVE_FAR;
        MOVEMENT_DISTANCE = MOVE_FAR ? MOVEMENT_DISTANCE+1 : MOVEMENT_DISTANCE-1;
        DIRECTION = DIRECTION + 15 === 360 ? 0 : DIRECTION + 15
    }
  //  console.log(MOVEMENT_DISTANCE, DIRECTION);
    const angle = DIRECTION;
    const distance = MOVEMENT_DISTANCE*1000;

    const EARTH_RADIUS = 6371000; // Earth's radius in meters
    const angleRad = (angle * Math.PI) / 180;
    const deltaLat = (distance * Math.cos(angleRad)) / EARTH_RADIUS;
    const deltaLng = (distance * Math.sin(angleRad)) / (EARTH_RADIUS * Math.cos(latitude * (Math.PI / 180)));
    const newLat = latitude + (deltaLat * 180) / Math.PI;
    const newLng = longitude + (deltaLng * 180) / Math.PI;
    return { latitude: newLat, longitude: newLng };
}

module.exports.randomSleep = (N, M) => {
  const randomSeconds = Math.floor(Math.random() * (M - N + 1)) + N;
  return new Promise(resolve => {
    setTimeout(resolve, randomSeconds * 1000);
  });
}