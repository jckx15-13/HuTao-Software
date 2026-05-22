module Physics where

import Prelude

foreign import mathSin :: Number -> Number
foreign import mathCos :: Number -> Number
foreign import mathAcos :: Number -> Number
foreign import mathAsin :: Number -> Number
foreign import mathAtan2 :: Number -> Number -> Number
foreign import mathPi :: Number
foreign import mathMin :: Number -> Number -> Number
foreign import mathMax :: Number -> Number -> Number

type Vector3 = { x :: Number, y :: Number, z :: Number }
type LatLng = { lat :: Number, lng :: Number }

-- | Dot product of two 3D vectors
dotProduct :: Vector3 -> Vector3 -> Number
dotProduct v1 v2 = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z

-- | Multiply vector by a scalar
scaleVector :: Number -> Vector3 -> Vector3
scaleVector s v = { x: v.x * s, y: v.y * s, z: v.z * s }

-- | Add two vectors
addVectors :: Vector3 -> Vector3 -> Vector3
addVectors v1 v2 = { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }

-- | Spherical Linear Interpolation (SLERP) between two unit vectors
slerp :: Vector3 -> Vector3 -> Number -> Vector3
slerp v1 v2 t =
  let
    cosTheta = dotProduct v1 v2
  in
    if cosTheta > 0.9995 then
      -- Close enough to use standard linear interpolation (LERP)
      let
        w1 = 1.0 - t
        w2 = t
      in
        addVectors (scaleVector w1 v1) (scaleVector w2 v2)
    else
      -- Make sure cosTheta doesn't exceed bounds
      let
        clampedCos = mathMax (-1.0) (mathMin 1.0 cosTheta)
        theta = mathAcos clampedCos
        sinTheta = mathSin theta
        w1 = mathSin ((1.0 - t) * theta) / sinTheta
        w2 = mathSin (t * theta) / sinTheta
      -- Perform SLERP
      in
        addVectors (scaleVector w1 v1) (scaleVector w2 v2)

-- | Convert latitude/longitude (in degrees) to a 3D unit vector
latLngToVector :: Number -> Number -> Vector3
latLngToVector lat lng =
  let
    latRad = (lat * mathPi) / 180.0
    lngRad = (lng * mathPi) / 180.0
    cosLat = mathCos latRad
  in
    { x: cosLat * mathCos lngRad
    , y: cosLat * mathSin lngRad
    , z: mathSin latRad
    }

-- | Convert 3D unit vector back to latitude/longitude (in degrees)
vectorToLatLng :: Vector3 -> LatLng
vectorToLatLng v =
  let
    -- Compute latitude in radians
    latRad = mathAsin v.z
    -- Compute longitude in radians
    lngRad = mathAtan2 v.y v.x
  in
    { lat: (latRad * 180.0) / mathPi
    , lng: (lngRad * 180.0) / mathPi
    }

-- | Compute orbit position at step `u` (in radians) given inclination `inc` (in radians)
-- | Returns coordinates in degrees.
orbitLatLng :: Number -> Number -> LatLng
orbitLatLng inc u =
  let
    latRad = mathAsin (mathSin inc * mathSin u)
    lngRad = mathAtan2 (mathCos inc * mathSin u) (mathCos u)
  in
    { lat: (latRad * 180.0) / mathPi
    , lng: (lngRad * 180.0) / mathPi
    }

-- | Cubic Bezier ease transition curve
-- | P0 = 0, P3 = 1
-- | P1 and P2 are control point coordinates (Number)
bezierEase :: Number -> Number -> Number -> Number
bezierEase p1 p2 t =
  let
    mt = 1.0 - t
    w1 = 3.0 * mt * mt * t * p1
    w2 = 3.0 * mt * t * t * p2
    w3 = t * t * t
  in
    w1 + w2 + w3
