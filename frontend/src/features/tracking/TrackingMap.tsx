import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { Spinner } from "@/components/Spinner";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
type LatLng = { lat: number; lng: number };

function dotIcon(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 9,
  };
}

export function TrackingMap({
  apiKey,
  restaurantPos,
  destinationPos,
  driverPos,
}: {
  apiKey: string;
  restaurantPos: LatLng;
  destinationPos: LatLng;
  driverPos: LatLng | null;
}) {
  const { isLoaded } = useJsApiLoader({ id: "sufra-google-maps", googleMapsApiKey: apiKey });

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const center = driverPos ?? { lat: (restaurantPos.lat + destinationPos.lat) / 2, lng: (restaurantPos.lng + destinationPos.lng) / 2 };

  return (
    <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={center} zoom={13}>
      <Marker position={restaurantPos} icon={dotIcon("#2563eb")} />
      <Marker position={destinationPos} icon={dotIcon("#ea580c")} />
      {driverPos && <Marker position={driverPos} icon={dotIcon("#16a34a")} />}
      <Polyline path={[restaurantPos, destinationPos]} options={{ strokeColor: "#94a3b8", strokeOpacity: 0.8, strokeWeight: 3, geodesic: true }} />
    </GoogleMap>
  );
}
