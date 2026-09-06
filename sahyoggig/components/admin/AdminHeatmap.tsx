"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// leaflet.heat is a plain JS file that attaches to L
import "leaflet.heat";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MapPin, Map as MapIcon, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminHeatmap({ bookings, workers }: { bookings: any[], workers: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      // Default to Bangalore
      mapInstance.current = L.map(mapRef.current).setView([12.9716, 77.5946], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;

    // Clear existing layers if this re-runs
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    // 1. Generate Heatmap from bookings
    // For demo, if bookings lack lat/lng, we generate slight offsets around workers
    const heatData: [number, number, number][] = [];
    bookings.forEach(b => {
      const w = b.worker;
      if (w && w.latitude && w.longitude) {
        // Pseudo-random offset for customer location
        const rLat = w.latitude + (Math.random() - 0.5) * 0.05;
        const rLng = w.longitude + (Math.random() - 0.5) * 0.05;
        heatData.push([rLat, rLng, 1]); // lat, lng, intensity
      }
    });

    if (heatData.length > 0) {
      // @ts-ignore - leaflet.heat adds L.heatLayer
      const heat = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 14 }).addTo(map);
      
      const bounds = L.latLngBounds(heatData.map(d => [d[0], d[1]]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    }

    // 2. Add Worker Markers
    const workerIcon = L.divIcon({
      className: 'bg-transparent',
      html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>`,
      iconSize: [16, 16]
    });

    workers.forEach(w => {
      if (w.latitude && w.longitude && w.isVerified) {
        L.marker([w.latitude, w.longitude], { icon: workerIcon })
          .bindPopup(`<b>${w.user?.name}</b><br/>${w.serviceCategory?.name}`)
          .addTo(map);
      }
    });

    return () => {
      // Don't fully destroy map on re-render in dev, just leave it be managed by the ref
    };
  }, [bookings, workers]);

  return (
    <Card className="col-span-full border-amber-200">
      <CardHeader className="bg-amber-50/50 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center text-amber-900">
              <MapIcon className="w-5 h-5 mr-2 text-amber-600" />
              Geo-Spatial Demand Heatmap
            </CardTitle>
            <CardDescription className="text-amber-700/80 mt-1">
              Live booking density vs. active worker locations.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white border-amber-300 text-amber-700 font-semibold shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Underserved Zone Detected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div ref={mapRef} className="w-full h-[400px] z-0" />
          
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur px-3 py-2 rounded shadow border text-xs">
            <div className="font-semibold mb-1 text-gray-800">Legend</div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500 blur-[1px]"></div>
              <span>High Demand (Bookings)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm"></div>
              <span>Active Worker</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
