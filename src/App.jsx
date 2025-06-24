import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import './App.css'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom train icon (disabled/invisible)
const trainIcon = L.divIcon({
  className: 'train-icon',
  html: '',
  iconSize: [0, 0],
  iconAnchor: [0, 0]
});

// Moving circle icon with colors from legend and direction triangle
const createCircleIcon = (color, angle = 0) => {
  // Calculate triangle position on circle edge
  const radius = 10; // Circle radius
  const triangleDistance = 12; // Distance from center to triangle
  const radians = (angle - 90) * (Math.PI / 180); // Convert to radians, -90 to point outward
  const triangleX = Math.cos(radians) * triangleDistance;
  const triangleY = Math.sin(radians) * triangleDistance;
  
  return L.divIcon({
    className: 'moving-circle',
    html: `
      <div style="width: 20px; height: 20px; background-color: ${color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.5); position: relative;">
        <div style="
          position: absolute;
          left: ${10 + triangleX}px;
          top: ${10 + triangleY}px;
          transform: translate(-50%, -50%) rotate(${angle}deg);
          width: 0;
          height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 6px solid rgb(19, 19, 19);
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Legend colors - only first 2
const legendColors = [
  'rgb(84, 255, 63)',   // 0-4 sec - Green
  'rgb(254, 250, 76)'   // 5-14 sec - Yellow
];

// Custom map label overlay component using pure DOM elements
function MapLabels({ cities }) {
  const map = useMap();
  
  useEffect(() => {
    const labelElements = [];
    
    cities.forEach((city) => {
      // Create a pure DOM element for the label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'pure-map-label';
      labelDiv.textContent = city.customName;
      
      // Position it absolutely on the map
      const updatePosition = () => {
        const point = map.latLngToContainerPoint([city.lat, city.lng]);
        labelDiv.style.left = `${point.x}px`;
        labelDiv.style.top = `${point.y}px`;
      };
      
      // Add to map container
      map.getContainer().appendChild(labelDiv);
      updatePosition();
      
      // Update position on map events
      const onMapEvent = () => updatePosition();
      map.on('zoom move', onMapEvent);
      
      labelElements.push({ element: labelDiv, cleanup: () => map.off('zoom move', onMapEvent) });
    });
    
    return () => {
      labelElements.forEach(({ element, cleanup }) => {
        cleanup();
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [map, cities]);
  
  return null;
}

// 20 Largest Japanese cities with Hungarian custom names
const japanCities = [
  { name: 'Tokyo', customName: 'Kazincbarzika', lat: 35.6762, lng: 139.6503 },
  { name: 'Aomori', customName: 'Kiskunhalas', lat: 40.8244, lng: 140.7400 },
  { name: 'Osaka', customName: 'Tápiószecső', lat: 34.6937, lng: 135.5023 },
  { name: 'Nagoya', customName: 'Füzesabony', lat: 35.1815, lng: 136.9066 },
  { name: 'Sapporo', customName: 'Dombóvár', lat: 43.0642, lng: 141.3469 },
  { name: 'Fukuoka', customName: 'Baktalórántháza', lat: 33.5904, lng: 130.4017 },
  { name: 'Kanazawa', customName: 'Kerkateskánd', lat: 36.5944, lng: 136.6256 },
  { name: 'Tottori', customName: 'Mátraverbélyes', lat: 35.5038, lng: 134.2377 },
  { name: 'Niigata', customName: 'Szolnok', lat: 37.9161, lng: 139.0364 },
  { name: 'Kochi', customName: 'Sárbogárd', lat: 33.5597, lng: 133.5311 },
  { name: 'Hiroshima', customName: 'Berzence', lat: 34.3853, lng: 132.4553 },
  { name: 'Sendai', customName: 'Pápa', lat: 38.2682, lng: 140.8694 },
  { name: 'Miyazaki', customName: 'Jászberény', lat: 31.9077, lng: 131.4202 },
  { name: 'Nagano', customName: 'Karcag', lat: 36.6513, lng: 138.1810 },
  { name: 'Shingu', customName: 'Bábolna', lat: 33.7333, lng: 135.9833 },
  { name: 'Iwaki', customName: 'Jászkarajenő', lat: 37.0481, lng: 140.8869 },
  { name: 'Akita', customName: 'Mátészalka', lat: 39.7186, lng: 140.1024 },
  { name: 'Shizuoka', customName: 'Kalocsa', lat: 34.9756, lng: 138.3828 },
  { name: 'Hamamatsu', customName: 'Batida', lat: 34.7108, lng: 137.7261 },
  { name: 'Okayama', customName: 'Csurgó', lat: 34.6551, lng: 133.9195 },
  { name: 'SeaOfJapan', customName: 'Sea of Japan', lat: 39.925819294681204, lng: 134.12578905768152 }
];

// Train routes connecting major cities
const trainRoutes = [
  { from: 'Tokyo', to: 'Osaka', name: 'Tokaido Shinkansen' },
  { from: 'Tokyo', to: 'Nagoya', name: 'Tokaido Express' },
  { from: 'Tokyo', to: 'Sendai', name: 'Tohoku Shinkansen' },
  { from: 'Tokyo', to: 'Niigata', name: 'Joetsu Shinkansen' },
  { from: 'Osaka', to: 'Tottori', name: 'San-in Main Line' },
  { from: 'Osaka', to: 'Kanazawa', name: 'Thunderbird Express' },
  { from: 'Tokyo', to: 'Iwaki', name: 'Joban Line' },
  { from: 'Osaka', to: 'Hiroshima', name: 'Sanyo Shinkansen' },
  { from: 'Hiroshima', to: 'Fukuoka', name: 'Sanyo Shinkansen' },
  { from: 'Fukuoka', to: 'Miyazaki', name: 'Nippo Main Line' },
  { from: 'Tokyo', to: 'Nagano', name: 'Hokuriku Shinkansen' },
  { from: 'Tokyo', to: 'Kochi', name: 'Tokaido-Dosan Line' },
  { from: 'Sendai', to: 'Akita', name: 'Akita Shinkansen' },
  { from: 'Hamamatsu', to: 'Shizuoka', name: 'Tokaido Line' },
  { from: 'Osaka', to: 'Shingu', name: 'Kisei Main Line' }
];

function MovingTrain({ route, isMoving, speed }) {
  const [position, setPosition] = useState({ lat: route.start.lat, lng: route.start.lng });
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    if (isMoving) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = (prev + speed) % 200; // 0-100 forward, 100-200 backward
          const actualProgress = newProgress > 100 ? 200 - newProgress : newProgress;
          const ratio = actualProgress / 100;
          
          const newLat = route.start.lat + (route.end.lat - route.start.lat) * ratio;
          const newLng = route.start.lng + (route.end.lng - route.start.lng) * ratio;
          
          setPosition({ lat: newLat, lng: newLng });
          return newProgress;
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isMoving, speed, route]);

  return (
    <Marker position={[position.lat, position.lng]} icon={trainIcon}>
      <Popup className="train-popup">
        <div>
          <strong>{route.name}</strong><br />
          {route.start.name} ↔ {route.end.name}<br />
          Status: {isMoving ? 'Moving' : 'Stopped'}
        </div>
      </Popup>
    </Marker>
  );
}

function MovingCircle({ route, color }) {
  const [position, setPosition] = useState({ lat: route.start.lat, lng: route.start.lng });
  const [progress, setProgress] = useState(Math.random() * 200); // Random starting position
  const [angle, setAngle] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = (prev + 0.01) % 200; // Very slow movement (0.01 speed - 20x slower)
        const actualProgress = newProgress > 100 ? 200 - newProgress : newProgress;
        const ratio = actualProgress / 100;
        
        const newLat = route.start.lat + (route.end.lat - route.start.lat) * ratio;
        const newLng = route.start.lng + (route.end.lng - route.start.lng) * ratio;
        
        // Calculate direction angle
        const isReversing = newProgress > 100;
        const deltaLat = isReversing ? route.start.lat - route.end.lat : route.end.lat - route.start.lat;
        const deltaLng = isReversing ? route.start.lng - route.end.lng : route.end.lng - route.start.lng;
        const directionAngle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
        
        setPosition({ lat: newLat, lng: newLng });
        setAngle(directionAngle);
        return newProgress;
      });
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [route]);

  return (
    <Marker position={[position.lat, position.lng]} icon={createCircleIcon(color, angle)} />
  );
}

function App() {
  const [isMoving, setIsMoving] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [trains, setTrains] = useState([]);
  const [movingCircles, setMovingCircles] = useState([]);

  useEffect(() => {
    // Create train objects from routes
    const trainData = trainRoutes.map((route, index) => {
      const startCity = japanCities.find(city => city.name === route.from);
      const endCity = japanCities.find(city => city.name === route.to);
      
      return {
        id: index,
        name: route.name,
        start: startCity,
        end: endCity,
        speed: 0.5 + Math.random() * 1.5 // Random speed between 0.5 and 2
      };
    });
    
    setTrains(trainData);

    // Generate 25 random routes for moving circles (exclude Sea of Japan and Sapporo)
    const eligibleCities = japanCities.filter(city => 
      city.name !== 'SeaOfJapan' && city.name !== 'Sapporo'
    );
    
    const circleRoutes = [];
    for (let i = 0; i < 25; i++) {
      const startIndex = Math.floor(Math.random() * eligibleCities.length);
      let endIndex = Math.floor(Math.random() * eligibleCities.length);
      
      // Ensure start and end are different
      while (endIndex === startIndex) {
        endIndex = Math.floor(Math.random() * eligibleCities.length);
      }
      
      const startCity = eligibleCities[startIndex];
      const endCity = eligibleCities[endIndex];
      const color = legendColors[Math.floor(Math.random() * legendColors.length)];
      
      circleRoutes.push({
        id: i,
        start: startCity,
        end: endCity,
        color: color
      });
    }
    
    setMovingCircles(circleRoutes);
  }, []);

  const toggleMovement = () => {
    setIsMoving(!isMoving);
  };

  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
  };

  return (
    <div className="App">
      {/* Color Legend - Bottom Right */}
      <div className="legend-box">
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Színek jelentése</h4>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(84, 255, 63)' }}></div>
          <span className="legend-text">0-4 sec</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(254, 250, 76)' }}></div>
          <span className="legend-text">5-14 sec</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(249, 164, 57)' }}></div>
          <span className="legend-text">15-59 sec</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgb(246, 50, 49)' }}></div>
          <span className="legend-text">59+ sec</span>
        </div>
      </div>

      <MapContainer 
        center={[36.2048, 138.2529]} 
        zoom={6} 
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Custom map labels that override default labels */}
        <MapLabels cities={japanCities} />
        
        {/* Moving trains */}
        {trains.map((train) => (
          <MovingTrain 
            key={train.id}
            route={train}
            isMoving={isMoving}
            speed={speed * train.speed}
          />
        ))}
        
        {/* Moving circles */}
        {movingCircles.map((circle) => (
          <MovingCircle 
            key={circle.id}
            route={circle}
            color={circle.color}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
