let accessToken;
let redirectURI = 'http://localhost:3000/';
let clientId = '231cb935c5d04a5ebd51502b3836be74';

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        } else if (window.location.href.match(/access_token=([^&]*)/) && window.location.href.match(/expires_in=([^&]*)/)) {
            accessToken = window.location.href.match(/access_token=([^&]*)/)[1];
            const expiresIn = window.location.href.match(/expires_in=([^&]*)/)[1];

            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');

            return accessToken;
        } else {
            window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
        }
    },

    search(term) {
        let accessToken = this.getAccessToken();
        if (!accessToken) {
            console.log('No access token');
            return;
        };

        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {Authorization: `Bearer ${accessToken}`}
        }).then (
            response => {return response.json()}
        ).then(
            jsonResponse => {
                if (jsonResponse.tracks) {
                    return jsonResponse.tracks.items.map(track => ({
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name,
                        album: track.album.name,
                        uri: track.uri
                    }));
                } else {
                    return;
                }
            }
        )
    },

    savePlaylist(name, tracks) {
        if (!name || !tracks) {
            return;
        }

        let userId;
        const accessToken = this.getAccessToken();

        return fetch(`https://api.spotify.com/v1/me`,
        {
            headers: {Authorization: `Bearer ${accessToken}`}
        }).then(
            response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request Failed');
            }, networkError => console.log(networkError.message)
        ).then(
            jsonResponse => {
                userId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                    headers: {Authorization: `Bearer ${accessToken}`},
                    method: 'POST',
                    body: JSON.stringify({name: name})
                })
            }
        ).then(
            response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Request failed');
            }, networkError => console.log(networkError.message)
        ).then(
            jsonResponse => {
                const playlistId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
                    headers: {Authorization: `Bearer ${accessToken}`},
                    method: 'POST',
                    body: JSON.stringify({uris: tracks})
                })
            }
        )
    }
}

export default Spotify;