const clientId = "84a3120e7aa94214a242cad044272b3e"
const redirectURI = "http://localhost:3000/";

let accessToken;
let expiresIn;

const Spotify = {
  getAccessToken(){
    if (accessToken){
      return accessToken;
    }

    //Checking for access token match 
    // the window.location.href gives us the url of the page we are currently on 
    //.match() is used to extract the access token value from the url 
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&])/);

    if(accessTokenMatch && expiresInMatch){
      accessToken = accessTokenMatch[1];
      expiresIn = Number(expiresInMatch[1]);
      
      //this clears the parameters, allowing us to grab a new access token when it expires
      window.setTimeout(() => accessToken = '',expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken;
    }else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`
      window.location = accessUrl
    }
  },
  search(term){
    const accessToken = Spotify.getAccessToken()
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term.replace(' ', '%20')}`,{
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
  }).then(response => {
    return response.json();
  }).then(jsonResponse => {
    if (!jsonResponse.tracks) {
      return []
    }
    return jsonResponse.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      uri: track.uri
    }))
  })
  },
  savePlaylist(name, trackUris){
    if (!name || !trackUris.length){
      return; 
    }

    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` }
    let userId;

    return fetch('https://api.spotify.com/v1/me', {headers: headers}
    ).then(response => {
      return response.json()
    }).then(jsonResponse => {
        userId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ name: name })
        }).then(response => response.json()
        ).then(jsonResponse => {
          let playlistId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
          {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ uris: trackUris})
          })
        })
    })

  }
}

export default Spotify;