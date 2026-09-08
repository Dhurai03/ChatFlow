import { useState, useRef, useEffect } from 'react';
import { searchUsers } from '../services/userService';

// Ionicons Search Icon (IoIosSearch SVG)
function IoIosSearch({ size = 18, color = 'currentColor', ...props }) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      height={size}
      width={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', color }}
      {...props}
    >
      <path d="M443.5 420.2L336.7 312.4c20.9-26.2 33.5-59.4 33.5-95.5 0-84.5-68.5-153-153.1-153S64 132.4 64 216.9s68.5 153 153.1 153c36.6 0 69.8-12.8 96-33.8l106.7 107.4c3.2 3.2 7.5 4.9 11.9 4.9s8.6-1.7 11.9-4.9c6.5-6.6 6.5-17.2-.1-23.3zM217.1 337.8c-66.9 0-121-54-121-120.9s54.1-120.9 121-120.9 121 54 121 120.9-54.1 120.9-121 120.9z" />
    </svg>
  );
}

function UserSearch({ onSelectUser }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsers(val);
        setResults(data);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (user) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    onSelectUser(user);
  };

  return (
    <div className="user-search" ref={wrapRef}>
      <div className="user-search-input-wrap">
        <span className="search-icon"><IoIosSearch size={20}/></span>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleChange}
          className="user-search-input"
        />
        {loading && <span className="search-loading" />}
      </div>

      {showDropdown && (
        <ul className="user-search-dropdown">
          {results.length === 0 ? (
            <li className="user-search-empty">No users found</li>
          ) : (
            results.map((u) => (
              <li key={u._id} className="user-search-item" onClick={() => handleSelect(u)}>
                <div className="avatar avatar-sm">{u.name.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="usearch-name">{u.name}</p>
                  <p className="usearch-email">{u.email}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default UserSearch;