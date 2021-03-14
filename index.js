if(navigator.geolocation === undefined) {
    return alert('GeoLocation is not supported in your Browser :(');
  }
  navigator.geolocation.getCurrentPosition((position) => {
    currentSocket.emit('createLocationMessage', {
      lat : position.coords.latitude,
      lng : position.coords.longitude
    })
  }, function(){
    return alert('Unable to fetch Location :(');
  })