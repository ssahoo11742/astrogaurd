const deg2rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;
const mu = 1.32712440018e11; // km^3/s^2
export const AU2KM = 1.495978707e8; // km

export function norm(vec) {
    return Math.sqrt(vec.reduce((sum, val) => sum + val*val, 0));
}

export function dot(a, b) {
    return a.reduce((sum, val, i) => sum + val*b[i], 0);
}

export function cross(a, b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ];
}

export function scalarMultiply(vec, scalar) {
    return vec.map(v => v*scalar);
}

export function addVec(a, b) {
    return a.map((v, i) => v + b[i]);
}

export function matrixMultiplyVec(mat, vec) {
    return [
        mat[0][0]*vec[0] + mat[0][1]*vec[1] + mat[0][2]*vec[2],
        mat[1][0]*vec[0] + mat[1][1]*vec[1] + mat[1][2]*vec[2],
        mat[2][0]*vec[0] + mat[2][1]*vec[1] + mat[2][2]*vec[2]
    ];
}

// Keplerian to Cartesian
export function keplerianToCartesian(a, e, i, om, w, ma) {
    let nu = ma; // Approximate: mean anomaly ~ true anomaly
    let r = a * (1 - e*e) / (1 + e*Math.cos(nu));
    
    // Position in orbital plane
    let x_orb = r * Math.cos(nu);
    let y_orb = r * Math.sin(nu);
    let z_orb = 0;
    
    // Velocity in orbital plane
    let h = Math.sqrt(mu * a * (1 - e*e));
    let vx_orb = -mu/h * Math.sin(nu);
    let vy_orb = mu/h * (e + Math.cos(nu));
    let vz_orb = 0;
    
    // Rotation matrices
    let R_om = [
        [Math.cos(om), -Math.sin(om), 0],
        [Math.sin(om),  Math.cos(om), 0],
        [0, 0, 1]
    ];
    let R_i = [
        [1, 0, 0],
        [0, Math.cos(i), -Math.sin(i)],
        [0, Math.sin(i), Math.cos(i)]
    ];
    let R_w = [
        [Math.cos(w), -Math.sin(w), 0],
        [Math.sin(w),  Math.cos(w), 0],
        [0,0,1]
    ];
    
    // Combined rotation: R_om * R_i * R_w
    function matMul(a, b) {
        let result = [];
        for (let i=0; i<3; i++) {
            result.push([]);
            for (let j=0; j<3; j++) {
                result[i][j] = a[i][0]*b[0][j] + a[i][1]*b[1][j] + a[i][2]*b[2][j];
            }
        }
        return result;
    }
    let R = matMul(matMul(R_om, R_i), R_w);
    
    let r_vec = matrixMultiplyVec(R, [x_orb, y_orb, z_orb]);
    let v_vec = matrixMultiplyVec(R, [vx_orb, vy_orb, vz_orb]);
    
    return {r_vec, v_vec};
}

