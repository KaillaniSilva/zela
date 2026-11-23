import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Localização econômica: usa a última posição conhecida (instantânea, sem
// gastar bateria) e só depois pede uma leitura nova com precisão balanceada.
export function useLocation() {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState(null);
  const [status, setStatus] = useState('carregando'); // carregando | ok | negado | erro

  const refresh = useCallback(async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setStatus('negado');
        return null;
      }
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        setPosition({ lat: last.coords.latitude, lng: last.coords.longitude });
        setStatus('ok');
      }
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const p = { lat: cur.coords.latitude, lng: cur.coords.longitude };
      setPosition(p);
      setStatus('ok');
      try {
        const [g] = await Location.reverseGeocodeAsync({ latitude: p.lat, longitude: p.lng });
        if (g) setAddress([g.street, g.streetNumber || g.name].filter(Boolean).join(', ') || g.district || null);
      } catch {
        // sem internet o endereço fica em branco; as coordenadas bastam
      }
      return p;
    } catch {
      setStatus((s) => (s === 'ok' ? 'ok' : 'erro'));
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { position, address, status, refresh };
}
