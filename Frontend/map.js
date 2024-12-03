import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search } from "lucide-react"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})

// Create a custom red icon for the search marker
const searchIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="25" height="41">
      <path fill="#dc2626" d="M12 0c-5.522 0-10 4.395-10 9.815 0 7.017 9.09 17.472 9.475 17.927a.77.77 0 0 0 1.05 0C12.91 27.287 22 16.832 22 9.815 22 4.395 17.522 0 12 0Zm0 14.722c-2.761 0-5-2.238-5-5s2.239-5 5-5 5 2.238 5 5-2.239 5-5 5Z"/>
    </svg>
  `,
  className: 'search-marker',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DEFAULT_CENTER = [41.6032, -73.0877] // Connecticut center
const DEFAULT_ZOOM = 9

// Component for the search marker with a popup
function SearchMarker({ position, address }) {
  return position ? (
    <Marker position={position} icon={searchIcon}>
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">Searched Location</h3>
          <p className="text-sm text-gray-700">{address}</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

// Component to control the address search functionality
function SearchControl({ onSearch }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      // ADD API KEY
      script.src = `https://maps.googleapis.com/maps/api/js?key=APIKEY`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(41.0, -73.7),
        new window.google.maps.LatLng(42.0, -71.8)
      ),
      fields: ['geometry', 'formatted_address'],
      types: ['address']
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  // Handle place selection from autocomplete suggestions
  const handlePlaceSelect = () => {
    setLoading(true);
    const place = autocompleteRef.current.getPlace();

    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      onSearch({
        coordinates: [lat, lng],
        address: place.formatted_address
      });
      setAddress('');
    } else {
      console.error('No geometry data received from Places API');
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="absolute top-4 right-4 z-[1000] flex gap-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search address"
        />
        
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <button 
        type="submit"
        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Search"
        disabled={loading}
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

// Component for updating the map view based on search results
function MapController({ searchLocation }) {
  const map = useMap()

  useEffect(() => {
    if (searchLocation) {
      map.setView(searchLocation, 14)
    }
  }, [map, searchLocation])

  return null
}

// Main component for rendering the map with resources and search functionality
const ResourceMap = () => {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedResource, setSelectedResource] = useState(null)
  const [searchLocation, setSearchLocation] = useState(null)
  const [searchAddress, setSearchAddress] = useState(null)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/resources')
        if (response.data.status === 'success') {
          setResources(response.data.data)
        } else {
          throw new Error(response.data.message)
        }
      } catch (err) {
        setError(err.message || 'Failed to load resources')
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  // Handle search data and set the search location on the map
  const handleSearch = (searchData) => {
    setSearchLocation(searchData.coordinates);
    setSearchAddress(searchData.address);
  }

  // Show loading spinner when fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Display error message if data fails to load
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Resources</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex-grow flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">Food Banks in Connecticut</h1>
      
      <div className="flex-grow w-full rounded-lg overflow-hidden shadow-lg relative" 
        style={{ maxHeight: 'calc(100vh - 175px)' }}>
        <SearchControl onSearch={handleSearch} />
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={DEFAULT_ZOOM} 
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <MapController searchLocation={searchLocation} />
          
          {/* Add the search marker */}
          <SearchMarker position={searchLocation} address={searchAddress} />
          
          {resources.map((resource) => (
            <React.Fragment key={resource.id}>
              <Marker
                position={[resource.lat, resource.lng]}
                eventHandlers={{
                  click: () => setSelectedResource(resource)
                }}
              >
                <Popup className="resource-popup">
                  <div className="p-2 max-w-sm">
                    <h3 className="font-bold text-lg mb-2">{resource.name}</h3>
                    <div className="text-sm space-y-2">
                      <p className="font-medium text-gray-900">{resource.address}</p>
                      {resource.time && (
                        <p className="text-blue-600">
                          <span className="font-medium">Time: </span>
                          {resource.time}
                        </p>
                      )}
                      {resource.schedule && (
                        <p className="text-gray-600">
                          <span className="font-medium">Schedule: </span>
                          {resource.schedule}
                        </p>
                      )}
                      {resource.description && (
                        <p className="text-gray-700 mt-2">
                          <span className="font-medium">Description: </span>
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
              
              {selectedResource?.id === resource.id && (
                <CircleMarker
                  center={[resource.lat, resource.lng]}
                  radius={20}
                  fillColor="#2196f3"
                  fillOpacity={0.2}
                  stroke={false}
                />
              )}
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default ResourceMap