// Cartesian to Keplerian
function cartesianToKeplerian(r_vec, v_vec) {
    const r = norm(r_vec);
    const v = norm(v_vec);

    // Specific angular momentum
    const h_vec = cross(r_vec, v_vec);
    const h = norm(h_vec);

    // Inclination
    const i = Math.acos(h_vec[2] / h);

    // Node line
    const K = [0, 0, 1];
    const N_vec = cross(K, h_vec);
    const N = norm(N_vec);

    // Eccentricity vector
    const rv = dot(r_vec, v_vec);
    const e_vec = scalarMultiply(
        addVec(
            scalarMultiply(r_vec, v*v - mu/r),
            scalarMultiply(v_vec, -rv)
        ),
        1 / mu
    );
    const e = norm(e_vec);

    // Semi-major axis
    const a = 1 / (2 / r - v*v / mu);

    // Longitude of ascending node (om)
    let om = 0;
    if (N !== 0) {
        om = Math.acos(N_vec[0] / N);
        if (N_vec[1] < 0) om = 2*Math.PI - om;
    }

    // Argument of periapsis (w)
    let w = 0;
    if (N !== 0 && e > 1e-12) {
        w = Math.acos(dot(N_vec, e_vec) / (N * e));
        if (e_vec[2] < 0) w = 2*Math.PI - w;
    } else if (e > 1e-12) {
        // If N ~ 0 (equatorial), define argument of periapsis from x-axis
        w = Math.acos(e_vec[0] / e);
        if (e_vec[1] < 0) w = 2*Math.PI - w;
    }

    // Build rotation matrix R = R_om * R_i * R_w (perifocal -> inertial)
    const R_om = [
        [Math.cos(om), -Math.sin(om), 0],
        [Math.sin(om),  Math.cos(om), 0],
        [0, 0, 1]
    ];
    const R_i = [
        [1, 0, 0],
        [0, Math.cos(i), -Math.sin(i)],
        [0, Math.sin(i),  Math.cos(i)]
    ];
    const R_w = [
        [Math.cos(w), -Math.sin(w), 0],
        [Math.sin(w),  Math.cos(w), 0],
        [0, 0, 1]
    ];
    function matMul(a, b) {
        const res = [];
        for (let ii = 0; ii < 3; ii++) {
            res[ii] = [];
            for (let jj = 0; jj < 3; jj++) {
                res[ii][jj] = a[ii][0]*b[0][jj] + a[ii][1]*b[1][jj] + a[ii][2]*b[2][jj];
            }
        }
        return res;
    }
    const R = matMul(matMul(R_om, R_i), R_w);

    // Transform r_vec into perifocal coords: r_perif = R^T * r_vec
    // (since R maps perifocal -> inertial)
    const RT = [
        [R[0][0], R[1][0], R[2][0]],
        [R[0][1], R[1][1], R[2][1]],
        [R[0][2], R[1][2], R[2][2]]
    ];
    const r_perif = matrixMultiplyVec(RT, r_vec);

    // True anomaly from perifocal coordinates (robust quadrant via atan2)
    let nu = Math.atan2(r_perif[1], r_perif[0]);
    if (nu < 0) nu += 2*Math.PI;

    // Eccentric anomaly E and mean anomaly M
    let E, M;
    if (e < 1.0) {
        // Elliptic
        E = 2 * Math.atan(Math.tan(nu/2) / Math.sqrt((1+e)/(1-e)));
        // Ensure E in [0, 2pi)
        if (E < 0) E += 2*Math.PI;
        M = E - e * Math.sin(E);
    } else if (e > 1.0) {
        // Hyperbolic (use hyperbolic anomaly)
        // E here denotes F (hyperbolic anomaly)
        const coshF = (e + Math.cos(nu)) / (1 + e * Math.cos(nu));
        // numerical safe: use asinh form
        const F = Math.log( (Math.sqrt(coshF + 1) + Math.sqrt(coshF - 1)) );
        E = F;
        M = e * Math.sinh(F) - F; // hyperbolic mean anomaly
    } else {
        // Parabolic case (e ~= 1) - not handled precisely here
        E = 0;
        M = 0;
    }

    return { a, e, i, om, w, ma: M };
}


export function applyDeltaV(keplerElements, deltav) {
    let {r_vec, v_vec} = keplerianToCartesian(
        keplerElements.a,
        keplerElements.e,
        keplerElements.i,
        keplerElements.om,
        keplerElements.w,
        keplerElements.ma
    );
    let v_new = addVec(v_vec, deltav);

    return cartesianToKeplerian(r_vec, v_new);
}


export function simulateKineticImpact(keplerElements, deltaVMag, direction = "alongVelocity", steps = 100) {
    // Convert current Keplerian to Cartesian
    const {r_vec, v_vec} = keplerianToCartesian(
        keplerElements.a,
        keplerElements.e,
        keplerElements.i,
        keplerElements.om,
        keplerElements.w,
        keplerElements.ma
    );

    // Compute delta-v vector based on chosen direction
    let deltaV;
    switch(direction) {
        case "alongVelocity":
            const vNorm = norm(v_vec);
            deltaV = scalarMultiply(v_vec, deltaVMag / vNorm);
            break;
        case "radial":
            const rNorm = norm(r_vec);
            deltaV = scalarMultiply(r_vec, deltaVMag / rNorm);
            break;
        case "normal": // perpendicular to orbital plane
            const h_vec = cross(r_vec, v_vec);
            const hNorm = norm(h_vec);
            deltaV = scalarMultiply(h_vec, deltaVMag / hNorm);
            break;
        default:
            throw new Error("Invalid direction for delta-v");
    }

    // Apply delta-v to get new orbit
    const newElements = applyDeltaV(keplerElements, deltaV);
    return newElements;
}


const G = 6.67430e-20; // km^3 / kg / s^2


/**
 * Simulate a laser ablation deflection effect.
 * The laser continuously imparts small thrust over time by vaporizing surface material.
 *
 * @param {Object} keplerElements - asteroid orbital elements {a,e,i,om,w,ma}
 * @param {number} power - laser power in megawatts (MW)
 * @param {number} efficiency - conversion efficiency (0–1)
 * @param {number} asteroidMass - asteroid mass (kg)
 * @param {number} durationSec - duration of ablation (seconds)
 * @param {number} dt - timestep (seconds)
 * @param {string} direction - "alongVelocity" | "radial" | "normal"
 * @returns {{currentElements: Object, deltaVmag: number}}
 */
