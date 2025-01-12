/***************************************************
 * script.js - Local Playlist Manager
 *             with 20 Mood Buttons (genre-based)
 **************************************************/
document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------
    // 1) DOM Elements
    // ------------------------------------------------
    const moodButtonsContainer = document.getElementById('mood-buttons-container');
    const searchResults        = document.getElementById('search-results');
    const apiStatus            = document.getElementById('api-status');

    const newPlaylistName      = document.getElementById('new-playlist-name');
    const createPlaylistBtn    = document.getElementById('create-playlist-button');
    const playlistsContainer   = document.getElementById('my-playlists');

    // Clear Session Storage Button
    const clearSessionBtn      = document.getElementById('clear-session-button');

    const MOOD_BUTTONS = [
        { label: 'Excited', genre: 'pop' },
        { label: 'Relaxed', genre: 'lo-fi' },
        { label: 'Angry', genre: 'rock' },
        { label: 'Heartfelt', genre: 'acoustic' },
        { label: 'Funky', genre: 'funk' },
        { label: 'Dance', genre: 'disco' },
        { label: 'Energetic', genre: 'dance' },
        { label: 'Heavy Metal', genre: 'metal' },
        { label: 'Laid-back', genre: 'chill' },
        { label: 'Old', genre: 'classical' },
        { label: 'Jazzy', genre: 'jazz' },
        { label: 'Homesick', genre: 'country' },
        { label: 'Beaten', genre: 'rap' },
        { label: 'Hip', genre: 'hip-hop' },
        { label: 'Reggae', genre: 'reggae' },
        { label: 'Blues', genre: 'blues' },
        { label: 'Punk', genre: 'punk' },
        { label: 'Indie', genre: 'indie' },
        { label: 'Latin', genre: 'latin' },
        { label: 'Soul', genre: 'soul' },
    ];

    // localStorage
    function loadPlaylists() {
        const data = localStorage.getItem('my_playlists');
        return data ? JSON.parse(data) : [];
    }

    function savePlaylists(playlists) {
        localStorage.setItem('my_playlists', JSON.stringify(playlists));
    }


    // 4) Spotify Search dle genre

    function getAccessToken() {

        return localStorage.getItem('access_token');
    }

    async function searchTracksByGenre(genre) {
        const url = `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=30`;
        const token = getAccessToken();

        if (!token) {
            apiStatus.textContent = 'No Spotify access token found. Please authorize first.';
            return [];
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    apiStatus.textContent = 'Authorization failed. Please log in again to Spotify.';
                } else {
                    apiStatus.textContent = `Search failed with HTTP status ${response.status}.`;
                }
                return [];
            }

            apiStatus.textContent = '';
            const data = await response.json();
            return data.tracks.items || [];
        } catch (error) {
            console.error('Error searching tracks:', error);
            apiStatus.textContent = 'Network or fetch error.';
            return [];
        }
    }

    // vysledky searchu

    function renderSearchResults(tracks) {
        searchResults.innerHTML = ''; // clear old results

        if (tracks.length === 0) {
            searchResults.innerHTML = '<li>No tracks found.</li>';
            return;
        }

        // konteiner na dva sloupce
        const columnContainer = document.createElement('div');
        columnContainer.style.display = 'grid';
        columnContainer.style.gridTemplateColumns = '1fr 1fr'; // Two columns
        columnContainer.style.gap = '1rem'; // Add some spacing between columns

        // rozdeli pisne do dvou slopcu
        const leftColumn = document.createElement('ul');
        const rightColumn = document.createElement('ul');

        tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.style.listStyleType = 'none'; // Remove default bullets
            li.style.marginBottom = '15px'; // Space between tracks

            // Basic info
            const title = track.name;
            const artist = track.artists.map(a => a.name).join(', ');
            const url = track.external_urls.spotify;

            // pridaní vlastního popisku uzivatele
            const descriptionInput = document.createElement('input');
            descriptionInput.type = 'text';
            descriptionInput.placeholder = 'Add a note...';
            descriptionInput.style.marginTop = '5px';
            descriptionInput.style.width = '90%';

            // button na pridani do playlistu
            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add to Playlist';
            addBtn.style.display = 'block';
            addBtn.style.marginTop = '5px';
            addBtn.addEventListener('click', () => {
                // **Updated:** Store track info in sessionStorage and redirect to add_playlist.html
                const trackInfo = {
                    id: track.id,
                    name: track.name,
                    artist: track.artists.map(a => a.name).join(', '),
                    url: track.external_urls.spotify,
                    description: descriptionInput.value || ''
                };
                sessionStorage.setItem('selected_track', JSON.stringify(trackInfo));
                window.location.href = 'add_playlist.html';
            });

            // informace o pisni
            const trackInfo = document.createElement('div');
            trackInfo.innerHTML = `
                <strong>${title}</strong> by ${artist}
                — <a href="${url}" target="_blank">Preview</a>
            `;
            trackInfo.style.marginBottom = '5px';

            li.appendChild(trackInfo);
            li.appendChild(descriptionInput);
            li.appendChild(addBtn);

            // alternace mezi sloupce
            if (index % 2 === 0) {
                leftColumn.appendChild(li);
            } else {
                rightColumn.appendChild(li);
            }
        });

        columnContainer.appendChild(leftColumn);
        columnContainer.appendChild(rightColumn);
        searchResults.appendChild(columnContainer);
    }

    // Playlist Management
    function createPlaylist(name) {
        const playlists = loadPlaylists();

        // overeni duplikatu jmen playlistu case-insensitive**
        const nameExists = playlists.some(pl => pl.name.toLowerCase() === name.toLowerCase());
        if (nameExists) {
            alert(`A playlist named "${name}" already exists. Please choose a different name.`);
            return;
        }

        const newPl = {
            id: generateUniqueId(),
            name,
            songs: []
        };
        playlists.push(newPl);
        savePlaylists(playlists);

        renderPlaylists();
    }

    function addTrackToPlaylist(playlistName, trackInfo) {
        const playlists = loadPlaylists();
        // najde playlist dle name (case-insensitive)**
        const pl = playlists.find(p => p.name.toLowerCase() === playlistName.toLowerCase());
        if (!pl) {
            alert(`Playlist named "${playlistName}" not found.`);
            return;
        }

        const newSong = {
            trackId: trackInfo.id,
            title: trackInfo.name,
            artist: trackInfo.artist,
            url: trackInfo.url,
            description: trackInfo.description || ''
        };

        pl.songs.push(newSong);
        savePlaylists(playlists);

        renderPlaylists();
    }

    // menení poradi v playlistu
    function moveSong(playlistId, songIndex, direction) {
        const playlists = loadPlaylists();
        const pl = playlists.find(p => p.id === playlistId);
        if (!pl) return;

        const newIndex = songIndex + direction;
        if (newIndex < 0 || newIndex >= pl.songs.length) return;

        // Swap
        const temp = pl.songs[songIndex];
        pl.songs[songIndex] = pl.songs[newIndex];
        pl.songs[newIndex] = temp;

        savePlaylists(playlists);
        renderPlaylists();
    }

    // odebrani tracku
    function removeTrackFromPlaylist(playlistId, songIndex) {
        const playlists = loadPlaylists();
        const pl = playlists.find(p => p.id === playlistId);
        if (!pl) return;

        pl.songs.splice(songIndex, 1);
        savePlaylists(playlists);

        renderPlaylists();
    }

    // smazani playlistu
    function removePlaylist(playlistId) {
        const playlists = loadPlaylists();
        const updated = playlists.filter(p => p.id !== playlistId);
        savePlaylists(updated);

        renderPlaylists();
    }

    //zobrazeni vsech playlistu
    function renderPlaylists() {
        playlistsContainer.innerHTML = '';
        const playlists = loadPlaylists();

        if (playlists.length === 0) {
            playlistsContainer.textContent = 'No playlists yet.';
            return;
        }

        playlists.forEach((pl) => {
            const div = document.createElement('div');
            div.className = 'playlist';
            div.style.border = '1px solid #ccc';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.marginBottom = '15px';
            div.style.backgroundColor = '#f9f9f9';

            const header = document.createElement('h3');
            header.textContent = `${pl.name}`;

            // "Delete Playlist" button
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete Playlist';
            delBtn.style.marginLeft = '10px';
            delBtn.style.backgroundColor = '#f44336'; // Red
            delBtn.style.color = 'white';
            delBtn.style.border = 'none';
            delBtn.style.borderRadius = '4px';
            delBtn.style.padding = '5px 10px';
            delBtn.style.cursor = 'pointer';
            delBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete the playlist "${pl.name}"?`)) {
                    removePlaylist(pl.id);
                }
            });
            header.appendChild(delBtn);

            div.appendChild(header);

            // prida polozku do listu ul v playlistu
            const ul = document.createElement('ul');
            ul.style.paddingLeft = '20px';

            if (pl.songs.length === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.textContent = 'No songs in this playlist.';
                ul.appendChild(emptyLi);
            } else {
                pl.songs.forEach((song, index) => {
                    const li = document.createElement('li');
                    li.style.marginBottom = '10px';

                    li.innerHTML = `
                        <strong>${song.title}</strong> by ${song.artist}<br/>
                        <em>${song.description}</em><br/>
                        <a href="${song.url}" target="_blank" class="spotify-button">Listen on Spotify</a><br/>
                    `;

                    // Action Buttons Container
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.marginTop = '5px';

                    // Up Button
                    if (index > 0) { // Only show 'Up' if not the first song
                        const upBtn = document.createElement('button');
                        upBtn.textContent = 'Up';
                        upBtn.style.marginRight = '5px';
                        upBtn.style.backgroundColor = '#2196F3'; // Blue
                        upBtn.style.color = 'white';
                        upBtn.style.border = 'none';
                        upBtn.style.borderRadius = '4px';
                        upBtn.style.padding = '5px 10px';
                        upBtn.style.cursor = 'pointer';
                        upBtn.addEventListener('click', () => moveSong(pl.id, index, -1));
                        actionsDiv.appendChild(upBtn);
                    }

                    // Down Button
                    if (index < pl.songs.length - 1) { // Only show 'Down' if not the last song
                        const downBtn = document.createElement('button');
                        downBtn.textContent = 'Down';
                        downBtn.style.marginRight = '5px';
                        downBtn.style.backgroundColor = '#2196F3'; // Blue
                        downBtn.style.color = 'white';
                        downBtn.style.border = 'none';
                        downBtn.style.borderRadius = '4px';
                        downBtn.style.padding = '5px 10px';
                        downBtn.style.cursor = 'pointer';
                        downBtn.addEventListener('click', () => moveSong(pl.id, index, +1));
                        actionsDiv.appendChild(downBtn);
                    }

                    // Remove Button
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Remove';
                    removeBtn.style.backgroundColor = '#f44336'; // Red
                    removeBtn.style.color = 'white';
                    removeBtn.style.border = 'none';
                    removeBtn.style.borderRadius = '4px';
                    removeBtn.style.padding = '5px 10px';
                    removeBtn.style.cursor = 'pointer';
                    removeBtn.addEventListener('click', () => {
                        if (confirm(`Are you sure you want to remove "${song.title}" from "${pl.name}"?`)) {
                            removeTrackFromPlaylist(pl.id, index);
                        }
                    });
                    actionsDiv.appendChild(removeBtn);

                    li.appendChild(actionsDiv);
                    ul.appendChild(li);
                });
            }

            div.appendChild(ul);
            playlistsContainer.appendChild(div);
        });
    }

    // id plalistu identifikator
    function generateUniqueId() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        } else {
            return 'pl-' + Math.random().toString(36).substring(2, 10);
        }
    }

    // vytvori 20 buttonu a prida Eevent Handlers
    function createMoodButtons() {
        MOOD_BUTTONS.forEach((moodObj) => {
            const btn = document.createElement('button');
            btn.textContent = moodObj.label;
            btn.style.margin = '5px';
            btn.style.padding = '10px 20px';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = '#4CAF50'; // Green
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.addEventListener('click', async () => {
                apiStatus.textContent = `Searching for ${moodObj.genre}...`;
                const tracks = await searchTracksByGenre(moodObj.genre);
                renderSearchResults(tracks);
            });
            moodButtonsContainer.appendChild(btn);
        });
    }


    // Wire Up "Create Playlist" button

    createPlaylistBtn.addEventListener('click', () => {
        const name = newPlaylistName.value.trim();
        if (!name) {
            alert('Please enter a playlist name.');
            return;
        }
        createPlaylist(name);
        newPlaylistName.value = '';
    });


    //  Wire Up "Clear Session Storage" button

    clearSessionBtn.addEventListener('click', () => {
        // vycistit session storage
        sessionStorage.clear();

        window.location.href = 'https://eso.vse.cz/~ngud19/playlistspotify/';
    });


    //  On Page Load

    createMoodButtons();   // Inicialiatzace 20ti mood buttonu
    renderPlaylists();     // ukaze playlisty
});
