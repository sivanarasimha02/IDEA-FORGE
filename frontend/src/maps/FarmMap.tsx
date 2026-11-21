import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet default marker icons in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FarmMapProps {
  centroidLat: number;
  centroidLon: number;
  boundaryGeoJSON?: string;
  farmName?: string;
  areaHectares?: number;
  isDrawingMode?: boolean;
  onPolygonCreated?: (coords: number[][]) => void;
  drawnPoints?: number[][];
  onAddPoint?: (pt: number[]) => void;
  onClearDrawing?: () => void;
  satelliteLayer?: boolean;
}

export const FarmMap: React.FC<FarmMapProps> = ({
  centroidLat,
  centroidLon,
  boundaryGeoJSON,
  farmName = 'Field Boundary',
  areaHectares,
  isDrawingMode = false,
  drawnPoints = [],
  onAddPoint,
  satelliteLayer = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centroidLat || 12.52, centroidLon || 76.89],
        zoom: 14,
        zoomControl: true,
      });

      // Satellite Basemap: Esri World Imagery
      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 18
        }
      );

      // OpenStreetMap Street layer
      const osmStreets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });

      if (satelliteLayer) {
        esriSatellite.addTo(map);
      } else {
        osmStreets.addTo(map);
      }

      L.control.layers(
        { 'Satellite (Esri Imagery)': esriSatellite, 'Street Map': osmStreets },
        undefined,
        { position: 'topright' }
      ).addTo(map);

      polygonLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Handle Click for drawing
    map.off('click');
    if (isDrawingMode && onAddPoint) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onAddPoint([roundCoord(e.latlng.lng), roundCoord(e.latlng.lat)]);
      });
    }

    return () => {
      // Don't fully destroy unless unmounting to prevent Leaflet container errors
    };
  }, [centroidLat, centroidLon, isDrawingMode, onAddPoint, satelliteLayer]);

  // Update polygon layers whenever boundary or drawnPoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layerGroup = polygonLayerRef.current;
    layerGroup.clearLayers();

    // 1. If in drawing mode, render drawing markers and tentative polyline/polygon
    if (isDrawingMode && drawnPoints.length > 0) {
      const latlngs: L.LatLngTuple[] = drawnPoints.map(p => [p[1], p[0]]);

      drawnPoints.forEach((pt, idx) => {
        const marker = L.circleMarker([pt[1], pt[0]], {
          radius: 6,
          color: '#fbbf24',
          fillColor: '#f59e0b',
          fillOpacity: 1
        }).bindTooltip(`Vertex ${idx + 1}`, { permanent: false });
        layerGroup.addLayer(marker);
      });

      if (drawnPoints.length >= 3) {
        const poly = L.polygon(latlngs, {
          color: '#f59e0b',
          fillColor: '#fbbf24',
          fillOpacity: 0.35,
          weight: 3,
          dashArray: '6, 6'
        });
        layerGroup.addLayer(poly);
      } else if (drawnPoints.length === 2) {
        const line = L.polyline(latlngs, {
          color: '#f59e0b',
          weight: 3,
          dashArray: '6, 6'
        });
        layerGroup.addLayer(line);
      }
      return;
    }

    // 2. Otherwise render saved boundary polygon
    if (boundaryGeoJSON) {
      try {
        const geojson = JSON.parse(boundaryGeoJSON);
        const geoLayer = L.geoJSON(geojson, {
          style: {
            color: '#10b981',
            fillColor: '#059669',
            fillOpacity: 0.45,
            weight: 3,
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div class="text-slate-900 p-1 font-sans">
                <h4 class="font-bold text-sm text-emerald-800">${farmName}</h4>
                <p class="text-xs text-slate-600 mt-1">Area: <strong>${areaHectares ? areaHectares.toFixed(1) : '--'} ha</strong></p>
                <p class="text-xs text-slate-600">Lat: ${centroidLat.toFixed(4)}, Lon: ${centroidLon.toFixed(4)}</p>
              </div>
            `);
          }
        });
        layerGroup.addLayer(geoLayer);
        map.fitBounds(geoLayer.getBounds(), { padding: [40, 40], maxZoom: 16 });
      } catch (err) {
        console.error('Failed to parse farm boundary GeoJSON', err);
      }
    } else if (centroidLat && centroidLon) {
      const marker = L.marker([centroidLat, centroidLon])
        .bindPopup(`<b>${farmName}</b><br/>Area: ${areaHectares || '--'} ha`);
      layerGroup.addLayer(marker);
      map.setView([centroidLat, centroidLon], 14);
    }
  }, [boundaryGeoJSON, drawnPoints, isDrawingMode, centroidLat, centroidLon, farmName, areaHectares]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
      
      {isDrawingMode && (
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-lg border border-amber-500/50 shadow-lg text-xs text-amber-300 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
          <span>Click map to add boundary points (minimum 3 points required). Points added: <strong>{drawnPoints.length}</strong></span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/85 backdrop-blur-sm px-3 py-1.5 rounded-md border border-slate-700/60 text-[11px] text-slate-300">
        Geo-Reference: WGS84 • Spatial Resolution: 10m (Sentinel-2 AOI)
      </div>
    </div>
  );
};

function roundCoord(num: number): number {
  return Math.round(num * 100000) / 100000;
}
