"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingForm } from "./BookingForm";
import { Badge } from "@/components/ui/badge";

// Fix for default Leaflet icons in Next.js/Webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

type Worker = {
  id: string;
  user: { name: string; phone: string | null };
  cooperative: { name: string };
  ratingAvg: number;
  totalJobs: number;
  latitude: number | null;
  longitude: number | null;
  // Computed on client
  matchScore?: number;
  distanceKm?: number;
  acceptanceRate?: number;
  isBestMatch?: boolean;
};

// Component to auto-center the map if workers exist
function MapAutoCenter({ workers }: { workers: Worker[] }) {
  const map = useMap();
  useEffect(() => {
    if (workers.length > 0) {
      const bounds = L.latLngBounds(
        workers
          .filter(w => w.latitude && w.longitude)
          .map((w) => [w.latitude!, w.longitude!])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [map, workers]);
  return null;
}

// Distance utility (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function WorkerMap({ categoryId }: { categoryId: string }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Simulated Customer Location (e.g. center of Bengaluru)
  const customerLoc: [number, number] = [12.9716, 77.5946];

  useEffect(() => {
    async function fetchWorkers() {
      try {
        const res = await fetch(`/api/workers?categoryId=${categoryId}`);
        if (res.ok) {
          let data: Worker[] = await res.json();
          
          // SMART WORKER MATCHING CALCULATION
          data = data.map((worker) => {
            if (!worker.latitude || !worker.longitude) return worker;
            
            // 1. Proximity
            const dist = getDistanceFromLatLonInKm(customerLoc[0], customerLoc[1], worker.latitude, worker.longitude);
            // 2. Acceptance Rate (simulated based on historical totalJobs for demo)
            const acceptanceRate = worker.totalJobs > 0 ? Math.min(99, 80 + (worker.totalJobs * 2)) : 85;
            // 3. Price (Standardized to 300 for the demo, so base price score is fixed)
            
            // Weighted combination
            // Closer is better (max 20 pts), Rating is better (max 40 pts), Acceptance is better (max 40 pts)
            const distScore = Math.max(0, 20 - dist); 
            const ratingScore = (worker.ratingAvg / 5) * 40; 
            const acceptanceScore = (acceptanceRate / 100) * 40;
            
            const matchScore = distScore + ratingScore + acceptanceScore;
            
            return {
              ...worker,
              distanceKm: dist,
              acceptanceRate,
              matchScore,
            };
          });

          // Sort by match score
          data.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          
          // Mark top scorer
          if (data.length > 0 && data[0].matchScore) {
            data[0].isBestMatch = true;
          }

          setWorkers(data);
        }
      } catch (error) {
        console.error("Failed to fetch workers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkers();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-[600px] rounded-lg overflow-hidden border z-0 relative">
        {/* Helper overlay for the user to understand matching is active */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-3 py-2 rounded-md shadow-sm border text-xs font-medium text-gray-700">
          Smart Match Enabled ⚡
        </div>
        
        <MapContainer center={customerLoc} zoom={12} scrollWheelZoom={true} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapAutoCenter workers={workers} />
          
          {workers.map((worker) => {
            if (!worker.latitude || !worker.longitude) return null;
            
            return (
              <Marker key={worker.id} position={[worker.latitude, worker.longitude]}>
                <Popup className="custom-popup">
                  <div className="p-1 space-y-3 min-w-[220px]">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg leading-tight">{worker.user.name}</h3>
                        {worker.isBestMatch && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-500 hover:to-orange-500 text-white text-[10px] px-1.5 py-0">
                            <Trophy className="w-3 h-3 mr-1" /> Best Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{worker.cooperative.name}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 text-sm bg-gray-50 p-2 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-yellow-600">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" />
                          <span className="font-medium text-xs">{worker.ratingAvg > 0 ? worker.ratingAvg.toFixed(1) : "New"}</span>
                        </div>
                        <span className="text-xs text-gray-500">{worker.totalJobs} jobs</span>
                      </div>
                      
                      {worker.matchScore && (
                        <div className="text-[10px] text-gray-600 leading-tight border-t pt-1.5 mt-0.5">
                          <span className="font-semibold text-green-700">{worker.matchScore.toFixed(0)} Match Score</span><br/>
                          {worker.distanceKm?.toFixed(1)}km away • {worker.acceptanceRate}% acceptance
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="sm" 
                      onClick={() => setSelectedWorker(worker)}
                    >
                      Book Now (₹300)
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <Dialog open={!!selectedWorker} onOpenChange={(open) => !open && setSelectedWorker(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book {selectedWorker?.user.name}</DialogTitle>
            <DialogDescription>
              Flat rate of ₹300. Fill in your details below.
            </DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <BookingForm workerId={selectedWorker.id} onClose={() => setSelectedWorker(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
