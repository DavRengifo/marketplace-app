"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

// Leaflet's default marker icons use relative paths that break in webpack/Next.js.
// Pointing them at the unpkg CDN is the standard fix.
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type MapActivity = {
    id: number;
    title: string;
    location: string;
    price: number;
    latitude?: number | null;
    longitude?: number | null;
    };

type MapProps = {
    activities?: MapActivity[];
};

export default function Map({ activities = [] }: MapProps) {
    const pinned = activities.filter(
        (a): a is MapActivity & { latitude: number; longitude: number } =>
            typeof a.latitude === "number" && typeof a.longitude === "number"
    );

    return (
        <MapContainer
            center={[46.5, 2.5]}
            zoom={5}
            style={{ height: "480px", width: "100%", borderRadius: "12px" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pinned.map((activity) => (
                <Marker
                    key={activity.id}
                    position={[activity.latitude, activity.longitude]}
                >
                    <Popup>
                        <Link
                            href={`/activity/${activity.id}`}
                            style={{ display: "block", fontWeight: 600, marginBottom: "4px", color: "#1a1a1a", textDecoration: "none" }}
                        >
                            {activity.title}
                        </Link>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>
                            {activity.location} · €{activity.price}
                        </span>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}   