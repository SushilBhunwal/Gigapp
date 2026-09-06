"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingForm } from "./BookingForm";

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

export default function WorkerMap({ categoryId }: { categoryId: string }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  useEffect(() => {
    async function fetchWorkers() {
      try {
        const res = await fetch(`/api/workers?categoryId=${categoryId}`);
        if (res.ok) {
          const data = await res.json();
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

  // Default to Bangalore center if no workers have coords
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  return (
    <>
      <div className="w-full h-[600px] rounded-lg overflow-hidden border z-0">
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={true} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapAutoCenter workers={workers} />
          
          {workers.map((worker) => {
            if (!worker.latitude || !worker.longitude) return null;
            
            return (
              <Marker key={worker.id} position={[worker.latitude, worker.longitude]}>
                <Popup>
                  <div className="p-1 space-y-2 min-w-[200px]">
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{worker.user.name}</h3>
                      <p className="text-xs text-muted-foreground">{worker.cooperative.name}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-yellow-600">
                        <Star className="w-4 h-4 fill-current mr-1" />
                        <span className="font-medium">{worker.ratingAvg > 0 ? worker.ratingAvg.toFixed(1) : "New"}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">{worker.totalJobs}</span> jobs
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-2" 
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
