type MapProps = {
    title?: string;
}

export default function Map ({ title = "Map view coming soon" }: MapProps) {
    return (
        <section className="map-placeholder">
            <p className="eyebrow">Map</p>
            <h2>{title}</h2>
            <p>
                This area is prepared for a future interactive map with activity markers,
                location-based exploration, and viewport-driven filtering.           
            </p>
        </section>
    );
}

