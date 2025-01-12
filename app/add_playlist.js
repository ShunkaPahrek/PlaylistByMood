
document.addEventListener('DOMContentLoaded', () => {
    const trackTitleSpan = document.getElementById('track-title');
    const trackArtistSpan = document.getElementById('track-artist');
    const trackDescriptionSpan = document.getElementById('track-description');
    const playlistSelect = document.getElementById('playlist-select');
    const playlistForm = document.getElementById('playlist-form');
    const cancelButton = document.getElementById('cancel-button');

    // retrievne tracky z sessionStorage
    const selectedTrackJSON = sessionStorage.getItem('selected_track');
    if (!selectedTrackJSON) {
        alert('No track selected. Redirecting to the main page.');
        window.location.href = 'index.html';
    }

    const selectedTrack = JSON.parse(selectedTrackJSON);

    // zobrazí informaci o tracku
    trackTitleSpan.textContent = selectedTrack.name;
    trackArtistSpan.textContent = selectedTrack.artist;
    trackDescriptionSpan.textContent = selectedTrack.description || 'No description provided.';

    // načte dropdown playlistu
    const playlists = loadPlaylists();
    if (playlists.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No playlists available. Please create one first.';
        option.disabled = true;
        option.selected = true;
        playlistSelect.appendChild(option);
        playlistSelect.disabled = true;
    } else {
        playlists.forEach(pl => {
            const option = document.createElement('option');
            option.value = pl.name;
            option.textContent = pl.name;
            playlistSelect.appendChild(option);
        });
    }

    // Handle form submission
    playlistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedPlaylist = playlistSelect.value;
        if (!selectedPlaylist) {
            alert('Please select a playlist.');
            return;
        }

        addTrackToPlaylist(selectedPlaylist, selectedTrack);
        alert(`Track "${selectedTrack.name}" has been added to "${selectedPlaylist}".`);
        // Clear the selected track from sessionStorage
        sessionStorage.removeItem('selected_track');
        // Redirect back to index.html
        window.location.href = 'index.html';
    });

    // Handle cancel button
    cancelButton.addEventListener('click', () => {
        // Clear the selected track from sessionStorage
        sessionStorage.removeItem('selected_track');
        // Redirect back to index.html
        window.location.href = 'index.html';
    });

    // Utility functions

    function loadPlaylists() {
        const data = localStorage.getItem('my_playlists');
        return data ? JSON.parse(data) : [];
    }

    function savePlaylists(playlists) {
        localStorage.setItem('my_playlists', JSON.stringify(playlists));
    }

    function addTrackToPlaylist(playlistName, trackInfo) {
        const playlists = loadPlaylists();
        // **Find playlist by name (case-insensitive)**
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
    }
});
