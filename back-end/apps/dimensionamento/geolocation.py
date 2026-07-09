import math
from dataclasses import dataclass


@dataclass(frozen=True)
class EstacaoSolar:
    id: str
    latitude: float
    longitude: float
    irradiacao: float


class GeoLocationService:
    """Serviço espacial para cálculos de geolocalização e proximidade."""

    RAIO_TERRA_KM = 6371.0

    @staticmethod
    def calcular_inclinacao_ideal(latitude_cidade: float) -> float:
        return abs(float(latitude_cidade))

    @classmethod
    def _haversine_km(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
    ) -> float:
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        delta_lat = lat2_rad - lat1_rad
        delta_lon = lon2_rad - lon1_rad

        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return cls.RAIO_TERRA_KM * c

    @classmethod
    def buscar_estacao_mais_proxima(
        cls,
        lat_cliente: float,
        lon_cliente: float,
        estacoes: list[EstacaoSolar],
    ) -> tuple[EstacaoSolar, float]:
        if not estacoes:
            raise ValueError("A lista de estações solares não pode ser vazia.")

        estacao_mais_proxima = min(
            estacoes,
            key=lambda estacao: cls._haversine_km(
                lat_cliente,
                lon_cliente,
                estacao.latitude,
                estacao.longitude,
            ),
        )

        distancia_km = cls._haversine_km(
            lat_cliente,
            lon_cliente,
            estacao_mais_proxima.latitude,
            estacao_mais_proxima.longitude,
        )
        return estacao_mais_proxima, distancia_km
