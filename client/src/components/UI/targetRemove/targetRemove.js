import * as THREE from 'three';

export const TargetRemove = ({setTarget, setFollowingBody, setAsteroidSize}) => {
    return(
        <>
        <button onClick={() => {setTarget(new THREE.Vector3(0,0,0)); setFollowingBody(null); setAsteroidSize(1)}} className="hover:cursor-pointer text-white rounded px-4 py-2 hover:underline">
          &lt;  See all asteroids
        </button>
        </>
    )
}