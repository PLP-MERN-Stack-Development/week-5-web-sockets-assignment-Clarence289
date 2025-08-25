import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

const defaultRooms = ['General', 'Sports', 'Tech', 'Random'];
const avatarList = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lion',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Fox',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Tiger',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Wolf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bear',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cat',
];

const getStoredAvatar = () => {
  const stored = localStorage.getItem('avatar');
  return stored ? stored : avatarList[0];
};

const JoinRoom = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState(defaultRooms[0]);
  const [customRoom, setCustomRoom] = useState('');
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(getStoredAvatar());
  const [isCustomAvatar, setIsCustomAvatar] = useState(!!localStorage.getItem('avatarFile'));
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    const finalRoom = customRoom.trim() ? customRoom.trim() : room;
    if (!name) {
      setError('Please enter your name.');
      return;
    }
    if (!finalRoom) {
      setError('Please select or create a room.');
      return;
    }
    setError('');
    navigate(`/chat?name=${encodeURIComponent(name)}&room=${encodeURIComponent(finalRoom)}&avatar=${encodeURIComponent(avatar)}`);
  };

  const randomAvatar = () => {
    setIsCustomAvatar(false);
    localStorage.removeItem('avatarFile');
    const idx = Math.floor(Math.random() * avatarList.length);
    setAvatar(avatarList[idx]);
    localStorage.setItem('avatar', avatarList[idx]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setIsCustomAvatar(true);
      localStorage.setItem('avatar', reader.result);
      localStorage.setItem('avatarFile', '1');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setAvatar(avatarList[0]);
    setIsCustomAvatar(false);
    localStorage.removeItem('avatarFile');
    localStorage.setItem('avatar', avatarList[0]);
  };

  return (
    <div className="join-container" style={{ fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif" }}>
      <div className="join-box" style={{ width: '100%', maxWidth: 370, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 className="animated-title" style={{
          textAlign: 'center',
          width: '100%',
          marginBottom: 18,
          fontWeight: 700,
          fontSize: '2.2rem',
          letterSpacing: '1px'
        }}>
          🚀 Welcome to <span style={{
            background: 'linear-gradient(90deg,#667eea,#f7971e,#764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: '2.3rem'
          }}>Socket Chat</span>
        </h2>
        <div className="avatar-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <img
            src={avatar}
            alt="avatar"
            className="avatar-img"
            style={{
              border: '3px solid #764ba2',
              background: '#fff',
              boxShadow: '0 0 0 6px #764ba244, 0 2px 8px #667eea33',
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: 10
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="avatar-random-btn"
              title="Random Avatar"
              onClick={randomAvatar}
              style={{
                fontSize: '1.3rem',
                borderRadius: '50%',
                border: '2px solid #764ba2',
                background: '#fff',
                width: 38,
                height: 38,
                boxShadow: '0 2px 8px #764ba244',
                cursor: 'pointer'
              }}
            >
              🎲
            </button>
            <button
              type="button"
              className="avatar-random-btn"
              title="Upload Image"
              onClick={() => fileInputRef.current.click()}
              style={{
                fontSize: '1.3rem',
                borderRadius: '50%',
                border: '2px solid #764ba2',
                background: '#fff',
                width: 38,
                height: 38,
                boxShadow: '0 2px 8px #764ba244',
                cursor: 'pointer'
              }}
            >
              📷
            </button>
            {isCustomAvatar && (
              <button
                type="button"
                className="avatar-random-btn"
                title="Delete Avatar"
                onClick={handleDeleteAvatar}
                style={{
                  fontSize: '1.3rem',
                  borderRadius: '50%',
                  border: '2px solid #e53e3e',
                  background: '#fff',
                  width: 38,
                  height: 38,
                  boxShadow: '0 2px 8px #e53e3e44',
                  cursor: 'pointer',
                  color: '#e53e3e'
                }}
              >
                ❌
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>
        </div>
        {error && <div className="join-error" style={{ textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleJoin} style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0
        }}>
          <input
            className="join-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            required
            autoFocus
            style={{
              fontWeight: 500,
              fontSize: '1.1rem',
              letterSpacing: '0.5px',
              textAlign: 'center',
              marginBottom: 16,
              width: '100%'
            }}
          />
          <select
            className="join-input"
            value={room}
            onChange={e => setRoom(e.target.value)}
            style={{
              fontWeight: 500,
              fontSize: '1.1rem',
              textAlign: 'center',
              marginBottom: 16,
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          >
            {defaultRooms.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            className="join-input"
            type="text"
            value={customRoom}
            onChange={e => setCustomRoom(e.target.value)}
            placeholder="Or create a new room"
            style={{
              fontWeight: 500,
              fontSize: '1.1rem',
              textAlign: 'center',
              marginBottom: 16,
              width: '100%'
            }}
          />
          <button
            className="join-button"
            type="submit"
            disabled={!name || !(room || customRoom.trim())}
            style={{
              marginTop: 18,
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '1px',
              boxShadow: '0 4px 16px #764ba244',
              width: '100%'
            }}
          >
            Join Chat
          </button>
        </form>
        <div style={{
          marginTop: 18,
          fontSize: '0.98rem',
          color: '#764ba2',
          textAlign: 'center',
          opacity: 0.85,
          animation: 'fade-in 1.5s cubic-bezier(.39,.575,.565,1) both'
        }}>
          <span role="img" aria-label="sparkles">✨</span>
          Fast, secure & real-time chat experience!
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;