export function laserAblation(
  keplerElements,
  power,
  efficiency,
  asteroidMass,
  durationSec,
  dt = 3600,
  direction = "alongVelocity"
) {
  console.log("Simulating laser ablation:", { power, efficiency, asteroidMass, durationSec, dt, direction });

  let currentElements = { ...keplerElements };
  const steps = Math.ceil(durationSec / dt);
  console.log(steps)
  let totalDeltaV = [0, 0, 0];

  // Convert MW to W
  const powerWatts = power * 1e6;

  for (let i = 0; i < steps; i++) {
    const { r_vec, v_vec } = keplerianToCartesian(
      currentElements.a,
      currentElements.e,
      currentElements.i,
      currentElements.om,
      currentElements.w,
      currentElements.ma
    );

    // Effective thrust = (efficiency * power) / exhaustVelocity
    // Typical exhaust velocity from ablation vapor ~ 3000 m/s = 3 km/s
    const exhaustVel = 3; // km/s
    const thrust = (efficiency * powerWatts) / (exhaustVel * 1e3); // Newtons
    const aMag = thrust / (asteroidMass * 1e3); // km/s²

    let a_vec;
    switch (direction) {
      case "alongVelocity":
        a_vec = scalarMultiply(v_vec, aMag / norm(v_vec));
        break;
      case "radial":
        a_vec = scalarMultiply(r_vec, aMag / norm(r_vec));
        break;
      case "normal":
        const h_vec = cross(r_vec, v_vec);
        a_vec = scalarMultiply(h_vec, aMag / norm(h_vec));
        break;
      default:
        a_vec = scalarMultiply(v_vec, aMag / norm(v_vec));
    }

    // Δv = a * dt
    const deltaV = scalarMultiply(a_vec, dt);
    const newV = addVec(v_vec, deltaV);
    totalDeltaV = addVec(totalDeltaV, deltaV);

    // Update orbital elements
    currentElements = cartesianToKeplerian(r_vec, newV);
  }

  const deltaVmag = norm(totalDeltaV);
  return { currentElements, deltaVmag };
}


/**
 * Simulate a gravity tractor effect over a period of time
 * @param {Object} keplerElements - asteroid orbital elements {a,e,i,om,w,ma}
 * @param {number} m_sc - spacecraft mass in kg
 * @param {number} r_sc - distance spacecraft to asteroid in km
 * @param {number} durationSec - total duration to apply gravity tractor (seconds)
 * @param {number} dt - timestep in seconds
 * @param {string} direction - "alongVelocity", "radial", "normal"
 * @returns new Keplerian elements after gravity tractor effect
 */
export function gravityTractor(keplerElements, m_sc, r_sc, durationSec, dt = 3600, direction = "alongVelocity") {
    console.log("Simulating gravity tractor:", {m_sc, r_sc, durationSec, dt, direction, keplerElements});
    let currentElements = { ...keplerElements };
    const steps = Math.ceil(durationSec / dt);
    let totalDeltaV = [0, 0, 0]; 

    for (let i = 0; i < steps; i++) {
        const { r_vec, v_vec } = keplerianToCartesian(
            currentElements.a,
            currentElements.e,
            currentElements.i,
            currentElements.om,
            currentElements.w,
            currentElements.ma
        );

        // Compute acceleration magnitude
        const aMag = (G * m_sc) / (r_sc * r_sc); // km/s^2

        // Determine acceleration vector
        let a_vec;
        switch (direction) {
            case "alongVelocity":
                a_vec = scalarMultiply(v_vec, aMag / norm(v_vec));
                break;
            case "radial":
                a_vec = scalarMultiply(r_vec, aMag / norm(r_vec));
                break;
            case "normal":
                const h_vec = cross(r_vec, v_vec);
                a_vec = scalarMultiply(h_vec, aMag / norm(h_vec));
                break;
            default:
                a_vec = scalarMultiply(v_vec, aMag / norm(v_vec));
        }

        // Update velocity
        const deltaV = scalarMultiply(a_vec, dt); // Δv = a * dt
        const newV = addVec(v_vec, deltaV);
        totalDeltaV = addVec(totalDeltaV, deltaV);

        // Update orbital elements
        currentElements = cartesianToKeplerian(r_vec, newV);
    }
    const deltaVmag = norm(totalDeltaV);

    return {currentElements, deltaVmag};
}
