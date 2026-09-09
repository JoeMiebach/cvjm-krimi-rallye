<?php
// Haversine-Distanzberechnung (1:1 aus 02_Technische_Spezifikation_PHP.md, "Geofencing-Logik")

function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float {
    $R = 6371000; // Erdradius in Metern
    $phi1 = deg2rad($lat1);
    $phi2 = deg2rad($lat2);
    $deltaPhi = deg2rad($lat2 - $lat1);
    $deltaLambda = deg2rad($lon2 - $lon1);

    $a = sin($deltaPhi / 2) ** 2 +
         cos($phi1) * cos($phi2) * sin($deltaLambda / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $R * $c;
}
